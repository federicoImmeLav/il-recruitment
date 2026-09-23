import { useQuery } from '@tanstack/react-query'
import paesiJson from '../data/paesi.json'

// Elenchi pubblici generati da scripts/genera-dati-riferimento.mjs (ISTAT, MIUR).
// Comuni e scuole sono caricati solo quando servono (import dinamico): pesano
// qualche centinaio di KB e servono solo al kiosk MDI e all'export.

export interface Comune {
  nome: string
  prov: string
  codice: string
}
export interface Paese {
  nome: string
  codice: string | null
}
export interface Scuola {
  codice: string
  nome: string
  comune: string
}

export const ITALIA = 'Italia'

/** Paesi per cittadinanza / nascita all'estero; l'Italia (senza codice Z) in testa. */
export const PAESI: Paese[] = [
  { nome: ITALIA, codice: null },
  ...(paesiJson as [string, string][]).map(([nome, codice]) => ({ nome, codice })),
]

export function paesePerCodice(codice: string) {
  return PAESI.find((p) => p.codice === codice)
}

/** Minuscolo, senza accenti e apostrofi/trattini, per confronti tolleranti. */
export function normalizza(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’`.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function caricaComuni(): Promise<Comune[]> {
  const { default: righe } = await import('../data/comuni.json')
  return (righe as [string, string, string][]).map(([nome, prov, codice]) => ({ nome, prov, codice }))
}

async function caricaScuole(): Promise<Scuola[]> {
  const { default: righe } = await import('../data/scuole-medie-lombardia.json')
  return (righe as [string, string, string][]).map(([codice, nome, comune]) => ({ codice, nome, comune }))
}

export function useComuni() {
  return useQuery({ queryKey: ['riferimenti', 'comuni'], queryFn: caricaComuni, staleTime: Infinity, gcTime: Infinity })
}

export function useScuoleMedie() {
  return useQuery({ queryKey: ['riferimenti', 'scuole'], queryFn: caricaScuole, staleTime: Infinity, gcTime: Infinity })
}

/** Ricerca per nome: prima chi inizia col testo digitato, poi chi lo contiene. */
export function cercaComuni(comuni: Comune[], testo: string, max = 8) {
  const q = normalizza(testo)
  if (q.length < 2) return []
  const inizio: Comune[] = []
  const contiene: Comune[] = []
  for (const c of comuni) {
    const n = normalizza(c.nome)
    if (n.startsWith(q)) inizio.push(c)
    else if (n.includes(q)) contiene.push(c)
    if (inizio.length >= max) break
  }
  return [...inizio, ...contiene].slice(0, max)
}

/** Ricerca scuole per nome, codice meccanografico o comune (tutte le parole devono comparire). */
export function cercaScuole(scuole: Scuola[], testo: string, max = 10) {
  const parole = normalizza(testo).split(' ').filter(Boolean)
  if (parole.join('').length < 3) return []
  const out: Scuola[] = []
  for (const s of scuole) {
    const t = normalizza(`${s.nome} ${s.codice} ${s.comune}`)
    if (parole.every((p) => t.includes(p))) out.push(s)
    if (out.length >= max) break
  }
  return out
}
