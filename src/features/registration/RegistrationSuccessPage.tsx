import { useLocation, useParams } from 'react-router-dom'
import { Icon } from '../../components/ui/Icon'
import { PublicLayout } from '../../components/layout/PublicLayout'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

export function RegistrationSuccessPage() {
  const { openDayId } = useParams<{ openDayId: string }>()
  const location = useLocation()
  const status = (location.state as { status?: string } | null)?.status

  const isWaitlist = status === 'waitlist'

  return (
    <PublicLayout>
      <Card className="flex flex-col items-center text-center">
        <span
          className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
            isWaitlist ? 'bg-warning-container text-on-warning-container' : 'bg-success-container text-on-success-container'
          }`}
        >
          <Icon name={isWaitlist ? 'hourglass_top' : 'check_circle'} size={36} filled />
        </span>
        <h1 className="text-headline-s text-on-surface">
          {isWaitlist ? 'Sei in lista d’attesa' : 'Iscrizione confermata!'}
        </h1>
        <p className="mt-2 text-body-l text-on-surface-variant">
          {isWaitlist
            ? 'I posti disponibili sono esauriti: ti contatteremo se si libererà un posto.'
            : 'Ti aspettiamo all’Open Day. Riceverai eventuali comunicazioni ai contatti forniti.'}
        </p>
        <Button to={`/mdi/kiosk/${openDayId}`} icon="edit_note" className="mt-6">
          Compila la Manifestazione di Interesse
        </Button>
      </Card>
    </PublicLayout>
  )
}
