import { describe, expect, it } from 'vitest'
import { analizzaCf, carattereControllo } from './codiceFiscale'

// Solo codici di fantasia costruiti per il test (nessun dato reale).
const cf = (primi15: string) => primi15 + carattereControllo(primi15)
const OGGI = new Date(2026, 8, 23)

describe('analizzaCf', () => {
  it('decodifica un maschio nato in Italia', () => {
    const e = analizzaCf(cf('RSSMRA12C15F205'), OGGI)
    expect(e).toMatchObject({ stato: 'valido', sesso: 'M', dataNascita: '2012-03-15', codiceLuogo: 'F205', estero: false })
  })

  it('decodifica una femmina nata all’estero (giorno + 40, codice Z)', () => {
    const e = analizzaCf(cf('BNCGLI11H52Z336'), OGGI)
    expect(e).toMatchObject({ stato: 'valido', sesso: 'F', dataNascita: '2011-06-12', codiceLuogo: 'Z336', estero: true })
  })

  it('assegna il secolo in base all’anno corrente (genitore nato nel 1980)', () => {
    const e = analizzaCf(cf('VRDLGU80A01I690'), OGGI)
    expect(e).toMatchObject({ stato: 'valido', dataNascita: '1980-01-01' })
  })

  it('gestisce l’omocodia', () => {
    // 12 -> MN, 15 -> MR, F205 -> F2LR
    const e = analizzaCf(cf('RSSMRAMNCMRF2LR'), OGGI)
    expect(e).toMatchObject({ stato: 'valido', dataNascita: '2012-03-15', codiceLuogo: 'F205' })
  })

  it('accetta minuscole e spazi', () => {
    const codice = cf('RSSMRA12C15F205')
    expect(analizzaCf(` ${codice.toLowerCase().slice(0, 8)} ${codice.slice(8)} `, OGGI).stato).toBe('valido')
  })

  it('rifiuta un carattere di controllo errato', () => {
    const codice = cf('RSSMRA12C15F205')
    const sbagliato = codice.slice(0, 15) + (codice[15] === 'A' ? 'B' : 'A')
    expect(analizzaCf(sbagliato, OGGI).stato).toBe('non_valido')
  })

  it('rifiuta lunghezza errata e date impossibili', () => {
    expect(analizzaCf('RSSMRA12C15F20', OGGI).stato).toBe('non_valido')
    expect(analizzaCf(cf('RSSMRA12B31F205'), OGGI).stato).toBe('non_valido') // 31 febbraio
  })

  it('accetta senza decodificare i codici provvisori non standard', () => {
    expect(analizzaCf('ABCD123456789012', OGGI).stato).toBe('non_standard')
  })

  it('vuoto', () => {
    expect(analizzaCf('  ', OGGI).stato).toBe('vuoto')
  })
})

describe('carattereControllo', () => {
  it('coincide con il codice di esempio pubblico dell’Agenzia delle Entrate', () => {
    // Esempio largamente documentato: RSSMRA85T10A562S
    expect(carattereControllo('RSSMRA85T10A562')).toBe('S')
  })
})
