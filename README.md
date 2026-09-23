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

### 1. Progetto Supabase

1. Crea un nuovo progetto su [supabase.com](https://supabase.com) (piano Free).
2. Apri **SQL Editor** e incolla in ordine il contenuto dei file in `supabase/migrations/`
   (`0001_init_schema.sql`, poi `0002_rls_policies.sql`, poi `0003_seed_corsi.sql`).
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

## Comandi

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia il server di sviluppo |
| `npm run build` | Type-check + build di produzione |
| `npm run lint` | Lint con oxlint |
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
    ├── open-days/       # creazione/gestione edizioni e Open Day (staff)
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

- Export verso **INNOVAPLAN** (gestionale Wollo): non automatico in questo MVP. Ogni MDI
  ha un flag "esportato su INNOVAPLAN" gestito manualmente dallo staff.
