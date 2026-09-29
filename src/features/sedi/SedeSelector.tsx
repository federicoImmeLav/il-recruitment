import { SelectField } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { useSede } from './SedeProvider'

/**
 * Scelta della sede di lavoro, in cima a ogni pagina staff. Con una sola sede
 * mostra solo il nome; con più sedi aggiunge "Tutte le mie sedi".
 */
export function SedeSelector() {
  const { sedi, citta, sedeId, sede, setSedeId, multiSede } = useSede()

  if (!multiSede) {
    if (!sede) return null
    return (
      <p className="mb-4 flex items-center gap-1 text-label-l text-on-surface-variant print:hidden">
        <Icon name="location_on" size={18} />
        Sede: {sede.nome}
      </p>
    )
  }

  // Raggruppate per città, nell'ordine delle sedi.
  const perCitta = citta
    .map((c) => ({ citta: c, sedi: sedi.filter((s) => s.citta_id === c.id) }))
    .filter((g) => g.sedi.length > 0)

  return (
    <SelectField
      label="Sede"
      dense
      className="mb-4 max-w-sm print:hidden"
      value={sedeId ?? ''}
      onChange={(e) => setSedeId(e.target.value || undefined)}
    >
      <option value="">Tutte le mie sedi ({sedi.length})</option>
      {perCitta.map((g) =>
        perCitta.length > 1 ? (
          <optgroup key={g.citta.id} label={g.citta.nome}>
            {g.sedi.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </optgroup>
        ) : (
          g.sedi.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))
        ),
      )}
    </SelectField>
  )
}

/** Avviso per le azioni che richiedono una sede precisa (creare, esportare, configurare). */
export function ScegliSedePrima({ azione }: { azione: string }) {
  return (
    <p className="flex items-center gap-2 rounded-md bg-surface-container-high px-4 py-3 text-body-m text-on-surface-variant">
      <Icon name="info" size={20} />
      Scegli una sede dal menu “Sede” per {azione}.
    </p>
  )
}
