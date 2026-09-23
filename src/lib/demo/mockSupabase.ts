// Client Supabase finto, in memoria, per la modalita' demo (`npm run demo`).
// Serve solo a vedere/provare la UI senza un progetto Supabase reale: dati di
// esempio fittizi, sessione staff finta, nessuna rete. Si perde tutto al reload.
// Implementa solo il sottoinsieme di query builder usato dagli hook in src/hooks.

import type { Booking, Corso, Edizione, Mdi, OpenDay, Profile } from '../../types/database.types'

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
}))

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
    created_at: now(),
    updated_at: now(),
  }
}
const open_days: OpenDay[] = [openDay(0, '15:00', 20), openDay(7, '10:00', 30), openDay(14, '15:30', 15, 'OpenDay2e')]

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
    email: null,
    corso_id: corsi[i % corsi.length].id,
    corso2_id: corsi[(i + 3) % corsi.length].id,
    canale: i % 4 === 0 ? 'scuola' : 'online',
    status: 'confirmed',
    flag_seconda_media: false,
    checked_in: checked,
    checked_in_at: checked ? now() : null,
    registered_at: now(),
    note_staff: null,
    created_at: now(),
    updated_at: now(),
  }
})

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
  bookings: bookings as unknown as Row[],
  mdi: mdi as unknown as Row[],
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

function presentiOggi(openDayId: string) {
  return (db.bookings as unknown as Booking[]).filter(
    (b) => b.open_day_id === openDayId && b.checked_in && b.status !== 'cancelled',
  )
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
      canale: (args.p_canale as Booking['canale']) ?? 'online',
      status: confermate(od.id) < od.posti_max ? 'confirmed' : 'waitlist',
      flag_seconda_media: (args.p_flag_seconda_media as boolean) ?? false,
      checked_in: false,
      checked_in_at: null,
      registered_at: now(),
      note_staff: null,
      created_at: now(),
      updated_at: now(),
    }
    db.bookings.push(booking as unknown as Row)
    return { data: { ...booking }, error: null }
  }
  if (fn === 'kiosk_cerca_iscritti') {
    const q = String(args.p_query ?? '').trim().toLowerCase()
    if (!od || od.data !== isoDate(0) || q.length < 2) return { data: [], error: null }
    const rows = presentiOggi(od.id)
      .filter((b) => b.cognome.toLowerCase().startsWith(q))
      .slice(0, 10)
      .map(({ id, cognome, nome, scuola }) => ({ id, cognome, nome, scuola }))
    return { data: rows, error: null }
  }
  if (fn === 'kiosk_dati_iscritto') {
    const b = (db.bookings as unknown as Booking[]).find((x) => x.id === args.p_booking_id)
    const odB = b && (db.open_days as unknown as OpenDay[]).find((o) => o.id === b.open_day_id)
    if (!b || !odB || odB.data !== isoDate(0) || !b.checked_in || b.status === 'cancelled') return { data: [], error: null }
    const { id, open_day_id, cognome, nome, data_nascita, scuola, telefono, email, corso_id, corso2_id } = b
    return { data: [{ id, open_day_id, cognome, nome, data_nascita, scuola, telefono, email, corso_id, corso2_id }], error: null }
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
}
