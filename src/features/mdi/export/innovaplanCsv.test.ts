import { describe, expect, it } from 'vitest'
import type { Mdi } from '../../../types/database.types'
import { COLONNE, annoScolasticoIscrizione, avvisiMdi, generaCsv, intestazione, nomeFile, rigaMdi, type ContestoExport } from './innovaplanCsv'

// Dati interamente inventati: nessun dato reale nei test.
function mdiDiProva(extra: Partial<Mdi> = {}): Mdi {
  return {
    id: 'mdi-1',
    open_day_id: null,
    booking_id: null,
    acc_cognome: 'Rossi',
    acc_nome: 'Anna',
    acc_qualita: 'genitore',
    acc_cellulare: '333 123 4567',
    acc_email: 'Anna.Rossi@Example.com',
    acc_email_2: null,
    acc_codice_fiscale: 'RSSNNA80A41F205X',
    acc_data_nascita: '1980-01-01',
    acc_sesso: 'F',
    acc_nato_estero: false,
    acc_comune_nascita: 'Milano',
    acc_comune_nascita_cod: 'F205',
    acc_stato_nascita: null,
    acc_cittadinanza: 'Italia',
    acc_residenza_come_allievo: true,
    acc_residenza_via: null,
    acc_residenza_citta: null,
    acc_residenza_comune_cod: null,
    acc_residenza_prov: null,
    acc_residenza_cap: null,
    all_cognome: 'Rossi',
    all_nome: 'Luca',
    all_codice_fiscale: 'RSSLCU12C15F205X',
    all_sesso: 'M',
    all_data_nascita: '2012-03-15',
    all_annualita: 3,
    all_sezione: 'B',
    all_nato_a: 'Milano',
    all_nato_estero: false,
    all_comune_nascita_cod: 'F205',
    all_stato_nascita: null,
    all_cittadinanza: 'Italia',
    all_cittadinanza_2: null,
    all_scuola_provenienza: 'Scuola media di prova',
    all_scuola_provenienza_cod: 'MIMM000001',
    all_residenza_via: 'Via Esempio 1',
    all_residenza_citta: 'Milano',
    all_residenza_comune_cod: 'F205',
    all_residenza_prov: 'MI',
    all_residenza_cap: '20100',
    all_domicilio_diverso: false,
    all_domicilio_via: null,
    all_domicilio_citta: null,
    all_domicilio_comune_cod: null,
    all_domicilio_prov: null,
    all_domicilio_cap: null,
    corso_pref1_id: 'c1',
    corso_pref2_id: 'c2',
    corso_pref3_id: null,
    sostegno_stato: 'mai',
    sostegno_asl: false,
    sostegno_diagnosi_funzionale: false,
    sostegno_bes: false,
    sostegno_dsa: false,
    canale_orientamento_scuola: false,
    canale_open_day: true,
    canale_ricerca_online: false,
    canale_passaparola: false,
    canale_altro: false,
    canale_altro_testo: null,
    consenso_privacy_a: true,
    consenso_privacy_b: false,
    consenso_foto_realizzare: true,
    consenso_foto_utilizzare: true,
    consenso_foto_comunicare: false,
    dichiarazione_firma_genitore: true,
    esportato_innovaplan: false,
    esportato_innovaplan_at: null,
    esportato_innovaplan_by: null,
    stato_lavorazione: 'nuova',
    created_at: '2026-10-01T10:00:00Z',
    updated_at: '2026-10-01T10:00:00Z',
    ...extra,
  }
}

const ctx: ContestoExport = {
  annoScolastico: 2027,
  codiceSede: 'MICF065007',
  classificazione: 'R3',
  corsi: [
    { id: 'c1', nome: 'Cucina', codice_ministeriale: 'A199' },
    { id: 'c2', nome: 'Informatica', codice_ministeriale: 'A226' },
  ],
}

describe('formato file', () => {
  it('intestazione: spazio iniziale, 69 colonne, ";" finale', () => {
    const h = intestazione()
    expect(h.startsWith(' ANNO_SCOLASTICO;COD_FORTE_SCUOLA;')).toBe(true)
    expect(h.endsWith('PRV_DOMICILIO_IOL;')).toBe(true)
    expect(h.split(';')).toHaveLength(70)
    expect(COLONNE).toHaveLength(69)
  })

  it('CRLF, niente BOM, ogni riga chiusa da ";"', () => {
    const csv = generaCsv([mdiDiProva(), mdiDiProva({ id: 'mdi-2' })], ctx)
    expect(csv.charCodeAt(0)).toBe(' '.charCodeAt(0))
    expect(csv.endsWith('\r\n')).toBe(true)
    const righe = csv.split('\r\n').slice(0, -1)
    expect(righe).toHaveLength(3)
    for (const r of righe) {
      expect(r.endsWith(';')).toBe(true)
      expect(r.split(';')).toHaveLength(70)
    }
    expect(csv.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
  })

  it('toglie ";" e a capo dai valori', () => {
    const r = rigaMdi(mdiDiProva({ all_residenza_via: 'Via Roma; 1\nscala B' }), ctx)
    expect(r.INDIRIZZO_RESIDENZA).toBe('VIA ROMA 1 SCALA B')
  })
})

describe('mappatura campi', () => {
  it('allievo nato in Italia', () => {
    const r = rigaMdi(mdiDiProva(), ctx)
    expect(r).toMatchObject({
      ANNO_SCOLASTICO: '2027',
      COD_FORTE_SCUOLA: 'MICF065007',
      COD_UTENTE_SCUOLA: 'MICF065007',
      COD_ALUNNO: '',
      COGNOME: 'ROSSI',
      NOME: 'LUCA',
      SESSO: 'M',
      DATA_NASCITA: '15/03/2012',
      COMUNE_NASCITA: 'F205',
      PRIMA_CITTADINANZA: 'ITALIA',
      STATO_ESTERO_NASCITA: '',
      COMUNE_RESIDENZA: 'F205',
      IND_MINISTERIALE: 'A199',
      CLASF_MINISTERIALE: 'R3',
      STATO_DOMANDA: '',
      PROG_DOMANDA: '',
      TIPO_DOMANDA: '',
      UTENZA: '',
      TELEFONO: '3331234567',
      SCUOLA_PROVENIENZA: 'MIMM000001',
      DES_SCU_PROVENIENZA: 'SCUOLA MEDIA DI PROVA',
    })
  })

  it('scelte: sede + codici corsi in ordine di preferenza', () => {
    const r = rigaMdi(mdiDiProva(), ctx)
    expect(r).toMatchObject({
      COD_SCU_I_SCELTA: 'MICF065007',
      IND_I_SCU_I_SCELTA: 'A199',
      CLF_I_SCU_I_SCELTA: 'R3',
      IND_II_SCU_I_SCELTA: 'A226',
      CLF_II_SCU_I_SCELTA: 'R3',
      IND_III_SCU_I_SCELTA: '',
      CLF_III_SCU_I_SCELTA: '',
      COD_SCU_II_SCELTA: '',
      COD_SCU_III_SCELTA: '',
    })
  })

  it('genitore con stessa residenza dell’allievo', () => {
    const r = rigaMdi(mdiDiProva(), ctx)
    expect(r).toMatchObject({
      CF_PRIMO_GENITORE: 'RSSNNA80A41F205X',
      COGNOME_PRIMO_GENITORE: 'ROSSI',
      PARENTELA_PRIMO_GEN: 'GENITORE',
      DATA_NAS_PRIMO_GEN: '01/01/1980',
      COM_NASCITA_PRIMO_GEN: 'F205',
      COD_CITT_PRIMO_GEN: 'ITALIA',
      COMUNE_RES_PRIMO_GEN: 'F205',
      CAP_RES_PRIMO_GEN: '20100',
      IND_RES_PRIMO_GEN: 'VIA ESEMPIO 1',
      EMAIL_PRIMO_GEN: 'anna.rossi@example.com',
    })
  })

  it('nati all’estero: paese per nome, "EEEE" per il genitore', () => {
    const r = rigaMdi(
      mdiDiProva({
        all_nato_estero: true,
        all_comune_nascita_cod: null,
        all_stato_nascita: 'Egitto',
        all_cittadinanza: 'Egitto',
        acc_nato_estero: true,
        acc_comune_nascita_cod: null,
        acc_stato_nascita: 'Egitto',
        acc_cittadinanza: 'Egitto',
        acc_qualita: 'tutore',
      }),
      ctx,
    )
    expect(r).toMatchObject({
      COMUNE_NASCITA: '',
      STATO_ESTERO_NASCITA: 'EGITTO',
      PRIMA_CITTADINANZA: 'EGITTO',
      COM_NASCITA_PRIMO_GEN: 'EEEE',
      STATO_EST_PRIMO_GEN: 'EGITTO',
      PARENTELA_PRIMO_GEN: 'TUTORE',
    })
  })

  it('domicilio = residenza se non diverso; residenza propria del genitore', () => {
    const uguale = rigaMdi(mdiDiProva(), ctx)
    expect(uguale).toMatchObject({ COMUNE_DOMICILIO_IOL: 'F205', CAP_DOMICILIO_IOL: '20100', PRV_DOMICILIO_IOL: 'MI' })

    const diversi = rigaMdi(
      mdiDiProva({
        all_domicilio_diverso: true,
        all_domicilio_via: 'Via Altra 2',
        all_domicilio_comune_cod: 'I690',
        all_domicilio_cap: '20099',
        all_domicilio_prov: 'MI',
        acc_residenza_come_allievo: false,
        acc_residenza_via: 'Via Genitore 3',
        acc_residenza_comune_cod: 'B162',
        acc_residenza_cap: '20091',
      }),
      ctx,
    )
    expect(diversi).toMatchObject({
      COMUNE_DOMICILIO_IOL: 'I690',
      INDIRIZZO_DOMICILIO_IOL: 'VIA ALTRA 2',
      COMUNE_RESIDENZA_IOL: 'F205',
      COMUNE_RES_PRIMO_GEN: 'B162',
      IND_RES_PRIMO_GEN: 'VIA GENITORE 3',
      CAP_RES_PRIMO_GEN: '20091',
    })
  })
})

describe('avvisi e utilità', () => {
  it('nessun avviso per una MDI completa', () => {
    expect(avvisiMdi(mdiDiProva(), ctx)).toEqual([])
  })

  it('segnala dati mancanti e codice corso non impostato', () => {
    const avvisi = avvisiMdi(mdiDiProva({ acc_codice_fiscale: null, all_scuola_provenienza_cod: null }), {
      ...ctx,
      corsi: [{ id: 'c1', nome: 'Cucina', codice_ministeriale: null }],
    })
    expect(avvisi).toEqual([
      'manca codice scuola di provenienza',
      'manca codice fiscale genitore',
      'manca codice ministeriale del corso Cucina (Impostazioni)',
    ])
  })

  it('anno scolastico di iscrizione e nome file', () => {
    expect(annoScolasticoIscrizione(new Date(2026, 8, 23))).toBe(2027)
    expect(annoScolasticoIscrizione(new Date(2027, 0, 15))).toBe(2027)
    expect(nomeFile(ctx, new Date(2026, 8, 23))).toBe('MDI_INNOVAPLAN_MICF065007_20260923.csv')
  })
})
