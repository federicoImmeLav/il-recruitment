import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Dialog } from '../../components/ui/Dialog'
import { Icon } from '../../components/ui/Icon'
import { List } from '../../components/ui/List'
import { ErrorBanner } from '../../components/ui/Spinner'
import { TextareaField } from '../../components/ui/Field'
import { useSnackbar } from '../../components/ui/Snackbar'
import { useCorsi } from '../../hooks/useCorsi'
import { useDecidiIscrizione } from '../../hooks/useBookings'
import type { Booking } from '../../types/database.types'

function RifiutaModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const decidi = useDecidiIscrizione()
  const snackbar = useSnackbar()
  const [motivo, setMotivo] = useState('')

  async function conferma() {
    await decidi.mutateAsync({ booking, approva: false, motivo })
    snackbar(`Richiesta di ${booking.nome} rifiutata: famiglia avvisata`)
    onClose()
  }

  return (
    <Dialog
      title={`Rifiuta ${booking.cognome} ${booking.nome}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Annulla
          </Button>
          <Button variant="danger" disabled={decidi.isPending} onClick={() => void conferma()}>
            {decidi.isPending ? 'Invio…' : 'Rifiuta e avvisa la famiglia'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextareaField
          label="Motivo (facoltativo, compare nel messaggio)"
          rows={3}
          placeholder="es. I posti per questa data sono esauriti: vi proponiamo l'Open Day successivo."
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
        {decidi.error && <ErrorBanner message="Operazione non riuscita, riprova." />}
      </div>
    </Dialog>
  )
}

function RichiestaRow({ booking }: { booking: Booking }) {
  const decidi = useDecidiIscrizione()
  const snackbar = useSnackbar()
  const { data: corsi } = useCorsi()
  const [rifiuta, setRifiuta] = useState(false)
  const corso = (id: string | null) => corsi?.find((c) => c.id === id)?.nome

  const dettagli = [
    booking.scuola && `${booking.scuola}${booking.classe ? ` (${booking.classe})` : ''}`,
    [corso(booking.corso_id), corso(booking.corso2_id)].filter(Boolean).join(' / '),
    booking.acc_cognome && `Genitore: ${booking.acc_cognome} ${booking.acc_nome ?? ''}`.trim(),
  ].filter(Boolean)

  async function approva() {
    await decidi.mutateAsync({ booking, approva: true })
    snackbar(`Iscrizione di ${booking.nome} approvata: famiglia avvisata`)
  }

  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-title-s text-on-surface">
          {booking.cognome} {booking.nome}
        </p>
        <p className="text-body-m text-on-surface-variant">
          {booking.telefono}
          {booking.email ? ` · ${booking.email}` : ' · nessuna email (avviso via WhatsApp)'}
        </p>
        {dettagli.length > 0 && <p className="text-body-s text-on-surface-variant">{dettagli.join(' · ')}</p>}
        {booking.note_staff && <p className="text-body-s italic text-on-surface-variant">{booking.note_staff}</p>}
        {decidi.error && <p className="mt-1 text-body-s text-error">Operazione non riuscita, riprova.</p>}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outlined" icon="close" disabled={decidi.isPending} onClick={() => setRifiuta(true)}>
          Rifiuta
        </Button>
        <Button variant="success" icon="check" disabled={decidi.isPending} onClick={() => void approva()}>
          {decidi.isPending ? '…' : 'Approva'}
        </Button>
      </div>
      {rifiuta && <RifiutaModal booking={booking} onClose={() => setRifiuta(false)} />}
    </li>
  )
}

/** Richieste arrivate dal Google Modulo in attesa di approvazione (status 'pending'). */
export function RichiesteDaApprovare({ bookings }: { bookings: Booking[] }) {
  const richieste = bookings.filter((b) => b.status === 'pending')
  if (richieste.length === 0) return null

  return (
    <Card className="!border-warning/40 !bg-warning-container/30">
      <div className="flex items-center gap-2">
        <Icon name="pending_actions" className="text-on-warning-container" />
        <h2 className="text-title-m text-on-surface">Richieste da approvare ({richieste.length})</h2>
      </div>
      <p className="mt-1 text-body-m text-on-surface-variant">
        Approvando o rifiutando, la famiglia riceve subito un messaggio con esito, data, ora e luogo.
      </p>
      <List className="mt-2">
        {richieste.map((b) => (
          <RichiestaRow key={b.id} booking={b} />
        ))}
      </List>
    </Card>
  )
}
