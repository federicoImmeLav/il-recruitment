-- Indirizzi per Open Day e gruppi d'interesse.
--
-- - open_day_corsi: quali indirizzi (corsi) vengono presentati in ciascun Open
--   Day, con posti facoltativi per indirizzo (solo informativi: la capienza
--   vincolante resta open_days.posti_max, applicata da create_booking).
--   Open Day senza righe = tutti i corsi attivi (retrocompatibile).
-- - bookings.corso_iniziale_id: indirizzo scelto al momento dell'iscrizione.
--   Il gruppo d'interesse durante l'evento coincide con bookings.corso_id
--   (scelta esplicita dell'utente): spostare qualcuno di gruppo aggiorna
--   corso_id, e il confronto con corso_iniziale_id dice chi ha cambiato idea.

-- ---------------------------------------------------------------------------
-- open_day_corsi
-- ---------------------------------------------------------------------------

create table public.open_day_corsi (
  open_day_id uuid not null references public.open_days (id) on delete cascade,
  corso_id uuid not null references public.corsi (id) on delete restrict,
  posti_max integer check (posti_max > 0),
  ordine integer not null default 0,
  primary key (open_day_id, corso_id)
);

create index open_day_corsi_corso_idx on public.open_day_corsi (corso_id);

alter table public.open_day_corsi enable row level security;

-- Il form pubblico deve sapere quali indirizzi mostrare, ma solo per gli Open
-- Day aperti (stesso criterio di open_days_select_public).
create policy "open_day_corsi_select_public"
  on public.open_day_corsi for select
  to anon
  using (
    exists (
      select 1 from public.open_days od
      where od.id = open_day_id and od.stato = 'aperto'
    )
  );

create policy "open_day_corsi_select_staff"
  on public.open_day_corsi for select
  to authenticated
  using (public.is_staff());

create policy "open_day_corsi_insert_staff"
  on public.open_day_corsi for insert
  to authenticated
  with check (public.is_staff());

create policy "open_day_corsi_update_staff"
  on public.open_day_corsi for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "open_day_corsi_delete_staff"
  on public.open_day_corsi for delete
  to authenticated
  using (public.is_staff());

revoke all on public.open_day_corsi from anon;
grant select on public.open_day_corsi to anon;
grant select, insert, update, delete on public.open_day_corsi to authenticated;

-- ---------------------------------------------------------------------------
-- imposta_corsi_open_day: sostituisce in un colpo solo la configurazione degli
-- indirizzi di un Open Day. p_corsi = [{"corso_id": "...", "posti_max": 12|null}, ...]
-- nell'ordine di visualizzazione. SECURITY INVOKER: valgono le RLS staff.
-- ---------------------------------------------------------------------------

create or replace function public.imposta_corsi_open_day(p_open_day_id uuid, p_corsi jsonb)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not public.is_staff() then
    raise exception 'Operazione riservata allo staff' using errcode = '42501';
  end if;

  delete from public.open_day_corsi where open_day_id = p_open_day_id;

  insert into public.open_day_corsi (open_day_id, corso_id, posti_max, ordine)
  select p_open_day_id, (e.value ->> 'corso_id')::uuid, nullif(e.value ->> 'posti_max', '')::integer, e.ordinality::integer
  from jsonb_array_elements(coalesce(p_corsi, '[]'::jsonb)) with ordinality as e(value, ordinality);
end;
$$;

revoke execute on function public.imposta_corsi_open_day(uuid, jsonb) from public, anon;
grant execute on function public.imposta_corsi_open_day(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- bookings.corso_iniziale_id: valorizzato in automatico all'inserimento (vale
-- per create_booking, webhook Google Moduli e walk-in), mai toccato dopo.
-- ---------------------------------------------------------------------------

alter table public.bookings add column corso_iniziale_id uuid references public.corsi (id);

update public.bookings set corso_iniziale_id = corso_id where corso_iniziale_id is null;

create or replace function public.bookings_imposta_corso_iniziale()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.corso_iniziale_id := coalesce(new.corso_iniziale_id, new.corso_id);
  return new;
end;
$$;

create trigger bookings_corso_iniziale
  before insert on public.bookings
  for each row execute function public.bookings_imposta_corso_iniziale();

create index bookings_open_day_corso_idx on public.bookings (open_day_id, corso_id);

alter publication supabase_realtime add table public.open_day_corsi;
