import { Link, useLocation, useParams } from 'react-router-dom'
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
      <Card className="text-center">
        <h1 className="text-lg font-bold text-text">
          {isWaitlist ? 'Sei in lista d’attesa' : 'Iscrizione confermata!'}
        </h1>
        <p className="mt-2 text-sm text-text2">
          {isWaitlist
            ? 'I posti disponibili sono esauriti: ti contatteremo se si libererà un posto.'
            : 'Ti aspettiamo all’Open Day. Riceverai eventuali comunicazioni ai contatti forniti.'}
        </p>
        <Link to={`/mdi/kiosk/${openDayId}`} className="mt-6 inline-block">
          <Button variant="blue">Compila la Manifestazione di Interesse</Button>
        </Link>
      </Card>
    </PublicLayout>
  )
}
