-- Row Level Security: repo di questo progetto e' pubblico su GitHub, quindi la
-- sicurezza dei dati personali (MDI, iscrizioni) dipende INTERAMENTE da queste
-- policy, non dalla segretezza del codice. Nessuna riga di `bookings`/`mdi` e'
-- leggibile senza un account staff attivo, indipendentemente dalla UI.

alter table public.profiles enable row level security;
alter table public.edizioni enable row level security;
alter table public.open_days enable row level security;
alter table public.corsi enable row level security;
alter table public.bookings enable row level security;
alter table public.mdi enable row level security;

-- ---------------------------------------------------------------------------
-- Helper: is_staff()
-- SECURITY DEFINER e' necessario qui perche' la policy di lettura di `profiles`
-- non permetterebbe altrimenti a un utente di verificare il proprio stato
-- staff. La funzione non espone righe: restituisce solo un booleano.
-- ---------------------------------------------------------------------------

create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and attivo = true
  );
$$;

grant execute on function public.is_staff() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- profiles
-- Ogni operatore legge il proprio profilo; lo staff attivo legge tutti i
-- profili (per assegnare open day a un collega). Nessuna insert/update/delete
-- da client: la creazione avviene via trigger, le modifiche di ruolo si fanno
-- da Supabase Dashboard (fuori scope MVP).
-- ---------------------------------------------------------------------------

create policy "profiles_select_own_or_staff"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.is_staff());

-- ---------------------------------------------------------------------------
-- edizioni: gestione riservata allo staff.
-- ---------------------------------------------------------------------------

create policy "edizioni_select_staff"
  on public.edizioni for select
  to authenticated
  using (public.is_staff());

create policy "edizioni_insert_staff"
  on public.edizioni for insert
  to authenticated
  with check (public.is_staff());

create policy "edizioni_update_staff"
  on public.edizioni for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "edizioni_delete_staff"
  on public.edizioni for delete
  to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- open_days: il pubblico deve poter vedere gli eventi aperti (per iscriversi),
-- ma non gli eventi chiusi/annullati ne' le colonne interne (note, operatore).
-- La visibilita' di riga e' gestita qui via RLS; le colonne visibili all'anon
-- sono ristrette separatamente con GRANT a livello di colonna piu' sotto.
-- ---------------------------------------------------------------------------

create policy "open_days_select_public"
  on public.open_days for select
  to anon
  using (stato = 'aperto');

create policy "open_days_select_staff"
  on public.open_days for select
  to authenticated
  using (public.is_staff());

create policy "open_days_insert_staff"
  on public.open_days for insert
  to authenticated
  with check (public.is_staff());

create policy "open_days_update_staff"
  on public.open_days for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "open_days_delete_staff"
  on public.open_days for delete
  to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- corsi: lookup pubblica (serve nei form di registrazione/MDI).
-- ---------------------------------------------------------------------------

create policy "corsi_select_public"
  on public.corsi for select
  to anon, authenticated
  using (attivo = true or public.is_staff());

create policy "corsi_insert_staff"
  on public.corsi for insert
  to authenticated
  with check (public.is_staff());

create policy "corsi_update_staff"
  on public.corsi for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "corsi_delete_staff"
  on public.corsi for delete
  to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- bookings: nessuna policy di insert per anon. L'unico modo per creare una
-- prenotazione da pubblico e' la funzione public.create_booking() (piu' sotto),
-- SECURITY DEFINER, che applica atomicamente la regola di capacita'/waitlist.
-- Lettura e gestione riservate allo staff.
-- ---------------------------------------------------------------------------

create policy "bookings_select_staff"
  on public.bookings for select
  to authenticated
  using (public.is_staff());

create policy "bookings_update_staff"
  on public.bookings for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "bookings_delete_staff"
  on public.bookings for delete
  to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- mdi: il kiosk pubblico (non autenticato) puo' inserire una nuova MDI, ma il
-- `with check` impedisce di auto-marcarsi come gia' esportata su INNOVAPLAN o
-- di impostare chi/quando l'ha esportata. Lettura e gestione riservate allo
-- staff.
-- ---------------------------------------------------------------------------

create policy "mdi_insert_public"
  on public.mdi for insert
  to anon, authenticated
  with check (
    esportato_innovaplan = false
    and esportato_innovaplan_at is null
    and esportato_innovaplan_by is null
  );

create policy "mdi_select_staff"
  on public.mdi for select
  to authenticated
  using (public.is_staff());

create policy "mdi_update_staff"
  on public.mdi for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "mdi_delete_staff"
  on public.mdi for delete
  to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------------------------
-- GRANT a livello di colonna/tabella. Supabase concede di default privilegi
-- ampi ai ruoli anon/authenticated: qui li restringiamo esplicitamente cosi'
-- che, anche in presenza di un bug nelle policy RLS, l'anon non possa comunque
-- leggere colonne sensibili o scrivere fuori dai canali previsti.
-- ---------------------------------------------------------------------------

revoke all on public.profiles from anon;
revoke all on public.edizioni from anon;
revoke all on public.open_days from anon;
revoke all on public.corsi from anon;
revoke all on public.bookings from anon;
revoke all on public.mdi from anon;

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.edizioni to authenticated;
grant select, insert, update, delete on public.open_days to authenticated;
grant select (id, edizione_id, data, ora, posti_max, tipo, stato) on public.open_days to anon;
grant select, insert, update, delete on public.corsi to authenticated;
grant select on public.corsi to anon;
grant select, update, delete on public.bookings to authenticated;
-- Nessun grant di insert su bookings per authenticated/anon: le prenotazioni
-- passano sempre dalla RPC create_booking, anche quando le crea lo staff
-- (walk-in), cosi' la logica di capacita'/waitlist resta un unico punto.
grant select, update, delete on public.mdi to authenticated;
grant insert on public.mdi to anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC create_booking: unico punto di ingresso per creare una prenotazione,
-- richiamabile sia dal form pubblico (anon) sia dallo staff (walk-in).
-- SECURITY DEFINER perche' anon non ha alcun grant diretto su `bookings`;
-- la funzione stessa applica i controlli di validita' (open day aperto) e la
-- promozione automatica a lista d'attesa oltre `posti_max`, in modo atomico
-- (lock di riga) per evitare race condition su iscrizioni concorrenti.
-- ---------------------------------------------------------------------------

create or replace function public.create_booking(
  p_open_day_id uuid,
  p_cognome text,
  p_nome text,
  p_telefono text,
  p_data_nascita date default null,
  p_scuola text default null,
  p_classe text default null,
  p_residenza text default null,
  p_email text default null,
  p_corso_id uuid default null,
  p_corso2_id uuid default null,
  p_canale public.canale_iscrizione default 'online',
  p_flag_seconda_media boolean default false
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_open_day public.open_days;
  v_edizione_id uuid;
  v_confermate integer;
  v_status public.stato_booking;
  v_booking public.bookings;
begin
  select * into v_open_day
  from public.open_days
  where id = p_open_day_id
  for update;

  if not found then
    raise exception 'Open day non trovato';
  end if;

  if v_open_day.stato <> 'aperto' then
    raise exception 'Open day non aperto alle iscrizioni';
  end if;

  v_edizione_id := v_open_day.edizione_id;

  select count(*) into v_confermate
  from public.bookings
  where open_day_id = p_open_day_id
    and status in ('confirmed', 'walk_in');

  if v_confermate < v_open_day.posti_max then
    v_status := 'confirmed';
  else
    v_status := 'waitlist';
  end if;

  insert into public.bookings (
    open_day_id, edizione_id, cognome, nome, data_nascita, scuola, classe,
    residenza, telefono, email, corso_id, corso2_id, canale, status,
    flag_seconda_media
  ) values (
    p_open_day_id, v_edizione_id, p_cognome, p_nome, p_data_nascita, p_scuola,
    p_classe, p_residenza, p_telefono, p_email, p_corso_id, p_corso2_id,
    p_canale, v_status, p_flag_seconda_media
  )
  returning * into v_booking;

  return v_booking;
end;
$$;

grant execute on function public.create_booking(
  uuid, text, text, text, date, text, text, text, text, uuid, uuid,
  public.canale_iscrizione, boolean
) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- posti_disponibili: aggregato pubblico (nessun dato personale) per mostrare
-- la capienza residua nel form di registrazione senza dare accesso di lettura
-- alla tabella `bookings`.
-- ---------------------------------------------------------------------------

create or replace function public.posti_disponibili(p_open_day_id uuid)
returns integer
language sql
security definer
stable
set search_path = ''
as $$
  select od.posti_max - count(b.id)::int
  from public.open_days od
  left join public.bookings b
    on b.open_day_id = od.id and b.status in ('confirmed', 'walk_in')
  where od.id = p_open_day_id
  group by od.posti_max;
$$;

grant execute on function public.posti_disponibili(uuid) to anon, authenticated;
