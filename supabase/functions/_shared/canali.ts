// Adattatori di invio per canale. Aggiungere/attivare un canale = implementare
// qui la funzione e impostare i relativi secret, senza toccare il resto.
//
// Secret usati (supabase secrets set ...):
//   BREVO_API_KEY               chiave API Brevo (email; anche SMS se attivati)
//   NOTIFICHE_MITTENTE_EMAIL    mittente verificato su Brevo
//   NOTIFICHE_MITTENTE_NOME     (facoltativo) nome mittente, default "Immaginazione e Lavoro"
//   BREVO_SMS_SENDER            (facoltativo) mittente SMS: se assente il canale SMS e' spento

export interface NotificaDaInviare {
  id: string
  canale: 'email' | 'sms' | 'whatsapp' | 'whatsapp_manuale'
  destinatario: string
  oggetto: string
  testo: string
}

/** Esito: ok, oppure errore con messaggio leggibile dallo staff. */
export type EsitoInvio = { ok: true } | { ok: false; errore: string; definitivo: boolean }

/** Numero italiano in formato internazionale senza "+", es. 393331234567. */
export function telefonoInternazionale(numero: string) {
  let n = numero.replace(/[^\d+]/g, '')
  if (n.startsWith('+')) n = n.slice(1)
  else if (n.startsWith('00')) n = n.slice(2)
  else if (/^3\d{8,9}$/.test(n)) n = `39${n}`
  return n
}

async function brevo(path: string, body: unknown): Promise<EsitoInvio> {
  const apiKey = Deno.env.get('BREVO_API_KEY')
  if (!apiKey) return { ok: false, errore: 'Canale non configurato (manca BREVO_API_KEY)', definitivo: true }
  const res = await fetch(`https://api.brevo.com/v3/${path}`, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.ok) return { ok: true }
  const dettaglio = await res.text()
  // 4xx (dati errati, indirizzo non valido...) non si risolvono ritentando.
  return { ok: false, errore: `Brevo ${res.status}: ${dettaglio.slice(0, 300)}`, definitivo: res.status < 500 && res.status !== 429 }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

async function inviaEmail(n: NotificaDaInviare): Promise<EsitoInvio> {
  const mittente = Deno.env.get('NOTIFICHE_MITTENTE_EMAIL')
  if (!mittente) return { ok: false, errore: 'Canale non configurato (manca NOTIFICHE_MITTENTE_EMAIL)', definitivo: true }
  return brevo('smtp/email', {
    sender: { email: mittente, name: Deno.env.get('NOTIFICHE_MITTENTE_NOME') ?? 'Immaginazione e Lavoro' },
    to: [{ email: n.destinatario }],
    subject: n.oggetto,
    textContent: n.testo,
    htmlContent: `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5">${escapeHtml(n.testo)}</p>`,
  })
}

async function inviaSms(n: NotificaDaInviare): Promise<EsitoInvio> {
  const sender = Deno.env.get('BREVO_SMS_SENDER')
  if (!sender) return { ok: false, errore: 'Canale SMS non attivo (manca BREVO_SMS_SENDER)', definitivo: true }
  return brevo('transactionalSMS/sms', {
    sender,
    recipient: telefonoInternazionale(n.destinatario),
    content: n.testo,
    type: 'transactional',
  })
}

async function inviaWhatsapp(_n: NotificaDaInviare): Promise<EsitoInvio> {
  // WhatsApp automatico richiede un account WhatsApp Business e modelli di
  // messaggio approvati da Meta (a pagamento). Predisposto ma non attivo:
  // nel frattempo lo staff puo' usare il pulsante "Invia su WhatsApp".
  return { ok: false, errore: 'WhatsApp automatico non ancora attivo: usa "Invia su WhatsApp"', definitivo: true }
}

export async function invia(n: NotificaDaInviare): Promise<EsitoInvio> {
  switch (n.canale) {
    case 'email':
      return inviaEmail(n)
    case 'sms':
      return inviaSms(n)
    case 'whatsapp':
      return inviaWhatsapp(n)
    default:
      return { ok: false, errore: 'Da inviare manualmente', definitivo: true }
  }
}
