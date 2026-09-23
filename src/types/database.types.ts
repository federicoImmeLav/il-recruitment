// Tipi scritti a mano, allineati a supabase/migrations/000*.sql.
// Quando il progetto Supabase reale e' collegato, si possono rigenerare con:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.types.ts

export type StatoEdizione = 'bozza' | 'attiva' | 'chiusa'
export type StatoOpenDay = 'aperto' | 'chiuso' | 'annullato'
export type TipoOpenDay = 'OpenDay' | 'OpenDay2e'
export type StatoBooking = 'confirmed' | 'pending' | 'waitlist' | 'walk_in' | 'cancelled' | 'rejected'
export type CanaleIscrizione = 'online' | 'scuola' | 'walk_in' | 'telefono' | 'altro'
export type QualitaAccompagnatore = 'genitore' | 'tutore'
export type SostegnoStato = 'mai' | 'passato' | 'presente'
export type RuoloOperatore =
  | 'farmer_iefp'
  | 'coordinamento_recruitment'
  | 'responsabile_bu_iefp'
  | 'operatore_segreteria'
  | 'preside'
  | 'responsabile_corso'
  | 'admin'

export type Profile = {
  id: string
  nome_completo: string
  ruolo: RuoloOperatore
  attivo: boolean
  created_at: string
}

export type Edizione = {
  id: string
  nome: string
  anno: string
  data_apertura: string | null
  data_chiusura: string | null
  stato: StatoEdizione
  created_by: string | null
  created_at: string
  updated_at: string
}

export type OpenDay = {
  id: string
  edizione_id: string
  data: string
  ora: string
  operatore_id: string | null
  posti_max: number
  note: string | null
  tipo: TipoOpenDay
  stato: StatoOpenDay
  /** Testo dell'opzione del menu nel Google Modulo collegata a questo Open Day. */
  etichetta_modulo: string | null
  /** Luogo/indicazioni specifici; se vuoto valgono quelli di `impostazioni`. */
  luogo_override: string | null
  created_at: string
  updated_at: string
}

/** Risultato di kiosk_cerca_iscritti (0004_kiosk_mdi.sql): solo dati non di contatto. */
export type KioskIscritto = { id: string; cognome: string; nome: string; scuola: string | null }

/** Risultato di kiosk_dati_iscritto: campi per precompilare la MDI. */
export type KioskDatiIscritto = Pick<
  Booking,
  | 'id'
  | 'open_day_id'
  | 'cognome'
  | 'nome'
  | 'data_nascita'
  | 'scuola'
  | 'telefono'
  | 'email'
  | 'corso_id'
  | 'corso2_id'
  | 'acc_cognome'
  | 'acc_nome'
>

/** Colonne effettivamente leggibili da anon (vedi GRANT in 0002_rls_policies.sql). */
export type OpenDayPublic = Pick<
  OpenDay,
  'id' | 'edizione_id' | 'data' | 'ora' | 'posti_max' | 'tipo' | 'stato'
>

export type Corso = {
  id: string
  nome: string
  qualifica: string
  ordine: number
  attivo: boolean
  /** Codice ministeriale dell'indirizzo (IND_MINISTERIALE nel tracciato SIDI), es. A199. */
  codice_ministeriale: string | null
}

export type Booking = {
  id: string
  open_day_id: string
  edizione_id: string
  cognome: string
  nome: string
  data_nascita: string | null
  scuola: string | null
  classe: string | null
  residenza: string | null
  telefono: string
  email: string | null
  corso_id: string | null
  corso2_id: string | null
  canale: CanaleIscrizione
  status: StatoBooking
  flag_seconda_media: boolean
  checked_in: boolean
  checked_in_at: string | null
  registered_at: string
  note_staff: string | null
  google_response_id: string | null
  acc_cognome: string | null
  acc_nome: string | null
  decisione_at: string | null
  decisione_by: string | null
  motivo_rifiuto: string | null
  created_at: string
  updated_at: string
}

export type CanaleNotifica = 'email' | 'whatsapp_manuale' | 'sms' | 'whatsapp'
export type TipoNotifica = 'approvazione' | 'rifiuto' | 'reminder'
export type StatoNotifica = 'in_coda' | 'inviata' | 'errore' | 'manuale'

export type Notifica = {
  id: string
  booking_id: string
  open_day_id: string
  tipo: TipoNotifica
  canale: CanaleNotifica
  destinatario: string
  oggetto: string
  testo: string
  stato: StatoNotifica
  errore: string | null
  tentativi: number
  in_invio_at: string | null
  created_at: string
  sent_at: string | null
}

export type Impostazioni = {
  id: 1
  luogo_predefinito: string
  indicazioni_predefinite: string
  contatti: string
  canale_predefinito: CanaleNotifica
  testo_approvazione: string
  testo_rifiuto: string
  testo_reminder: string
  codice_meccanografico_sede: string
  classificazione_ministeriale: string
  updated_at: string
}

export type EsitoImport = 'importata' | 'duplicata' | 'open_day_non_trovato' | 'errore'

export type GoogleFormImportLog = {
  id: string
  response_id: string | null
  ricevuto_at: string
  esito: EsitoImport
  messaggio: string | null
  booking_id: string | null
  payload: Record<string, unknown>
}

export type Mdi = {
  id: string
  open_day_id: string | null
  booking_id: string | null

  acc_cognome: string
  acc_nome: string
  acc_qualita: QualitaAccompagnatore
  acc_cellulare: string
  acc_email: string

  all_cognome: string
  all_nome: string
  all_data_nascita: string
  all_annualita: number
  all_sezione: string | null
  all_nato_a: string
  all_cittadinanza: string
  all_scuola_provenienza: string | null
  all_residenza_via: string
  all_residenza_citta: string
  all_residenza_prov: string | null
  all_residenza_cap: string | null
  all_domicilio_diverso: boolean
  all_domicilio_via: string | null
  all_domicilio_citta: string | null
  all_domicilio_prov: string | null
  all_domicilio_cap: string | null
  // Aggiunti in 0008 per l'anagrafica INNOVAPLAN (codici comune = catastali ISTAT)
  all_codice_fiscale: string | null
  all_sesso: 'M' | 'F' | null
  all_nato_estero: boolean
  all_comune_nascita_cod: string | null
  all_stato_nascita: string | null
  all_cittadinanza_2: string | null
  all_residenza_comune_cod: string | null
  all_domicilio_comune_cod: string | null
  all_scuola_provenienza_cod: string | null

  acc_codice_fiscale: string | null
  acc_data_nascita: string | null
  acc_sesso: 'M' | 'F' | null
  acc_nato_estero: boolean
  acc_comune_nascita: string | null
  acc_comune_nascita_cod: string | null
  acc_stato_nascita: string | null
  acc_cittadinanza: string | null
  acc_residenza_come_allievo: boolean
  acc_residenza_via: string | null
  acc_residenza_citta: string | null
  acc_residenza_comune_cod: string | null
  acc_residenza_prov: string | null
  acc_residenza_cap: string | null
  acc_email_2: string | null

  corso_pref1_id: string | null
  corso_pref2_id: string | null
  corso_pref3_id: string | null

  sostegno_stato: SostegnoStato
  sostegno_asl: boolean
  sostegno_diagnosi_funzionale: boolean
  sostegno_bes: boolean
  sostegno_dsa: boolean

  canale_orientamento_scuola: boolean
  canale_open_day: boolean
  canale_ricerca_online: boolean
  canale_passaparola: boolean
  canale_altro: boolean
  canale_altro_testo: string | null

  consenso_privacy_a: boolean
  consenso_privacy_b: boolean
  consenso_foto_realizzare: boolean
  consenso_foto_utilizzare: boolean
  consenso_foto_comunicare: boolean
  dichiarazione_firma_genitore: boolean

  esportato_innovaplan: boolean
  esportato_innovaplan_at: string | null
  esportato_innovaplan_by: string | null
  stato_lavorazione: string

  created_at: string
  updated_at: string
}

type NoRelationships = { Relationships: [] }

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        // Nessun insert diretto da client: la riga viene creata dal trigger handle_new_user().
        Insert: Partial<Profile> & { id: string }
        Update: Partial<Profile>
      } & NoRelationships
      edizioni: {
        Row: Edizione
        Insert: {
          id?: string
          nome: string
          anno: string
          data_apertura?: string | null
          data_chiusura?: string | null
          stato?: StatoEdizione
          created_by?: string | null
        }
        Update: Partial<Edizione>
      } & NoRelationships
      open_days: {
        Row: OpenDay
        Insert: {
          id?: string
          edizione_id: string
          data: string
          ora: string
          operatore_id?: string | null
          posti_max: number
          note?: string | null
          tipo?: TipoOpenDay
          stato?: StatoOpenDay
          etichetta_modulo?: string | null
          luogo_override?: string | null
        }
        Update: Partial<OpenDay>
      } & NoRelationships
      corsi: {
        Row: Corso
        Insert: {
          id?: string
          nome: string
          qualifica: string
          ordine?: number
          attivo?: boolean
          codice_ministeriale?: string | null
        }
        Update: Partial<Corso>
      } & NoRelationships
      bookings: {
        Row: Booking
        // Nessun insert diretto da client: le prenotazioni si creano solo via RPC create_booking().
        Insert: Partial<Booking> & { open_day_id: string; edizione_id: string; cognome: string; nome: string; telefono: string }
        Update: Partial<Booking>
      } & NoRelationships
      mdi: {
        Row: Mdi
        Insert: {
          id?: string
          open_day_id?: string | null
          booking_id?: string | null
          acc_cognome: string
          acc_nome: string
          acc_qualita: QualitaAccompagnatore
          acc_cellulare: string
          acc_email: string
          all_cognome: string
          all_nome: string
          all_data_nascita: string
          all_annualita: number
          all_sezione?: string | null
          all_nato_a: string
          all_cittadinanza: string
          all_scuola_provenienza?: string | null
          all_residenza_via: string
          all_residenza_citta: string
          all_residenza_prov?: string | null
          all_residenza_cap?: string | null
          all_domicilio_diverso?: boolean
          all_domicilio_via?: string | null
          all_domicilio_citta?: string | null
          all_domicilio_prov?: string | null
          all_domicilio_cap?: string | null
          all_codice_fiscale?: string | null
          all_sesso?: 'M' | 'F' | null
          all_nato_estero?: boolean
          all_comune_nascita_cod?: string | null
          all_stato_nascita?: string | null
          all_cittadinanza_2?: string | null
          all_residenza_comune_cod?: string | null
          all_domicilio_comune_cod?: string | null
          all_scuola_provenienza_cod?: string | null
          acc_codice_fiscale?: string | null
          acc_data_nascita?: string | null
          acc_sesso?: 'M' | 'F' | null
          acc_nato_estero?: boolean
          acc_comune_nascita?: string | null
          acc_comune_nascita_cod?: string | null
          acc_stato_nascita?: string | null
          acc_cittadinanza?: string | null
          acc_residenza_come_allievo?: boolean
          acc_residenza_via?: string | null
          acc_residenza_citta?: string | null
          acc_residenza_comune_cod?: string | null
          acc_residenza_prov?: string | null
          acc_residenza_cap?: string | null
          acc_email_2?: string | null
          corso_pref1_id?: string | null
          corso_pref2_id?: string | null
          corso_pref3_id?: string | null
          sostegno_stato?: SostegnoStato
          sostegno_asl?: boolean
          sostegno_diagnosi_funzionale?: boolean
          sostegno_bes?: boolean
          sostegno_dsa?: boolean
          canale_orientamento_scuola?: boolean
          canale_open_day?: boolean
          canale_ricerca_online?: boolean
          canale_passaparola?: boolean
          canale_altro?: boolean
          canale_altro_testo?: string | null
          consenso_privacy_a: boolean
          consenso_privacy_b: boolean
          consenso_foto_realizzare: boolean
          consenso_foto_utilizzare: boolean
          consenso_foto_comunicare: boolean
          dichiarazione_firma_genitore: boolean
        }
        Update: Partial<Mdi>
      } & NoRelationships
      impostazioni: {
        Row: Impostazioni
        Insert: never
        Update: Partial<Omit<Impostazioni, 'id' | 'updated_at'>>
      } & NoRelationships
      notifiche: {
        Row: Notifica
        // Creazione solo via RPC (decidi_iscrizione / accoda_reminder).
        Insert: never
        Update: Partial<Pick<Notifica, 'stato' | 'errore' | 'sent_at'>>
      } & NoRelationships
      google_form_import_log: {
        Row: GoogleFormImportLog
        Insert: never
        Update: never
      } & NoRelationships
    }
    Views: Record<string, never>
    Functions: {
      create_booking: {
        Args: {
          p_open_day_id: string
          p_cognome: string
          p_nome: string
          p_telefono: string
          p_data_nascita?: string | null
          p_scuola?: string | null
          p_classe?: string | null
          p_residenza?: string | null
          p_email?: string | null
          p_corso_id?: string | null
          p_corso2_id?: string | null
          p_canale?: CanaleIscrizione
          p_flag_seconda_media?: boolean
        }
        Returns: Booking
      }
      posti_disponibili: {
        Args: { p_open_day_id: string }
        Returns: number
      }
      kiosk_cerca_iscritti: {
        Args: { p_open_day_id: string; p_query: string }
        Returns: KioskIscritto[]
      }
      kiosk_dati_iscritto: {
        Args: { p_booking_id: string }
        Returns: KioskDatiIscritto[]
      }
      decidi_iscrizione: {
        Args: { p_booking_id: string; p_approva: boolean; p_motivo?: string | null }
        Returns: Booking
      }
      is_staff: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
  }
}
