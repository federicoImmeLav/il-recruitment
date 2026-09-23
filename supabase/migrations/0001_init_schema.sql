-- Schema iniziale: Open Day (edizioni, eventi, iscrizioni) + MDI (Manifestazione di Interesse).
-- Scope MVP: creazione Open Day, registrazione, monitoraggio, compilazione/gestione MDI.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

create type public.stato_edizione as enum ('bozza', 'attiva', 'chiusa');
create type public.stato_open_day as enum ('aperto', 'chiuso', 'annullato');
create type public.tipo_open_day as enum ('OpenDay', 'OpenDay2e');
create type public.stato_booking as enum ('confirmed', 'pending', 'waitlist', 'walk_in', 'cancelled');
create type public.canale_iscrizione as enum ('online', 'scuola', 'walk_in', 'telefono', 'altro');
create type public.qualita_accompagnatore as enum ('genitore', 'tutore');
create type public.sostegno_stato as enum ('mai', 'passato', 'presente');
create type public.ruolo_operatore as enum (
  'farmer_iefp',
  'coordinamento_recruitment',
  'responsabile_bu_iefp',
  'operatore_segreteria',
  'preside',
  'responsabile_corso',
  'admin'
);

-- ---------------------------------------------------------------------------
-- profiles: un account staff per persona, collegato 1:1 ad auth.users.
-- Niente self-signup pubblico: gli account vengono creati dall'admin via
-- Supabase Dashboard (Authentication > Invite user); questo trigger popola
-- solo la riga di profilo corrispondente.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome_completo text not null default '',
  ruolo public.ruolo_operatore not null default 'operatore_segreteria',
  attivo boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome_completo)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome_completo', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- edizioni
-- ---------------------------------------------------------------------------

create table public.edizioni (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  anno text not null,
  data_apertura date,
  data_chiusura date,
  stato public.stato_edizione not null default 'bozza',
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger edizioni_set_updated_at
  before update on public.edizioni
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- open_days
-- ---------------------------------------------------------------------------

create table public.open_days (
  id uuid primary key default gen_random_uuid(),
  edizione_id uuid not null references public.edizioni (id) on delete restrict,
  data date not null,
  ora time not null,
  operatore_id uuid references public.profiles (id),
  posti_max integer not null check (posti_max > 0),
  note text,
  tipo public.tipo_open_day not null default 'OpenDay',
  stato public.stato_open_day not null default 'aperto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index open_days_edizione_data_idx on public.open_days (edizione_id, data);

create trigger open_days_set_updated_at
  before update on public.open_days
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- corsi (lookup, popolata da 0003_seed_corsi.sql)
-- ---------------------------------------------------------------------------

create table public.corsi (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  qualifica text not null,
  ordine integer not null default 0,
  attivo boolean not null default true
);

-- ---------------------------------------------------------------------------
-- bookings (iscrizioni Open Day)
-- ---------------------------------------------------------------------------

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  open_day_id uuid not null references public.open_days (id) on delete cascade,
  edizione_id uuid not null references public.edizioni (id) on delete restrict,
  cognome text not null,
  nome text not null,
  data_nascita date,
  scuola text,
  classe text,
  residenza text,
  telefono text not null,
  email text,
  corso_id uuid references public.corsi (id),
  corso2_id uuid references public.corsi (id),
  canale public.canale_iscrizione not null default 'online',
  status public.stato_booking not null default 'pending',
  flag_seconda_media boolean not null default false,
  checked_in boolean not null default false,
  checked_in_at timestamptz,
  registered_at timestamptz not null default now(),
  note_staff text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_open_day_status_idx on public.bookings (open_day_id, status);
create index bookings_open_day_checkin_idx on public.bookings (open_day_id, checked_in);

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- mdi (Manifestazione di Interesse)
-- ---------------------------------------------------------------------------

create table public.mdi (
  id uuid primary key default gen_random_uuid(),
  open_day_id uuid references public.open_days (id) on delete set null,
  booking_id uuid references public.bookings (id) on delete set null,

  -- Accompagnatore
  acc_cognome text not null,
  acc_nome text not null,
  acc_qualita public.qualita_accompagnatore not null,
  acc_cellulare text not null,
  acc_email text not null,

  -- Allievo
  all_cognome text not null,
  all_nome text not null,
  all_data_nascita date not null,
  all_annualita smallint not null check (all_annualita between 1 and 5),
  all_sezione char(1),
  all_nato_a text not null,
  all_cittadinanza text not null,
  all_scuola_provenienza text,
  all_residenza_via text not null,
  all_residenza_citta text not null,
  all_residenza_prov char(2),
  all_residenza_cap text,
  all_domicilio_diverso boolean not null default false,
  all_domicilio_via text,
  all_domicilio_citta text,
  all_domicilio_prov char(2),
  all_domicilio_cap text,

  -- Corsi (fino a 3 preferenze ordinate)
  corso_pref1_id uuid references public.corsi (id),
  corso_pref2_id uuid references public.corsi (id),
  corso_pref3_id uuid references public.corsi (id),

  -- Sostegno / certificazioni
  sostegno_stato public.sostegno_stato not null default 'mai',
  sostegno_asl boolean not null default false,
  sostegno_diagnosi_funzionale boolean not null default false,
  sostegno_bes boolean not null default false,
  sostegno_dsa boolean not null default false,

  -- Canale di conoscenza
  canale_orientamento_scuola boolean not null default false,
  canale_open_day boolean not null default false,
  canale_ricerca_online boolean not null default false,
  canale_passaparola boolean not null default false,
  canale_altro boolean not null default false,
  canale_altro_testo text,

  -- Privacy / consensi (GDPR art. 13, come da modulo cartaceo)
  consenso_foto_realizzare boolean not null default false,
  consenso_foto_utilizzare boolean not null default false,
  consenso_foto_comunicare boolean not null default false,
  dichiarazione_firma_genitore boolean not null default false,

  -- Gestione staff / export verso INNOVAPLAN (gestionale Wollo, manuale)
  esportato_innovaplan boolean not null default false,
  esportato_innovaplan_at timestamptz,
  esportato_innovaplan_by uuid references public.profiles (id),
  stato_lavorazione text not null default 'nuovo',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index mdi_open_day_idx on public.mdi (open_day_id);
create index mdi_esportato_innovaplan_idx on public.mdi (esportato_innovaplan);
create index mdi_allievo_nome_idx on public.mdi (all_cognome, all_nome);

create trigger mdi_set_updated_at
  before update on public.mdi
  for each row execute function public.set_updated_at();
