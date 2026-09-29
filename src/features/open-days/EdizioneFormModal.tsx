import { useState } from 'react'
import { Dialog } from '../../components/ui/Dialog'
import { Button } from '../../components/ui/Button'
import { InputField, SelectField } from '../../components/ui/Field'
import { useCreateEdizione } from '../../hooks/useEdizioni'
import type { StatoEdizione } from '../../types/database.types'
import { useSede } from '../sedi/SedeProvider'

export function EdizioneFormModal({ onClose }: { onClose: () => void }) {
  const createEdizione = useCreateEdizione()
  const { sedi, sedeId: sedeCorrente, multiSede } = useSede()
  const [sedeId, setSedeId] = useState(sedeCorrente ?? '')
  const [nome, setNome] = useState('')
  const [anno, setAnno] = useState('')
  const [dataApertura, setDataApertura] = useState('')
  const [dataChiusura, setDataChiusura] = useState('')
  const [stato, setStato] = useState<StatoEdizione>('bozza')

  async function handleSubmit() {
    await createEdizione.mutateAsync({
      sede_id: sedeId,
      nome,
      anno,
      data_apertura: dataApertura || null,
      data_chiusura: dataChiusura || null,
      stato,
    })
    onClose()
  }

  return (
    <Dialog
      title="Nuova edizione"
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!sedeId || !nome || !anno || createEdizione.isPending}>
            {createEdizione.isPending ? 'Salvataggio…' : 'Crea edizione'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Ogni sede ha le proprie edizioni: con una sola sede la scelta e' implicita. */}
        {multiSede && (
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
