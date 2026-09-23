-- Import iscrizioni da Google Moduli, approvazione/rifiuto da parte dello staff,
-- coda notifiche (email / WhatsApp / SMS) e reminder 2 giorni prima dell'Open Day.
--
-- Flusso:
--   Google Modulo -> Apps Script -> Edge Function `google-forms-webhook` (service
--   role) -> bookings.status = 'pending' + google_form_import_log.
--   Staff -> RPC decidi_iscrizione() -> bookings confermata/rifiutata + riga in
--   `notifiche` (in coda) -> Edge Function `send-notifications` la invia.
--   pg_cron (0007) -> accoda_reminder() ogni giorno + invio coda ogni 5 minuti.
--
-- Sicurezza: tutte le nuove tabelle sono leggibili/scrivibili SOLO dallo staff
-- (RLS + grant). anon non ha alcun accesso: il webhook scrive lato server con la
-- service role key, che vive solo nei secret delle Edge Functions.

-- ---------------------------------------------------------------------------
-- bookings / open_days: nuove colonne
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column google_response_id text unique,
  add column acc_cognome text,
  add column acc_nome text,
  add column decisione_at timestamptz,
  add column decisione_by uuid references public.profiles (id),
  add column motivo_rifiuto text;

alter table public.open_days
  -- Testo esatto dell'opzione del menu nel Google Modulo che corrisponde a questo Open Day.
  add column etichetta_modulo text,
  -- Luogo/indicazioni specifici; se vuoto si usano quelli predefiniti in `impostazioni`.
  add column luogo_override text;

create unique index open_days_etichetta_modulo_key
  on public.open_days (lower(btrim(etichetta_modulo)))
  where etichetta_modulo is not null;

-- ---------------------------------------------------------------------------
-- impostazioni (riga unica): luogo predefinito, canale e testi dei messaggi.
-- Segnaposto nei testi: {nome} {cognome} {data} {ora} {luogo} {indicazioni}
-- {motivo} {contatti}
-- ---------------------------------------------------------------------------

create table public.impostazioni (
  id smallint primary key default 1 check (id = 1),
  luogo_predefinito text not null,
  indicazioni_predefinite text not null default '',
  contatti text not null default '',
  canale_predefinito text not null default 'email'
    check (canale_predefinito in ('email', 'whatsapp_manuale', 'sms', 'whatsapp')),
  testo_approvazione text not null,
  testo_rifiuto text not null,
  testo_reminder text not null,
  updated_at timestamptz not null default now()
);

create trigger impostazioni_set_updated_at
  before update on public.impostazioni
  for each row execute function public.set_updated_at();

-- Valori fittizi iniziali: da modificare dalla pagina Impostazioni dell'area staff.
insert into public.impostazioni (
  id, luogo_predefinito, indicazioni_predefinite, contatti,
  testo_approvazione, testo_rifiuto, testo_reminder
) values (
  1,
  'Immaginazione e Lavoro — Via Esempio 1, 20100 Milano',
  'Presentatevi 10 minuti prima all''ingresso principale e chiedete dell''accoglienza Open Day.',
  'tel. 02 0000000 — orientamento@example.it',
  'Gentile famiglia, l''iscrizione di {nome} {cognome} all''Open Day di Immaginazione e Lavoro di {data} alle ore {ora} è CONFERMATA. Vi aspettiamo presso {luogo}. {indicazioni} Per informazioni: {contatti}',
  'Gentile famiglia, purtroppo non possiamo confermare l''iscrizione di {nome} {cognome} all''Open Day di {data} alle ore {ora}. {motivo} Per informazioni o per scegliere un''altra data: {contatti}',
  'Promemoria: {nome} {cognome} è atteso/a all''Open Day di Immaginazione e Lavoro {data} alle ore {ora} presso {luogo}. {indicazioni} Per informazioni: {contatti}'
);

-- ---------------------------------------------------------------------------
-- notifiche: coda messaggi verso le famiglie
-- ---------------------------------------------------------------------------

create table public.notifiche (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  open_day_id uuid not null references public.open_days (id) on delete cascade,
  tipo text not null check (tipo in ('approvazione', 'rifiuto', 'reminder')),
  canale text not null check (canale in ('email', 'whatsapp_manuale', 'sms', 'whatsapp')),
  destinatario text not null,
  oggetto text not null,
  testo text not null,
  -- in_coda: da inviare dal server | manuale: la invia lo staff (link WhatsApp)
  stato text not null default 'in_coda' check (stato in ('in_coda', 'inviata', 'errore', 'manuale')),
  errore text,
  tentativi smallint not null default 0,
  -- Prenotazione per l'invio (vedi prendi_notifiche_da_inviare): evita doppi invii
  -- se il cron e un operatore avviano l'invio nello stesso momento.
  in_invio_at timestamptz,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index notifiche_stato_idx on public.notifiche (stato) where stato = 'in_coda';
create index notifiche_booking_idx on public.notifiche (booking_id);
create index notifiche_open_day_idx on public.notifiche (open_day_id);
-- Un solo reminder per iscrizione, anche se il job giornaliero gira piu' volte.
create unique index notifiche_reminder_unico on public.notifiche (booking_id) where tipo = 'reminder';

-- ---------------------------------------------------------------------------
-- google_form_import_log: traccia di ogni risposta ricevuta dal webhook
-- ---------------------------------------------------------------------------

create table public.google_form_import_log (
  id uuid primary key default gen_random_uuid(),
  response_id text,
  ricevuto_at timestamptz not null default now(),
  esito text not null check (esito in ('importata', 'duplicata', 'open_day_non_trovato', 'errore')),
  messaggio text,
  booking_id uuid references public.bookings (id) on delete set null,
  payload jsonb not null
);

create index google_form_import_log_ricevuto_idx on public.google_form_import_log (ricevuto_at desc);

-- ---------------------------------------------------------------------------
-- RLS + grant: solo staff
-- ---------------------------------------------------------------------------

alter table public.impostazioni enable row level security;
alter table public.notifiche enable row level security;
alter table public.google_form_import_log enable row level security;

create policy "impostazioni_select_staff" on public.impostazioni for select
  to authenticated using (public.is_staff());
create policy "impostazioni_update_staff" on public.impostazioni for update
  to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "notifiche_select_staff" on public.notifiche for select
  to authenticated using (public.is_staff());
-- Lo staff aggiorna solo lo stato (es. WhatsApp inviato a mano): creazione solo via RPC.
create policy "notifiche_update_staff" on public.notifiche for update
  to authenticated using (public.is_staff()) with check (public.is_staff());

create policy "google_form_import_log_select_staff" on public.google_form_import_log for select
  to authenticated using (public.is_staff());

revoke all on public.impostazioni from anon;
revoke all on public.notifiche from anon;
revoke all on public.google_form_import_log from anon;
revoke all on public.impostazioni from authenticated;
revoke all on public.notifiche from authenticated;
revoke all on public.google_form_import_log from authenticated;

grant select, update on public.impostazioni to authenticated;
grant select on public.notifiche to authenticated;
grant update (stato, errore, sent_at) on public.notifiche to authenticated;
grant select on public.google_form_import_log to authenticated;

-- ---------------------------------------------------------------------------
-- Composizione messaggi
-- ---------------------------------------------------------------------------

create or replace function public.componi_messaggio(
  p_testo text,
  p_booking public.bookings,
  p_open_day public.open_days,
  p_imp public.impostazioni,
  p_motivo text default null
)
returns text
language sql
stable
set search_path = ''
as $$
  select btrim(regexp_replace(
    replace(replace(replace(replace(replace(replace(replace(replace(p_testo,
      '{nome}', p_booking.nome),
      '{cognome}', p_booking.cognome),
      '{data}', (array['domenica','lunedì','martedì','mercoledì','giovedì','venerdì','sabato'])
                  [extract(dow from p_open_day.data)::int + 1] || ' ' || to_char(p_open_day.data, 'DD/MM/YYYY')),
      '{ora}', to_char(p_open_day.ora, 'HH24:MI')),
      '{luogo}', coalesce(nullif(btrim(p_open_day.luogo_override), ''), p_imp.luogo_predefinito)),
      '{indicazioni}', case when nullif(btrim(p_open_day.luogo_override), '') is null
                            then p_imp.indicazioni_predefinite else '' end),
      '{motivo}', coalesce(nullif(btrim(p_motivo), ''), '')),
      '{contatti}', p_imp.contatti),
    '\s{2,}', ' ', 'g'));
$$;

-- Canale e destinatario effettivi: se manca l'email si ripiega su WhatsApp manuale.
create or replace function public.accoda_notifica(
  p_booking public.bookings,
  p_tipo text,
  p_motivo text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_od public.open_days;
  v_imp public.impostazioni;
  v_canale text;
  v_dest text;
  v_testo text;
  v_oggetto text;
begin
  select * into v_od from public.open_days where id = p_booking.open_day_id;
  select * into v_imp from public.impostazioni where id = 1;

  v_canale := v_imp.canale_predefinito;
  if v_canale = 'email' and nullif(btrim(p_booking.email), '') is null then
    v_canale := 'whatsapp_manuale';
  end if;
  v_dest := case when v_canale = 'email' then btrim(p_booking.email) else btrim(p_booking.telefono) end;

  v_testo := public.componi_messaggio(
    case p_tipo
      when 'approvazione' then v_imp.testo_approvazione
      when 'rifiuto' then v_imp.testo_rifiuto
      else v_imp.testo_reminder
    end,
    p_booking, v_od, v_imp, p_motivo);

  v_oggetto := case p_tipo
    when 'approvazione' then 'Iscrizione Open Day confermata'
    when 'rifiuto' then 'Iscrizione Open Day non confermata'
    else 'Promemoria Open Day'
  end || ' — Immaginazione e Lavoro';

  insert into public.notifiche (booking_id, open_day_id, tipo, canale, destinatario, oggetto, testo, stato)
  values (
    p_booking.id, p_booking.open_day_id, p_tipo, v_canale, v_dest, v_oggetto, v_testo,
    case when v_canale = 'whatsapp_manuale' then 'manuale' else 'in_coda' end
  )
  on conflict (booking_id) where tipo = 'reminder' do nothing;
end;
$$;

revoke execute on function public.accoda_notifica(public.bookings, text, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- decidi_iscrizione: approva (sempre 'confirmed', anche oltre i posti massimi,
-- scelta esplicita dell'utente) o rifiuta, e accoda la notifica nella stessa
-- transazione.
-- ---------------------------------------------------------------------------

create or replace function public.decidi_iscrizione(
  p_booking_id uuid,
  p_approva boolean,
  p_motivo text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
begin
  if not public.is_staff() then
    raise exception 'Operazione riservata allo staff' using errcode = '42501';
  end if;

  update public.bookings
  set status = case when p_approva then 'confirmed' else 'rejected' end::public.stato_booking,
      decisione_at = now(),
      decisione_by = (select auth.uid()),
      motivo_rifiuto = case when p_approva then null else nullif(btrim(p_motivo), '') end
  where id = p_booking_id
    and status in ('pending', 'waitlist', 'confirmed', 'rejected')
  returning * into v_booking;

  if not found then
    raise exception 'Iscrizione non trovata o non modificabile';
  end if;

  perform public.accoda_notifica(v_booking, case when p_approva then 'approvazione' else 'rifiuto' end, p_motivo);
  return v_booking;
end;
$$;

revoke execute on function public.decidi_iscrizione(uuid, boolean, text) from public, anon;
grant execute on function public.decidi_iscrizione(uuid, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- accoda_reminder: chiamata ogni mattina da pg_cron (0007). Accoda un promemoria
-- per ogni iscritto confermato agli Open Day di dopodomani.
-- ---------------------------------------------------------------------------

create or replace function public.accoda_reminder()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings;
  v_count integer := 0;
begin
  for v_booking in
    select b.*
    from public.bookings b
    join public.open_days od on od.id = b.open_day_id
    where od.stato = 'aperto'
      and od.data = (now() at time zone 'Europe/Rome')::date + 2
      and b.status in ('confirmed', 'walk_in')
      and not exists (select 1 from public.notifiche n where n.booking_id = b.id and n.tipo = 'reminder')
  loop
    perform public.accoda_notifica(v_booking, 'reminder');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke execute on function public.accoda_reminder() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- prendi_notifiche_da_inviare: usata solo dall'Edge Function send-notifications
-- (service role). Prenota atomicamente fino a p_limite notifiche in coda; una
-- prenotazione piu' vecchia di 10 minuti (invio interrotto) viene ripresa.
-- ---------------------------------------------------------------------------

create or replace function public.prendi_notifiche_da_inviare(p_limite integer default 50)
returns setof public.notifiche
language sql
security definer
set search_path = ''
as $$
  update public.notifiche n
  set in_invio_at = now(), tentativi = n.tentativi + 1
  where n.id in (
    select id from public.notifiche
    where stato = 'in_coda'
      and (in_invio_at is null or in_invio_at < now() - interval '10 minutes')
    order by created_at
    limit p_limite
    for update skip locked
  )
  returning n.*;
$$;

revoke execute on function public.prendi_notifiche_da_inviare(integer) from public, anon, authenticated;
grant execute on function public.prendi_notifiche_da_inviare(integer) to service_role;

-- ---------------------------------------------------------------------------
-- Kiosk MDI: precompila anche l'accompagnatore, se arrivato dal Google Modulo.
-- (Cambia il tipo di ritorno: serve drop + create.)
-- ---------------------------------------------------------------------------

drop function if exists public.kiosk_dati_iscritto(uuid);

create function public.kiosk_dati_iscritto(p_booking_id uuid)
returns table (
  id uuid,
  open_day_id uuid,
  cognome text,
  nome text,
  data_nascita date,
  scuola text,
  telefono text,
  email text,
  corso_id uuid,
  corso2_id uuid,
  acc_cognome text,
  acc_nome text
)
language sql
security definer
stable
set search_path = ''
as $$
  select b.id, b.open_day_id, b.cognome, b.nome, b.data_nascita, b.scuola,
         b.telefono, b.email, b.corso_id, b.corso2_id, b.acc_cognome, b.acc_nome
  from public.bookings b
  join public.open_days od on od.id = b.open_day_id
  where b.id = p_booking_id
    and od.data = (now() at time zone 'Europe/Rome')::date
    and b.checked_in = true
    and b.status not in ('cancelled', 'rejected');
$$;

revoke execute on function public.kiosk_dati_iscritto(uuid) from public;
grant execute on function public.kiosk_dati_iscritto(uuid) to anon, authenticated;

-- La ricerca del kiosk esclude anche le richieste rifiutate.
create or replace function public.kiosk_cerca_iscritti(p_open_day_id uuid, p_query text)
returns table (id uuid, cognome text, nome text, scuola text)
language sql
security definer
stable
set search_path = ''
as $$
  select b.id, b.cognome, b.nome, b.scuola
  from public.bookings b
  join public.open_days od on od.id = b.open_day_id
  where b.open_day_id = p_open_day_id
    and od.data = (now() at time zone 'Europe/Rome')::date
    and b.checked_in = true
    and b.status not in ('cancelled', 'rejected')
    and length(btrim(coalesce(p_query, ''))) >= 2
    and b.cognome ilike replace(replace(replace(btrim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
  order by b.cognome, b.nome
  limit 10;
$$;

-- ---------------------------------------------------------------------------
-- Realtime: la dashboard di monitoraggio (useRealtimeOpenDay) si aggiorna da
-- sola quando arriva una nuova iscrizione dal Google Modulo. Realtime rispetta
-- le RLS: solo lo staff riceve gli eventi.
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.bookings, public.mdi, public.notifiche;
