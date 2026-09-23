import { Badge } from '../../components/ui/Badge'
import { useAggiornaNotifica } from '../../hooks/useNotifiche'
import { TIPO_NOTIFICA_LABEL } from '../../lib/constants'
import { linkWhatsapp } from '../../lib/messaggi'
import type { Booking, Notifica } from '../../types/database.types'

const CANALE_BREVE: Record<Notifica['canale'], string> = {
  email: 'email',
  whatsapp_manuale: 'WhatsApp',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
}

function statoBadge(n: Notifica) {
  switch (n.stato) {
    case 'inviata':
      return <Badge color="green">✓ inviata</Badge>
    case 'in_coda':
      return <Badge color="blue">in invio…</Badge>
    case 'manuale':
      return <Badge color="orange">da inviare a mano</Badge>
    default:
      return <Badge color="red">errore</Badge>
  }
}

/** Stato delle notifiche di un'iscrizione, con invio WhatsApp manuale e "riprova". */
export function NotificheIscrizione({ booking, notifiche }: { booking: Booking; notifiche: Notifica[] }) {
  const aggiorna = useAggiornaNotifica()
  if (notifiche.length === 0) return null

  return (
    <ul className="mt-2 space-y-1.5">
      {notifiche.map((n) => {
        const whatsappPossibile = n.stato === 'manuale' || n.stato === 'errore'
        return (
          <li key={n.id} className="flex flex-wrap items-center gap-2 text-xs text-text2">
            <span className="font-bold">
              {TIPO_NOTIFICA_LABEL[n.tipo]} via {CANALE_BREVE[n.canale]}
            </span>
            {statoBadge(n)}
            {n.stato === 'errore' && n.errore && (
              <span className="text-red" title={n.errore}>
                {n.errore.length > 60 ? `${n.errore.slice(0, 60)}…` : n.errore}
              </span>
            )}
            {whatsappPossibile && (
              <a
                href={linkWhatsapp(booking.telefono, n.testo)}
                target="_blank"
                rel="noreferrer"
                onClick={() => void aggiorna.mutateAsync({ notifica: n, azione: 'inviata' })}
                className="rounded-md bg-[#25D366] px-2 py-1 font-bold text-white hover:opacity-90"
              >
                Invia su WhatsApp
              </a>
            )}
            {n.stato === 'errore' && n.canale !== 'whatsapp_manuale' && (
              <button
                type="button"
                disabled={aggiorna.isPending}
                onClick={() => void aggiorna.mutateAsync({ notifica: n, azione: 'riprova' })}
                className="font-bold text-blue hover:underline disabled:opacity-50"
              >
                Riprova
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
