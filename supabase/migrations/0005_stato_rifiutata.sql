-- Nuovo stato "rifiutata" per le richieste di iscrizione (Google Moduli) non
-- approvate dallo staff. File separato dalla 0006: un valore aggiunto a un enum
-- non puo' essere usato nella stessa transazione in cui viene creato.

alter type public.stato_booking add value if not exists 'rejected';
