export type SiNo = 'si' | 'no' | ''

export interface MdiFormValues {
  acc_cognome: string
  acc_nome: string
  acc_qualita: 'genitore' | 'tutore' | ''
  acc_cellulare: string
  acc_email: string

  all_cognome: string
  all_nome: string
  all_data_nascita: string
  all_annualita: string
  all_sezione: string
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
  all_cognome: '',
  all_nome: '',
  all_data_nascita: '',
  all_annualita: '',
  all_sezione: '',
  all_nato_a: '',
  all_cittadinanza: '',
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
export const STEP_TITLES = ['Identificazione', 'Dati allievo', 'Corsi e certificazioni', 'Privacy e consensi', 'Conferma']

export const STEP_FIELDS: (keyof MdiFormValues)[][] = [
  [],
  [
    'acc_cognome',
    'acc_nome',
    'acc_qualita',
    'acc_cellulare',
    'acc_email',
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
