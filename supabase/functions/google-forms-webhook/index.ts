// Riceve le risposte del Google Modulo di iscrizione Open Day (inviate dall'Apps
// Script in integrations/google-forms/Code.gs) e le salva come iscrizioni
// "da approvare" (status 'pending'). E' l'unico canale d'iscrizione pubblico
// (0013): l'app non ha piu' una pagina di iscrizione propria.
//
// Un solo modulo per città, con una domanda a scelta singola tra le date
// (0011_multisede.sql): l'Apps Script manda lo slug della città nell'header
// `x-citta` (default "milano") e l'Open Day si cerca solo tra quelli delle sedi
// di quella città. Oggi c'è solo il modulo di Milano.
//
// Protezione: niente JWT (Apps Script non ne ha), ma header `x-webhook-secret`
// che deve coincidere con il secret della città: GOOGLE_FORMS_SECRET_<SLUG>
// (es. GOOGLE_FORMS_SECRET_TORINO), oppure GOOGLE_FORMS_SECRET per Milano.
// Ogni chiamata viene registrata in google_form_import_log, cosi' lo staff
// della città vede anche gli scarti.

import { adminClient, json, segretoValido } from '../_shared/util.ts'

interface Payload {
  responseId: string
  submittedAt?: string
  openDay: string
  cognome: string
  nome: string
  telefono: string
  email?: string
  dataNascita?: string
  scuola?: string
  classe?: string
  residenza?: string
  corso1?: string
  corso2?: string
  accCognome?: string
  accNome?: string
  note?: string
}

const normalizza = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()
const testo = (s: unknown) => (typeof s === 'string' && s.trim() ? s.trim() : null)

/** Accetta "YYYY-MM-DD" (formato di Google Moduli) o "DD/MM/YYYY". */
function dataIso(s: unknown): string | null {
  const v = testo(s)
  if (!v) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null
}

function segretoCitta(slug: string) {
  const perCitta = Deno.env.get(`GOOGLE_FORMS_SECRET_${slug.toUpperCase().replace(/-/g, '_')}`)
  return perCitta ?? (slug === 'milano' ? Deno.env.get('GOOGLE_FORMS_SECRET') : undefined)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Metodo non consentito' }, 405)
  const cittaSlug = (req.headers.get('x-citta') ?? 'milano').trim().toLowerCase()
  if (!/^[a-z0-9-]+$/.test(cittaSlug) || !segretoValido(req.headers.get('x-webhook-secret'), segretoCitta(cittaSlug))) {
    return json({ error: 'Non autorizzato' }, 401)
  }

  let payload: Payload
  try {
    payload = await req.json()
  } catch {
    return json({ error: 'JSON non valido' }, 400)
  }

  const db = adminClient()
  const { data: citta } = await db.from('citta').select('id').eq('slug', cittaSlug).maybeSingle()
  const log = (esito: string, messaggio: string | null, booking_id: string | null = null) =>
    db.from('google_form_import_log').insert({
      response_id: testo(payload?.responseId),
      esito,
      messaggio,
      booking_id,
      citta_id: citta?.id ?? null,
      payload,
    })

  if (!citta) {
    await log('errore', `Città "${cittaSlug}" non trovata: controlla la proprietà CITTA dell'Apps Script`)
    return json({ esito: 'errore' })
  }
  const { data: sedi } = await db.from('sedi').select('id').eq('citta_id', citta.id)
  const sediCitta = (sedi ?? []).map((s) => s.id)

  const mancanti = (['responseId', 'openDay', 'cognome', 'nome', 'telefono'] as const).filter(
    (k) => !testo(payload?.[k]),
  )
  if (mancanti.length) {
    await log('errore', `Campi obbligatori mancanti: ${mancanti.join(', ')}`)
    // 200: la risposta e' comunque registrata; ritentare non la correggerebbe.
    return json({ esito: 'errore', mancanti })
  }

  const { data: esistente } = await db
    .from('bookings')
    .select('id')
    .eq('google_response_id', payload.responseId)
    .maybeSingle()
  if (esistente) {
    await log('duplicata', null, esistente.id)
    return json({ esito: 'duplicata', booking_id: esistente.id })
  }

  const { data: openDays, error: odError } = await db
    .from('open_days')
    .select('id, sede_id, etichetta_modulo')
    .in('sede_id', sediCitta)
    .not('etichetta_modulo', 'is', null)
  if (odError) {
    await log('errore', odError.message)
    return json({ error: 'Errore database' }, 500)
  }
  const openDay = openDays?.find((o) => normalizza(o.etichetta_modulo) === normalizza(payload.openDay))
  if (!openDay) {
    await log('open_day_non_trovato', `Nessun Open Day della città con etichetta "${payload.openDay}"`)
    return json({ esito: 'open_day_non_trovato' })
  }

  // Corsi della sede dell'Open Day prima, poi delle altre sedi della città: la 1ª
  // scelta deve essere della sede (vincolo in 0011), la 2ª puo' essere cross-sede.
  const { data: corsiCitta } = await db.from('corsi').select('id, nome, sede_id').in('sede_id', sediCitta)
  const corsi = [...(corsiCitta ?? [])].sort(
    (a, b) => Number(b.sede_id === openDay.sede_id) - Number(a.sede_id === openDay.sede_id),
  )
  const corsoId = (nome: unknown, soloSede: boolean) => {
    const n = testo(nome)
    if (!n) return null
    return (
      corsi.find((c) => (!soloSede || c.sede_id === openDay.sede_id) && normalizza(n).startsWith(normalizza(c.nome)))
        ?.id ?? null
    )
  }

  // Indirizzi dell'Open Day (0010): se quello scelto non c'e' l'iscrizione si salva
  // comunque (lo staff la vede "fuori Open Day" e la sposta), ma lo si annota nel log.
  const corso1Id = corsoId(payload.corso1, true)
  const { data: indirizziOd } = await db.from('open_day_corsi').select('corso_id').eq('open_day_id', openDay.id)
  const fuoriOpenDay =
    corso1Id && indirizziOd?.length && !indirizziOd.some((r) => r.corso_id === corso1Id)
      ? `Indirizzo "${testo(payload.corso1)}" non presentato in questo Open Day`
      : null

  const note = [testo(payload.note), payload.submittedAt ? `Modulo Google inviato il ${payload.submittedAt}` : null]
    .filter(Boolean)
    .join(' — ')

  const { data: booking, error } = await db
    .from('bookings')
    // sede_id ed edizione_id li ricava il trigger dall'Open Day.
    .insert({
      open_day_id: openDay.id,
      google_response_id: payload.responseId,
      cognome: payload.cognome.trim(),
      nome: payload.nome.trim(),
      telefono: payload.telefono.trim(),
      email: testo(payload.email)?.toLowerCase() ?? null,
      data_nascita: dataIso(payload.dataNascita),
      scuola: testo(payload.scuola),
      classe: testo(payload.classe),
      // Domanda "Classe frequentata" con opzioni "2ª media", "3ª media", ...
      flag_seconda_media: testo(payload.classe)?.startsWith('2') ?? false,
      residenza: testo(payload.residenza),
      corso_id: corso1Id,
      corso2_id: corsoId(payload.corso2, false),
      acc_cognome: testo(payload.accCognome),
      acc_nome: testo(payload.accNome),
      canale: 'online',
      status: 'pending',
      note_staff: note || null,
    })
    .select('id')
    .single()

  if (error) {
    // Due invii quasi simultanei della stessa risposta: il vincolo unique fa da arbitro.
    const esito = error.code === '23505' ? 'duplicata' : 'errore'
    await log(esito, error.message)
    return json({ esito }, esito === 'errore' ? 500 : 200)
  }

  await log('importata', fuoriOpenDay, booking.id)
  return json({ esito: 'importata', booking_id: booking.id })
})
