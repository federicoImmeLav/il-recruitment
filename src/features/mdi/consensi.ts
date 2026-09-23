// Testi dei consensi e delle dichiarazioni del modulo MDI (vecchio kiosk v5).

export const TITOLARE_FIRMA = 'Cristiana Poggio — Presidente'

export function testoDichiarazioneSingoloGenitore(accompagnatore: string) {
  return `Il sottoscritto, ${accompagnatore}, consapevole delle conseguenze amministrative e penali per chi rilasci dichiarazioni non corrispondenti a verità, ai sensi del DPR 245/2000, dichiara di aver effettuato la scelta/richiesta in osservanza delle disposizioni sulla responsabilità genitoriale di cui agli artt. 316, 337 ter e 337 quater del codice civile, che richiedono il consenso di entrambi i genitori.`
}

export const CONSENSI_PRIVACY = [
  {
    key: 'consenso_privacy_a',
    lettera: 'A)',
    testo: 'Consenso al trattamento dei dati personali e sensibili per le finalità istituzionali indicate nell’informativa.',
  },
  {
    key: 'consenso_privacy_b',
    lettera: 'B)',
    testo: 'Consenso al trattamento per finalità di comunicazione commerciale (newsletter, materiale promozionale).',
  },
] as const

export const CONSENSI_FOTO = [
  {
    key: 'consenso_foto_realizzare',
    verbo: 'realizzare',
    testo: 'fotografie, video o altri materiali audiovisivi contenenti l’immagine, il nome, la voce di mia/o figlia/o.',
    prep: 'a',
  },
  {
    key: 'consenso_foto_utilizzare',
    verbo: 'utilizzare',
    testo: 'il materiale contenente l’immagine, il nome e/o la voce di mia/o figlia/o a scopo promozionale.',
    prep: 'ad',
  },
  {
    key: 'consenso_foto_comunicare',
    verbo: 'comunicare',
    testo: 'il materiale contenente l’immagine, il nome e/o la voce di mia/o figlia/o a scopo promozionale.',
    prep: 'a',
  },
] as const
