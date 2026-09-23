# Progetto: IL Recruitment — Open Day & MDI (Immaginazione e Lavoro)

## Cos'è

App di gestione recruitment IeFP, successore mirato del vecchio portale a file HTML
statici (`...\Desktop\2026-2027\Secondo Lavoro\Recruitment\`, che resta solo come
archivio/riferimento di design e campi — non più il progetto attivo).

Scope MVP, volutamente limitato a 4 flussi (altre funzionalità del vecchio portale —
composizione classi, azioni scuole, stage, scheda candidato completa, kanban gruppi,
SMS — NON vanno aggiunte se non esplicitamente richiesto):

1. Creazione Open Day (edizioni + eventi)
2. Registrazione pubblica all'Open Day
3. Monitoraggio Open Day (dashboard live)
4. Compilazione (kiosk pubblico) e gestione (staff) della MDI (Manifestazione di
   Interesse), con flag manuale di export verso **INNOVAPLAN** (gestionale Wollo — export
   non automatico, va sempre confermato caso per caso con l'utente se estendere la
   funzionalità)

## Stack

- Vite + React 19 + TypeScript, no CSS-in-JS: Tailwind CSS v4 (plugin `@tailwindcss/vite`,
  nessun `tailwind.config.js` — i token vivono come CSS custom properties in
  `src/index.css` e sono mappati in `@theme`).
- Supabase (Postgres + Auth + Realtime), piano Free. Schema in `supabase/migrations/`
  (0001 schema, 0002 RLS/RPC, 0003 seed corsi, 0004 kiosk MDI, 0005–0007 import Google
  Moduli + approvazione + coda notifiche + pg_cron, 0008 anagrafica MDI per INNOVAPLAN) — **fonte di verità**, da incollare in
  ordine nello SQL Editor del progetto Supabase.
- React Router v6, TanStack Query, React Hook Form (niente Zod: validazione via regole
  `register()` di RHF, tenuta volutamente semplice).
- Lint: `oxlint` (non ESLint). `npm run build` fa anche il type-check (`tsc -b`). Test: Vitest
  (`npm test`).
- Export INNOVAPLAN: CSV nel tracciato SIDI "Alunni e scelte" (`src/features/mdi/export/`),
  generato nel browser. Formato verificato byte per byte sull'esempio dell'utente in `risorse/`
  (senza BOM, `;`, CRLF, `;` finale, spazio iniziale nell'intestazione). `risorse/` contiene
  dati reali ed è gitignored: mai committarla né copiarne valori in codice/test.

## Sicurezza (repo GitHub pubblico, scelta esplicita dell'utente)

Il repo è **pubblico**: la protezione dei dati (MDI, iscrizioni con dati di minori) non
dipende dal codice essere segreto ma **solo** dalle RLS in `0002_rls_policies.sql`.
Regole da rispettare in ogni modifica futura allo schema:
- Mai grant pubblici ampi: `anon` ha solo lettura colonne non sensibili su `open_days`/
  `corsi` e insert su `mdi`; nessun insert diretto su `bookings` (solo via RPC
  `create_booking`, che applica capacità/waitlist atomicamente).
- `service_role` key: mai nel codice, mai in `.env.local` committato (è gitignored).
- Le pagine `/staff/*` sono protette sia da `ProtectedRoute` (router) sia dalle RLS
  lato DB — non fidarsi mai della sola UI per nascondere dati/azioni di gestione.
- Account staff creati solo dall'admin via Supabase Dashboard (Authentication → Invite),
  niente self-signup pubblico.
- Edge Functions Deno in `supabase/functions/` (`google-forms-webhook`, `send-notifications`):
  unico posto dove si usa la service role (dai secret Supabase). Apps Script del Google
  Modulo in `integrations/google-forms/`. Notifiche: canali intercambiabili in
  `supabase/functions/_shared/canali.ts` (email Brevo attiva; SMS/WhatsApp automatici
  predisposti, a pagamento, da attivare solo su richiesta dell'utente).

## Struttura

Vedi `README.md` per setup passo-passo (creare progetto Supabase, `.env.local`, primo
account staff, deploy). Struttura cartelle in `src/` spiegata lì.

## Convenzioni

- Lingua contenuti/UI: italiano.
- Mobile-first: l'app deve restare pienamente usabile da smartphone/tablet (form
  pubblici e area staff, inclusi check-in fatti a mano libera durante l'evento).
- Design system ripreso dal vecchio portale: variabili colore in `src/index.css`
  (`--orange` primario azioni, `--green` successo, `--blue`, `--red`, `--gray`...), font
  Lato. Mantenere coerenza visiva per chi già usa i vecchi strumenti.
- Ogni nuovo modulo Supabase (tabelle/RLS) segue il pattern di `0002_rls_policies.sql`:
  helper `is_staff()`, `TO authenticated`/`TO anon` espliciti, mai `auth.role()`.
- Per ogni nuovo strumento, segnalare sempre l'eventuale necessità di export dati verso
  INNOVAPLAN; è l'utente a confermare caso per caso se serve davvero.

## Stato attuale (2026-09-23) e prossimi passi

Scaffold completo e funzionante lato codice (build/lint/dev server verificati), **non
ancora collegato a un Supabase reale**. Per rendere l'app operativa:

1. Creare un progetto Supabase (Free) e incollare in ordine i file di
   `supabase/migrations/` nello SQL Editor.
2. `cp .env.example .env.local` e compilarlo con URL/anon key del progetto.
3. Da Supabase Dashboard → Authentication → invitare gli account staff (te stesso +
   eventuali colleghi a cui dare accesso a `/staff`).
4. `npm install && npm run dev` per provare in locale.
5. Collegare il repo GitHub (`https://github.com/federicoImmeLav/il-recruitment`) a
   Vercel per il deploy, impostando le stesse due variabili d'ambiente.

Repo GitHub già creato e collegato (`origin` → main pushato). L'utente ha altre
necessità/funzionalità da aggiungere in futuro, ancora da specificare — non anticiparle.
