import { useFormContext } from 'react-hook-form'
import { InformativaImmagini, InformativaPrivacy } from '../informative'
import { CONSENSI_FOTO, CONSENSI_PRIVACY, TITOLARE_FIRMA, testoDichiarazioneSingoloGenitore } from '../consensi'
import { Accordion, FirmaPromemoria, KioskSection, SiNoField } from '../kioskUi'
import type { MdiFormValues } from '../mdiFormTypes'

const scelta = { required: 'Indica SÌ o NO' }

export function StepPrivacy() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<MdiFormValues>()
  const [accCognome, accNome, qualita] = watch(['acc_cognome', 'acc_nome', 'acc_qualita'])
  const accompagnatore = `${accCognome} ${accNome}`.trim()

  return (
    <div className="space-y-5">
      <KioskSection title="Informativa all'interessato (studenti) — Art. 13 Reg. UE 2016/679">
        <Accordion title="📄 Leggi il testo integrale dell'informativa sulla privacy">
          <InformativaPrivacy />
          <p>
            <em>Il Titolare del trattamento</em>
            <br />
            <strong>{TITOLARE_FIRMA}</strong>
          </p>
        </Accordion>
        {CONSENSI_PRIVACY.map((c) => (
          <SiNoField key={c.key} error={errors[c.key]} inputProps={register(c.key, scelta)}>
            <strong>{c.lettera}</strong> {c.testo}
          </SiNoField>
        ))}
        <FirmaPromemoria nome={accompagnatore} />
      </KioskSection>

      <KioskSection title="Utilizzo registrazioni vocali, filmati e immagini — Art. 13 Reg. UE 2016/679">
        <Accordion title="📷 Leggi il testo integrale dell'informativa sull'utilizzo di immagini e riprese">
          <InformativaImmagini />
          <p>
            <em>Il Titolare del trattamento</em>
            <br />
            <strong>{TITOLARE_FIRMA}</strong>
          </p>
        </Accordion>
        <p className="text-sm font-bold">
          Il/la sottoscritto/a <span className="text-blue">{accompagnatore || '—'}</span>, preso atto dell'informativa,
          con la presente <strong>AUTORIZZA</strong> i Titolari del trattamento:
        </p>
        {CONSENSI_FOTO.map((c) => (
          <SiNoField key={c.key} error={errors[c.key]} inputProps={register(c.key, scelta)}>
            {c.prep} <strong>{c.verbo}</strong> {c.testo}
          </SiNoField>
        ))}
        <FirmaPromemoria nome={accompagnatore} />
      </KioskSection>

      {qualita === 'genitore' && (
        <KioskSection title="Dichiarazione in caso di firma di un solo genitore">
          <div className="rounded-il border-[1.5px] border-[#f0c800] bg-[#fffbf0] px-4 py-4 text-sm leading-relaxed">
            <p>{testoDichiarazioneSingoloGenitore(accompagnatore || '—')}</p>
          </div>
          <p className="text-xs text-text3">Da firmare sulla copia stampata solo se firma un solo genitore.</p>
        </KioskSection>
      )}
    </div>
  )
}
