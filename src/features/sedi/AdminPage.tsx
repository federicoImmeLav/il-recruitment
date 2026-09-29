import { useState } from 'react'
import { Badge } from '../../components/ui/Badge'
import { Button, IconButton } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Dialog } from '../../components/ui/Dialog'
import { Checkbox, InputField, SelectField } from '../../components/ui/Field'
import { Icon } from '../../components/ui/Icon'
import { List, ListItem } from '../../components/ui/List'
import { EmptyState, PageHeader, SectionHeader } from '../../components/ui/PageHeader'
import { useSnackbar } from '../../components/ui/Snackbar'
import { ErrorBanner, InfoBanner, Spinner } from '../../components/ui/Spinner'
import { Tabs } from '../../components/ui/Tabs'
import {
  useAggiornaProfilo,
  useAggiungiAmbito,
  useCreaCitta,
  useProfili,
  useRimuoviAmbito,
  useSalvaSede,
  useStaffAmbiti,
} from '../../hooks/useSedi'
import type { Citta, Profile, Sede, StaffAmbito } from '../../types/database.types'
import { useAuth } from '../auth/AuthProvider'
import { useSede } from './SedeProvider'

/** Regioni con l'elenco scuole medie gia' generato (vedi scripts/genera-dati-riferimento.mjs). */
const REGIONI = ['LOMBARDIA', 'PIEMONTE']

/** "Corso Galileo Ferraris" -> "corso-galileo-ferraris": usato nel link del kiosk. */
function slug(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const erroreDuplicato = (e: unknown) =>
  (e as { code?: string } | null)?.code === '23505' ? 'Nome o identificativo già usato.' : 'Salvataggio non riuscito, riprova.'

// ---------------------------------------------------------------------------
// Sedi e città
// ---------------------------------------------------------------------------

function SedeDialog({ sede, citta, onClose }: { sede?: Sede; citta: Citta[]; onClose: () => void }) {
  const salva = useSalvaSede()
  const [nome, setNome] = useState(sede?.nome ?? '')
  const [slugSede, setSlugSede] = useState(sede?.slug ?? '')
  const [cittaId, setCittaId] = useState(sede?.citta_id ?? citta[0]?.id ?? '')
  const [attiva, setAttiva] = useState(sede?.attiva ?? true)
  const [ordine, setOrdine] = useState(String(sede?.ordine ?? 0))
  const slugEffettivo = slugSede || slug(nome)

  async function invia() {
    try {
      await salva.mutateAsync({
        id: sede?.id,
        patch: { nome: nome.trim(), slug: slugEffettivo, citta_id: cittaId, attiva, ordine: Number(ordine) || 0 },
      })
      onClose()
    } catch {
      // Errore mostrato nel banner.
    }
  }

  return (
    <Dialog
      title={sede ? `Modifica ${sede.nome}` : 'Nuova sede'}
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={() => void invia()} disabled={!nome.trim() || !slugEffettivo || !cittaId || salva.isPending}>
            {salva.isPending ? 'Salvataggio…' : sede ? 'Salva' : 'Crea sede'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <SelectField label="Città" required value={cittaId} onChange={(e) => setCittaId(e.target.value)}>
          {citta.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </SelectField>
        <InputField label="Nome sede" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <InputField
          label="Identificativo per il link del kiosk"
          placeholder={slug(nome) || 'es. torino-centro'}
          value={slugSede}
          onChange={(e) => setSlugSede(slug(e.target.value))}
          supporting={`Link del tablet: /mdi/kiosk/sede/${slugEffettivo || '…'}`}
        />
        <InputField
          label="Ordine"
          type="number"
          inputMode="numeric"
          value={ordine}
          onChange={(e) => setOrdine(e.target.value)}
        />
        <label className="-ml-2.5 flex cursor-pointer items-center gap-1 text-body-l text-on-surface">
          <Checkbox checked={attiva} onChange={(e) => setAttiva(e.target.checked)} />
          Sede attiva (visibile a kiosk e form pubblici)
        </label>
        <p className="text-body-s text-on-surface-variant">
          Luogo, contatti, mittente, codici INNOVAPLAN, corsi e testi della sede si impostano da Impostazioni dopo averla
          scelta nel menu “Sede”.
        </p>
        {salva.error && <ErrorBanner message={erroreDuplicato(salva.error)} />}
      </div>
    </Dialog>
  )
}

function CittaDialog({ onClose }: { onClose: () => void }) {
  const crea = useCreaCitta()
  const [nome, setNome] = useState('')
  const [regione, setRegione] = useState(REGIONI[0])

  async function invia() {
    try {
      await crea.mutateAsync({ nome: nome.trim(), slug: slug(nome), regione })
      onClose()
    } catch {
      // Errore mostrato nel banner.
    }
  }

  return (
    <Dialog
      title="Nuova città"
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={() => void invia()} disabled={!nome.trim() || crea.isPending}>
            {crea.isPending ? 'Salvataggio…' : 'Crea città'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <InputField label="Nome città" required value={nome} onChange={(e) => setNome(e.target.value)} />
        <SelectField
          label="Regione"
          value={regione}
          onChange={(e) => setRegione(e.target.value)}
          supporting="Determina l’elenco delle scuole medie proposto nella MDI."
        >
          {REGIONI.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0) + r.slice(1).toLowerCase()}
            </option>
          ))}
        </SelectField>
        {crea.error && <ErrorBanner message={erroreDuplicato(crea.error)} />}
      </div>
    </Dialog>
  )
}

function TabSedi() {
  const { tutteLeSedi, citta } = useSede()
  const [dialog, setDialog] = useState<'nuova' | 'citta' | Sede | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button icon="add" onClick={() => setDialog('nuova')} disabled={citta.length === 0}>
          Nuova sede
        </Button>
        <Button variant="outlined" icon="add" onClick={() => setDialog('citta')}>
          Nuova città
        </Button>
      </div>

      {citta.map((c) => {
        const sedi = tutteLeSedi.filter((s) => s.citta_id === c.id)
        return (
          <Card key={c.id} className="!py-2">
            <SectionHeader title={`${c.nome} · ${sedi.length} ${sedi.length === 1 ? 'sede' : 'sedi'}`} className="!mb-0 pt-2" />
            {sedi.length === 0 && <EmptyState icon="location_off">Nessuna sede in questa città.</EmptyState>}
            <List>
              {sedi.map((s) => (
                <ListItem
                  key={s.id}
                  leading={<Icon name="location_on" className="text-on-surface-variant" />}
                  headline={s.nome}
                  supporting={`/mdi/kiosk/sede/${s.slug}${s.codice_meccanografico ? ` · ${s.codice_meccanografico}` : ''}`}
                  trailing={
                    <>
                      {!s.attiva && <Badge color="neutral">Non attiva</Badge>}
                      <IconButton icon="edit" label={`Modifica ${s.nome}`} onClick={() => setDialog(s)} />
                    </>
                  }
                />
              ))}
            </List>
          </Card>
        )
      })}

      {dialog === 'citta' && <CittaDialog onClose={() => setDialog(null)} />}
      {dialog && dialog !== 'citta' && (
        <SedeDialog sede={dialog === 'nuova' ? undefined : dialog} citta={citta} onClose={() => setDialog(null)} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Utenti staff: admin, attivo, ambiti città/sede
// ---------------------------------------------------------------------------

function UtenteDialog({ utente, ambiti, onClose }: { utente: Profile; ambiti: StaffAmbito[]; onClose: () => void }) {
  const { profile } = useAuth()
  const { tutteLeSedi, citta } = useSede()
  const aggiorna = useAggiornaProfilo()
  const aggiungi = useAggiungiAmbito()
  const rimuovi = useRimuoviAmbito()
  const snackbar = useSnackbar()
  const [scelta, setScelta] = useState('')
  const io = utente.id === profile?.id

  const etichetta = (a: StaffAmbito) =>
    a.citta_id
      ? `${citta.find((c) => c.id === a.citta_id)?.nome ?? '—'} (tutte le sedi)`
      : (tutteLeSedi.find((s) => s.id === a.sede_id)?.nome ?? '—')

  async function aggiungiAmbito() {
    const [tipo, id] = scelta.split(':')
    await aggiungi.mutateAsync({ profile_id: utente.id, ...(tipo === 'citta' ? { citta_id: id } : { sede_id: id }) })
    setScelta('')
  }

  async function cambia(patch: Partial<Pick<Profile, 'attivo' | 'is_admin'>>) {
    await aggiorna.mutateAsync({ id: utente.id, ...patch })
    snackbar('Utente aggiornato')
  }

  const giaAssegnato = (valore: string) =>
    ambiti.some((a) => (a.citta_id ? `citta:${a.citta_id}` : `sede:${a.sede_id}`) === valore)

  return (
    <Dialog
      title={utente.nome_completo || utente.email || 'Utente'}
      variant="form"
      onClose={onClose}
      footer={
        <Button variant="text" onClick={onClose}>
          Chiudi
        </Button>
      }
    >
      <div className="space-y-5">
        {utente.email && <p className="text-body-m text-on-surface-variant">{utente.email}</p>}

        <div>
          <label className="-ml-2.5 flex cursor-pointer items-center gap-1 text-body-l text-on-surface">
            <Checkbox
              checked={utente.attivo}
              disabled={io || aggiorna.isPending}
              onChange={(e) => void cambia({ attivo: e.target.checked })}
            />
            Account attivo
          </label>
          <label className="-ml-2.5 flex cursor-pointer items-center gap-1 text-body-l text-on-surface">
            <Checkbox
              checked={utente.is_admin}
              disabled={io || aggiorna.isPending}
              onChange={(e) => void cambia({ is_admin: e.target.checked })}
            />
            Amministratore (tutte le sedi, gestione sedi e utenti)
          </label>
          {io && <p className="text-body-s text-on-surface-variant">Non puoi togliere a te stesso l’accesso admin.</p>}
        </div>

        <div className="space-y-3">
          <p className="text-title-s text-on-surface">Città e sedi su cui lavora</p>
          {ambiti.length === 0 && (
            <p className="text-body-m text-on-surface-variant">
              {utente.is_admin ? 'Come admin vede già tutte le sedi.' : 'Nessuna: l’utente non vede alcun dato.'}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {ambiti.map((a) => (
              <span
                key={a.id}
                className="inline-flex h-8 items-center gap-1 rounded-sm border border-outline pl-3 text-label-l text-on-surface-variant"
              >
                <Icon name={a.citta_id ? 'location_city' : 'location_on'} size={18} />
                {etichetta(a)}
                <IconButton
                  icon="close"
                  label={`Rimuovi ${etichetta(a)}`}
                  className="!h-8 !w-8"
                  disabled={rimuovi.isPending}
                  onClick={() => void rimuovi.mutateAsync(a.id)}
                />
              </span>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SelectField label="Aggiungi" dense className="flex-1" value={scelta} onChange={(e) => setScelta(e.target.value)}>
              <option value="">Scegli città o sede…</option>
              {citta.map((c) => (
                <optgroup key={c.id} label={c.nome}>
                  <option value={`citta:${c.id}`} disabled={giaAssegnato(`citta:${c.id}`)}>
                    {c.nome} — tutte le sedi (referente)
                  </option>
                  {tutteLeSedi
                    .filter((s) => s.citta_id === c.id)
                    .map((s) => (
                      <option key={s.id} value={`sede:${s.id}`} disabled={giaAssegnato(`sede:${s.id}`)}>
                        {s.nome}
                      </option>
                    ))}
                </optgroup>
              ))}
            </SelectField>
            <Button variant="tonal" icon="add" disabled={!scelta || aggiungi.isPending} onClick={() => void aggiungiAmbito()}>
              Aggiungi
            </Button>
          </div>
        </div>
        {(aggiorna.error || aggiungi.error || rimuovi.error) && <ErrorBanner message="Modifica non riuscita, riprova." />}
      </div>
    </Dialog>
  )
}

function TabUtenti() {
  const { data: profili, isLoading, error } = useProfili()
  const { data: ambiti } = useStaffAmbiti()
  const { tutteLeSedi, citta } = useSede()
  const [apertoId, setApertoId] = useState<string | null>(null)
  const aperto = profili?.find((p) => p.id === apertoId)

  const riassunto = (p: Profile) => {
    const miei = ambiti?.filter((a) => a.profile_id === p.id) ?? []
    if (p.is_admin) return 'Tutte le sedi'
    if (miei.length === 0) return 'Nessuna sede assegnata'
    return miei
      .map((a) =>
        a.citta_id
          ? `${citta.find((c) => c.id === a.citta_id)?.nome} (tutte)`
          : tutteLeSedi.find((s) => s.id === a.sede_id)?.nome,
      )
      .join(', ')
  }

  return (
    <div className="space-y-4">
      <InfoBanner>
        Un nuovo collega si invita da Supabase Dashboard → Authentication → Invite user; dopo il primo accesso compare qui e
        gli assegni città o sedi. Senza assegnazioni non vede alcun dato.
      </InfoBanner>
      {isLoading && <Spinner />}
      {error && <ErrorBanner message="Errore nel caricamento degli utenti." />}
      <Card className="!py-2">
        <List>
          {profili?.map((p) => (
            <ListItem
              key={p.id}
              onClick={() => setApertoId(p.id)}
              leading={<Icon name="account_circle" className="text-on-surface-variant" />}
              headline={p.nome_completo || p.email}
              supporting={riassunto(p)}
              trailing={
                <>
                  {p.is_admin && <Badge color="primary">Admin</Badge>}
                  {!p.attivo && <Badge color="neutral">Disattivato</Badge>}
                </>
              }
            />
          ))}
        </List>
      </Card>
      {aperto && (
        <UtenteDialog
          utente={aperto}
          ambiti={ambiti?.filter((a) => a.profile_id === aperto.id) ?? []}
          onClose={() => setApertoId(null)}
        />
      )}
    </div>
  )
}

export function AdminPage() {
  const { isAdmin } = useSede()
  const [tab, setTab] = useState<'sedi' | 'utenti'>('sedi')

  if (!isAdmin) {
    return (
      <Card>
        <EmptyState icon="admin_panel_settings">Questa sezione è riservata agli amministratori.</EmptyState>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Sedi e utenti" subtitle="Città, sedi e accessi dello staff" />
      <Tabs
        label="Sezioni admin"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'sedi', label: 'Sedi', icon: 'location_on' },
          { value: 'utenti', label: 'Utenti', icon: 'group' },
        ]}
      />
      {tab === 'sedi' ? <TabSedi /> : <TabUtenti />}
    </div>
  )
}
