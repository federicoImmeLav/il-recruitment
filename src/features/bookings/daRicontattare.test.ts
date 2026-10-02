import { describe, expect, it } from 'vitest'
import type { Booking, Mdi } from '../../types/database.types'
import { csvDaRicontattare, daRicontattare } from './daRicontattare'

// Dati inventati.
const b = (id: string, cognome: string, nome: string, extra: Partial<Booking> = {}) =>
  ({ id, cognome, nome, telefono: '0212345', status: 'confirmed', checked_in: false, data_nascita: null, ...extra }) as Booking
const m = (cognome: string, nome: string, extra: Partial<Mdi> = {}) =>
  ({ id: `m-${cognome}`, booking_id: null, all_cognome: cognome, all_nome: nome, all_data_nascita: '2012-01-01', ...extra }) as Mdi

describe('daRicontattare', () => {
  it('separa non presentati e presenti senza MDI, escludendo chi ha la MDI', () => {
    const bookings = [
      b('1', 'Rossi', 'Anna'),
      b('2', 'Verdi', 'Luca', { checked_in: true }),
      b('3', 'Bianchi', 'Sara', { checked_in: true }),
      b('4', 'Neri', 'Paolo'),
    ]
    const r = daRicontattare(bookings, [m('Bianchi', 'Sara', { booking_id: '3' }), m('Neri', 'Paolo', { booking_id: '4' })])
    expect(r.map((x) => [x.booking.cognome, x.motivo])).toEqual([
      ['Rossi', 'non_presentato'],
      ['Verdi', 'senza_mdi'],
    ])
  })

  it('abbina la MDI senza iscrizione per nome, ignorando maiuscole, accenti e spazi', () => {
    const r = daRicontattare([b('1', "D'Amico", 'Niccolò', { checked_in: true })], [m('DAMICO', ' niccolo ')])
    expect(r).toEqual([])
  })

  it('con la data di nascita nell’iscrizione, il nome da solo non basta', () => {
    const iscr = b('1', 'Rossi', 'Anna', { data_nascita: '2012-05-05' })
    expect(daRicontattare([iscr], [m('Rossi', 'Anna')])).toHaveLength(1)
    expect(daRicontattare([iscr], [m('Rossi', 'Anna', { all_data_nascita: '2012-05-05' })])).toHaveLength(0)
  })

  it('ignora annullati, rifiutati e da approvare', () => {
    const r = daRicontattare(
      [b('1', 'A', 'A', { status: 'cancelled' }), b('2', 'B', 'B', { status: 'rejected' }), b('3', 'C', 'C', { status: 'pending' })],
      [],
    )
    expect(r).toEqual([])
  })
})

describe('csvDaRicontattare', () => {
  it('produce un CSV per Excel con BOM, ";" e telefono come testo', () => {
    const csv = csvDaRicontattare(daRicontattare([b('1', 'Rossi', 'Anna "Annina"', { corso_id: 'c1' })], []), [
      { id: 'c1', nome: 'Cucina' },
    ])
    expect(csv.startsWith('﻿"Motivo";"Cognome"')).toBe(true)
    expect(csv).toContain('"Non presentato";"Rossi";"Anna ""Annina""";="0212345";"";"";"";"";"Cucina"\r\n')
  })
})
