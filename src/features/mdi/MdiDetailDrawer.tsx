import { Dialog } from '../../components/ui/Dialog'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Spinner, ErrorBanner } from '../../components/ui/Spinner'
import { useMdiDetail, useToggleExportInnovaplan } from '../../hooks/useMdi'
import { useCorsi } from '../../hooks/useCorsi'
import { useAuth } from '../auth/AuthProvider'
import { SOSTEGNO_STATO_LABEL } from '../../lib/constants'

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 py-1.5">
      <span className="text-body-m text-on-surface-variant">{label}</span>
      <span className="text-right text-body-m font-bold text-on-surface">{value}</span>
    </div>
  )
}

const SEZIONE = 'mb-1 border-b border-outline-variant pb-1 text-title-s text-primary'

export function MdiDetailDrawer(
{ id, onClose }: { id: string; onClose: () => void }) {
  const { data: mdi, isLoading, error } = useMdiDetail(id)
  const { data: corsi } = useCorsi()
  const { profile } = useAuth()
  const toggleExport = useToggleExportInnovaplan()

  const corsoNome = (corsoId: string | null) => corsi?.find((c) => c.id === corsoId)?.nome

  return (
    <Dialog
      title="Dettaglio MDI"
      variant="sheet"
      onClose={onClose}
      footer={
        mdi &&
        profile && (
          <Button
            variant={mdi.esportato_innovaplan ? 'outlined' : 'success'}
            icon={mdi.esportato_innovaplan ? 'undo' : 'check'}
            disabled={toggleExport.isPending}
            onClick={() =>
              void toggleExport.mutateAsync({ id: mdi.id, esportato: !mdi.esportato_innovaplan, staffId: profile.id })
            }
          >
            {mdi.esportato_innovaplan ? 'Segna come da esportare' : 'Segna come esportata su INNOVAPLAN'}
          </Button>
        )
      }
    >
      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Errore nel caricamento della MDI." />}
      {mdi && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-headline-s text-on-surface">
              {mdi.all_cognome} {mdi.all_nome}
            </h3>
            <Badge color={mdi.esportato_innovaplan ? 'success' : 'warning'}>
              {mdi.esportato_innovaplan ? 'Esportata su INNOVAPLAN' : 'Da esportare'}
            </Badge>
          </div>

          <section>
            <h4 className={SEZIONE}>Allievo/a</h4>
            <Row label="Codice fiscale" value={mdi.all_codice_fiscale} />
            <Row label="Sesso" value={mdi.all_sesso} />
            <Row label="Data di nascita" value={new Date(mdi.all_data_nascita).toLocaleDateString('it-IT')} />
            <Row label="Annualità / sezione" value={`${mdi.all_annualita}ª ${mdi.all_sezione ?? ''}`} />
            <Row
              label="Nato/a a"
              value={`${mdi.all_nato_a}${mdi.all_comune_nascita_cod ? ` (${mdi.all_comune_nascita_cod})` : ''}`}
            />
            <Row label="Cittadinanza" value={[mdi.all_cittadinanza, mdi.all_cittadinanza_2].filter(Boolean).join(' / ')} />
            <Row
              label="Scuola di provenienza"
              value={
                mdi.all_scuola_provenienza &&
                `${mdi.all_scuola_provenienza}${mdi.all_scuola_provenienza_cod ? ` (${mdi.all_scuola_provenienza_cod})` : ''}`
              }
            />
            <Row
              label="Residenza"
              value={`${mdi.all_residenza_via}, ${mdi.all_residenza_cap ?? ''} ${mdi.all_residenza_citta}${mdi.all_residenza_prov ? ` (${mdi.all_residenza_prov})` : ''}`}
            />
            {mdi.all_domicilio_diverso && (
              <Row label="Domicilio" value={`${mdi.all_domicilio_via ?? ''}, ${mdi.all_domicilio_cap ?? ''} ${mdi.all_domicilio_citta ?? ''}`} />
            )}
          </section>

          <section>
            <h4 className={SEZIONE}>Accompagnatore</h4>
            <Row label="Nome" value={`${mdi.acc_cognome} ${mdi.acc_nome} (${mdi.acc_qualita})`} />
            <Row label="Codice fiscale" value={mdi.acc_codice_fiscale} />
            <Row
              label="Nato/a"
              value={
                mdi.acc_data_nascita &&
                `${mdi.acc_nato_estero ? mdi.acc_stato_nascita : mdi.acc_comune_nascita} il ${new Date(mdi.acc_data_nascita).toLocaleDateString('it-IT')}`
              }
            />
            <Row label="Cittadinanza" value={mdi.acc_cittadinanza} />
            <Row label="Cellulare" value={mdi.acc_cellulare} />
            <Row label="Email" value={[mdi.acc_email, mdi.acc_email_2].filter(Boolean).join(' / ')} />
            {!mdi.acc_residenza_come_allievo && (
              <Row label="Residenza" value={`${mdi.acc_residenza_via ?? ''}, ${mdi.acc_residenza_cap ?? ''} ${mdi.acc_residenza_citta ?? ''}`} />
            )}
          </section>

          <section>
            <h4 className={SEZIONE}>Corsi di interesse</h4>
            <Row label="1ª preferenza" value={corsoNome(mdi.corso_pref1_id)} />
            <Row label="2ª preferenza" value={corsoNome(mdi.corso_pref2_id)} />
            <Row label="3ª preferenza" value={corsoNome(mdi.corso_pref3_id)} />
          </section>

          <section>
            <h4 className={SEZIONE}>Sostegno / canale</h4>
            <Row label="Sostegno" value={SOSTEGNO_STATO_LABEL[mdi.sostegno_stato]} />
            <Row
              label="Certificazioni"
              value={
                [
                  mdi.sostegno_asl && 'ASL',
                  mdi.sostegno_diagnosi_funzionale && 'Diagnosi Funzionale',
                  mdi.sostegno_bes && 'BES',
                  mdi.sostegno_dsa && 'DSA',
                ]
                  .filter(Boolean)
                  .join(', ') || null
              }
            />
            <Row
              label="Canale di conoscenza"
              value={
                [
                  mdi.canale_orientamento_scuola && 'Orientamento a scuola',
                  mdi.canale_open_day && 'Open Day',
                  mdi.canale_ricerca_online && 'Ricerca online',
                  mdi.canale_passaparola && 'Passaparola',
                  mdi.canale_altro && `Altro: ${mdi.canale_altro_testo}`,
                ]
                  .filter(Boolean)
                  .join(', ') || null
              }
            />
          </section>

          <section>
            <h4 className={SEZIONE}>Consensi</h4>
            <Row label="Privacy A) finalità istituzionali" value={mdi.consenso_privacy_a ? 'Sì' : 'No'} />
            <Row label="Privacy B) comunicazioni commerciali" value={mdi.consenso_privacy_b ? 'Sì' : 'No'} />
            <Row label="Foto/video: realizzare" value={mdi.consenso_foto_realizzare ? 'Sì' : 'No'} />
            <Row label="Foto/video: utilizzare" value={mdi.consenso_foto_utilizzare ? 'Sì' : 'No'} />
            <Row label="Foto/video: comunicare" value={mdi.consenso_foto_comunicare ? 'Sì' : 'No'} />
          </section>

          {mdi.esportato_innovaplan_at && (
            <p className="text-body-s text-on-surface-variant">
              Esportata il {new Date(mdi.esportato_innovaplan_at).toLocaleString('it-IT')}
            </p>
          )}
        </div>
      )}
    </Dialog>
  )
}
