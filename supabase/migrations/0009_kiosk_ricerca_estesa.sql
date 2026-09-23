-- Kiosk MDI: ricerca degli iscritti estesa (scelta esplicita dell'utente).
--
-- Prima (0004/0006): solo Open Day di OGGI e solo iscritti con check-in.
-- Ora: iscritti a qualsiasi Open Day non annullato di un'edizione ATTIVA
-- (cosi' la MDI si puo' compilare anche in giorni diversi dall'evento), per
-- cognome o nome. Esclusi rifiutati e annullati.
--
-- Esposizione verso anon: la ricerca (min. 2 caratteri, max 10 risultati)
-- restituisce solo cognome, nome, scuola e data dell'Open Day; i contatti si
-- leggono solo per id prenotazione scelto dai risultati (kiosk_dati_iscritto).

drop function if exists public.kiosk_cerca_iscritti(uuid, text);

create function public.kiosk_cerca_iscritti(p_query text)
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
  where e.stato = 'attiva'
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
    and e.stato = 'attiva'
    and od.stato <> 'annullato'
    and b.status not in ('cancelled', 'rejected');
$$;

revoke execute on function public.kiosk_cerca_iscritti(text) from public;
grant execute on function public.kiosk_cerca_iscritti(text) to anon, authenticated;
revoke execute on function public.kiosk_dati_iscritto(uuid) from public;
grant execute on function public.kiosk_dati_iscritto(uuid) to anon, authenticated;
