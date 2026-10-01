-- 0013 — Iscrizioni agli Open Day solo dal Google Modulo
--
-- La pagina pubblica dell'app (/open-day/<id>/iscrizione) e' stata rimossa: le famiglie
-- si iscrivono soltanto dal Google Modulo, le cui risposte arrivano dal webhook
-- `google-forms-webhook` (service role) come iscrizioni "da approvare".
--
-- anon non deve quindi piu' poter creare iscrizioni ne' leggere la capienza residua.
-- create_booking resta allo staff autenticato per i walk-in; posti_disponibili resta
-- eseguibile da authenticated (nessun dato personale).
-- Come in 0012: su Supabase va revocato anche da anon, non solo da public.

revoke execute on function public.create_booking(
  uuid, text, text, text, date, text, text, text, text, uuid, uuid,
  public.canale_iscrizione, boolean
) from public, anon;

revoke execute on function public.posti_disponibili(uuid) from public, anon;
