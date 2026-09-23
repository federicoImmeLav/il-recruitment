import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
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
      return <Badge color="success">inviata</Badge>
    case 'in_coda':
      return <Badge color="tertiary">in invio…</Badge>
    case 'manuale':
      return <Badge color="warning">da inviare a mano</Badge>
    default:
      return <Badge color="error">errore</Badge>
  }
}

/** Stato delle notifiche di un'iscrizione, con invio WhatsApp manuale e "riprova". */
export function NotificheIscrizione({ booking, notifiche }: { booking: Booking; notifiche: Notifica[] }) {
  const aggiorna = useAggiornaNotifica()
  if (notifiche.length === 0) return null

  return (
    <ul className="mt-2 space-y-1">
      {notifiche.map((n) => {
        const whatsappPossibile = n.stato === 'manuale' || n.stato === 'errore'
        return (
          <li key={n.id} className="flex flex-wrap items-center gap-2 text-body-s text-on-surface-variant">
            <span className="text-label-m">
              {TIPO_NOTIFICA_LABEL[n.tipo]} via {CANALE_BREVE[n.canale]}
            </span>
            {statoBadge(n)}
            {n.stato === 'errore' && n.errore && (
              <span className="text-error" title={n.errore}>
                {n.errore.length > 60 ? `${n.errore.slice(0, 60)}…` : n.errore}
              </span>
            )}
            {whatsappPossibile && (
              <Button
                href={linkWhatsapp(booking.telefono, n.testo)}
                target="_blank"
                rel="noreferrer"
                icon="chat"
                className="!bg-whatsapp !text-on-whatsapp"
                onClick={() => void aggiorna.mutateAsync({ notifica: n, azione: 'inviata' })}
              >
                Invia su WhatsApp
              </Button>
            )}
            {n.stato === 'errore' && n.canale !== 'whatsapp_manuale' && (
              <Button
                variant="text"
                icon="refresh"
                disabled={aggiorna.isPending}
                onClick={() => void aggiorna.mutateAsync({ notifica: n, azione: 'riprova' })}
              >
                Riprova
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
