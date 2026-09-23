import { useState } from 'react'
import { Dialog } from '../../components/ui/Dialog'
import { Button } from '../../components/ui/Button'
import { Checkbox, InputField, SelectField, TextareaField } from '../../components/ui/Field'
import { ErrorBanner } from '../../components/ui/Spinner'
import { useCreateOpenDay, useUpdateOpenDay } from '../../hooks/useOpenDays'
import { useCorsi } from '../../hooks/useCorsi'
import { useImpostaCorsiOpenDay, useOpenDayCorsi } from '../../hooks/useOpenDayCorsi'
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
  const [etichetta, setEtichetta] = useState(openDay?.etichetta_modulo ?? '')
  const [luogo, setLuogo] = useState(openDay?.luogo_override ?? '')

  // Indirizzi presentati: corso_id -> posti (stringa, '' = senza limite). null finche' non si tocca nulla.
  const { data: corsi } = useCorsi()
  const { indirizzi, configurati } = useOpenDayCorsi(openDay?.id)
  const impostaCorsi = useImpostaCorsiOpenDay()
  const [selezioneModificata, setSelezione] = useState<Record<string, string> | null>(null)
  const selezione: Record<string, string> =
    selezioneModificata ??
    (configurati && indirizzi
      ? Object.fromEntries(indirizzi.map((i) => [i.corso.id, i.posti_max ? String(i.posti_max) : '']))
      : {})

  function toggleCorso(id: string, attivo: boolean) {
    const nuova = { ...selezione }
    if (attivo) nuova[id] = ''
    else delete nuova[id]
    setSelezione(nuova)
  }

  const saving = createOpenDay.isPending || updateOpenDay.isPending || impostaCorsi.isPending

  const saveError = createOpenDay.error ?? updateOpenDay.error ?? impostaCorsi.error

  async function handleSubmit() {
    const campi = {
      data,
      ora,
      posti_max: postiMax,
      tipo,
      stato,
      note,
      etichetta_modulo: etichetta.trim() || null,
      luogo_override: luogo.trim() || null,
    }
    try {
      const salvato = openDay
        ? await updateOpenDay.mutateAsync({ id: openDay.id, ...campi })
        : await createOpenDay.mutateAsync({ edizione_id: edizioneId, ...campi })
      if (selezioneModificata !== null) {
        await impostaCorsi.mutateAsync({
          openDayId: salvato.id,
          corsi: (corsi ?? [])
            .filter((c) => c.id in selezioneModificata)
            .map((c) => ({ corso_id: c.id, posti_max: Number(selezioneModificata[c.id]) > 0 ? Number(selezioneModificata[c.id]) : null })),
        })
      }
      onClose()
    } catch {
      // Errore mostrato nel banner sotto il form.
    }
  }

  return (
    <Dialog
      title={openDay ? 'Modifica Open Day' : 'Nuovo Open Day'}
      variant="form"
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
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
        <div className="rounded-md bg-surface-container-lowest p-4">
          <p className="text-title-s text-on-surface">Indirizzi presentati</p>
          <p className="mb-2 mt-1 text-body-s text-on-surface-variant">
            Sono quelli proposti nel form di iscrizione e i gruppi d'interesse dell'evento. Nessuno selezionato = tutti
            i corsi attivi. I posti per indirizzo sono indicativi (non bloccano le iscrizioni).
          </p>
          {corsi?.map((c) => {
            const attivo = c.id in selezione
            return (
              <div key={c.id} className="flex min-h-14 items-center justify-between gap-3">
                <label className="-ml-2.5 flex min-w-0 cursor-pointer items-center gap-1 text-body-l text-on-surface">
                  <Checkbox checked={attivo} onChange={(e) => toggleCorso(c.id, e.target.checked)} />
                  {c.nome}
                </label>
                {attivo && (
                  <InputField
                    dense
                    label="Posti"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    aria-label={`Posti per ${c.nome}`}
                    className="w-24 shrink-0"
                    value={selezione[c.id]}
                    onChange={(e) => setSelezione({ ...selezione, [c.id]: e.target.value })}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="space-y-4 rounded-md bg-surface-container-lowest p-4">
          <p className="text-title-s text-on-surface">Google Modulo e messaggi</p>
          <InputField
            label="Etichetta modulo Google"
            value={etichetta}
            onChange={(e) => setEtichetta(e.target.value)}
            placeholder="es. Sabato 18 ottobre 2026 — ore 10:00"
            supporting="Incolla il testo identico dell'opzione del menu nel Google Modulo: le risposte che la scelgono arrivano qui come “da approvare”."
          />

          <TextareaField
            label="Luogo e indicazioni (solo se diversi dal predefinito)"
            rows={2}
            value={luogo}
            onChange={(e) => setLuogo(e.target.value)}
            placeholder="Lascia vuoto per usare quelli in Impostazioni"
          />
        </div>
        {saveError && (
          <ErrorBanner
            message={
              (saveError as { code?: string }).code === '23505'
                ? 'Etichetta modulo Google già usata da un altro Open Day.'
                : 'Salvataggio non riuscito, riprova.'
            }
          />
        )}
        <TextareaField
          label="Note interne"
          rows={3}
          value={note ?? ''}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Visibili solo allo staff"
        />
      </div>
    </Dialog>
  )
}
