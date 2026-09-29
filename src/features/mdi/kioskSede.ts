import { createContext, useContext } from 'react'
import type { Citta, Corso, SedePublic } from '../../types/database.types'

/**
 * Sede del kiosk (dal link /mdi/kiosk/sede/<slug> o dall'Open Day), condivisa
 * dai passi della MDI: ricerca iscritti, scuole della regione, corsi proponibili.
 */
export interface KioskSede {
  sede: SedePublic
  citta: Citta | undefined
  /** Corsi attivi della sede: la 1ª preferenza si sceglie solo tra questi. */
  corsiSede: Corso[]
  /** Corsi attivi delle altre sedi della stessa città, per la 2ª e 3ª preferenza. */
  altreSedi: { sede: SedePublic; corsi: Corso[] }[]
}

export const KioskSedeContext = createContext<KioskSede | null>(null)

export function useKioskSede() {
  const ctx = useContext(KioskSedeContext)
  if (!ctx) throw new Error('useKioskSede deve essere usato dentro il kiosk MDI')
  return ctx
}

/** "Milano, il …": luogo della sede se impostato, altrimenti la città. */
export function luogoFirma({ sede, citta }: Pick<KioskSede, 'sede' | 'citta'>) {
  return sede.luogo_firma?.trim() || citta?.nome || sede.nome
}
