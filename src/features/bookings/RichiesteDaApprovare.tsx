import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { ErrorBanner } from '../../components/ui/Spinner'
import { TextareaField } from '../../components/ui/Field'
import { useCorsi } from '../../hooks/useCorsi'
import { useDecidiIscrizione } from '../../hooks/useBookings'
import type { Booking } from '../../types/database.types'

function RifiutaModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const decidi = useDecidiIscrizione()
  const [motivo, setMotivo] = useState('')

  async function conferma() {
    await decidi.mutateAsync({ booking, approva: false, motivo })
    onClose()
  }

  return (
    <Modal
      title={`Rifiuta ${booking.cognome} ${booking.nome}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
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
    </Modal>
  )
}

function RichiestaRow({ booking }: { booking: Booking }) {
  const decidi = useDecidiIscrizione()
  const { data: corsi } = useCorsi()
  const [rifiuta, setRifiuta] = useState(false)
  const corso = (id: string | null) => corsi?.find((c) => c.id === id)?.nome

  const dettagli = [
    booking.scuola && `${booking.scuola}${booking.classe ? ` (${booking.classe})` : ''}`,
    [corso(booking.corso_id), corso(booking.corso2_id)].filter(Boolean).join(' / '),
    booking.acc_cognome && `Genitore: ${booking.acc_cognome} ${booking.acc_nome ?? ''}`.trim(),
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-3 border-b border-border py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-bold text-text">
          {booking.cognome} {booking.nome}
        </p>
        <p className="text-xs text-text3">
          {booking.telefono}
          {booking.email ? ` · ${booking.email}` : ' · nessuna email (avviso via WhatsApp)'}
        </p>
        {dettagli.length > 0 && <p className="text-xs text-text2">{dettagli.join(' · ')}</p>}
        {booking.note_staff && <p className="text-xs italic text-text3">{booking.note_staff}</p>}
        {decidi.error && <p className="mt-1 text-xs text-red">Operazione non riuscita, riprova.</p>}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          variant="success"
          disabled={decidi.isPending}
          onClick={() => void decidi.mutateAsync({ booking, approva: true })}
        >
          {decidi.isPending ? '…' : '✓ Approva'}
        </Button>
        <Button variant="ghost" className="text-red" disabled={decidi.isPending} onClick={() => setRifiuta(true)}>
          ✕ Rifiuta
        </Button>
      </div>
      {rifiuta && <RifiutaModal booking={booking} onClose={() => setRifiuta(false)} />}
    </div>
  )
}

/** Richieste arrivate dal Google Modulo in attesa di approvazione (status 'pending'). */
export function RichiesteDaApprovare({ bookings }: { bookings: Booking[] }) {
  const richieste = bookings.filter((b) => b.status === 'pending')
  if (richieste.length === 0) return null

  return (
    <Card className="border-l-4 border-l-orange">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wide text-text2">
          Richieste da approvare ({richieste.length})
        </h2>
      </div>
      <p className="mb-2 text-xs text-text3">
        Approvando o rifiutando, la famiglia riceve subito un messaggio con esito, data, ora e luogo.
      </p>
      {richieste.map((b) => (
        <RichiestaRow key={b.id} booking={b} />
      ))}
    </Card>
  )
}
