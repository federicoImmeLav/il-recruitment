import type { Booking, Corso, Mdi } from '../../types/database.types'

// Dopo un Open Day: chi tra gli iscritti non si e' presentato e chi e' venuto
// ma non ha compilato la MDI, per richiamarli.
//
// Una MDI conta per un iscritto se ne porta il booking_id (scelto dalla ricerca
// del kiosk) oppure, se compilata senza sceglierlo, per stesso cognome e nome
// (e stessa data di nascita, quando l'iscrizione la riporta). Chi ha la MDI
// conta come presente anche senza check-in.

export type MotivoRicontatto = 'non_presentato' | 'senza_mdi'

export const MOTIVO_RICONTATTO_LABEL: Record<MotivoRicontatto, string> = {
  non_presentato: 'Non presentato',
  senza_mdi: 'Presente senza MDI',
}

export interface DaRicontattare {
  booking: Booking
  motivo: MotivoRicontatto
}

const norm = (s: string | null | undefined) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/gi, '')
    .toLowerCase()

const chiave = (cognome: string, nome: string) => `${norm(cognome)}|${norm(nome)}`

/** Iscritti attivi (confermati, walk-in, lista d'attesa) da ricontattare, in ordine alfabetico. */
export function daRicontattare(bookings: Booking[], mdi: Mdi[]): DaRicontattare[] {
  const conBooking = new Set(mdi.map((m) => m.booking_id).filter(Boolean))
  const senzaBooking = new Map<string, Mdi[]>()
  for (const m of mdi.filter((m) => !m.booking_id)) {
    const k = chiave(m.all_cognome, m.all_nome)
    senzaBooking.set(k, [...(senzaBooking.get(k) ?? []), m])
  }
  const haMdi = (b: Booking) =>
    conBooking.has(b.id) ||
    (senzaBooking.get(chiave(b.cognome, b.nome)) ?? []).some(
      (m) => !b.data_nascita || m.all_data_nascita?.slice(0, 10) === b.data_nascita.slice(0, 10),
    )

  return bookings
    .filter((b) => ['confirmed', 'walk_in', 'waitlist'].includes(b.status))
    .filter((b) => !haMdi(b))
    .map((b): DaRicontattare => ({ booking: b, motivo: b.checked_in ? 'senza_mdi' : 'non_presentato' }))
    .sort((a, b) => `${a.booking.cognome} ${a.booking.nome}`.localeCompare(`${b.booking.cognome} ${b.booking.nome}`, 'it'))
}

/** Valore CSV tra virgolette (raddoppiate quelle interne). */
const cella = (v: string | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`

/**
 * CSV per Excel in italiano: separatore ";", BOM UTF-8 (accenti corretti), righe CRLF.
 * Telefono come testo, cosi' Excel non toglie lo zero/il "+" iniziale.
 */
export function csvDaRicontattare(righe: DaRicontattare[], corsi: Pick<Corso, 'id' | 'nome'>[]) {
  const nomeCorso = (id: string | null) => corsi.find((c) => c.id === id)?.nome ?? ''
  const intestazione = ['Motivo', 'Cognome', 'Nome', 'Telefono', 'Email', 'Accompagnatore', 'Scuola', 'Classe', 'Indirizzo']
  const linee = righe.map(({ booking: b, motivo }) =>
    [
      cella(MOTIVO_RICONTATTO_LABEL[motivo]),
      cella(b.cognome),
      cella(b.nome),
      `="${b.telefono.replace(/"/g, '')}"`,
      cella(b.email),
      cella([b.acc_cognome, b.acc_nome].filter(Boolean).join(' ')),
      cella(b.scuola),
      cella(b.classe),
      cella(nomeCorso(b.corso_id)),
    ].join(';'),
  )
  return '﻿' + [intestazione.map(cella).join(';'), ...linee].join('\r\n') + '\r\n'
}
