// Codice fiscale delle persone fisiche: validazione del carattere di controllo e
// decodifica di sesso, data e luogo di nascita (codice catastale del comune, o
// "Zxxx" per i nati all'estero). Gestisce l'omocodia.

const MESI = 'ABCDEHLMPRST'
const OMOCODIA = 'LMNPQRSTUV' // sostituti delle cifre 0-9
const POSIZIONI_NUMERICHE = [6, 7, 9, 10, 12, 13, 14]
const DISPARI = [1, 0, 5, 7, 9, 13, 15, 17, 19, 21, 2, 4, 18, 20, 11, 3, 6, 8, 12, 14, 16, 10, 22, 25, 24, 23]

/** Forma standard: 6 lettere, 2 cifre, lettera mese, 2 cifre, lettera + 3 cifre, controllo (cifre anche omocodiche). */
const FORMA_STANDARD = /^[A-Z]{6}[\dLMNPQRSTUV]{2}[ABCDEHLMPRST][\dLMNPQRSTUV]{2}[A-Z][\dLMNPQRSTUV]{3}[A-Z]$/

export function normalizzaCf(cf: string) {
  return cf.replace(/\s/g, '').toUpperCase()
}

function valore(c: string) {
  return /\d/.test(c) ? Number(c) : c.charCodeAt(0) - 65
}

export function carattereControllo(primi15: string) {
  let somma = 0
  for (let i = 0; i < 15; i++) {
    const v = valore(primi15[i])
    // Posizioni dispari (1ª, 3ª, …) = indici pari.
    somma += i % 2 === 0 ? DISPARI[v] : v
  }
  return String.fromCharCode(65 + (somma % 26))
}

/** Toglie l'omocodia nelle posizioni numeriche (L→0, M→1, …). */
function deomocodia(cf: string) {
  const c = cf.split('')
  for (const p of POSIZIONI_NUMERICHE) {
    const i = OMOCODIA.indexOf(c[p])
    if (i >= 0) c[p] = String(i)
  }
  return c.join('')
}

export type EsitoCf =
  | { stato: 'vuoto' }
  | { stato: 'valido'; cf: string; sesso: 'M' | 'F'; dataNascita: string; codiceLuogo: string; estero: boolean }
  /** 16 caratteri ma non nella forma standard (es. codici provvisori): accettato senza decodifica. */
  | { stato: 'non_standard'; cf: string }
  | { stato: 'non_valido'; cf: string; motivo: string }

export function analizzaCf(input: string, oggi = new Date()): EsitoCf {
  const cf = normalizzaCf(input)
  if (!cf) return { stato: 'vuoto' }
  if (cf.length !== 16 || !/^[A-Z0-9]+$/.test(cf)) {
    return { stato: 'non_valido', cf, motivo: 'Il codice fiscale deve avere 16 caratteri (lettere e cifre)' }
  }
  if (!FORMA_STANDARD.test(cf)) return { stato: 'non_standard', cf }
  if (carattereControllo(cf.slice(0, 15)) !== cf[15]) {
    return { stato: 'non_valido', cf, motivo: 'Codice fiscale non valido: controlla di averlo scritto correttamente' }
  }

  const d = deomocodia(cf)
  const aa = Number(d.slice(6, 8))
  const mese = MESI.indexOf(d[8]) + 1
  const gg = Number(d.slice(9, 11))
  const sesso = gg > 40 ? 'F' : 'M'
  const giorno = gg > 40 ? gg - 40 : gg
  const secolo = 2000 + aa > oggi.getFullYear() ? 1900 : 2000
  const anno = secolo + aa
  const data = new Date(anno, mese - 1, giorno)
  if (giorno < 1 || data.getMonth() !== mese - 1) {
    return { stato: 'non_valido', cf, motivo: 'Codice fiscale non valido: la data di nascita non esiste' }
  }
  const codiceLuogo = d.slice(11, 15)
  return {
    stato: 'valido',
    cf,
    sesso,
    dataNascita: `${anno}-${String(mese).padStart(2, '0')}-${String(giorno).padStart(2, '0')}`,
    codiceLuogo,
    estero: codiceLuogo.startsWith('Z'),
  }
}
