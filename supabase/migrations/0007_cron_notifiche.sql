-- Job pianificati per le notifiche (pg_cron + pg_net, disponibili sul piano Free).
--
-- PRIMA di eseguire questo file, salva nel Vault (SQL Editor) i due valori
-- specifici del tuo progetto — NON vanno mai scritti nel repo:
--
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/send-notifications', 'notifiche_function_url');
--   select vault.create_secret('<stesso valore del secret NOTIFICHE_CRON_SECRET>', 'notifiche_cron_secret');
--
-- Orari: pg_cron lavora in UTC. '0 7 * * *' = 09:00 ora legale / 08:00 ora solare
-- italiana; va bene per un promemoria "due giorni prima".

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Rende il file rieseguibile senza duplicare i job.
select cron.unschedule(jobname)
from cron.job
where jobname in ('accoda-reminder-open-day', 'invia-notifiche');

-- Ogni mattina: accoda i promemoria per gli Open Day di dopodomani.
select cron.schedule(
  'accoda-reminder-open-day',
  '0 7 * * *',
  $$ select public.accoda_reminder(); $$
);

-- Ogni 5 minuti: se ci sono notifiche in coda, chiama l'Edge Function che le invia.
select cron.schedule(
  'invia-notifiche',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'notifiche_function_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'notifiche_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  )
  where exists (select 1 from public.notifiche where stato = 'in_coda')
    and exists (select 1 from vault.decrypted_secrets where name = 'notifiche_function_url');
  $$
);
