import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { InputField, SelectField } from '../../components/ui/Field'
import { useCreateEdizione } from '../../hooks/useEdizioni'
import type { StatoEdizione } from '../../types/database.types'

export function EdizioneFormModal({ onClose }: { onClose: () => void }) {
  const createEdizione = useCreateEdizione()
  const [nome, setNome] = useState('')
  const [anno, setAnno] = useState('')
  const [dataApertura, setDataApertura] = useState('')
  const [dataChiusura, setDataChiusura] = useState('')
  const [stato, setStato] = useState<StatoEdizione>('bozza')

  async function handleSubmit() {
    await createEdizione.mutateAsync({
      nome,
      anno,
      data_apertura: dataApertura || null,
      data_chiusura: dataChiusura || null,
      stato,
    })
    onClose()
  }

  return (
    <Modal
      title="Nuova edizione"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!nome || !anno || createEdizione.isPending}>
            {createEdizione.isPending ? 'Salvataggio…' : 'Crea edizione'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
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
    </Modal>
  )
}
