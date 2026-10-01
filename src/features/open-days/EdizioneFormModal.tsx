import { useState } from 'react'
import { Dialog } from '../../components/ui/Dialog'
import { Button } from '../../components/ui/Button'
import { InputField, SelectField } from '../../components/ui/Field'
import { useCreateEdizione, useUpdateEdizione } from '../../hooks/useEdizioni'
import type { Edizione, StatoEdizione } from '../../types/database.types'
import { useSede } from '../sedi/SedeProvider'

/** Crea una nuova edizione o, se `edizione` e' passata, la modifica. */
export function EdizioneFormModal({ edizione, onClose }: { edizione?: Edizione; onClose: () => void }) {
  const createEdizione = useCreateEdizione()
  const updateEdizione = useUpdateEdizione()
  const mutation = edizione ? updateEdizione : createEdizione
  const { sedi, sedeId: sedeCorrente, multiSede } = useSede()
  const [sedeId, setSedeId] = useState(edizione?.sede_id ?? sedeCorrente ?? '')
  const [nome, setNome] = useState(edizione?.nome ?? '')
  const [anno, setAnno] = useState(edizione?.anno ?? '')
  const [dataApertura, setDataApertura] = useState(edizione?.data_apertura ?? '')
  const [dataChiusura, setDataChiusura] = useState(edizione?.data_chiusura ?? '')
  const [stato, setStato] = useState<StatoEdizione>(edizione?.stato ?? 'bozza')

  async function handleSubmit() {
    const valori = {
      nome,
      anno,
      data_apertura: dataApertura || null,
      data_chiusura: dataChiusura || null,
      stato,
    }
    // La sede non si cambia in modifica: gli Open Day e le iscrizioni restano legati alla sede d'origine.
    if (edizione) await updateEdizione.mutateAsync({ id: edizione.id, ...valori })
    else await createEdizione.mutateAsync({ sede_id: sedeId, ...valori })
    onClose()
  }

  return (
    <Dialog
      title={edizione ? 'Modifica edizione' : 'Nuova edizione'}
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!sedeId || !nome || !anno || mutation.isPending}>
            {mutation.isPending ? 'Salvataggio…' : edizione ? 'Salva' : 'Crea edizione'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Ogni sede ha le proprie edizioni: con una sola sede la scelta e' implicita. */}
        {multiSede && !edizione && (
          <SelectField label="Sede" required value={sedeId} onChange={(e) => setSedeId(e.target.value)}>
            <option value="">Seleziona…</option>
            {sedi.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </SelectField>
        )}
        <InputField
          label="Nome edizione"
          required
          placeholder="Open Day IeFP"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <InputField
          label="Anno formativo"
          required
          placeholder="2027/2028"
          value={anno}
          onChange={(e) => setAnno(e.target.value)}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            label="Apertura"
            type="date"
            value={dataApertura}
            onChange={(e) => setDataApertura(e.target.value)}
          />
          <InputField
            label="Chiusura"
            type="date"
            value={dataChiusura}
            onChange={(e) => setDataChiusura(e.target.value)}
          />
        </div>
        <SelectField label="Stato" value={stato} onChange={(e) => setStato(e.target.value as StatoEdizione)}>
          <option value="bozza">Bozza</option>
          <option value="attiva">Attiva</option>
          <option value="chiusa">Chiusa</option>
        </SelectField>
      </div>
    </Dialog>
  )
}
