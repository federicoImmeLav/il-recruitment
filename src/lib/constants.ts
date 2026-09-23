export const RUOLI_OPERATORE = [
  'farmer_iefp',
  'coordinamento_recruitment',
  'responsabile_bu_iefp',
  'operatore_segreteria',
  'preside',
  'responsabile_corso',
  'admin',
] as const

export const RUOLO_LABEL: Record<(typeof RUOLI_OPERATORE)[number], string> = {
  farmer_iefp: 'Farmer IeFP',
  coordinamento_recruitment: 'Coordinamento Recruitment',
  responsabile_bu_iefp: 'Responsabile BU IeFP',
  operatore_segreteria: 'Operatore Segreteria',
  preside: 'Preside',
  responsabile_corso: 'Responsabile Corso',
  admin: 'Amministratore',
}

export const STATO_BOOKING_LABEL = {
  confirmed: 'Confermata',
  pending: 'In attesa',
  waitlist: 'Lista d’attesa',
  walk_in: 'Walk-in',
  cancelled: 'Annullata',
} as const

export const STATO_BOOKING_COLOR: Record<keyof typeof STATO_BOOKING_LABEL, 'green' | 'orange' | 'blue' | 'gray' | 'red'> = {
  confirmed: 'green',
  pending: 'orange',
  waitlist: 'blue',
  walk_in: 'gray',
  cancelled: 'red',
}

export const CANALE_ISCRIZIONE_LABEL = {
  online: 'Online',
  scuola: 'Scuola',
  walk_in: 'Walk-in',
  telefono: 'Telefono',
  altro: 'Altro',
} as const

export const SOSTEGNO_STATO_LABEL = {
  mai: 'Nessun sostegno',
  passato: 'Sostegno in passato',
  presente: 'Sostegno attuale',
} as const

export const QUALITA_ACCOMPAGNATORE_LABEL = {
  genitore: 'Genitore',
  tutore: 'Tutore',
} as const

/** Ordine di visualizzazione nel form: rispecchia il modulo MDI cartaceo esistente. */
export const CORSI_SEED = [
  { nome: 'Cucina', qualifica: 'Operatore della ristorazione - preparazione pasti', ordine: 1 },
  { nome: 'Sala Bar', qualifica: 'Operatore della ristorazione - servizi di sala e bar', ordine: 2 },
  { nome: 'Panificazione e pasticceria', qualifica: 'Operatore della ristorazione - panificazione e pasticceria', ordine: 3 },
  { nome: 'Acconciatura', qualifica: 'Operatore del benessere - acconciatura', ordine: 4 },
  { nome: 'Estetica', qualifica: 'Operatore del benessere - estetica', ordine: 5 },
  { nome: 'Informatica', qualifica: 'Operatore informatico', ordine: 6 },
  { nome: 'Grafica', qualifica: 'Operatore grafico', ordine: 7 },
  { nome: 'Comunicazione Digitale', qualifica: 'Operatore della comunicazione digitale', ordine: 8 },
  { nome: 'Elettricità e domotica', qualifica: 'Operatore elettrico - impianti civili e domotica', ordine: 9 },
] as const

export const CANALE_CONOSCENZA_OPTIONS = [
  { key: 'canale_orientamento_scuola', label: 'Orientamento a scuola' },
  { key: 'canale_open_day', label: 'Open Day' },
  { key: 'canale_ricerca_online', label: 'Ricerca online' },
  { key: 'canale_passaparola', label: 'Passaparola' },
  { key: 'canale_altro', label: 'Altro' },
] as const
