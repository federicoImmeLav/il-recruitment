-- 0014 — Annullamento ed eliminazione delle iscrizioni riservati agli admin
--
-- - Annulla (status 'cancelled') e Riattiva (da 'cancelled' a un altro stato): solo admin.
--   Il controllo vale per gli utenti autenticati; service role e SQL Editor (auth.uid()
--   nullo) non sono limitati.
-- - All'annullamento si tolgono i messaggi non ancora partiti (in coda o WhatsApp da
--   inviare a mano), per non mandare conferme o promemoria a chi e' stato annullato.
-- - Eliminazione definitiva: solo admin (prima bastava avere accesso alla sede).
--   Le notifiche dell'iscrizione si cancellano a cascata; MDI e registro Google Moduli
--   restano, col collegamento azzerato.

create or replace function public.bookings_controlla_annullamento()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.status = 'cancelled') is distinct from (old.status = 'cancelled') then
    if (select auth.uid()) is not null and not public.is_admin() then
      raise exception 'Solo un admin può annullare o riattivare un''iscrizione'
        using errcode = '42501';
    end if;
    if new.status = 'cancelled' then
      delete from public.notifiche
      where booking_id = new.id
        and stato in ('in_coda', 'manuale')
        and in_invio_at is null;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.bookings_controlla_annullamento() from public, anon, authenticated;

create trigger bookings_controlla_annullamento
  before update of status on public.bookings
  for each row execute function public.bookings_controlla_annullamento();

drop policy "bookings_delete_sede" on public.bookings;

create policy "bookings_delete_admin" on public.bookings for delete
  to authenticated
  using ((select public.is_admin()) and sede_id = any ((select public.sedi_accessibili())::uuid[]));
