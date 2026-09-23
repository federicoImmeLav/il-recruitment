import { useState } from 'react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { InputField, SelectField, TextareaField } from '../../components/ui/Field'
import { useCreateOpenDay, useUpdateOpenDay } from '../../hooks/useOpenDays'
import type { OpenDay, StatoOpenDay, TipoOpenDay } from '../../types/database.types'

export function OpenDayFormModal({
  edizioneId,
  openDay,
  onClose,
}: {
  edizioneId: string
  openDay?: OpenDay
  onClose: () => void
}) {
  const createOpenDay = useCreateOpenDay()
  const updateOpenDay = useUpdateOpenDay()
  const [data, setData] = useState(openDay?.data ?? '')
  const [ora, setOra] = useState(openDay?.ora ?? '')
  const [postiMax, setPostiMax] = useState(openDay?.posti_max ?? 20)
  const [tipo, setTipo] = useState<TipoOpenDay>(openDay?.tipo ?? 'OpenDay')
  const [stato, setStato] = useState<StatoOpenDay>(openDay?.stato ?? 'aperto')
  const [note, setNote] = useState(openDay?.note ?? '')

  const saving = createOpenDay.isPending || updateOpenDay.isPending

  async function handleSubmit() {
    if (openDay) {
      await updateOpenDay.mutateAsync({ id: openDay.id, data, ora, posti_max: postiMax, tipo, stato, note })
    } else {
      await createOpenDay.mutateAsync({ edizione_id: edizioneId, data, ora, posti_max: postiMax, tipo, stato, note })
    }
    onClose()
  }

  return (
    <Modal
      title={openDay ? 'Modifica Open Day' : 'Nuovo Open Day'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={!data || !ora || saving}>
            {saving ? 'Salvataggio…' : openDay ? 'Salva modifiche' : 'Crea Open Day'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField label="Data" type="date" required value={data} onChange={(e) => setData(e.target.value)} />
          <InputField label="Ora" type="time" required value={ora} onChange={(e) => setOra(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InputField
            label="Posti massimi"
            type="number"
            min={1}
            required
            value={postiMax}
            onChange={(e) => setPostiMax(Number(e.target.value))}
          />
          <SelectField label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoOpenDay)}>
            <option value="OpenDay">Open Day</option>
            <option value="OpenDay2e">Open Day 2ª edizione</option>
          </SelectField>
        </div>
        <SelectField label="Stato" value={stato} onChange={(e) => setStato(e.target.value as StatoOpenDay)}>
          <option value="aperto">Aperto alle iscrizioni</option>
          <option value="chiuso">Chiuso</option>
          <option value="annullato">Annullato</option>
        </SelectField>
        <TextareaField
          label="Note interne"
          rows={3}
          value={note ?? ''}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Visibili solo allo staff"
        />
      </div>
    </Modal>
  )
}
