import type { Impostazioni, OpenDay } from '../types/database.types'

// Specchio lato client di public.componi_messaggio() (0006_google_forms_notifiche.sql):
// usato per l'anteprima dei testi nella pagina Impostazioni e dal mock demo.
// I messaggi veri vengono sempre composti dal database.

const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']

export const SEGNAPOSTO = ['{nome}', '{cognome}', '{data}', '{ora}', '{luogo}', '{indicazioni}', '{motivo}', '{contatti}']

export function componiMessaggio(
  testo: string,
  booking: { nome: string; cognome: string },
  openDay: Pick<OpenDay, 'data' | 'ora' | 'luogo_override'>,
  imp: Pick<Impostazioni, 'luogo_predefinito' | 'indicazioni_predefinite' | 'contatti'>,
  motivo?: string | null,
) {
  const [y, m, d] = openDay.data.split('-').map(Number)
  const giorno = GIORNI[new Date(y, m - 1, d).getDay()]
  const override = openDay.luogo_override?.trim()
  const valori: Record<string, string> = {
    '{nome}': booking.nome,
    '{cognome}': booking.cognome,
    '{data}': `${giorno} ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`,
    '{ora}': openDay.ora.slice(0, 5),
    '{luogo}': override || imp.luogo_predefinito,
    '{indicazioni}': override ? '' : imp.indicazioni_predefinite,
    '{motivo}': motivo?.trim() ?? '',
    '{contatti}': imp.contatti,
  }
  return Object.entries(valori)
    .reduce((t, [k, v]) => t.split(k).join(v), testo)
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Numero italiano in formato internazionale senza "+", es. 393331234567 (come in _shared/canali.ts). */
export function telefonoInternazionale(numero: string) {
  let n = numero.replace(/[^\d+]/g, '')
  if (n.startsWith('+')) n = n.slice(1)
  else if (n.startsWith('00')) n = n.slice(2)
  else if (/^3\d{8,9}$/.test(n)) n = `39${n}`
  return n
}

/** Link "click to chat": apre WhatsApp con il messaggio gia' scritto (invio gratuito, a mano). */
export function linkWhatsapp(numero: string, testo: string) {
  return `https://wa.me/${telefonoInternazionale(numero)}?text=${encodeURIComponent(testo)}`
}
