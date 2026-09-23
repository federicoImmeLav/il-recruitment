import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { ChipSet, FilterChip } from '../../components/ui/Chip'
import { Icon } from '../../components/ui/Icon'
import { List, ListItem } from '../../components/ui/List'
import { EmptyState, PageHeader } from '../../components/ui/PageHeader'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner'
import { useMdiList } from '../../hooks/useMdi'
import { useCorsi } from '../../hooks/useCorsi'
import { MdiDetailDrawer } from './MdiDetailDrawer'
import { Button } from '../../components/ui/Button'
import { ExportInnovaplanModal } from './export/ExportInnovaplanModal'

export function MdiListPage() {
  const [ricerca, setRicerca] = useState('')
  const [soloDaEsportare, setSoloDaEsportare] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [exportAperto, setExportAperto] = useState(false)
  const { data: mdiList, isLoading, error } = useMdiList({ ricerca: ricerca || undefined, soloDaEsportare })
  const { data: corsi } = useCorsi()

  const corsoNome = (id: string | null) => corsi?.find((c) => c.id === id)?.nome ?? '—'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manifestazioni di Interesse"
        actions={
          <Button variant="tonal" icon="download" onClick={() => setExportAperto(true)}>
            Esporta per INNOVAPLAN
          </Button>
        }
      />

      <div className="space-y-2">
        {/* Search bar M3 */}
        <label className="flex h-14 w-full max-w-xl items-center gap-4 rounded-full bg-surface-container-high px-4 text-on-surface-variant focus-within:outline-3 focus-within:outline-secondary">
          <Icon name="search" />
          <input
            type="search"
            aria-label="Cerca allievo/a"
            placeholder="Cerca per cognome o nome"
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent text-body-l text-on-surface outline-none placeholder:text-on-surface-variant"
          />
        </label>
        <ChipSet label="Filtri MDI">
          <FilterChip selected={soloDaEsportare} onClick={() => setSoloDaEsportare((v) => !v)}>
            Solo da esportare su INNOVAPLAN
          </FilterChip>
        </ChipSet>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Errore nel caricamento delle MDI." />}

      <Card className="!py-2">
        {mdiList?.length === 0 && <EmptyState icon="search_off">Nessuna MDI trovata.</EmptyState>}
        <List>
          {mdiList?.map((m) => (
            <ListItem
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              leading={
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-title-m text-on-primary-container">
                  {m.all_cognome.charAt(0)}
                </span>
              }
              headline={
                <span className="text-title-s">
                  {m.all_cognome} {m.all_nome}
                </span>
              }
              supporting={`${corsoNome(m.corso_pref1_id)} · ${new Date(m.created_at).toLocaleDateString('it-IT')}`}
              trailing={
                <Badge color={m.esportato_innovaplan ? 'success' : 'warning'}>
                  {m.esportato_innovaplan ? 'Esportata' : 'Da esportare'}
                </Badge>
              }
            />
          ))}
        </List>
      </Card>

      {selectedId && <MdiDetailDrawer id={selectedId} onClose={() => setSelectedId(null)} />}
      {exportAperto && <ExportInnovaplanModal onClose={() => setExportAperto(false)} />}
    </div>
  )
}
