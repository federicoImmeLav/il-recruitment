# IL Recruitment — Open Day & MDI

App di gestione recruitment IeFP di **Immaginazione e Lavoro**: creazione Open Day,
registrazione pubblica, monitoraggio in tempo reale e gestione delle Manifestazioni di
Interesse (MDI). MVP volutamente limitato a questi 4 flussi — altre funzionalità del
vecchio portale (composizione classi, azioni scuole, stage, ecc.) non sono incluse.

## Stack

- [Vite](https://vite.dev) + React 19 + TypeScript
- [Supabase](https://supabase.com) (Postgres, Auth, Realtime) — piano Free per iniziare
- Tailwind CSS v4 (palette/font ripresi dal design system esistente)
- React Router, TanStack Query, React Hook Form

## Setup

> **Vuoi solo vedere l'app?** `npm install && npm run demo` → apri http://localhost:5173/staff/dashboard. Parte con dati di esempio fittizi e un utente staff simulato, senza Supabase. Le modifiche restano solo in memoria e si perdono al reload.

### 1. Progetto Supabase

1. Crea un nuovo progetto su [supabase.com](https://supabase.com) (piano Free).
2. Apri **SQL Editor** e incolla in ordine il contenuto dei file in `supabase/migrations/`
   (`0001_init_schema.sql`, `0002_rls_policies.sql`, `0003_seed_corsi.sql`, `0004_kiosk_mdi.sql`,
   `0005_stato_rifiutata.sql`, `0006_google_forms_notifiche.sql`, `0008_mdi_anagrafica_innovaplan.sql`,
   `0009_kiosk_ricerca_estesa.sql`, `0010_indirizzi_gruppi.sql`).
   La `0007_cron_notifiche.sql` va eseguita dopo aver configurato le notifiche (vedi sotto).
3. In **Project Settings → API** copia `Project URL` e `anon public key`.

### 2. Variabili d'ambiente

```bash
cp .env.example .env.local
```

Compila `.env.local` con i valori del punto precedente. **Non committare mai `.env.local`**
(è già in `.gitignore`): contiene le chiavi del tuo progetto Supabase.

### 3. Installazione e avvio

```bash
npm install
npm run dev
```

### 4. Creare i primi account staff

Non esiste self-signup pubblico. Per dare accesso all'area riservata (`/staff/...`) a te
stesso o a un collega: **Supabase Dashboard → Authentication → Users → Invite user**.
L'account viene collegato automaticamente a un profilo staff (tabella `profiles`).

### 5. Iscrizioni da Google Moduli, conferme e promemoria

Flusso: risposta al Google Modulo → iscrizione **"Da approvare"** nel Monitoraggio → lo staff
approva o rifiuta → la famiglia riceve un messaggio con esito, data, ora e luogo → 2 giorni
prima dell'Open Day parte un promemoria automatico ai confermati.

**Canali di invio** (Impostazioni → Canale di invio):
- **Email** — automatica e gratuita con [Brevo](https://www.brevo.com) (piano free: 300 email/giorno).
- **WhatsApp manuale** — gratuito: nell'app il pulsante "Invia su WhatsApp" apre WhatsApp con il
  messaggio già scritto, l'operatore preme Invia. Usato anche quando manca l'email.
- **SMS / WhatsApp automatico** — a pagamento, predisposti in `supabase/functions/_shared/canali.ts`:
  si attivano aggiungendo i secret del provider (SMS: `BREVO_SMS_SENDER`).

**Configurazione** (una volta sola):

1. **Brevo**: crea un account gratuito, verifica il mittente (idealmente un indirizzo
   @immaginazioneelavoro.it — per la consegna migliore servono i record DNS SPF/DKIM che Brevo
   indica, da chiedere a chi gestisce il dominio) e genera una **API key**.
2. **Edge Functions** (dalla cartella del progetto; `<ref>` è l'id del progetto Supabase):
   ```bash
   npx supabase login
   npx supabase functions deploy google-forms-webhook --project-ref <ref>
   npx supabase functions deploy send-notifications --project-ref <ref>
   npx supabase secrets set --project-ref <ref>      GOOGLE_FORMS_SECRET=<stringa-casuale-lunga>      NOTIFICHE_CRON_SECRET=<altra-stringa-casuale-lunga>      BREVO_API_KEY=<api-key-brevo>      NOTIFICHE_MITTENTE_EMAIL=<mittente-verificato>
   ```
   Le stringhe casuali si possono generare con `openssl rand -hex 32`. **Non vanno mai nel repo.**
3. **Job pianificati**: nello SQL Editor salva nel Vault URL e segreto (vedi l'intestazione di
   `0007_cron_notifiche.sql`), poi esegui `0007_cron_notifiche.sql`. Crea due job: promemoria
   ogni mattina e invio della coda ogni 5 minuti.
4. **Google Modulo**: segui [`integrations/google-forms/README.md`](integrations/google-forms/README.md)
   (Apps Script + attivatore). In ogni Open Day dell'app compila **"Etichetta modulo Google"**
   con il testo identico dell'opzione del menu.
5. In **Impostazioni** sostituisci luogo, indicazioni e contatti fittizi con quelli reali e
   controlla i testi dei messaggi (c'è l'anteprima).

### 6. Export anagrafiche per INNOVAPLAN

La MDI raccoglie i dati del tracciato SIDI **"Alunni e scelte"** (codici fiscali, luogo di nascita,
cittadinanza, dati del genitore, scuola di provenienza con codice meccanografico). Da
**MDI → Esporta per INNOVAPLAN** si scarica un CSV con le stesse 69 colonne e lo stesso formato
dell'export SIDI (separatore `;`, UTF-8, CRLF), da importare su INNOVAPLAN; poi si segnano le MDI
come esportate (passo manuale).

Prima del primo export, in **Impostazioni → Dati per INNOVAPLAN** inserisci il **codice
ministeriale di ogni corso** (colonna IND_MINISTERIALE, es. A199) e verifica codice sede (MICF065007)
e classificazione (R3).

Scelte da verificare al primo import di prova: cittadinanza e stato estero sono esportati come
**nome del paese** (i codici SIDI non coincidono con quelli ISTAT); le colonne proprie delle domande
ministeriali (COD_ALUNNO, PROG/STATO/TIPO_DOMANDA, UTENZA) restano vuote.

Elenchi di riferimento (comuni ISTAT con codice catastale, paesi esteri, scuole medie della
Lombardia dall'anagrafe MIUR) in `src/data/`, rigenerabili con
`node scripts/genera-dati-riferimento.mjs` (aggiornare `ANNO_MIUR` ogni anno).

> ⚠️ La cartella `risorse/` (file d'esempio con dati reali) è esclusa da git: non spostare mai
> file con dati personali fuori da lì.

## Comandi

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia il server di sviluppo |
| `npm run demo` | Server di sviluppo in **modalità demo**: dati finti in memoria, login saltato, nessun Supabase necessario (solo locale, mai in build di produzione) |
| `npm run build` | Type-check + build di produzione |
| `npm run lint` | Lint con oxlint |
| `npm test` | Test (Vitest): codice fiscale, export INNOVAPLAN |
| `npm run preview` | Serve la build di produzione in locale |

## Struttura

```
src/
├── lib/            # client Supabase, query client, costanti (corsi, enum)
├── types/          # tipi TypeScript allineati allo schema Supabase
├── hooks/          # data fetching (React Query) e realtime
├── components/     # UI condivisa (ui/, layout/, charts/)
├── router/         # ProtectedRoute per l'area staff
└── features/
    ├── auth/           # login staff
    ├── registration/   # form pubblico di iscrizione all'Open Day
    ├── bookings/       # gestione iscrizioni + check-in (staff)
    ├── monitoring/      # dashboard di monitoraggio live (staff)
    ├── open-days/       # creazione/gestione edizioni e Open Day + indirizzi presentati (staff)
    ├── gruppi/          # gruppi d'interesse per indirizzo: board live + riepilogo (staff)
    └── mdi/             # kiosk MDI (pubblico) + elenco/gestione (staff)

supabase/migrations/     # schema, RLS policies, seed dei corsi
```

## Sicurezza (repo pubblico)

Questo repository è pubblico. La protezione dei dati personali **non dipende dal codice
essere segreto**, ma esclusivamente dalle Row Level Security policy in
`supabase/migrations/0002_rls_policies.sql`: nessuna riga di `bookings` o `mdi` è
leggibile senza un account staff attivo. La chiave `anon` è pubblica per design (è
protetta dalle RLS); la `service_role` key **non va mai** inserita nel codice o in
`.env.local` committato.

## Deploy

Consigliato [Vercel](https://vercel.com), collegato a questo repository GitHub:
imposta `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` in Project Settings → Environment
Variables (mai nel codice).

## Note

- Il Google Modulo dovrebbe riportare l'informativa privacy e avvisare che la famiglia verrà
  contattata via email/WhatsApp/SMS per conferma e promemoria (i dati passano da Google e Brevo).

- Export verso **INNOVAPLAN** (gestionale Wollo): non automatico in questo MVP. Ogni MDI
  ha un flag "esportato su INNOVAPLAN" gestito manualmente dallo staff.
