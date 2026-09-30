-- 0012 — Permessi EXECUTE delle funzioni interne (Security Advisor, lint 0028/0029)
--
-- Su Supabase le funzioni nuove nello schema public ricevono EXECUTE direttamente da
-- anon/authenticated (default privileges), non solo tramite PUBLIC: il solo
-- `revoke ... from public` usato nelle migrazioni precedenti non basta.
--
-- Funzioni trigger: non sono chiamabili via /rest/v1/rpc (Postgres le esegue solo come
-- trigger), ma si toglie comunque il permesso. I trigger continuano a funzionare: il
-- privilegio EXECUTE e' verificato solo alla creazione del trigger, non a ogni esecuzione.
--
-- Restano volutamente eseguibili da anon: create_booking, posti_disponibili,
-- kiosk_cerca_iscritti, kiosk_dati_iscritto (flussi pubblici), is_staff/is_admin (usate
-- in policy valutate anche per anon, es. corsi_select_public). Da authenticated anche
-- decidi_iscrizione (controlla is_staff() al suo interno).

revoke execute on function public.bookings_imposta_sede() from public, anon, authenticated;
revoke execute on function public.edizioni_propaga_sede() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.mdi_imposta_sede() from public, anon, authenticated;
revoke execute on function public.notifiche_imposta_sede() from public, anon, authenticated;
revoke execute on function public.open_day_corsi_verifica_sede() from public, anon, authenticated;
revoke execute on function public.open_days_imposta_sede() from public, anon, authenticated;

-- sedi_accessibili(): come previsto in 0011, solo per lo staff autenticato (nessuna
-- policy TO anon la usa; le funzioni SECURITY DEFINER la chiamano come owner).
revoke execute on function public.sedi_accessibili() from anon;
