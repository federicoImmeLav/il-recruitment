import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { InputField, CheckboxField } from '../../components/ui/Field'
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-text">Manifestazioni di Interesse</h1>
        <Button variant="blue" onClick={() => setExportAperto(true)}>
          ⬇ Esporta per INNOVAPLAN
        </Button>
      </div>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full sm:max-w-xs">
          <InputField label="Cerca allievo/a" placeholder="Cognome o nome" value={ricerca} onChange={(e) => setRicerca(e.target.value)} />
        </div>
        <CheckboxField label="Solo da esportare su INNOVAPLAN" checked={soloDaEsportare} onChange={(e) => setSoloDaEsportare(e.target.checked)} />
      </Card>

      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Errore nel caricamento delle MDI." />}

      <Card>
        {mdiList?.length === 0 && <p className="text-sm text-text3">Nessuna MDI trovata.</p>}
        <div className="divide-y divide-border">
          {mdiList?.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              className="flex w-full flex-col gap-1 py-3 text-left transition-colors hover:bg-gray-light sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-bold text-text">
                  {m.all_cognome} {m.all_nome}
                </p>
                <p className="text-xs text-text3">
                  {corsoNome(m.corso_pref1_id)} · {new Date(m.created_at).toLocaleDateString('it-IT')}
                </p>
              </div>
              <Badge color={m.esportato_innovaplan ? 'green' : 'orange'}>
                {m.esportato_innovaplan ? 'Esportata' : 'Da esportare'}
              </Badge>
            </button>
          ))}
        </div>
      </Card>

      {selectedId && <MdiDetailDrawer id={selectedId} onClose={() => setSelectedId(null)} />}
      {exportAperto && <ExportInnovaplanModal onClose={() => setExportAperto(false)} />}
    </div>
  )
}
