import type { ReactNode } from 'react'
import { CANALE_CONOSCENZA_OPTIONS, dicituraCorso } from '../../lib/constants'
import type { Corso } from '../../types/database.types'
import { InformativaImmagini, InformativaPrivacy } from './informative'
import { CONSENSI_FOTO, TITOLARE_FIRMA, testoDichiarazioneSingoloGenitore } from './consensi'
import { LUOGO_FIRMA, annualitaIscrizione, type MdiFormValues, type SiNo } from './mdiFormTypes'

// Modulo MDI stampabile per la firma olografa, ricalcato su buildPrint() del
// vecchio IL_Kiosk_MDI_v5. Visibile solo in stampa (classi `.mdi-print*` in index.css).

const box = (checked: boolean) => (checked ? '☑' : '☐')

function fmtData(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function Campo({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`mdi-print-campo ${className}`}>{children || ' '}</span>
}

function Firma({ oggi, label = 'Firma leggibile del genitore (o di chi ne ha la rappresentanza)' }: { oggi: string; label?: string }) {
  return (
    <div className="mdi-print-firma">
      <div>
        {LUOGO_FIRMA}, il <strong>{oggi}</strong>
      </div>
      <div className="mdi-print-firma-linea">
        {label}
        <div />
      </div>
    </div>
  )
}

function FirmaTitolare({ oggi }: { oggi: string }) {
  return (
    <div className="mdi-print-firma">
      <div className="mdi-print-firma-linea">
        <em>Il Titolare del trattamento</em>
        <br />
        <strong>{TITOLARE_FIRMA}</strong>
        <div />
      </div>
      <div>
        {LUOGO_FIRMA}, il <strong>{oggi}</strong>
      </div>
    </div>
  )
}

function SiNoBox({ v }: { v: SiNo }) {
  return (
    <>
      {box(v === 'si')} <strong>SÌ</strong>&nbsp; {box(v === 'no')} <strong>NO</strong>&nbsp;&nbsp;
    </>
  )
}

export function MdiPrintDocument({ v, corsi }: { v: MdiFormValues; corsi: Corso[] }) {
  const oggi = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const acc = `${v.acc_cognome} ${v.acc_nome}`.trim()
  const prefs = [v.corso_pref1_id, v.corso_pref2_id, v.corso_pref3_id]
  const domicilio = v.all_domicilio_diverso
    ? [v.all_domicilio_via, v.all_domicilio_citta, v.all_domicilio_prov, v.all_domicilio_cap].filter(Boolean).join(', ')
    : ''

  return (
    <div className="mdi-print">
      <div className="mdi-print-header">
        <img src="/logo-il.jpg" alt="Immaginazione e Lavoro" />
      </div>

      {/* PAGINA 1 — Manifestazione di interesse */}
      <div className="mdi-print-body">
        <h1 className="mdi-print-titolo">Manifestazione di Interesse al Corso</h1>
        <p>
          Il/la sottoscritto/a <Campo className="w-lg">{acc}</Campo> in qualità di {box(v.acc_qualita === 'genitore')}{' '}
          Genitore {box(v.acc_qualita === 'tutore')} Tutore
        </p>
        <p>
          Del ragazzo/a <Campo className="w-lg">{`${v.all_cognome} ${v.all_nome}`}</Campo>
        </p>
        <p>
          Nato/a a <Campo>{v.all_nato_a}</Campo> il <Campo>{fmtData(v.all_data_nascita)}</Campo> Cittadinanza{' '}
          <Campo>{v.all_cittadinanza}</Campo>
        </p>
        <p>
          Residente in Via <Campo className="w-lg">{v.all_residenza_via}</Campo> Città <Campo>{v.all_residenza_citta}</Campo>{' '}
          Prov <Campo>{v.all_residenza_prov.toUpperCase()}</Campo> CAP <Campo>{v.all_residenza_cap}</Campo>
        </p>
        {domicilio && (
          <p>
            Domiciliato in <Campo className="w-lg">{domicilio}</Campo>
          </p>
        )}
        <p>
          Scuola di provenienza <Campo className="w-lg">{v.all_scuola_provenienza}</Campo> Ann. / Sez.{' '}
          <Campo>{`${v.all_annualita}°${v.all_sezione ? ` — ${v.all_sezione}` : ''}`}</Campo>
        </p>
        <p>
          Cellulare genitore <Campo>{v.acc_cellulare}</Campo> E-mail genitore <Campo className="w-lg">{v.acc_email}</Campo>
        </p>

        <p className="mdi-print-blocco">
          <strong>COME SIETE VENUTI A CONOSCENZA DELLA NOSTRA SCUOLA:</strong>
          <br />
          {CANALE_CONOSCENZA_OPTIONS.filter((o) => o.key !== 'canale_altro').map((o) => (
            <span key={o.key}>
              {box(v[o.key])} {o.label.toUpperCase()}&nbsp;&nbsp;{' '}
            </span>
          ))}
          {box(v.canale_altro)} ALTRO: <Campo>{v.canale_altro ? v.canale_altro_testo : ''}</Campo>
        </p>

        <p className="mdi-print-blocco">
          <strong>Il/la sottoscritto/a dichiara che il proprio figlio/a ha/sta usufruendo di sostegno scolastico:</strong>
          <br />
          {box(v.sostegno_stato === 'passato')} Ha usufruito in passato &nbsp;&nbsp;{box(v.sostegno_stato === 'presente')} Sta
          usufruendo &nbsp;&nbsp;{box(v.sostegno_stato === 'mai')} Nessuna delle precedenti
        </p>

        <h2 className="mdi-print-sezione">Dichiara che il proprio figlio/a è in possesso delle seguenti certificazioni:</h2>
        <div className="mdi-print-lista">
          {box(v.sostegno_asl)} COLLEGIO ASL – Certifica la necessità di avere l'insegnante di sostegno
          <br />
          {box(v.sostegno_diagnosi_funzionale)} DIAGNOSI FUNZIONALE MEDICA
          <br />
          {box(v.sostegno_bes)} BES – Bisogno Educativo Speciale
          <br />
          {box(v.sostegno_dsa)} DSA – Disturbi Specifici dell'Apprendimento
          <br />
          {box(v.cert_nessuna)} NESSUNA DELLE PRECEDENTI
        </div>

        <h2 className="mdi-print-sezione">
          Dichiara di essere interessato, per l'annualità {annualitaIscrizione()}, all'iscrizione al corso (in ordine di
          priorità):
        </h2>
        <div className="mdi-print-lista">
          {corsi.map((c) => {
            const p = prefs.indexOf(c.id) + 1
            return (
              <div key={c.id}>
                {p > 0 ? <strong>{p}.</strong> : '☐'} {dicituraCorso(c, 'modulo')}
              </div>
            )
          })}
        </div>
        <Firma oggi={oggi} />

        {/* PAGINA 2 — Informativa privacy + consensi A/B */}
        <div className="mdi-print-pagina">
          <h1 className="mdi-print-titolo small">
            Informativa all'interessato (studenti)
            <br />
            Art. 13 del Regolamento (UE) 27 aprile 2016, n. 679
          </h1>
          <div className="mdi-print-testo">
            <InformativaPrivacy />
          </div>
          <FirmaTitolare oggi={oggi} />
          <div className="mdi-print-box">
            Il/la sottoscritto/a <strong>{acc}</strong>, presa visione e ricevuta copia dell'informativa sopra riportata,{' '}
            <strong>esprime il proprio consenso</strong>:
            <br />
            <br />
            <SiNoBox v={v.consenso_privacy_a} /> al trattamento dei dati personali e sensibili per le finalità di cui alla
            lettera <strong>A)</strong>
            <br />
            <br />
            <SiNoBox v={v.consenso_privacy_b} /> al trattamento dei dati personali per le finalità di cui alla lettera{' '}
            <strong>B)</strong>
          </div>
          <Firma oggi={oggi} />
        </div>

        {/* PAGINA 3 — Informativa immagini + autorizzazioni + dichiarazione singolo genitore */}
        <div className="mdi-print-pagina">
          <h1 className="mdi-print-titolo small">
            Autorizzazione trattamento dati
            <br />
            Utilizzo registrazioni vocali, filmati e immagini
            <br />
            Informativa all'interessato — Art. 13 del Regolamento (UE) 27 aprile 2016, n. 679
          </h1>
          <div className="mdi-print-testo">
            <InformativaImmagini />
          </div>
          <FirmaTitolare oggi={oggi} />
          <div className="mdi-print-box">
            <div className="mdi-print-box-titolo">Autorizzazione per la pubblicazione di fotografie e videoriprese</div>
            Il/la sottoscritto/a <strong>{acc}</strong>, preso atto dell'informativa ricevuta ai sensi dell'art. 13 del Reg.
            (UE) 2016/679, con la presente <strong>AUTORIZZA</strong> i Titolari del trattamento:
            <div className="mdi-print-lista">
              {CONSENSI_FOTO.map((c) => (
                <div key={c.key}>
                  <SiNoBox v={v[c.key]} /> {c.prep} <strong>{c.verbo}</strong> {c.testo}
                </div>
              ))}
            </div>
          </div>
          <Firma oggi={oggi} />

          {v.acc_qualita === 'genitore' && (
            <div className="mdi-print-box">
              <strong>Dichiarazione da rilasciare in caso di firma di un solo genitore:</strong>
              <br />
              <br />
              {testoDichiarazioneSingoloGenitore(acc)}
              <Firma oggi={oggi} label="Firma leggibile del genitore" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
