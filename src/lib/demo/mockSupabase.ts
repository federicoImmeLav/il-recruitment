// Client Supabase finto, in memoria, per la modalita' demo (`npm run demo`).
// Serve solo a vedere/provare la UI senza un progetto Supabase reale: dati di
// esempio fittizi, sessione staff finta, nessuna rete. Si perde tutto al reload.
// Implementa solo il sottoinsieme di query builder usato dagli hook in src/hooks.

import type {
  Booking,
  Corso,
  Edizione,
  GoogleFormImportLog,
  Impostazioni,
  Mdi,
  Notifica,
  OpenDay,
  OpenDayCorso,
  Profile,
} from '../../types/database.types'
import { componiMessaggio } from '../messaggi'
import { carattereControllo } from '../codiceFiscale'

type Row = Record<string, unknown>

const now = () => new Date().toISOString()
const uuid = () => crypto.randomUUID()

function isoDate(offsetDays: number) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

// --- Seed -------------------------------------------------------------------

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'

const profiles: Profile[] = [
  { id: DEMO_USER_ID, nome_completo: 'Utente Demo', ruolo: 'admin', attivo: true, created_at: now() },
]

const corsiSeed: [string, string][] = [
  ['Cucina', 'Operatore della ristorazione - preparazione pasti'],
  ['Sala Bar', 'Operatore della ristorazione - servizi di sala e bar'],
  ['Panificazione e pasticceria', 'Operatore della ristorazione - panificazione e pasticceria'],
  ['Acconciatura', 'Operatore del benessere - acconciatura'],
  ['Estetica', 'Operatore del benessere - estetica'],
  ['Informatica', 'Operatore informatico'],
  ['Grafica', 'Operatore grafico'],
  ['Comunicazione Digitale', 'Operatore della comunicazione digitale'],
  ['Elettricità e domotica', 'Operatore elettrico - impianti civili e domotica'],
]
const corsi: Corso[] = corsiSeed.map(([nome, qualifica], i) => ({
  id: uuid(),
  nome,
  qualifica,
  ordine: i + 1,
  attivo: true,
  // Da impostare in Impostazioni (la corrispondenza reale corso <-> codice la conosce lo staff).
  codice_ministeriale: null,
}))

/** Codice fiscale di fantasia ma formalmente valido (carattere di controllo corretto). */
function cfDemo(cognome: string, nome: string, data: string, femmina: boolean, luogo = 'F205') {
  const lettere = (s: string) => (s.toUpperCase().replace(/[^A-Z]/g, '') + 'XXX').slice(0, 3)
  const [y, m, d] = data.split('-')
  const giorno = String(Number(d) + (femmina ? 40 : 0)).padStart(2, '0')
  const primi15 = `${lettere(cognome)}${lettere(nome)}${y.slice(2)}${'ABCDEHLMPRST'[Number(m) - 1]}${giorno}${luogo}`
  return primi15 + carattereControllo(primi15)
}

const edizioneId = uuid()
const edizioni: Edizione[] = [
  {
    id: edizioneId,
    nome: 'Recruitment 2026-2027',
    anno: '2026-2027',
    data_apertura: isoDate(-30),
    data_chiusura: isoDate(120),
    stato: 'attiva',
    created_by: DEMO_USER_ID,
    created_at: now(),
    updated_at: now(),
  },
]

function openDay(offset: number, ora: string, posti: number, tipo: OpenDay['tipo'] = 'OpenDay'): OpenDay {
  return {
    id: uuid(),
    edizione_id: edizioneId,
    data: isoDate(offset),
    ora,
    operatore_id: DEMO_USER_ID,
    posti_max: posti,
    note: null,
    tipo,
    stato: 'aperto',
    etichetta_modulo: etichettaModulo(isoDate(offset), ora),
    luogo_override: null,
    created_at: now(),
    updated_at: now(),
  }
}

function etichettaModulo(data: string, ora: string) {
  const d = new Date(`${data}T12:00:00`)
  const giorno = d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return `${giorno.charAt(0).toUpperCase()}${giorno.slice(1)} — ore ${ora}`
}

/** Campi aggiunti in 0006 (Google Moduli / approvazione), vuoti per le iscrizioni non da modulo. */
const campiDecisione = {
  google_response_id: null,
  acc_cognome: null,
  acc_nome: null,
  decisione_at: null,
  decisione_by: null,
  motivo_rifiuto: null,
}
const open_days: OpenDay[] = [openDay(0, '15:00', 20), openDay(7, '10:00', 30), openDay(14, '15:30', 15, 'OpenDay2e')]

// Indirizzi presentati: il 1° Open Day ha una selezione (con posti per alcuni), il 2° usa tutti i corsi
// attivi (nessuna configurazione), il 3° solo l'area ristorazione.
const open_day_corsi: OpenDayCorso[] = [
  ...[0, 1, 2, 4, 6].map((c, i) => ({ open_day_id: open_days[0].id, corso_id: corsi[c].id, posti_max: i < 2 ? 4 : null, ordine: i + 1 })),
  ...[0, 1, 2].map((c, i) => ({ open_day_id: open_days[2].id, corso_id: corsi[c].id, posti_max: null, ordine: i + 1 })),
]

// Iscritti che hanno gia' cambiato indirizzo rispetto all'iscrizione (indice -> corso iniziale).
const cambiSeed: Record<number, number> = { 2: 5, 4: 0 }

const nomi = [
  ['Rossi', 'Luca'], ['Bianchi', 'Giulia'], ['Ferrari', 'Matteo'], ['Esposito', 'Sofia'],
  ['Romano', 'Alessandro'], ['Colombo', 'Aurora'], ['Ricci', 'Lorenzo'], ['Marino', 'Ginevra'],
  ['Greco', 'Tommaso'], ['Bruno', 'Alice'], ['Gallo', 'Leonardo'], ['Conti', 'Emma'],
]
const bookings: Booking[] = nomi.map(([cognome, nome], i) => {
  const od = open_days[i % 2]
  const checked = od === open_days[0] && i % 3 !== 0
  return {
    id: uuid(),
    open_day_id: od.id,
    edizione_id: edizioneId,
    cognome,
    nome,
    data_nascita: `2012-0${(i % 9) + 1}-1${i % 9}`,
    scuola: 'IC Esempio',
    classe: '3A',
    residenza: 'Milano',
    telefono: `333000${String(i).padStart(4, '0')}`,
    email: i % 2 === 0 ? `famiglia.${cognome.toLowerCase()}@example.com` : null,
    corso_id: corsi[i % corsi.length].id,
    corso2_id: corsi[(i + 3) % corsi.length].id,
    corso_iniziale_id: corsi[cambiSeed[i] ?? i % corsi.length].id,
    canale: i % 4 === 0 ? 'scuola' : 'online',
    status: 'confirmed',
    flag_seconda_media: false,
    checked_in: checked,
    checked_in_at: checked ? now() : null,
    registered_at: now(),
    note_staff: null,
    ...campiDecisione,
    created_at: now(),
    updated_at: now(),
  }
})

// Richieste arrivate dal Google Modulo, ancora da approvare.
const richiesteGoogle: [string, string, string, string | null, number][] = [
  ['Moretti', 'Giorgia', 'Moretti Paola', 'paola.moretti@example.com', 0],
  ['Barbieri', 'Samuele', 'Barbieri Marco', null, 0],
  ['Fontana', 'Nicole', 'Fontana Anna', 'anna.fontana@example.com', 1],
  ['Santoro', 'Davide', 'Santoro Luigi', 'l.santoro@example.com', 1],
]
richiesteGoogle.forEach(([cognome, nome, genitore, email, odIndex], i) => {
  const [accCognome, accNome] = genitore.split(' ')
  bookings.push({
    id: uuid(),
    open_day_id: open_days[odIndex].id,
    edizione_id: edizioneId,
    cognome,
    nome,
    data_nascita: '2012-05-1' + i,
    scuola: 'SMS Calvino',
    classe: '3B',
    residenza: 'Milano',
    telefono: `3471112${String(i).padStart(3, '0')}`,
    email,
    corso_id: corsi[(i * 2) % corsi.length].id,
    corso2_id: null,
    corso_iniziale_id: corsi[(i * 2) % corsi.length].id,
    canale: 'online',
    status: 'pending',
    flag_seconda_media: false,
    checked_in: false,
    checked_in_at: null,
    registered_at: now(),
    note_staff: `Modulo Google inviato il ${new Date().toLocaleDateString('it-IT')}`,
    ...campiDecisione,
    google_response_id: `demo-response-${i}`,
    acc_cognome: accCognome,
    acc_nome: accNome,
    created_at: now(),
    updated_at: now(),
  })
})

const impostazioni: Impostazioni = {
  id: 1,
  luogo_predefinito: 'Immaginazione e Lavoro — Via Esempio 1, 20100 Milano',
  indicazioni_predefinite: "Presentatevi 10 minuti prima all'ingresso principale e chiedete dell'accoglienza Open Day.",
  contatti: 'tel. 02 0000000 — orientamento@example.it',
  canale_predefinito: 'email',
  testo_approvazione:
    "Gentile famiglia, l'iscrizione di {nome} {cognome} all'Open Day di Immaginazione e Lavoro di {data} alle ore {ora} è CONFERMATA. Vi aspettiamo presso {luogo}. {indicazioni} Per informazioni: {contatti}",
  testo_rifiuto:
    "Gentile famiglia, purtroppo non possiamo confermare l'iscrizione di {nome} {cognome} all'Open Day di {data} alle ore {ora}. {motivo} Per informazioni o per scegliere un'altra data: {contatti}",
  testo_reminder:
    "Promemoria: {nome} {cognome} è atteso/a all'Open Day di Immaginazione e Lavoro {data} alle ore {ora} presso {luogo}. {indicazioni} Per informazioni: {contatti}",
  codice_meccanografico_sede: 'MICF065007',
  classificazione_ministeriale: 'R3',
  updated_at: now(),
}

const notifiche: Notifica[] = []

const google_form_import_log: GoogleFormImportLog[] = [
  ...bookings
    .filter((b) => b.google_response_id)
    .map((b) => ({
      id: uuid(),
      response_id: b.google_response_id,
      ricevuto_at: now(),
      esito: 'importata' as const,
      messaggio: null,
      booking_id: b.id,
      payload: { cognome: b.cognome, nome: b.nome, openDay: open_days.find((o) => o.id === b.open_day_id)?.etichetta_modulo },
    })),
  {
    id: uuid(),
    response_id: 'demo-response-x',
    ricevuto_at: now(),
    esito: 'open_day_non_trovato',
    messaggio: 'Nessun Open Day con etichetta "Domenica 1 marzo — ore 11:00"',
    booking_id: null,
    payload: { cognome: 'Galli', nome: 'Pietro', openDay: 'Domenica 1 marzo — ore 11:00' },
  },
]

const mdi: Mdi[] = bookings.slice(0, 3).map((b, i) => ({
  id: uuid(),
  open_day_id: b.open_day_id,
  booking_id: b.id,
  acc_cognome: b.cognome,
  acc_nome: 'Genitore',
  acc_qualita: 'genitore',
  acc_cellulare: b.telefono,
  acc_email: 'demo@example.com',
  all_cognome: b.cognome,
  all_nome: b.nome,
  all_data_nascita: b.data_nascita ?? '2012-01-01',
  all_annualita: 1,
  all_sezione: null,
  all_nato_a: 'Milano',
  all_cittadinanza: 'Italiana',
  all_scuola_provenienza: b.scuola,
  all_residenza_via: 'Via Esempio 1',
  all_residenza_citta: 'Milano',
  all_residenza_prov: 'MI',
  all_residenza_cap: '20100',
  all_domicilio_diverso: false,
  all_domicilio_via: null,
  all_domicilio_citta: null,
  all_domicilio_prov: null,
  all_domicilio_cap: null,
  // La 3ª MDI e' "vecchia" (compilata prima dei nuovi campi): l'export la segnala come incompleta.
  all_codice_fiscale: i < 2 ? cfDemo(b.cognome, b.nome, b.data_nascita ?? '2012-01-01', i === 1) : null,
  all_sesso: i < 2 ? (i === 1 ? 'F' : 'M') : null,
  all_nato_estero: false,
  all_comune_nascita_cod: i < 2 ? 'F205' : null,
  all_stato_nascita: null,
  all_cittadinanza_2: null,
  all_residenza_comune_cod: i < 2 ? 'F205' : null,
  all_domicilio_comune_cod: null,
  all_scuola_provenienza_cod: i < 2 ? 'MIMM000001' : null,
  acc_codice_fiscale: i < 2 ? cfDemo(b.cognome, 'Genitore', '1980-05-10', true) : null,
  acc_data_nascita: i < 2 ? '1980-05-10' : null,
  acc_sesso: i < 2 ? 'F' : null,
  acc_nato_estero: false,
  acc_comune_nascita: i < 2 ? 'Milano' : null,
  acc_comune_nascita_cod: i < 2 ? 'F205' : null,
  acc_stato_nascita: null,
  acc_cittadinanza: i < 2 ? 'Italia' : null,
  acc_residenza_come_allievo: true,
  acc_residenza_via: null,
  acc_residenza_citta: null,
  acc_residenza_comune_cod: null,
  acc_residenza_prov: null,
  acc_residenza_cap: null,
  acc_email_2: null,
  corso_pref1_id: b.corso_id,
  corso_pref2_id: b.corso2_id,
  corso_pref3_id: null,
  sostegno_stato: 'mai',
  sostegno_asl: false,
  sostegno_diagnosi_funzionale: false,
  sostegno_bes: false,
  sostegno_dsa: false,
  canale_orientamento_scuola: false,
  canale_open_day: true,
  canale_ricerca_online: false,
  canale_passaparola: i === 1,
  canale_altro: false,
  canale_altro_testo: null,
  consenso_privacy_a: true,
  consenso_privacy_b: i !== 2,
  consenso_foto_realizzare: true,
  consenso_foto_utilizzare: true,
  consenso_foto_comunicare: false,
  dichiarazione_firma_genitore: true,
  esportato_innovaplan: i === 0,
  esportato_innovaplan_at: i === 0 ? now() : null,
  esportato_innovaplan_by: i === 0 ? DEMO_USER_ID : null,
  stato_lavorazione: 'nuova',
  created_at: now(),
  updated_at: now(),
}))

const db: Record<string, Row[]> = {
  profiles: profiles as unknown as Row[],
  corsi: corsi as unknown as Row[],
  edizioni: edizioni as unknown as Row[],
  open_days: open_days as unknown as Row[],
  open_day_corsi: open_day_corsi as unknown as Row[],
  bookings: bookings as unknown as Row[],
  mdi: mdi as unknown as Row[],
  impostazioni: [impostazioni] as unknown as Row[],
  notifiche: notifiche as unknown as Row[],
  google_form_import_log: google_form_import_log as unknown as Row[],
}

// --- Query builder ------------------------------------------------------------

type Result = { data: unknown; error: { message: string } | null }

function ilike(value: unknown, pattern: string) {
  const re = new RegExp('^' + pattern.split('%').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$', 'i')
  return re.test(String(value ?? ''))
}

class MockQuery implements PromiseLike<Result> {
  private filters: ((r: Row) => boolean)[] = []
  private sort: { col: string; asc: boolean } | null = null
  private mode: 'many' | 'single' | 'maybeSingle' = 'many'
  private max: number | null = null
  private op: { kind: 'select' } | { kind: 'insert'; rows: Row[] } | { kind: 'update'; patch: Row } = {
    kind: 'select',
  }

  private table: string
  constructor(table: string) {
    this.table = table
  }

  select() {
    return this
  }
  insert(values: Row | Row[]) {
    this.op = { kind: 'insert', rows: Array.isArray(values) ? values : [values] }
    return this
  }
  update(patch: Row) {
    this.op = { kind: 'update', patch }
    return this
  }
  eq(col: string, value: unknown) {
    this.filters.push((r) => r[col] === value)
    return this
  }
  in(col: string, values: unknown[]) {
    this.filters.push((r) => values.includes(r[col]))
    return this
  }
  or(expr: string) {
    // Supporta solo la forma usata dagli hook: "col.ilike.%x%,col2.ilike.%x%"
    const parts = expr.split(',').map((p) => {
      const [col, , ...rest] = p.split('.')
      return { col, pattern: rest.join('.') }
    })
    this.filters.push((r) => parts.some((p) => ilike(r[p.col], p.pattern)))
    return this
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.sort = { col, asc: opts?.ascending ?? true }
    return this
  }
  limit(n: number) {
    this.max = n
    return this
  }
  single() {
    this.mode = 'single'
    return this
  }
  maybeSingle() {
    this.mode = 'maybeSingle'
    return this
  }

  private run(): Result {
    const table = (db[this.table] ??= [])
    let rows: Row[]

    if (this.op.kind === 'insert') {
      rows = this.op.rows.map((r) => ({ id: uuid(), created_at: now(), updated_at: now(), ...defaultsFor(this.table), ...r }))
      table.push(...rows)
    } else {
      rows = table.filter((r) => this.filters.every((f) => f(r)))
      if (this.op.kind === 'update') {
        for (const r of rows) Object.assign(r, this.op.patch, { updated_at: now() })
      }
    }

    if (this.sort) {
      const { col, asc } = this.sort
      rows = [...rows].sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : String(a[col]) > String(b[col]) ? 1 : 0) * (asc ? 1 : -1))
    }

    if (this.max !== null) rows = rows.slice(0, this.max)
    const copy = rows.map((r) => ({ ...r }))
    if (this.mode === 'many') return { data: copy, error: null }
    if (copy.length === 0 && this.mode === 'maybeSingle') return { data: null, error: null }
    if (copy.length !== 1) return { data: null, error: { message: `Attese 1 riga, trovate ${copy.length}` } }
    return { data: copy[0], error: null }
  }

  then<T1 = Result, T2 = never>(
    onFulfilled?: ((value: Result) => T1 | PromiseLike<T1>) | null,
    onRejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null,
  ): PromiseLike<T1 | T2> {
    // Piccolo ritardo per far vedere gli stati di caricamento come con la rete vera.
    return new Promise<Result>((resolve) => setTimeout(() => resolve(this.run()), 150)).then(onFulfilled, onRejected)
  }
}

function defaultsFor(table: string): Row {
  if (table === 'mdi') return { esportato_innovaplan: false, esportato_innovaplan_at: null, esportato_innovaplan_by: null, stato_lavorazione: 'nuova' }
  if (table === 'open_days') return { tipo: 'OpenDay', stato: 'aperto', note: null, operatore_id: null }
  if (table === 'edizioni') return { stato: 'bozza', created_by: DEMO_USER_ID }
  return {}
}

// --- RPC (replica di create_booking / posti_disponibili in 0002_rls_policies.sql) ---

function confermate(openDayId: string) {
  return db.bookings.filter((b) => b.open_day_id === openDayId && (b.status === 'confirmed' || b.status === 'walk_in')).length
}

// Replica di public.accoda_notifica() (0006_google_forms_notifiche.sql).
function accodaNotifica(b: Booking, tipo: Notifica['tipo'], motivo: string | null = null) {
  const od = (db.open_days as unknown as OpenDay[]).find((o) => o.id === b.open_day_id)!
  const imp = db.impostazioni[0] as unknown as Impostazioni
  let canale = imp.canale_predefinito
  if (canale === 'email' && !b.email?.trim()) canale = 'whatsapp_manuale'
  const testo = { approvazione: imp.testo_approvazione, rifiuto: imp.testo_rifiuto, reminder: imp.testo_reminder }[tipo]
  const oggetto = { approvazione: 'Iscrizione Open Day confermata', rifiuto: 'Iscrizione Open Day non confermata', reminder: 'Promemoria Open Day' }[tipo]
  db.notifiche.push({
    id: uuid(),
    booking_id: b.id,
    open_day_id: b.open_day_id,
    tipo,
    canale,
    destinatario: canale === 'email' ? b.email!.trim() : b.telefono,
    oggetto: `${oggetto} — Immaginazione e Lavoro`,
    testo: componiMessaggio(testo, b, od, imp, motivo),
    stato: canale === 'whatsapp_manuale' ? 'manuale' : 'in_coda',
    errore: null,
    tentativi: 0,
    in_invio_at: null,
    created_at: now(),
    sent_at: null,
  } satisfies Notifica as unknown as Row)
}

/** Simula l'Edge Function send-notifications: le email "partono", SMS/WhatsApp automatici non sono attivi. */
async function invokeFunction(name: string): Promise<Result> {
  await new Promise((r) => setTimeout(r, 600))
  if (name !== 'send-notifications') return { data: null, error: { message: `Funzione ${name} non simulata` } }
  let inviate = 0
  for (const n of db.notifiche as unknown as Notifica[]) {
    if (n.stato !== 'in_coda') continue
    n.tentativi++
    if (n.canale === 'email') {
      Object.assign(n, { stato: 'inviata', sent_at: now(), errore: null })
      inviate++
    } else {
      Object.assign(n, { stato: 'errore', errore: `Canale ${n.canale.toUpperCase()} non attivo (demo)` })
    }
  }
  return { data: { inviate }, error: null }
}

function iscrittiRicercabili() {
  const ods = db.open_days as unknown as OpenDay[]
  const edizioniAttive = new Set((db.edizioni as unknown as Edizione[]).filter((e) => e.stato === 'attiva').map((e) => e.id))
  return (db.bookings as unknown as Booking[]).flatMap((b) => {
    const od = ods.find((o) => o.id === b.open_day_id)
    const ok = od && od.stato !== 'annullato' && edizioniAttive.has(od.edizione_id) && !['cancelled', 'rejected'].includes(b.status)
    return ok ? [{ b, od }] : []
  })
}

async function rpc(fn: string, args: Row): Promise<Result> {
  await new Promise((r) => setTimeout(r, 150))
  const od = db.open_days.find((o) => o.id === args.p_open_day_id) as OpenDay | undefined

  if (fn === 'posti_disponibili') {
    return { data: od ? od.posti_max - confermate(od.id) : null, error: null }
  }
  if (fn === 'create_booking') {
    if (!od) return { data: null, error: { message: 'Open day non trovato' } }
    if (od.stato !== 'aperto') return { data: null, error: { message: 'Open day non aperto alle iscrizioni' } }
    const booking: Booking = {
      id: uuid(),
      open_day_id: od.id,
      edizione_id: od.edizione_id,
      cognome: args.p_cognome as string,
      nome: args.p_nome as string,
      telefono: args.p_telefono as string,
      data_nascita: (args.p_data_nascita as string) ?? null,
      scuola: (args.p_scuola as string) ?? null,
      classe: (args.p_classe as string) ?? null,
      residenza: (args.p_residenza as string) ?? null,
      email: (args.p_email as string) ?? null,
      corso_id: (args.p_corso_id as string) ?? null,
      corso2_id: (args.p_corso2_id as string) ?? null,
      corso_iniziale_id: (args.p_corso_id as string) ?? null,
      canale: (args.p_canale as Booking['canale']) ?? 'online',
      status: confermate(od.id) < od.posti_max ? 'confirmed' : 'waitlist',
      flag_seconda_media: (args.p_flag_seconda_media as boolean) ?? false,
      checked_in: false,
      checked_in_at: null,
      registered_at: now(),
      note_staff: null,
      ...campiDecisione,
      created_at: now(),
      updated_at: now(),
    }
    db.bookings.push(booking as unknown as Row)
    return { data: { ...booking }, error: null }
  }
  if (fn === 'kiosk_cerca_iscritti') {
    // Replica di 0009: qualsiasi Open Day non annullato dell'edizione attiva, per cognome o nome.
    const q = String(args.p_query ?? '').trim().toLowerCase()
    if (q.length < 2) return { data: [], error: null }
    const rows = iscrittiRicercabili()
      .filter(({ b }) =>
        [b.cognome, b.nome, `${b.cognome} ${b.nome}`, `${b.nome} ${b.cognome}`].some((t) => t.toLowerCase().startsWith(q)),
      )
      .sort((x, y) => `${x.b.cognome} ${x.b.nome}`.localeCompare(`${y.b.cognome} ${y.b.nome}`, 'it'))
      .slice(0, 10)
      .map(({ b, od }) => ({ id: b.id, cognome: b.cognome, nome: b.nome, scuola: b.scuola, open_day_data: od.data }))
    return { data: rows, error: null }
  }
  if (fn === 'kiosk_dati_iscritto') {
    const b = iscrittiRicercabili().find(({ b: x }) => x.id === args.p_booking_id)?.b
    if (!b) return { data: [], error: null }
    const { id, open_day_id, cognome, nome, data_nascita, scuola, telefono, email, corso_id, corso2_id, acc_cognome, acc_nome } = b
    return {
      data: [{ id, open_day_id, cognome, nome, data_nascita, scuola, telefono, email, corso_id, corso2_id, acc_cognome, acc_nome }],
      error: null,
    }
  }
  if (fn === 'decidi_iscrizione') {
    const b = (db.bookings as unknown as Booking[]).find((x) => x.id === args.p_booking_id)
    if (!b) return { data: null, error: { message: 'Iscrizione non trovata o non modificabile' } }
    const approva = args.p_approva === true
    const motivo = (args.p_motivo as string | null) ?? null
    Object.assign(b, {
      status: approva ? 'confirmed' : 'rejected',
      decisione_at: now(),
      decisione_by: DEMO_USER_ID,
      motivo_rifiuto: approva ? null : motivo,
      updated_at: now(),
    })
    accodaNotifica(b, approva ? 'approvazione' : 'rifiuto', motivo)
    return { data: { ...b }, error: null }
  }
  if (fn === 'imposta_corsi_open_day') {
    // Replica di 0010: sostituzione completa della configurazione indirizzi.
    const nuovi = (args.p_corsi as { corso_id: string; posti_max: number | null }[]) ?? []
    db.open_day_corsi = [
      ...db.open_day_corsi.filter((r) => r.open_day_id !== args.p_open_day_id),
      ...nuovi.map((c, i) => ({ open_day_id: args.p_open_day_id, corso_id: c.corso_id, posti_max: c.posti_max, ordine: i + 1 })),
    ]
    return { data: null, error: null }
  }
  if (fn === 'is_staff') return { data: true, error: null }
  return { data: null, error: { message: `RPC ${fn} non simulata in demo` } }
}

// --- Auth / Realtime finti ------------------------------------------------------

const demoSession = {
  access_token: 'demo',
  refresh_token: 'demo',
  token_type: 'bearer',
  expires_in: 3600,
  user: { id: DEMO_USER_ID, email: 'demo@example.com' },
}

const fakeChannel = {
  on() {
    return fakeChannel
  },
  subscribe() {
    return fakeChannel
  },
}

export const mockSupabase = {
  from: (table: string) => new MockQuery(table),
  rpc,
  auth: {
    getSession: async () => ({ data: { session: demoSession }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signInWithPassword: async () => ({ data: { session: demoSession }, error: null }),
    signOut: async () => ({ error: null }),
  },
  channel: () => fakeChannel,
  removeChannel: async () => 'ok',
  functions: { invoke: invokeFunction },
}
