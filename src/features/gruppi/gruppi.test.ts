import { describe, expect, it } from 'vitest'
import type { Booking, Corso } from '../../types/database.types'
import { cambiIndirizzo, raggruppaPerIndirizzo, riepilogoIndirizzi } from './gruppi'

const corso = (id: string, nome: string, ordine: number): Corso => ({
  id,
  nome,
  qualifica: nome,
  ordine,
  attivo: true,
  codice_ministeriale: null,
})
const cucina = corso('c-cucina', 'Cucina', 1)
const estetica = corso('c-estetica', 'Estetica', 2)
const grafica = corso('c-grafica', 'Grafica', 3)
const corsi = [cucina, estetica, grafica]

// Dati inventati.
let n = 0
function iscritto(cognome: string, corsoId: string | null, extra: Partial<Booking> = {}): Booking {
  n++
  return {
    id: `b${n}`,
    open_day_id: 'od1',
    edizione_id: 'ed1',
    cognome,
    nome: 'Test',
    data_nascita: null,
    scuola: null,
    classe: null,
    residenza: null,
    telefono: '3330000000',
    email: null,
    corso_id: corsoId,
    corso2_id: null,
    corso_iniziale_id: corsoId,
    canale: 'online',
    status: 'confirmed',
    flag_seconda_media: false,
    checked_in: false,
    checked_in_at: null,
    registered_at: '',
    note_staff: null,
    google_response_id: null,
    acc_cognome: null,
    acc_nome: null,
    decisione_at: null,
    decisione_by: null,
    motivo_rifiuto: null,
    created_at: '',
    updated_at: '',
    ...extra,
  }
}

const indirizzi = [
  { corso: cucina, posti_max: 10 },
  { corso: estetica, posti_max: null },
]

describe('raggruppaPerIndirizzo', () => {
  const bookings = [
    iscritto('Verdi', cucina.id, { checked_in: true }),
    iscritto('Abate', cucina.id),
    iscritto('Neri', grafica.id, { checked_in: true }),
    iscritto('Rosa', null),
    iscritto('Scartato', cucina.id, { status: 'rejected' }),
    iscritto('Attesa', estetica.id, { status: 'pending' }),
  ]

  it('mette prima gli indirizzi configurati, poi quelli fuori configurazione e i senza indirizzo', () => {
    const gruppi = raggruppaPerIndirizzo(bookings, indirizzi, corsi)
    expect(gruppi.map((g) => g.nome)).toEqual(['Cucina', 'Estetica', 'Grafica', 'Senza indirizzo'])
    expect(gruppi[0].membri.map((b) => b.cognome)).toEqual(['Abate', 'Verdi'])
    expect(gruppi[0].posti_max).toBe(10)
    expect(gruppi[1].membri).toEqual([])
    expect(gruppi[2].fuoriConfigurazione).toBe(true)
  })

  it('con soloPresenti tiene solo chi ha fatto il check-in', () => {
    const gruppi = raggruppaPerIndirizzo(bookings, indirizzi, corsi, { soloPresenti: true })
    expect(gruppi.map((g) => [g.nome, g.membri.length])).toEqual([
      ['Cucina', 1],
      ['Estetica', 0],
      ['Grafica', 1],
    ])
  })
})

describe('riepilogoIndirizzi e cambiIndirizzo', () => {
  const bookings = [
    iscritto('Bassi', estetica.id, { corso_iniziale_id: cucina.id, checked_in: true }),
    iscritto('Conti', cucina.id, { checked_in: true }),
    iscritto('Dori', grafica.id, { corso_iniziale_id: grafica.id }),
    iscritto('Elia', estetica.id, { corso_iniziale_id: grafica.id }),
  ]

  it('conta iniziali, attuali, presenti, entrati e usciti per indirizzo', () => {
    const righe = riepilogoIndirizzi(bookings, indirizzi, corsi)
    const perNome = Object.fromEntries(righe.map((r) => [r.nome, r]))
    expect(perNome.Cucina).toMatchObject({ iniziali: 2, iscritti: 1, presenti: 1, entrati: 0, usciti: 1 })
    expect(perNome.Estetica).toMatchObject({ iniziali: 0, iscritti: 2, presenti: 1, entrati: 2, usciti: 0 })
    expect(perNome.Grafica).toMatchObject({ iniziali: 2, iscritti: 1, entrati: 0, usciti: 1, fuoriConfigurazione: true })
  })

  it("mostra anche l'indirizzo da cui sono usciti tutti", () => {
    const righe = riepilogoIndirizzi([iscritto('Fabi', cucina.id, { corso_iniziale_id: grafica.id })], indirizzi, corsi)
    expect(righe.find((r) => r.nome === 'Grafica')).toMatchObject({ iniziali: 1, iscritti: 0, usciti: 1 })
  })

  it('elenca i cambi da → a in ordine alfabetico', () => {
    expect(cambiIndirizzo(bookings, corsi).map((c) => `${c.booking.cognome}: ${c.da} → ${c.a}`)).toEqual([
      'Bassi: Cucina → Estetica',
      'Elia: Grafica → Estetica',
    ])
  })
})
