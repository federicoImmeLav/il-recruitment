import { useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ChipSet, FilterChip } from '../../components/ui/Chip'
import { Dialog } from '../../components/ui/Dialog'
import { List } from '../../components/ui/List'
import { EmptyState } from '../../components/ui/PageHeader'
import { ErrorBanner, InfoBanner, Spinner } from '../../components/ui/Spinner'
import { useMdiList } from '../../hooks/useMdi'
import { scaricaCsv } from '../mdi/export/innovaplanCsv'
import type { Booking, Corso, OpenDay } from '../../types/database.types'
import { csvDaRicontattare, daRicontattare, MOTIVO_RICONTATTO_LABEL, type MotivoRicontatto } from './daRicontattare'

type Filtro = 'tutti' | MotivoRicontatto

/** Dopo l'Open Day: iscritti non presentati o presenti senza MDI, con download CSV per richiamarli. */
export function DaRicontattareModal({
  openDay,
  bookings,
  corsi,
  onClose,
}: {
  openDay: OpenDay
  bookings: Booking[]
  corsi: Corso[]
  onClose: () => void
}) {
  // Tutte le MDI della sede: anche quelle compilate dal kiosk di sede, senza Open Day.
  const { data: mdi, isLoading, error } = useMdiList({ sedeId: openDay.sede_id })
  const [filtro, setFiltro] = useState<Filtro>('tutti')

  const tutti = mdi ? daRicontattare(bookings, mdi) : []
  const righe = tutti.filter((r) => filtro === 'tutti' || r.motivo === filtro)
  const conta = (f: Filtro) => tutti.filter((r) => f === 'tutti' || r.motivo === f).length

  function scarica() {
    const suffisso = filtro === 'non_presentato' ? '_non_presentati' : filtro === 'senza_mdi' ? '_senza_MDI' : ''
    scaricaCsv(csvDaRicontattare(righe, corsi), `Da_ricontattare_OpenDay_${openDay.data}${suffisso}.csv`)
  }

  return (
    <Dialog
      title="Da ricontattare"
      variant="form"
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Chiudi
          </Button>
          <Button icon="download" disabled={righe.length === 0} onClick={scarica}>
            Scarica CSV ({righe.length})
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <InfoBanner>
          Iscritti che non hanno fatto il check-in né compilato la MDI, e presenti che non hanno compilato la MDI.
          Una MDI compilata senza scegliere l’iscritto nel kiosk viene riconosciuta da cognome e nome.
        </InfoBanner>
        {isLoading && <Spinner />}
        {error && <ErrorBanner message="Errore nel caricamento delle MDI." />}
        {mdi && (
          <>
            <ChipSet label="Filtra per motivo">
              {(['tutti', 'non_presentato', 'senza_mdi'] as const).map((f) => (
                <FilterChip key={f} selected={filtro === f} onClick={() => setFiltro(f)}>
                  {f === 'tutti' ? 'Tutti' : MOTIVO_RICONTATTO_LABEL[f]} ({conta(f)})
                </FilterChip>
              ))}
            </ChipSet>
            {righe.length === 0 && <EmptyState icon="how_to_reg">Nessuno da ricontattare in questo elenco.</EmptyState>}
            <List>
              {righe.map(({ booking: b, motivo }) => (
                <li key={b.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="text-title-s text-on-surface">
                      {b.cognome} {b.nome}
                    </p>
                    <p className="text-body-m text-on-surface-variant">
                      {b.telefono}
                      {b.email ? ` · ${b.email}` : ''}
                      {b.scuola ? ` · ${b.scuola}` : ''}
                    </p>
                  </div>
                  <Badge color={motivo === 'non_presentato' ? 'error' : 'warning'}>{MOTIVO_RICONTATTO_LABEL[motivo]}</Badge>
                </li>
              ))}
            </List>
          </>
        )}
      </div>
    </Dialog>
  )
}
