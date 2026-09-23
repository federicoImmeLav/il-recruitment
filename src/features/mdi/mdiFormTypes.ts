export type SiNo = 'si' | 'no' | ''
export type LuogoNascita = 'italia' | 'estero'
export type Sesso = 'M' | 'F' | ''

export interface MdiFormValues {
  acc_cognome: string
  acc_nome: string
  acc_qualita: 'genitore' | 'tutore' | ''
  acc_cellulare: string
  acc_email: string
  acc_email_2: string
  acc_codice_fiscale: string
  acc_sesso: Sesso
  acc_data_nascita: string
  acc_nascita: LuogoNascita
  /** Nome del comune (Italia) o del paese (estero). */
  acc_comune_nascita: string
  acc_comune_nascita_cod: string
  acc_stato_nascita: string
  acc_cittadinanza: string
  acc_residenza_come_allievo: boolean
  acc_residenza_via: string
  acc_residenza_citta: string
  acc_residenza_comune_cod: string
  acc_residenza_prov: string
  acc_residenza_cap: string

  all_codice_fiscale: string
  all_sesso: Sesso
  all_nascita: LuogoNascita
  all_comune_nascita_cod: string
  all_stato_nascita: string
  all_cittadinanza_2: string
  all_residenza_comune_cod: string
  all_domicilio_comune_cod: string
  all_scuola_provenienza_cod: string

  all_cognome: string
  all_nome: string
  all_data_nascita: string
  all_annualita: string
  all_sezione: string
  /** Nome del comune (Italia) o del paese (estero) di nascita. */
  all_nato_a: string
  all_cittadinanza: string
  all_scuola_provenienza: string
  all_residenza_via: string
  all_residenza_citta: string
  all_residenza_prov: string
  all_residenza_cap: string
  all_domicilio_diverso: boolean
  all_domicilio_via: string
  all_domicilio_citta: string
  all_domicilio_prov: string
  all_domicilio_cap: string

  corso_pref1_id: string
  corso_pref2_id: string
  corso_pref3_id: string

  sostegno_stato: 'mai' | 'passato' | 'presente' | ''
  sostegno_asl: boolean
  sostegno_diagnosi_funzionale: boolean
  sostegno_bes: boolean
  sostegno_dsa: boolean
  /** Solo UI: "Nessuna delle precedenti" per le certificazioni (non salvato). */
  cert_nessuna: boolean

  canale_orientamento_scuola: boolean
  canale_open_day: boolean
  canale_ricerca_online: boolean
  canale_passaparola: boolean
  canale_altro: boolean
  canale_altro_testo: string

  consenso_privacy_a: SiNo
  consenso_privacy_b: SiNo
  consenso_foto_realizzare: SiNo
  consenso_foto_utilizzare: SiNo
  consenso_foto_comunicare: SiNo
}

export const MDI_DEFAULT_VALUES: MdiFormValues = {
  acc_cognome: '',
  acc_nome: '',
  acc_qualita: '',
  acc_cellulare: '',
  acc_email: '',
  acc_email_2: '',
  acc_codice_fiscale: '',
  acc_sesso: '',
  acc_data_nascita: '',
  acc_nascita: 'italia',
  acc_comune_nascita: '',
  acc_comune_nascita_cod: '',
  acc_stato_nascita: '',
  acc_cittadinanza: 'Italia',
  acc_residenza_come_allievo: true,
  acc_residenza_via: '',
  acc_residenza_citta: '',
  acc_residenza_comune_cod: '',
  acc_residenza_prov: '',
  acc_residenza_cap: '',
  all_codice_fiscale: '',
  all_sesso: '',
  all_nascita: 'italia',
  all_comune_nascita_cod: '',
  all_stato_nascita: '',
  all_cittadinanza_2: '',
  all_residenza_comune_cod: '',
  all_domicilio_comune_cod: '',
  all_scuola_provenienza_cod: '',
  all_cognome: '',
  all_nome: '',
  all_data_nascita: '',
  all_annualita: '',
  all_sezione: '',
  all_nato_a: '',
  all_cittadinanza: 'Italia',
  all_scuola_provenienza: '',
  all_residenza_via: '',
  all_residenza_citta: '',
  all_residenza_prov: '',
  all_residenza_cap: '',
  all_domicilio_diverso: false,
  all_domicilio_via: '',
  all_domicilio_citta: '',
  all_domicilio_prov: '',
  all_domicilio_cap: '',
  corso_pref1_id: '',
  corso_pref2_id: '',
  corso_pref3_id: '',
  sostegno_stato: '',
  sostegno_asl: false,
  sostegno_diagnosi_funzionale: false,
  sostegno_bes: false,
  sostegno_dsa: false,
  cert_nessuna: false,
  canale_orientamento_scuola: false,
  canale_open_day: false,
  canale_ricerca_online: false,
  canale_passaparola: false,
  canale_altro: false,
  canale_altro_testo: '',
  consenso_privacy_a: '',
  consenso_privacy_b: '',
  consenso_foto_realizzare: '',
  consenso_foto_utilizzare: '',
  consenso_foto_comunicare: '',
}

/** Passi del kiosk, come nel vecchio IL_Kiosk_MDI_v5. Il passo 0 (identificazione) non ha campi da validare. */
export const STEP_TITLES = [
  'Identificazione',
  'Allievo',
  'Genitore',
  'Corsi e certificazioni',
  'Privacy e consensi',
  'Conferma',
]

export const STEP_FIELDS: (keyof MdiFormValues)[][] = [
  [],
  [
    'all_codice_fiscale',
    'all_sesso',
    'all_comune_nascita_cod',
    'all_stato_nascita',
    'all_scuola_provenienza_cod',
    'all_cognome',
    'all_nome',
    'all_data_nascita',
    'all_annualita',
    'all_sezione',
    'all_nato_a',
    'all_cittadinanza',
    'all_residenza_via',
    'all_residenza_citta',
    'all_residenza_prov',
    'all_residenza_cap',
    'all_domicilio_via',
    'all_domicilio_citta',
  ],
  [
    'acc_cognome',
    'acc_nome',
    'acc_qualita',
    'acc_codice_fiscale',
    'acc_sesso',
    'acc_data_nascita',
    'acc_comune_nascita',
    'acc_stato_nascita',
    'acc_cittadinanza',
    'acc_cellulare',
    'acc_email',
    'acc_email_2',
    'acc_residenza_via',
    'acc_residenza_citta',
    'acc_residenza_cap',
  ],
  ['corso_pref1_id', 'sostegno_stato', 'cert_nessuna', 'canale_altro_testo'],
  [
    'consenso_privacy_a',
    'consenso_privacy_b',
    'consenso_foto_realizzare',
    'consenso_foto_utilizzare',
    'consenso_foto_comunicare',
  ],
  [],
]

export const SEZIONI = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/** Luogo stampato accanto alle firme ("Milano, il …"), come nel modulo cartaceo. */
export const LUOGO_FIRMA = 'Milano'

/**
 * Annualità formativa a cui si riferisce la MDI, es. "27/28": l'anno formativo
 * successivo a quello in corso (che inizia a settembre).
 */
export function annualitaIscrizione(date = new Date()) {
  const inizioAnnoInCorso = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1
  const a = (inizioAnnoInCorso + 1) % 100
  return `${String(a).padStart(2, '0')}/${String((a + 1) % 100).padStart(2, '0')}`
}
