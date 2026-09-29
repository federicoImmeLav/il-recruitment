-- Multi-città / multi-sede (Milano + Torino con 3 sedi).
--
-- Modello:
--   citta 1─n sedi. Ogni sede ha il proprio catalogo corsi, le proprie edizioni
--   (e quindi Open Day), la propria configurazione (luogo, contatti, mittente,
--   codice meccanografico, luogo firma MDI) e testi dei messaggi che, se vuoti,
--   ricadono sui template globali di `impostazioni`.
--   Le tabelle operative portano `sede_id` denormalizzato (valorizzato da
--   trigger, mai fidandosi del client) cosi' che ogni policy sia un semplice
--   confronto con l'elenco di sedi dell'utente.
--
-- Accesso staff (sostituisce il vecchio "qualsiasi staff vede tutto"):
--   - profiles.is_admin        -> tutte le sedi + gestione città/sedi/utenti;
--   - staff_ambiti (citta_id)  -> referente di città: tutte le sedi della città;
--   - staff_ambiti (sede_id)   -> operatore: solo quella sede (anche più righe).
--   Uno staff attivo senza ambiti non vede alcun dato operativo.
--
-- MDI: preferenza 1 tra i corsi della sede, 2 e 3 anche di altre sedi della
-- stessa città; la MDI resta visibile solo alla sede in cui è compilata
-- (scelta esplicita dell'utente).
--
-- I dati esistenti vengono assegnati alla sede Milano.

-- ---------------------------------------------------------------------------
-- citta / sedi
-- ---------------------------------------------------------------------------

create table public.citta (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Regione in maiuscolo come nell'anagrafe scuole MIUR (es. LOMBARDIA, PIEMONTE).
  regione text not null,
  created_at timestamptz not null default now()
);

create table public.sedi (
  id uuid primary key default gen_random_uuid(),
  citta_id uuid not null references public.citta (id) on delete restrict,
  nome text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  attiva boolean not null default true,
  ordine integer not null default 0,
  -- Usati nei messaggi alle famiglie ({luogo} {indicazioni} {contatti}).
  luogo text not null default '',
  indicazioni text not null default '',
  contatti text not null default '',
  -- Stampa MDI ("<luogo_firma>, lì ..."); vuoto = nome della città.
  luogo_firma text,
  -- Mittente email (deve essere verificato su Brevo); vuoti = secret globali.
  mittente_nome text,
  mittente_email text,
  -- Export INNOVAPLAN (tracciato SIDI).
  codice_meccanografico text not null default '',
  classificazione_ministeriale text not null default 'R3',
  -- Testi personalizzati; vuoti = template globali di `impostazioni`.
  testo_approvazione text,
  testo_rifiuto text,
  testo_reminder text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (citta_id, nome)
);

create index sedi_citta_idx on public.sedi (citta_id);

create trigger sedi_set_updated_at
  before update on public.sedi
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seed: Milano (sede unica, riceve i dati e la configurazione esistenti) e
-- Torino (le 3 sedi si creano dalla pagina admin).
-- ---------------------------------------------------------------------------

insert into public.citta (nome, slug, regione) values
  ('Milano', 'milano', 'LOMBARDIA'),
  ('Torino', 'torino', 'PIEMONTE');

insert into public.sedi (
  citta_id, nome, slug, luogo, indicazioni, contatti,
  codice_meccanografico, classificazione_ministeriale
)
select c.id, 'Milano', 'milano', i.luogo_predefinito, i.indicazioni_predefinite, i.contatti,
       i.codice_meccanografico_sede, i.classificazione_ministeriale
from public.citta c
cross join public.impostazioni i
where c.slug = 'milano' and i.id = 1;

-- ---------------------------------------------------------------------------
-- profiles: admin + email (per la pagina utenti)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column is_admin boolean not null default false,
  add column email text;

update public.profiles p set email = u.email from auth.users u where u.id = p.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome_completo, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome_completo', new.email), new.email);
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- staff_ambiti: a quali città/sedi ha accesso ciascun operatore
-- ---------------------------------------------------------------------------

create table public.staff_ambiti (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  citta_id uuid references public.citta (id) on delete cascade,
  sede_id uuid references public.sedi (id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((citta_id is null) <> (sede_id is null))
);

create unique index staff_ambiti_citta_key on public.staff_ambiti (profile_id, citta_id) where citta_id is not null;
create unique index staff_ambiti_sede_key on public.staff_ambiti (profile_id, sede_id) where sede_id is not null;
create index staff_ambiti_citta_idx on public.staff_ambiti (citta_id);
create index staff_ambiti_sede_idx on public.staff_ambiti (sede_id);

-- ---------------------------------------------------------------------------
-- Helper di accesso. SECURITY DEFINER per leggere profili/ambiti senza
-- dipendere dalle loro policy; restituiscono solo booleani / id di sedi.
-- Nelle policy vanno sempre avvolti in (select ...) cosi' Postgres li valuta
-- una volta per query e non per riga.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and attivo = true and is_admin = true
  );
$$;

create or replace function public.sedi_accessibili()
returns uuid[]
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(array_agg(s.id order by s.ordine, s.nome), '{}')
  from public.sedi s
  where exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.attivo = true
      and (
        p.is_admin = true
        or exists (
          select 1 from public.staff_ambiti a
          where a.profile_id = p.id
            and (a.sede_id = s.id or a.citta_id = s.citta_id)
        )
      )
  );
$$;

revoke execute on function public.is_admin() from public;
revoke execute on function public.sedi_accessibili() from public;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.sedi_accessibili() to authenticated;

-- ---------------------------------------------------------------------------
-- Colonne sede_id sulle tabelle operative + backfill su Milano
-- ---------------------------------------------------------------------------

alter table public.edizioni add column sede_id uuid references public.sedi (id) on delete restrict;
alter table public.open_days add column sede_id uuid references public.sedi (id) on delete restrict;
alter table public.corsi add column sede_id uuid references public.sedi (id) on delete restrict;
alter table public.bookings add column sede_id uuid references public.sedi (id) on delete restrict;
alter table public.mdi add column sede_id uuid references public.sedi (id) on delete restrict;
alter table public.notifiche add column sede_id uuid references public.sedi (id) on delete cascade;
alter table public.google_form_import_log add column citta_id uuid references public.citta (id) on delete set null;

do $$
declare
  v_milano uuid := (select id from public.sedi where slug = 'milano');
begin
  update public.edizioni set sede_id = v_milano where sede_id is null;
  update public.open_days set sede_id = v_milano where sede_id is null;
  update public.corsi set sede_id = v_milano where sede_id is null;
  update public.bookings set sede_id = v_milano where sede_id is null;
  update public.mdi set sede_id = v_milano where sede_id is null;
  update public.notifiche set sede_id = v_milano where sede_id is null;
  update public.google_form_import_log set citta_id = (select citta_id from public.sedi where id = v_milano)
    where citta_id is null;
end;
$$;

alter table public.edizioni alter column sede_id set not null;
alter table public.open_days alter column sede_id set not null;
alter table public.corsi alter column sede_id set not null;
alter table public.bookings alter column sede_id set not null;
alter table public.mdi alter column sede_id set not null;
alter table public.notifiche alter column sede_id set not null;

create index edizioni_sede_idx on public.edizioni (sede_id);
create index open_days_sede_data_idx on public.open_days (sede_id, data);
create index corsi_sede_idx on public.corsi (sede_id, ordine);
create index bookings_sede_idx on public.bookings (sede_id);
create index mdi_sede_idx on public.mdi (sede_id, created_at desc);
create index notifiche_sede_idx on public.notifiche (sede_id);
create index google_form_import_log_citta_idx on public.google_form_import_log (citta_id);

-- Corsi: il nome e' unico per sede, non piu' globalmente.
alter table public.corsi drop constraint corsi_nome_key;
alter table public.corsi add constraint corsi_sede_nome_key unique (sede_id, nome);

-- Etichetta del Google Modulo: unica per città (un modulo per città), non globale.
drop index public.open_days_etichetta_modulo_key;

-- ---------------------------------------------------------------------------
-- Trigger di coerenza: sede_id sempre derivato lato server.
-- SECURITY DEFINER perche' anon (kiosk) e le RPC non leggono tutte le righe
-- coinvolte; le funzioni non espongono dati, validano e basta.
-- ---------------------------------------------------------------------------

create or replace function public.open_days_imposta_sede()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select e.sede_id into new.sede_id from public.edizioni e where e.id = new.edizione_id;

  if nullif(btrim(new.etichetta_modulo), '') is null then
    new.etichetta_modulo := null;
  elsif exists (
    select 1
    from public.open_days od
    join public.sedi s1 on s1.id = od.sede_id
    join public.sedi s2 on s2.id = new.sede_id
    where od.id <> new.id
      and s1.citta_id = s2.citta_id
      and lower(btrim(od.etichetta_modulo)) = lower(btrim(new.etichetta_modulo))
  ) then
    raise exception 'Etichetta del Google Modulo già usata da un altro Open Day della stessa città'
      using errcode = '23505';
  end if;
  return new;
end;
$$;

create trigger open_days_sede
  before insert or update of edizione_id, etichetta_modulo on public.open_days
  for each row execute function public.open_days_imposta_sede();

-- Cambiare sede a un'edizione trascina i suoi Open Day.
create or replace function public.edizioni_propaga_sede()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.sede_id is distinct from old.sede_id then
    update public.open_days set edizione_id = edizione_id where edizione_id = new.id;
  end if;
  return new;
end;
$$;

create trigger edizioni_sede
  after update of sede_id on public.edizioni
  for each row execute function public.edizioni_propaga_sede();

-- Corso della sede (p_stessa_sede) o di una sede della stessa città.
create or replace function public.corso_ammesso(p_corso_id uuid, p_sede_id uuid, p_stessa_sede boolean)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select p_corso_id is null or exists (
    select 1
    from public.corsi c
    join public.sedi sc on sc.id = c.sede_id
    join public.sedi s on s.id = p_sede_id
    where c.id = p_corso_id
      and (c.sede_id = p_sede_id or (not p_stessa_sede and sc.citta_id = s.citta_id))
  );
$$;

revoke execute on function public.corso_ammesso(uuid, uuid, boolean) from public, anon, authenticated;

create or replace function public.bookings_imposta_sede()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select od.sede_id, od.edizione_id into new.sede_id, new.edizione_id
  from public.open_days od where od.id = new.open_day_id;

  if not public.corso_ammesso(new.corso_id, new.sede_id, true) then
    raise exception 'Indirizzo non disponibile in questa sede' using errcode = '23514';
  end if;
  if not public.corso_ammesso(new.corso2_id, new.sede_id, false) then
    raise exception 'Seconda scelta non disponibile in questa città' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger bookings_sede
  before insert or update of open_day_id, corso_id, corso2_id on public.bookings
  for each row execute function public.bookings_imposta_sede();

create or replace function public.mdi_imposta_sede()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Con un Open Day collegato la sede e' la sua; altrimenti quella indicata
  -- dal kiosk (che la ricava dal link /mdi/kiosk/sede/<slug>).
  if new.open_day_id is not null then
    select od.sede_id into new.sede_id from public.open_days od where od.id = new.open_day_id;
  end if;

  if new.sede_id is null or not exists (select 1 from public.sedi where id = new.sede_id and attiva) then
    raise exception 'Sede della MDI mancante o non attiva' using errcode = '23514';
  end if;
  if not public.corso_ammesso(new.corso_pref1_id, new.sede_id, true) then
    raise exception 'La prima preferenza deve essere un corso della sede' using errcode = '23514';
  end if;
  if not public.corso_ammesso(new.corso_pref2_id, new.sede_id, false)
     or not public.corso_ammesso(new.corso_pref3_id, new.sede_id, false) then
    raise exception 'Le preferenze devono essere corsi di una sede della stessa città' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger mdi_sede
  before insert or update of open_day_id, sede_id, corso_pref1_id, corso_pref2_id, corso_pref3_id on public.mdi
  for each row execute function public.mdi_imposta_sede();

create or replace function public.open_day_corsi_verifica_sede()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.open_days od join public.corsi c on c.sede_id = od.sede_id
    where od.id = new.open_day_id and c.id = new.corso_id
  ) then
    raise exception 'Il corso non appartiene alla sede dell''Open Day' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger open_day_corsi_sede
  before insert or update on public.open_day_corsi
  for each row execute function public.open_day_corsi_verifica_sede();

create or replace function public.notifiche_imposta_sede()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select b.sede_id into new.sede_id from public.bookings b where b.id = new.booking_id;
  return new;
end;
$$;

create trigger notifiche_sede
  before insert on public.notifiche
  for each row execute function public.notifiche_imposta_sede();

-- ---------------------------------------------------------------------------
-- impostazioni: restano solo i default globali (canale + template testi).
-- Luogo, contatti e codici ora vivono su `sedi` (copiati sopra su Milano).
-- ---------------------------------------------------------------------------

drop function if exists public.componi_messaggio(text, public.bookings, public.open_days, public.impostazioni, text);

alter table public.impostazioni
  drop column luogo_predefinito,
  drop column indicazioni_predefinite,
  drop column contatti,
  drop column codice_meccanografico_sede,
  drop column classificazione_ministeriale;

alter table public.notifiche
  add column mittente_nome text,
  add column mittente_email text;

-- ---------------------------------------------------------------------------
-- RLS: nuove tabelle
-- ---------------------------------------------------------------------------

alter table public.citta enable row level security;
alter table public.sedi enable row level security;
alter table public.staff_ambiti enable row level security;

-- citta: nessun dato sensibile, serve anche al kiosk / form pubblici.
create policy "citta_select_all" on public.citta for select
  to anon, authenticated using (true);
create policy "citta_insert_admin" on public.citta for insert
  to authenticated with check ((select public.is_admin()));
create policy "citta_update_admin" on public.citta for update
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "citta_delete_admin" on public.citta for delete
  to authenticated using ((select public.is_admin()));

-- sedi: anon vede solo le sedi attive e solo le colonne pubbliche (grant sotto).
-- Lo staff vede tutte le sedi (servono per le preferenze cross-sede e i nomi),
-- ma modifica solo le proprie; creare/eliminare sedi e' riservato all'admin.
create policy "sedi_select_public" on public.sedi for select
  to anon using (attiva = true);
create policy "sedi_select_staff" on public.sedi for select
  to authenticated using ((select public.is_staff()));
create policy "sedi_insert_admin" on public.sedi for insert
  to authenticated with check ((select public.is_admin()));
create policy "sedi_update_staff" on public.sedi for update
  to authenticated
  using (id = any ((select public.sedi_accessibili())::uuid[]))
  with check (id = any ((select public.sedi_accessibili())::uuid[]));
create policy "sedi_delete_admin" on public.sedi for delete
  to authenticated using ((select public.is_admin()));

create policy "staff_ambiti_select_own_or_admin" on public.staff_ambiti for select
  to authenticated using (profile_id = (select auth.uid()) or (select public.is_admin()));
create policy "staff_ambiti_insert_admin" on public.staff_ambiti for insert
  to authenticated with check ((select public.is_admin()));
create policy "staff_ambiti_delete_admin" on public.staff_ambiti for delete
  to authenticated using ((select public.is_admin()));

-- profiles: l'admin puo' attivare/disattivare, rinominare e promuovere.
create policy "profiles_update_admin" on public.profiles for update
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

revoke all on public.citta from anon, authenticated;
revoke all on public.sedi from anon, authenticated;
revoke all on public.staff_ambiti from anon, authenticated;

grant select on public.citta to anon;
grant select, insert, update, delete on public.citta to authenticated;
grant select (id, citta_id, nome, slug, attiva, ordine, luogo, indicazioni, luogo_firma) on public.sedi to anon;
grant select, insert, update, delete on public.sedi to authenticated;
grant select, insert, delete on public.staff_ambiti to authenticated;
grant update (nome_completo, attivo, is_admin) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- RLS: tabelle operative limitate alle sedi dell'utente
-- ---------------------------------------------------------------------------

drop policy "edizioni_select_staff" on public.edizioni;
drop policy "edizioni_insert_staff" on public.edizioni;
drop policy "edizioni_update_staff" on public.edizioni;
drop policy "edizioni_delete_staff" on public.edizioni;

create policy "edizioni_select_sede" on public.edizioni for select
  to authenticated using (sede_id = any ((select public.sedi_accessibili())::uuid[]));
create policy "edizioni_insert_sede" on public.edizioni for insert
  to authenticated with check (sede_id = any ((select public.sedi_accessibili())::uuid[]));
create policy "edizioni_update_sede" on public.edizioni for update
  to authenticated
  using (sede_id = any ((select public.sedi_accessibili())::uuid[]))
  with check (sede_id = any ((select public.sedi_accessibili())::uuid[]));
create policy "edizioni_delete_sede" on public.edizioni for delete
  to authenticated using (sede_id = any ((select public.sedi_accessibili())::uuid[]));

drop policy "open_days_select_staff" on public.open_days;
drop policy "open_days_insert_staff" on public.open_days;
drop policy "open_days_update_staff" on public.open_days;
drop policy "open_days_delete_staff" on public.open_days;

-- (open_days_select_public per anon resta invariata: Open Day aperti.)
create policy "open_days_select_sede" on public.open_days for select
  to authenticated using (sede_id = any ((select public.sedi_accessibili())::uuid[]));
create policy "open_days_insert_sede" on public.open_days for insert
  to authenticated with check (sede_id = any ((select public.sedi_accessibili())::uuid[]));
create policy "open_days_update_sede" on public.open_days for update
  to authenticated
  using (sede_id = any ((select public.sedi_accessibili())::uuid[]))
  with check (sede_id = any ((select public.sedi_accessibili())::uuid[]));
create policy "open_days_delete_sede" on public.open_days for delete
  to authenticated using (sede_id = any ((select public.sedi_accessibili())::uuid[]));

-- Colonna in piu' leggibile da anon (si somma alle colonne concesse in 0002).
grant select (sede_id) on public.open_days to anon;

drop policy "corsi_insert_staff" on public.corsi;
drop policy "corsi_update_staff" on public.corsi;
drop policy "corsi_delete_staff" on public.corsi;

-- (corsi_select_public resta: corsi attivi di tutte le sedi, servono alle
-- preferenze cross-sede; lo staff vede anche quelli disattivati.)
create policy "corsi_insert_sede" on public.corsi for insert
  to authenticated with check (sede_id = any ((select public.sedi_accessibili())::uuid[]));
create policy "corsi_update_sede" on public.corsi for update
  to authenticated
  using (sede_id = any ((select public.sedi_accessibili())::uuid[]))
  with check (sede_id = any ((select public.sedi_accessibili())::uuid[]));
create policy "corsi_delete_sede" on public.corsi for delete
  to authenticated using (sede_id = any ((select public.sedi_accessibili())::uuid[]));

drop policy "open_day_corsi_select_staff" on public.open_day_corsi;
drop policy "open_day_corsi_insert_staff" on public.open_day_corsi;
drop policy "open_day_corsi_update_staff" on public.open_day_corsi;
drop policy "open_day_corsi_delete_staff" on public.open_day_corsi;

-- open_days nella subquery e' a sua volta filtrato dalle RLS dell'utente.
create policy "open_day_corsi_select_sede" on public.open_day_corsi for select
  to authenticated using (exists (select 1 from public.open_days od where od.id = open_day_id));
create policy "open_day_corsi_insert_sede" on public.open_day_corsi for insert
  to authenticated with check (exists (select 1 from public.open_days od where od.id = open_day_id));
create policy "open_day_corsi_update_sede" on public.open_day_corsi for update
  to authenticated
  using (exists (select 1 from public.open_days od where od.id = open_day_id))
  with check (exists (select 1 from public.open_days od where od.id = open_day_id));
create policy "open_day_corsi_delete_sede" on public.open_day_corsi for delete
  to authenticated using (exists (select 1 from public.open_days od where od.id = open_day_id));

drop policy "bookings_select_staff" on public.bookings;
drop policy "bookings_update_staff" on public.bookings;
drop policy "bookings_delete_staff" on public.bookings;

create policy "bookings_select_sede" on public.bookings for select
  to authenticated using (sede_id = any ((select public.sedi_accessibili())::uuid[]));
create policy "bookings_update_sede" on public.bookings for update
  to authenticated
  using (sede_id = any ((select public.sedi_accessibili())::uuid[]))
  with check (sede_id = any ((select public.sedi_accessibili())::uuid[]));
create policy "bookings_delete_sede" on public.bookings for delete
  to authenticated using (sede_id = any ((select public.sedi_accessibili())::uuid[]));

drop policy "mdi_select_staff" on public.mdi;
drop policy "mdi_update_staff" on public.mdi;
drop policy "mdi_delete_staff" on public.mdi;

-- (mdi_insert_public resta: il kiosk inserisce, il trigger valida la sede.)
create policy "mdi_select_sede" on public.mdi for select
  to authenticated using (sede_id = any ((select public.sedi_accessibili())::uuid[]));
create policy "mdi_update_sede" on public.mdi for update
  to authenticated
  using (sede_id = any ((select public.sedi_accessibili())::uuid[]))
  with check (sede_id = any ((select public.sedi_accessibili())::uuid[]));
create policy "mdi_delete_sede" on public.mdi for delete
  to authenticated using (sede_id = any ((select public.sedi_accessibili())::uuid[]));

drop policy "notifiche_select_staff" on public.notifiche;
drop policy "notifiche_update_staff" on public.notifiche;

create policy "notifiche_select_sede" on public.notifiche for select
  to authenticated using (sede_id = any ((select public.sedi_accessibili())::uuid[]));
create policy "notifiche_update_sede" on public.notifiche for update
  to authenticated
  using (sede_id = any ((select public.sedi_accessibili())::uuid[]))
  with check (sede_id = any ((select public.sedi_accessibili())::uuid[]));

-- Il log contiene i dati personali inviati dal modulo: visibile all'admin e a
-- chi ha almeno una sede nella città del modulo.
drop policy "google_form_import_log_select_staff" on public.google_form_import_log;

create policy "google_form_import_log_select_citta" on public.google_form_import_log for select
  to authenticated using (
    (select public.is_admin())
    or citta_id in (select s.citta_id from public.sedi s where s.id = any ((select public.sedi_accessibili())::uuid[]))
  );

-- Template globali: li legge tutto lo staff, li modifica solo l'admin
-- (le sedi personalizzano i propri testi su `sedi`).
drop policy "impostazioni_update_staff" on public.impostazioni;

create policy "impostazioni_update_admin" on public.impostazioni for update
  to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Messaggi: luogo/contatti/testi della sede, con fallback ai template globali
-- ---------------------------------------------------------------------------

create or replace function public.componi_messaggio(
  p_testo text,
  p_booking public.bookings,
  p_open_day public.open_days,
  p_sede public.sedi,
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
      '{luogo}', coalesce(nullif(btrim(p_open_day.luogo_override), ''), p_sede.luogo)),
      '{indicazioni}', case when nullif(btrim(p_open_day.luogo_override), '') is null
                            then p_sede.indicazioni else '' end),
      '{motivo}', coalesce(nullif(btrim(p_motivo), ''), '')),
      '{contatti}', p_sede.contatti),
    '\s{2,}', ' ', 'g'));
$$;

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
  v_sede public.sedi;
  v_imp public.impostazioni;
  v_canale text;
  v_dest text;
  v_testo text;
  v_oggetto text;
begin
  select * into v_od from public.open_days where id = p_booking.open_day_id;
  select * into v_sede from public.sedi where id = p_booking.sede_id;
  select * into v_imp from public.impostazioni where id = 1;

  v_canale := v_imp.canale_predefinito;
  if v_canale = 'email' and nullif(btrim(p_booking.email), '') is null then
    v_canale := 'whatsapp_manuale';
  end if;
  v_dest := case when v_canale = 'email' then btrim(p_booking.email) else btrim(p_booking.telefono) end;

  v_testo := public.componi_messaggio(
    case p_tipo
      when 'approvazione' then coalesce(nullif(btrim(v_sede.testo_approvazione), ''), v_imp.testo_approvazione)
      when 'rifiuto' then coalesce(nullif(btrim(v_sede.testo_rifiuto), ''), v_imp.testo_rifiuto)
      else coalesce(nullif(btrim(v_sede.testo_reminder), ''), v_imp.testo_reminder)
    end,
    p_booking, v_od, v_sede, p_motivo);

  v_oggetto := case p_tipo
    when 'approvazione' then 'Iscrizione Open Day confermata'
    when 'rifiuto' then 'Iscrizione Open Day non confermata'
    else 'Promemoria Open Day'
  end || ' — ' || coalesce(nullif(btrim(v_sede.mittente_nome), ''), 'Immaginazione e Lavoro');

  insert into public.notifiche (
    booking_id, open_day_id, tipo, canale, destinatario, oggetto, testo, stato,
    mittente_nome, mittente_email
  )
  values (
    p_booking.id, p_booking.open_day_id, p_tipo, v_canale, v_dest, v_oggetto, v_testo,
    case when v_canale = 'whatsapp_manuale' then 'manuale' else 'in_coda' end,
    nullif(btrim(v_sede.mittente_nome), ''), nullif(btrim(v_sede.mittente_email), '')
  )
  on conflict (booking_id) where tipo = 'reminder' do nothing;
end;
$$;

revoke execute on function public.accoda_notifica(public.bookings, text, text) from public, anon, authenticated;

-- decidi_iscrizione: solo per iscrizioni delle proprie sedi.
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
    and sede_id = any (public.sedi_accessibili())
    and status in ('pending', 'waitlist', 'confirmed', 'rejected')
  returning * into v_booking;

  if not found then
    raise exception 'Iscrizione non trovata o non modificabile';
  end if;

  perform public.accoda_notifica(v_booking, case when p_approva then 'approvazione' else 'rifiuto' end, p_motivo);
  return v_booking;
end;
$$;

-- imposta_corsi_open_day e' SECURITY INVOKER: le nuove RLS di open_day_corsi
-- (via open_days) e il trigger di coerenza bastano; controlliamo comunque che
-- l'Open Day sia visibile per dare un errore chiaro invece di "0 righe".
create or replace function public.imposta_corsi_open_day(p_open_day_id uuid, p_corsi jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.open_days where id = p_open_day_id) then
    raise exception 'Open Day non trovato o non accessibile' using errcode = '42501';
  end if;

  delete from public.open_day_corsi where open_day_id = p_open_day_id;

  insert into public.open_day_corsi (open_day_id, corso_id, posti_max, ordine)
  select p_open_day_id, (e.value ->> 'corso_id')::uuid, nullif(e.value ->> 'posti_max', '')::integer, e.ordinality::integer
  from jsonb_array_elements(coalesce(p_corsi, '[]'::jsonb)) with ordinality as e(value, ordinality);
end;
$$;

-- ---------------------------------------------------------------------------
-- Kiosk: ricerca e precompilazione limitate alla sede del kiosk
-- ---------------------------------------------------------------------------

drop function if exists public.kiosk_cerca_iscritti(text);
drop function if exists public.kiosk_dati_iscritto(uuid);

create function public.kiosk_cerca_iscritti(p_sede_id uuid, p_query text)
returns table (id uuid, cognome text, nome text, scuola text, open_day_data date)
language sql
security definer
stable
set search_path = ''
as $$
  with q as (
    select replace(replace(replace(btrim(coalesce(p_query, '')), '\', '\\'), '%', '\%'), '_', '\_') as p
  )
  select b.id, b.cognome, b.nome, b.scuola, od.data
  from public.bookings b
  join public.open_days od on od.id = b.open_day_id
  join public.edizioni e on e.id = od.edizione_id
  cross join q
  where b.sede_id = p_sede_id
    and e.stato = 'attiva'
    and od.stato <> 'annullato'
    and b.status not in ('cancelled', 'rejected')
    and length(q.p) >= 2
    and (
      b.cognome ilike q.p || '%'
      or b.nome ilike q.p || '%'
      or (b.cognome || ' ' || b.nome) ilike q.p || '%'
      or (b.nome || ' ' || b.cognome) ilike q.p || '%'
    )
  order by b.cognome, b.nome, od.data
  limit 10;
$$;

create function public.kiosk_dati_iscritto(p_sede_id uuid, p_booking_id uuid)
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
  join public.edizioni e on e.id = od.edizione_id
  where b.id = p_booking_id
    and b.sede_id = p_sede_id
    and e.stato = 'attiva'
    and od.stato <> 'annullato'
    and b.status not in ('cancelled', 'rejected');
$$;

revoke execute on function public.kiosk_cerca_iscritti(uuid, text) from public;
grant execute on function public.kiosk_cerca_iscritti(uuid, text) to anon, authenticated;
revoke execute on function public.kiosk_dati_iscritto(uuid, uuid) from public;
grant execute on function public.kiosk_dati_iscritto(uuid, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- statistiche_sedi: dashboard comparativa. SECURITY INVOKER: ognuno vede solo
-- le sedi a cui ha accesso (RLS). Edizioni considerate: quelle con anno =
-- p_anno se indicato, altrimenti quelle in stato 'attiva'. Le MDI senza Open
-- Day collegato contano se create dall'apertura della prima edizione.
-- ---------------------------------------------------------------------------

create or replace function public.statistiche_sedi(p_anno text default null)
returns table (
  sede_id uuid,
  sede_nome text,
  citta_nome text,
  edizioni text,
  open_day integer,
  iscritti integer,
  confermati integer,
  da_approvare integer,
  in_attesa integer,
  presenti integer,
  mdi integer,
  mdi_esportate integer
)
language sql
stable
set search_path = ''
as $$
  with ed as (
    select e.id, e.sede_id, e.nome, coalesce(e.data_apertura::timestamptz, e.created_at) as dal
    from public.edizioni e
    where case when p_anno is null then e.stato = 'attiva' else e.anno = p_anno end
  ),
  od as (
    select o.id, o.sede_id
    from public.open_days o
    join ed on ed.id = o.edizione_id
    where o.stato <> 'annullato'
  )
  select
    s.id,
    s.nome,
    c.nome,
    (select string_agg(ed.nome, ', ' order by ed.nome) from ed where ed.sede_id = s.id),
    (select count(*)::int from od where od.sede_id = s.id),
    coalesce(b.iscritti, 0),
    coalesce(b.confermati, 0),
    coalesce(b.da_approvare, 0),
    coalesce(b.in_attesa, 0),
    coalesce(b.presenti, 0),
    coalesce(m.mdi, 0),
    coalesce(m.mdi_esportate, 0)
  from public.sedi s
  join public.citta c on c.id = s.citta_id
  left join lateral (
    select
      count(*) filter (where bk.status not in ('cancelled', 'rejected'))::int as iscritti,
      count(*) filter (where bk.status in ('confirmed', 'walk_in'))::int as confermati,
      count(*) filter (where bk.status = 'pending')::int as da_approvare,
      count(*) filter (where bk.status = 'waitlist')::int as in_attesa,
      count(*) filter (where bk.checked_in)::int as presenti
    from public.bookings bk
    join od on od.id = bk.open_day_id
    where od.sede_id = s.id
  ) b on true
  left join lateral (
    select count(*)::int as mdi, count(*) filter (where md.esportato_innovaplan)::int as mdi_esportate
    from public.mdi md
    where md.sede_id = s.id
      and (
        md.open_day_id in (select od.id from od where od.sede_id = s.id)
        or (md.open_day_id is null and md.created_at >= (select min(ed.dal) from ed where ed.sede_id = s.id))
      )
  ) m on true
  where s.id = any ((select public.sedi_accessibili())::uuid[])
  order by c.nome, s.ordine, s.nome;
$$;

revoke execute on function public.statistiche_sedi(text) from public, anon;
grant execute on function public.statistiche_sedi(text) to authenticated;
