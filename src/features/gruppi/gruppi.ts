// Logica dei gruppi d'interesse di un Open Day. Il gruppo coincide con
// l'indirizzo attuale dell'iscritto (`bookings.corso_id`); `corso_iniziale_id`
// e' quello scelto all'iscrizione e serve a vedere chi ha cambiato idea.

import type { Booking, Corso } from '../../types/database.types'
import type { IndirizzoOpenDay } from '../../hooks/useOpenDayCorsi'

/** Iscrizioni che contano nei gruppi: confermate, walk-in e lista d'attesa (esclusi da approvare, rifiutati, annullati). */
export function inGruppo(b: Booking) {
  return b.status === 'confirmed' || b.status === 'walk_in' || b.status === 'waitlist'
}

export type Gruppo = {
  /** null = iscritti senza indirizzo indicato. */
  corsoId: string | null
  nome: string
  posti_max: number | null
  /** Indirizzo non tra quelli configurati per l'Open Day (es. scelto nel Google Modulo). */
  fuoriConfigurazione: boolean
  membri: Booking[]
}

const SENZA_INDIRIZZO = 'Senza indirizzo'

function nomeCorso(corsi: Corso[], id: string | null) {
  if (!id) return SENZA_INDIRIZZO
  return corsi.find((c) => c.id === id)?.nome ?? 'Indirizzo non più attivo'
}

/**
 * Colonne della board: prima gli indirizzi configurati (anche vuoti, nell'ordine
 * dell'Open Day), poi quelli fuori configurazione che hanno membri, infine
 * "Senza indirizzo" se serve. Membri in ordine alfabetico.
 */
export function raggruppaPerIndirizzo(
  bookings: Booking[],
  indirizzi: IndirizzoOpenDay[],
  corsi: Corso[],
  { soloPresenti = false }: { soloPresenti?: boolean } = {},
): Gruppo[] {
  const membri = bookings.filter((b) => inGruppo(b) && (!soloPresenti || b.checked_in))
  const gruppi: Gruppo[] = indirizzi.map((i) => ({
    corsoId: i.corso.id,
    nome: i.corso.nome,
    posti_max: i.posti_max,
    fuoriConfigurazione: false,
    membri: [],
  }))
  const perId = new Map(gruppi.map((g) => [g.corsoId, g]))
  const extra: Gruppo[] = []
  let senza: Gruppo | null = null

  for (const b of membri) {
    let g = perId.get(b.corso_id)
    if (!g) {
      if (b.corso_id === null) {
        senza ??= { corsoId: null, nome: SENZA_INDIRIZZO, posti_max: null, fuoriConfigurazione: false, membri: [] }
        g = senza
      } else {
        g = { corsoId: b.corso_id, nome: nomeCorso(corsi, b.corso_id), posti_max: null, fuoriConfigurazione: true, membri: [] }
        extra.push(g)
      }
      perId.set(b.corso_id, g)
    }
    g.membri.push(b)
  }

  const tutti = [...gruppi, ...extra.sort((a, b) => a.nome.localeCompare(b.nome, 'it')), ...(senza ? [senza] : [])]
  for (const g of tutti) {
    g.membri.sort((a, b) => `${a.cognome} ${a.nome}`.localeCompare(`${b.cognome} ${b.nome}`, 'it'))
  }
  return tutti
}

export type RigaRiepilogo = {
  corsoId: string | null
  nome: string
  posti_max: number | null
  fuoriConfigurazione: boolean
  /** Iscritti che all'iscrizione avevano scelto questo indirizzo. */
  iniziali: number
  /** Iscritti attualmente in questo indirizzo / gruppo. */
  iscritti: number
  presenti: number
  /** Arrivati da un altro indirizzo. */
  entrati: number
  /** Passati a un altro indirizzo. */
  usciti: number
}

/** Riepilogo per indirizzo: iscritti attuali vs iniziali, presenze, spostamenti. */
export function riepilogoIndirizzi(bookings: Booking[], indirizzi: IndirizzoOpenDay[], corsi: Corso[]): RigaRiepilogo[] {
  const attivi = bookings.filter(inGruppo)
  const gruppi = raggruppaPerIndirizzo(bookings, indirizzi, corsi)
  // Indirizzi da cui qualcuno e' uscito del tutto: devono comparire comunque.
  const noti = new Set(gruppi.map((g) => g.corsoId))
  for (const b of attivi) {
    const id = b.corso_iniziale_id
    if (!noti.has(id)) {
      noti.add(id)
      gruppi.push({
        corsoId: id,
        nome: nomeCorso(corsi, id),
        posti_max: null,
        fuoriConfigurazione: id !== null,
        membri: [],
      })
    }
  }

  return gruppi.map((g) => ({
    corsoId: g.corsoId,
    nome: g.nome,
    posti_max: g.posti_max,
    fuoriConfigurazione: g.fuoriConfigurazione,
    iniziali: attivi.filter((b) => b.corso_iniziale_id === g.corsoId).length,
    iscritti: g.membri.length,
    presenti: g.membri.filter((b) => b.checked_in).length,
    entrati: g.membri.filter((b) => b.corso_iniziale_id !== g.corsoId).length,
    usciti: attivi.filter((b) => b.corso_iniziale_id === g.corsoId && b.corso_id !== g.corsoId).length,
  }))
}

export type Cambio = { booking: Booking; da: string; a: string }

/** Chi ha cambiato indirizzo rispetto all'iscrizione, in ordine alfabetico. */
export function cambiIndirizzo(bookings: Booking[], corsi: Corso[]): Cambio[] {
  return bookings
    .filter((b) => inGruppo(b) && b.corso_iniziale_id !== b.corso_id)
    .map((b) => ({ booking: b, da: nomeCorso(corsi, b.corso_iniziale_id), a: nomeCorso(corsi, b.corso_id) }))
    .sort((x, y) =>
      `${x.booking.cognome} ${x.booking.nome}`.localeCompare(`${y.booking.cognome} ${y.booking.nome}`, 'it'),
    )
}
