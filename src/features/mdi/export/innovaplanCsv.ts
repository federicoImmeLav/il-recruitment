import type { Corso, Mdi } from '../../../types/database.types'

// Export delle MDI per l'import anagrafiche su INNOVAPLAN, nel tracciato SIDI
// "Alunni e scelte" delle Iscrizioni On Line (esempio fornito dall'utente in
// risorse/, NON versionato perche' contiene dati reali).
//
// Formato, identico all'esempio: UTF-8 senza BOM, separatore ";", righe CRLF,
// ogni riga chiusa da ";", nessuna virgolettatura, intestazione con uno spazio
// iniziale. Date gg/mm/aaaa, comuni come codice catastale, "EEEE" per il comune
// di nascita del genitore nato all'estero.
//
// Scelte dell'utente: cittadinanza e stato estero esportati come NOME del paese
// (i codici SIDI non coincidono con quelli ISTAT); colonne proprie delle domande
// ministeriali (COD_ALUNNO, STATO/PROG/TIPO_DOMANDA, UTENZA) vuote.

export const COLONNE = [
  'ANNO_SCOLASTICO', 'COD_FORTE_SCUOLA', 'COD_UTENTE_SCUOLA', 'COD_ALUNNO', 'COD_FISCALE', 'COGNOME', 'NOME',
  'SESSO', 'DATA_NASCITA', 'COMUNE_NASCITA', 'PRIMA_CITTADINANZA', 'SECONDA_CITTADINANZA', 'STATO_ESTERO_NASCITA',
  'COMUNE_RESIDENZA', 'INDIRIZZO_RESIDENZA', 'CAP_RESIDENZA', 'IND_MINISTERIALE', 'CLASF_MINISTERIALE',
  'STATO_DOMANDA', 'PROG_DOMANDA', 'TIPO_DOMANDA', 'UTENZA', 'TELEFONO', 'CF_PRIMO_GENITORE',
  'COGNOME_PRIMO_GENITORE', 'NOME_PRIMO_GENITORE', 'PARENTELA_PRIMO_GEN', 'DATA_NAS_PRIMO_GEN', 'SESSO_PRIMO_GEN',
  'COM_NASCITA_PRIMO_GEN', 'COD_CITT_PRIMO_GEN', 'STATO_EST_PRIMO_GEN', 'COMUNE_RES_PRIMO_GEN', 'CAP_RES_PRIMO_GEN',
  'IND_RES_PRIMO_GEN', 'TELEFONO_PRIMO_GEN', 'EMAIL_PRIMO_GEN', 'SEC_EMAIL_PRIMO_GEN', 'COD_SCU_I_SCELTA',
  'COD_SCU_II_SCELTA', 'COD_SCU_III_SCELTA', 'IND_I_SCU_I_SCELTA', 'CLF_I_SCU_I_SCELTA', 'IND_II_SCU_I_SCELTA',
  'CLF_II_SCU_I_SCELTA', 'IND_III_SCU_I_SCELTA', 'CLF_III_SCU_I_SCELTA', 'IND_I_SCU_II_SCELTA', 'CLF_I_SCU_II_SCELTA',
  'IND_II_SCU_II_SCELTA', 'CLF_II_SCU_II_SCELTA', 'IND_III_SCU_II_SCELTA', 'CLF_III_SCU_II_SCELTA',
  'IND_I_SCU_III_SCELTA', 'CLF_I_SCU_III_SCELTA', 'IND_II_SCU_III_SCELTA', 'CLF_II_SCU_III_SCELTA',
  'IND_III_SCU_III_SCELTA', 'CLF_III_SCU_III_SCELTA', 'SCUOLA_PROVENIENZA', 'DES_SCU_PROVENIENZA',
  'COMUNE_RESIDENZA_IOL', 'INDIRIZZO_RESIDENZA_IOL', 'CAP_RESIDENZA_IOL', 'PRV_RESIDENZA_IOL',
  'COMUNE_DOMICILIO_IOL', 'INDIRIZZO_DOMICILIO_IOL', 'CAP_DOMICILIO_IOL', 'PRV_DOMICILIO_IOL',
] as const

export type Colonna = (typeof COLONNE)[number]

export interface ContestoExport {
  /** Anno di inizio dell'anno formativo di iscrizione (es. 2027 per il 2027/28). */
  annoScolastico: number
  codiceSede: string
  classificazione: string
  corsi: Pick<Corso, 'id' | 'nome' | 'codice_ministeriale'>[]
}

const CRLF = '\r\n'

/** Niente ";" ne' a capo nei valori: il formato non prevede virgolette. */
function pulisci(v: string | number | null | undefined) {
  return String(v ?? '')
    .replace(/[;\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}
const up = (v: string | null | undefined) => pulisci(v).toUpperCase()

function dataIt(iso: string | null | undefined) {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function telefono(v: string | null | undefined) {
  return pulisci(v).replace(/[\s./-]/g, '')
}

/** Anno di inizio dell'anno formativo a cui si iscrivono (quello successivo all'anno in corso). */
export function annoScolasticoIscrizione(oggi = new Date()) {
  return (oggi.getMonth() >= 8 ? oggi.getFullYear() : oggi.getFullYear() - 1) + 1
}

export function rigaMdi(m: Mdi, ctx: ContestoExport): Record<Colonna, string> {
  const codiceCorso = (id: string | null) => pulisci(ctx.corsi.find((c) => c.id === id)?.codice_ministeriale)
  const prefs = [m.corso_pref1_id, m.corso_pref2_id, m.corso_pref3_id].map(codiceCorso)
  const clf = (cod: string) => (cod ? pulisci(ctx.classificazione) : '')

  const accRes = !m.acc_residenza_come_allievo
  const genComuneRes = accRes ? m.acc_residenza_comune_cod : m.all_residenza_comune_cod
  const genCapRes = accRes ? m.acc_residenza_cap : m.all_residenza_cap
  const genIndRes = accRes ? m.acc_residenza_via : m.all_residenza_via

  const dom = m.all_domicilio_diverso
  const domComune = dom ? m.all_domicilio_comune_cod : m.all_residenza_comune_cod
  const domVia = dom ? m.all_domicilio_via : m.all_residenza_via
  const domCap = dom ? m.all_domicilio_cap : m.all_residenza_cap
  const domProv = dom ? m.all_domicilio_prov : m.all_residenza_prov

  const r: Record<Colonna, string> = Object.fromEntries(COLONNE.map((c) => [c, ''])) as Record<Colonna, string>
  Object.assign(r, {
    ANNO_SCOLASTICO: String(ctx.annoScolastico),
    COD_FORTE_SCUOLA: up(ctx.codiceSede),
    COD_UTENTE_SCUOLA: up(ctx.codiceSede),
    COD_FISCALE: up(m.all_codice_fiscale),
    COGNOME: up(m.all_cognome),
    NOME: up(m.all_nome),
    SESSO: up(m.all_sesso),
    DATA_NASCITA: dataIt(m.all_data_nascita),
    COMUNE_NASCITA: m.all_nato_estero ? '' : up(m.all_comune_nascita_cod),
    PRIMA_CITTADINANZA: up(m.all_cittadinanza),
    SECONDA_CITTADINANZA: up(m.all_cittadinanza_2),
    STATO_ESTERO_NASCITA: m.all_nato_estero ? up(m.all_stato_nascita) : '',
    COMUNE_RESIDENZA: up(m.all_residenza_comune_cod),
    INDIRIZZO_RESIDENZA: up(m.all_residenza_via),
    CAP_RESIDENZA: pulisci(m.all_residenza_cap),
    IND_MINISTERIALE: prefs[0],
    CLASF_MINISTERIALE: clf(prefs[0]),
    TELEFONO: telefono(m.acc_cellulare),
    CF_PRIMO_GENITORE: up(m.acc_codice_fiscale),
    COGNOME_PRIMO_GENITORE: up(m.acc_cognome),
    NOME_PRIMO_GENITORE: up(m.acc_nome),
    PARENTELA_PRIMO_GEN: m.acc_qualita === 'tutore' ? 'TUTORE' : 'GENITORE',
    DATA_NAS_PRIMO_GEN: dataIt(m.acc_data_nascita),
    SESSO_PRIMO_GEN: up(m.acc_sesso),
    COM_NASCITA_PRIMO_GEN: m.acc_nato_estero ? 'EEEE' : up(m.acc_comune_nascita_cod),
    COD_CITT_PRIMO_GEN: up(m.acc_cittadinanza),
    STATO_EST_PRIMO_GEN: m.acc_nato_estero ? up(m.acc_stato_nascita) : '',
    COMUNE_RES_PRIMO_GEN: up(genComuneRes),
    CAP_RES_PRIMO_GEN: pulisci(genCapRes),
    IND_RES_PRIMO_GEN: up(genIndRes),
    TELEFONO_PRIMO_GEN: telefono(m.acc_cellulare),
    EMAIL_PRIMO_GEN: pulisci(m.acc_email).toLowerCase(),
    SEC_EMAIL_PRIMO_GEN: pulisci(m.acc_email_2).toLowerCase(),
    COD_SCU_I_SCELTA: up(ctx.codiceSede),
    IND_I_SCU_I_SCELTA: prefs[0],
    CLF_I_SCU_I_SCELTA: clf(prefs[0]),
    IND_II_SCU_I_SCELTA: prefs[1],
    CLF_II_SCU_I_SCELTA: clf(prefs[1]),
    IND_III_SCU_I_SCELTA: prefs[2],
    CLF_III_SCU_I_SCELTA: clf(prefs[2]),
    SCUOLA_PROVENIENZA: up(m.all_scuola_provenienza_cod),
    DES_SCU_PROVENIENZA: up(m.all_scuola_provenienza),
    COMUNE_RESIDENZA_IOL: up(m.all_residenza_comune_cod),
    INDIRIZZO_RESIDENZA_IOL: up(m.all_residenza_via),
    CAP_RESIDENZA_IOL: pulisci(m.all_residenza_cap),
    PRV_RESIDENZA_IOL: up(m.all_residenza_prov),
    COMUNE_DOMICILIO_IOL: up(domComune),
    INDIRIZZO_DOMICILIO_IOL: up(domVia),
    CAP_DOMICILIO_IOL: pulisci(domCap),
    PRV_DOMICILIO_IOL: up(domProv),
  } satisfies Partial<Record<Colonna, string>>)
  return r
}

export function intestazione() {
  return ` ${COLONNE.join(';')};`
}

/** Contenuto completo del file, pronto per il download. */
export function generaCsv(mdi: Mdi[], ctx: ContestoExport) {
  const righe = mdi.map((m) => {
    const r = rigaMdi(m, ctx)
    return `${COLONNE.map((c) => r[c]).join(';')};`
  })
  return [intestazione(), ...righe].join(CRLF) + CRLF
}

export function nomeFile(ctx: Pick<ContestoExport, 'codiceSede'>, oggi = new Date()) {
  const d = `${oggi.getFullYear()}${String(oggi.getMonth() + 1).padStart(2, '0')}${String(oggi.getDate()).padStart(2, '0')}`
  return `MDI_INNOVAPLAN_${up(ctx.codiceSede) || 'SEDE'}_${d}.csv`
}

/** Dati mancanti che INNOVAPLAN probabilmente richiede: mostrati come avvisi prima del download. */
export function avvisiMdi(m: Mdi, ctx: ContestoExport): string[] {
  const a: string[] = []
  const manca = (cond: unknown, testo: string) => !cond && a.push(testo)
  manca(m.all_codice_fiscale, 'codice fiscale allievo')
  manca(m.all_sesso, 'sesso allievo')
  manca(m.all_nato_estero ? m.all_stato_nascita : m.all_comune_nascita_cod, 'luogo di nascita allievo (codice)')
  manca(m.all_residenza_comune_cod, 'comune di residenza (codice)')
  manca(m.all_residenza_cap, 'CAP di residenza')
  manca(m.all_scuola_provenienza_cod, 'codice scuola di provenienza')
  manca(m.acc_codice_fiscale, 'codice fiscale genitore')
  manca(m.acc_data_nascita, 'data di nascita genitore')
  manca(m.acc_sesso, 'sesso genitore')
  manca(m.acc_nato_estero ? m.acc_stato_nascita : m.acc_comune_nascita_cod, 'luogo di nascita genitore')
  manca(m.corso_pref1_id, '1ª preferenza di corso')
  const corso1 = ctx.corsi.find((c) => c.id === m.corso_pref1_id)
  if (corso1 && !corso1.codice_ministeriale) a.push(`codice ministeriale del corso ${corso1.nome} (Impostazioni)`)
  return a.map((x) => `manca ${x}`)
}

export function scaricaCsv(contenuto: string, nome: string) {
  const url = URL.createObjectURL(new Blob([contenuto], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
