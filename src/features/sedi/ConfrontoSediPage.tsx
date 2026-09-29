import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { InputField } from '../../components/ui/Field'
import { EmptyState, PageHeader } from '../../components/ui/PageHeader'
import { ErrorBanner, Spinner } from '../../components/ui/Spinner'
import { useStatisticheSedi } from '../../hooks/useSedi'
import type { StatisticheSede } from '../../types/database.types'
import { useSede } from './SedeProvider'

const COLONNE: { chiave: keyof StatisticheSede; label: string }[] = [
  { chiave: 'open_day', label: 'Open Day' },
  { chiave: 'iscritti', label: 'Iscritti' },
  { chiave: 'confermati', label: 'Confermati' },
  { chiave: 'da_approvare', label: 'Da approvare' },
  { chiave: 'in_attesa', label: 'Lista d’attesa' },
  { chiave: 'presenti', label: 'Presenti' },
  { chiave: 'mdi', label: 'MDI' },
  { chiave: 'mdi_esportate', label: 'MDI esportate' },
]

const percentuale = (parte: number, totale: number) => (totale > 0 ? `${Math.round((parte / totale) * 100)}%` : '—')

/** Presenti su confermati e MDI su presenti: i due passaggi dell'imbuto Open Day → iscrizione. */
function tassi(r: Pick<StatisticheSede, 'presenti' | 'confermati' | 'mdi'>) {
  return { presenza: percentuale(r.presenti, r.confermati), conversione: percentuale(r.mdi, r.presenti) }
}

function somma(righe: StatisticheSede[]) {
  const tot = Object.fromEntries(COLONNE.map((c) => [c.chiave, 0])) as Record<string, number>
  for (const r of righe) for (const c of COLONNE) tot[c.chiave] += r[c.chiave] as number
  return tot as unknown as StatisticheSede
}

/**
 * Dashboard comparativa per referenti di città e admin: una riga per sede
 * accessibile (RLS), sulle edizioni attive o su quelle di un anno formativo.
 */
export function ConfrontoSediPage() {
  const { multiSede } = useSede()
  const [anno, setAnno] = useState('')
  const annoFiltro = anno.trim() || null
  const { data: righe, isLoading, error } = useStatisticheSedi(annoFiltro)

  // Una sezione per città; la riga di totale c'e' solo se la città ha piu' sedi.
  const perCitta = Object.entries(
    (righe ?? []).reduce<Record<string, StatisticheSede[]>>((acc, r) => {
      ;(acc[r.citta_nome] ??= []).push(r)
      return acc
    }, {}),
  )

  if (!multiSede) {
    return (
      <Card>
        <EmptyState icon="leaderboard">Il confronto è disponibile per chi lavora su più sedi.</EmptyState>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Confronto sedi"
        subtitle={
          annoFiltro
            ? `Edizioni dell’anno formativo ${annoFiltro}`
            : 'Edizioni attive di ogni sede. Presenza = presenti su confermati; conversione = MDI su presenti.'
        }
      />

      <InputField
        label="Anno formativo"
        dense
        placeholder="es. 2026/2027 — vuoto = edizioni attive"
        className="max-w-sm"
        value={anno}
        onChange={(e) => setAnno(e.target.value)}
        supporting="Scrivilo come nel campo “Anno” delle edizioni."
      />

      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Errore nel caricamento delle statistiche." />}
      {righe?.length === 0 && (
        <Card>
          <EmptyState icon="leaderboard">Nessuna sede con edizioni corrispondenti.</EmptyState>
        </Card>
      )}

      {perCitta.map(([citta, sedi]) => {
        const totale = sedi.length > 1 ? somma(sedi) : null
        return (
          <section key={citta} className="space-y-3">
            <h2 className="text-title-m text-on-surface">{citta}</h2>

            {/* Compact: una card per sede. */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 medium:hidden">
              {sedi.map((r) => (
                <Card key={r.sede_id} className="space-y-3">
                  <div>
                    <p className="text-title-m text-on-surface">{r.sede_nome}</p>
                    <p className="text-body-s text-on-surface-variant">{r.edizioni ?? 'Nessuna edizione'}</p>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-body-m">
                    {COLONNE.map((c) => (
                      <div key={c.chiave} className="flex justify-between gap-2">
                        <dt className="text-on-surface-variant">{c.label}</dt>
                        <dd className="tabular-nums text-on-surface">{r[c.chiave]}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-2">
                      <dt className="text-on-surface-variant">Presenza</dt>
                      <dd className="tabular-nums text-on-surface">{tassi(r).presenza}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-on-surface-variant">Conversione</dt>
                      <dd className="tabular-nums text-on-surface">{tassi(r).conversione}</dd>
                    </div>
                  </dl>
                </Card>
              ))}
            </div>

            {/* Medium+: tabella. */}
            <Card className="hidden overflow-x-auto !p-0 medium:block">
              <table className="w-full text-body-m">
                <thead>
                  <tr className="border-b border-outline-variant text-left text-label-l text-on-surface-variant">
                    <th className="px-4 py-3 font-normal">Sede</th>
                    {COLONNE.map((c) => (
                      <th key={c.chiave} className="px-3 py-3 text-right font-normal">
                        {c.label}
                      </th>
                    ))}
                    <th className="px-3 py-3 text-right font-normal">Presenza</th>
                    <th className="px-4 py-3 text-right font-normal">Conversione</th>
                  </tr>
                </thead>
                <tbody>
                  {[...sedi, ...(totale ? [{ ...totale, sede_id: 'totale', sede_nome: `Totale ${citta}` }] : [])].map((r) => {
                    const t = tassi(r)
                    const riga = r.sede_id === 'totale'
                    return (
                      <tr
                        key={r.sede_id}
                        className={`border-b border-outline-variant last:border-0 ${riga ? 'bg-surface-container text-label-l' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <p className="text-on-surface">{r.sede_nome}</p>
                          {!riga && <p className="text-body-s text-on-surface-variant">{r.edizioni ?? 'Nessuna edizione'}</p>}
                        </td>
                        {COLONNE.map((c) => (
                          <td key={c.chiave} className="px-3 py-3 text-right tabular-nums text-on-surface">
                            {r[c.chiave]}
                          </td>
                        ))}
                        <td className="px-3 py-3 text-right tabular-nums text-on-surface">{t.presenza}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-on-surface">{t.conversione}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Card>
          </section>
        )
      })}
    </div>
  )
}
