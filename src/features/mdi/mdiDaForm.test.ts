import { describe, expect, it } from 'vitest'
import type { Mdi } from '../../types/database.types'
import { rigaMdi } from './export/innovaplanCsv'
import { mdiDaForm } from './mdiDaForm'
import { MDI_DEFAULT_VALUES, type MdiFormValues } from './mdiFormTypes'

// Valori inventati, come li compilerebbe una famiglia nel kiosk.
const compilato: MdiFormValues = {
  ...MDI_DEFAULT_VALUES,
  acc_cognome: ' Bianchi ',
  acc_nome: 'Marco',
  acc_qualita: 'genitore',
  acc_cellulare: '333 000 1111',
  acc_email: 'marco@example.com',
  acc_codice_fiscale: 'bnc mrc 75d10z336x',
  acc_sesso: 'M',
  acc_data_nascita: '1975-04-10',
  acc_nascita: 'estero',
  acc_comune_nascita: 'da ignorare',
  acc_stato_nascita: 'Egitto',
  acc_cittadinanza: 'Egitto',
  acc_residenza_come_allievo: true,
  all_cognome: 'Bianchi',
  all_nome: 'Sara',
  all_codice_fiscale: 'BNCSRA12M55F205X',
  all_sesso: 'F',
  all_data_nascita: '2012-08-15',
  all_nascita: 'italia',
  all_nato_a: 'Milano',
  all_comune_nascita_cod: 'F205',
  all_cittadinanza: 'Italia',
  all_cittadinanza_2: 'Egitto',
  all_annualita: '3',
  all_sezione: 'C',
  all_scuola_provenienza: 'Scuola di prova',
  all_scuola_provenienza_cod: 'MIMM000002',
  all_residenza_via: 'Via Prova 5',
  all_residenza_citta: 'Milano',
  all_residenza_comune_cod: 'F205',
  all_residenza_prov: 'mi',
  all_residenza_cap: '20100',
  corso_pref1_id: 'c2',
  corso_pref2_id: 'c2',
  corso_pref3_id: 'c1',
  sostegno_stato: 'mai',
  cert_nessuna: true,
  consenso_privacy_a: 'si',
  consenso_privacy_b: 'no',
  consenso_foto_realizzare: 'si',
  consenso_foto_utilizzare: 'no',
  consenso_foto_comunicare: 'no',
}

describe('mdiDaForm', () => {
  const riga = mdiDaForm(compilato, { openDayId: 'od-1', bookingId: null })

  it('normalizza e compatta le preferenze senza duplicati', () => {
    expect(riga).toMatchObject({
      acc_cognome: 'Bianchi',
      acc_codice_fiscale: 'BNCMRC75D10Z336X',
      all_residenza_prov: 'MI',
      corso_pref1_id: 'c2',
      corso_pref2_id: 'c1',
      corso_pref3_id: null,
      consenso_privacy_b: false,
      dichiarazione_firma_genitore: true,
    })
  })

  it('genitore nato all’estero: niente comune, paese come stato di nascita', () => {
    expect(riga).toMatchObject({
      acc_nato_estero: true,
      acc_comune_nascita: null,
      acc_comune_nascita_cod: null,
      acc_stato_nascita: 'Egitto',
    })
  })

  it('arriva nel CSV con i valori attesi', () => {
    const mdi = { ...riga, id: 'x', esportato_innovaplan: false, esportato_innovaplan_at: null, esportato_innovaplan_by: null, stato_lavorazione: 'nuova', created_at: '', updated_at: '' } as Mdi
    const r = rigaMdi(mdi, {
      annoScolastico: 2027,
      codiceSede: 'MICF065007',
      classificazione: 'R3',
      corsi: [
        { id: 'c1', nome: 'Cucina', codice_ministeriale: 'A199' },
        { id: 'c2', nome: 'Grafica', codice_ministeriale: 'A232' },
      ],
    })
    expect(r).toMatchObject({
      COGNOME: 'BIANCHI',
      SECONDA_CITTADINANZA: 'EGITTO',
      COM_NASCITA_PRIMO_GEN: 'EEEE',
      STATO_EST_PRIMO_GEN: 'EGITTO',
      IND_I_SCU_I_SCELTA: 'A232',
      IND_II_SCU_I_SCELTA: 'A199',
      IND_III_SCU_I_SCELTA: '',
      SCUOLA_PROVENIENZA: 'MIMM000002',
      PRV_RESIDENZA_IOL: 'MI',
      COMUNE_RES_PRIMO_GEN: 'F205',
    })
  })
})
