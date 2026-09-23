-- Kiosk MDI: consensi privacy A/B (come da modulo cartaceo / vecchio kiosk v5) e
-- ricerca pubblica degli iscritti per precompilare la MDI dopo l'Open Day.
--
-- Scelta esplicita dell'utente: ricerca senza codice di sblocco, ma limitata al
-- minimo indispensabile. anon NON ottiene alcun grant su `bookings`: passa solo
-- da queste due funzioni SECURITY DEFINER, che:
--   - rispondono solo per open day in data odierna (fuso Europe/Rome);
--   - considerano solo iscritti con check-in effettuato (presenti all'evento);
--   - la ricerca richiede almeno 2 caratteri, matcha per prefisso di cognome,
--     restituisce max 10 righe e solo cognome/nome/scuola (niente contatti);
--   - i dati di precompilazione si leggono solo per id prenotazione (uuid,
--     ottenuto dalla ricerca), con le stesse condizioni.

-- ---------------------------------------------------------------------------
-- Consensi informativa privacy
--   A) trattamento dati personali e sensibili per finalita' istituzionali
--   B) comunicazioni commerciali / newsletter
-- ---------------------------------------------------------------------------

alter table public.mdi
  add column consenso_privacy_a boolean not null default false,
  add column consenso_privacy_b boolean not null default false;

-- ---------------------------------------------------------------------------
-- kiosk_cerca_iscritti
-- ---------------------------------------------------------------------------

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
    and b.status <> 'cancelled'
    and length(btrim(coalesce(p_query, ''))) >= 2
    and b.cognome ilike replace(replace(replace(btrim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
  order by b.cognome, b.nome
  limit 10;
$$;

-- ---------------------------------------------------------------------------
-- kiosk_dati_iscritto: campi usati per precompilare la MDI
-- ---------------------------------------------------------------------------

create or replace function public.kiosk_dati_iscritto(p_booking_id uuid)
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
  corso2_id uuid
)
language sql
security definer
stable
set search_path = ''
as $$
  select b.id, b.open_day_id, b.cognome, b.nome, b.data_nascita, b.scuola,
         b.telefono, b.email, b.corso_id, b.corso2_id
  from public.bookings b
  join public.open_days od on od.id = b.open_day_id
  where b.id = p_booking_id
    and od.data = (now() at time zone 'Europe/Rome')::date
    and b.checked_in = true
    and b.status <> 'cancelled';
$$;

revoke execute on function public.kiosk_cerca_iscritti(uuid, text) from public;
revoke execute on function public.kiosk_dati_iscritto(uuid) from public;
grant execute on function public.kiosk_cerca_iscritti(uuid, text) to anon, authenticated;
grant execute on function public.kiosk_dati_iscritto(uuid) to anon, authenticated;
