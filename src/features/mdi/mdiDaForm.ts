import type { CreateMdiInput } from '../../hooks/useMdi'
import type { MdiFormValues } from './mdiFormTypes'

const t = (s: string) => s.trim()
const tn = (s: string) => s.trim() || null
const up = (s: string) => s.trim().toUpperCase() || null
/** Il vincolo in 0008 accetta solo 16 caratteri A-Z/0-9: via spazi, maiuscolo. */
const cf = (s: string) => s.replace(/\s/g, '').toUpperCase() || null

/** Converte i valori del form kiosk nella riga `mdi` da inserire. */
export function mdiDaForm(
  v: MdiFormValues,
  ctx: { openDayId: string | null; bookingId: string | null },
): CreateMdiInput {
  // Preferenze senza duplicati, compattate in ordine.
  const prefs = [...new Set([v.corso_pref1_id, v.corso_pref2_id, v.corso_pref3_id].filter(Boolean))]
  const allEstero = v.all_nascita === 'estero'
  const accEstero = v.acc_nascita === 'estero'
  const dom = v.all_domicilio_diverso
  const accRes = !v.acc_residenza_come_allievo

  return {
    open_day_id: ctx.openDayId,
    booking_id: ctx.bookingId,

    acc_cognome: t(v.acc_cognome),
    acc_nome: t(v.acc_nome),
    acc_qualita: v.acc_qualita as 'genitore' | 'tutore',
    acc_cellulare: t(v.acc_cellulare),
    acc_email: t(v.acc_email),
    acc_email_2: tn(v.acc_email_2),
    acc_codice_fiscale: cf(v.acc_codice_fiscale),
    acc_data_nascita: v.acc_data_nascita || null,
    acc_sesso: v.acc_sesso || null,
    acc_nato_estero: accEstero,
    acc_comune_nascita: accEstero ? null : tn(v.acc_comune_nascita),
    acc_comune_nascita_cod: accEstero ? null : tn(v.acc_comune_nascita_cod),
    acc_stato_nascita: accEstero ? tn(v.acc_stato_nascita) : null,
    acc_cittadinanza: tn(v.acc_cittadinanza),
    acc_residenza_come_allievo: !accRes,
    acc_residenza_via: accRes ? tn(v.acc_residenza_via) : null,
    acc_residenza_citta: accRes ? tn(v.acc_residenza_citta) : null,
    acc_residenza_comune_cod: accRes ? tn(v.acc_residenza_comune_cod) : null,
    acc_residenza_prov: accRes ? up(v.acc_residenza_prov) : null,
    acc_residenza_cap: accRes ? tn(v.acc_residenza_cap) : null,

    all_cognome: t(v.all_cognome),
    all_nome: t(v.all_nome),
    all_codice_fiscale: cf(v.all_codice_fiscale),
    all_sesso: v.all_sesso || null,
    all_data_nascita: v.all_data_nascita,
    all_annualita: Number(v.all_annualita),
    all_sezione: v.all_sezione || null,
    all_nato_estero: allEstero,
    // "Nato/a a": comune, o paese se nato all'estero (usato anche nella stampa).
    all_nato_a: allEstero ? t(v.all_stato_nascita) : t(v.all_nato_a),
    all_comune_nascita_cod: allEstero ? null : tn(v.all_comune_nascita_cod),
    all_stato_nascita: allEstero ? tn(v.all_stato_nascita) : null,
    all_cittadinanza: t(v.all_cittadinanza),
    all_cittadinanza_2: tn(v.all_cittadinanza_2),
    all_scuola_provenienza: tn(v.all_scuola_provenienza),
    all_scuola_provenienza_cod: tn(v.all_scuola_provenienza_cod),
    all_residenza_via: t(v.all_residenza_via),
    all_residenza_citta: t(v.all_residenza_citta),
    all_residenza_comune_cod: tn(v.all_residenza_comune_cod),
    all_residenza_prov: up(v.all_residenza_prov),
    all_residenza_cap: tn(v.all_residenza_cap),
    all_domicilio_diverso: dom,
    all_domicilio_via: dom ? tn(v.all_domicilio_via) : null,
    all_domicilio_citta: dom ? tn(v.all_domicilio_citta) : null,
    all_domicilio_comune_cod: dom ? tn(v.all_domicilio_comune_cod) : null,
    all_domicilio_prov: dom ? up(v.all_domicilio_prov) : null,
    all_domicilio_cap: dom ? tn(v.all_domicilio_cap) : null,

    corso_pref1_id: prefs[0] ?? null,
    corso_pref2_id: prefs[1] ?? null,
    corso_pref3_id: prefs[2] ?? null,
    sostegno_stato: v.sostegno_stato || 'mai',
    sostegno_asl: v.sostegno_asl,
    sostegno_diagnosi_funzionale: v.sostegno_diagnosi_funzionale,
    sostegno_bes: v.sostegno_bes,
    sostegno_dsa: v.sostegno_dsa,
    canale_orientamento_scuola: v.canale_orientamento_scuola,
    canale_open_day: v.canale_open_day,
    canale_ricerca_online: v.canale_ricerca_online,
    canale_passaparola: v.canale_passaparola,
    canale_altro: v.canale_altro,
    canale_altro_testo: v.canale_altro ? tn(v.canale_altro_testo) : null,
    consenso_privacy_a: v.consenso_privacy_a === 'si',
    consenso_privacy_b: v.consenso_privacy_b === 'si',
    consenso_foto_realizzare: v.consenso_foto_realizzare === 'si',
    consenso_foto_utilizzare: v.consenso_foto_utilizzare === 'si',
    consenso_foto_comunicare: v.consenso_foto_comunicare === 'si',
    // Nel modulo la dichiarazione per firma di un solo genitore compare solo se firma un genitore.
    dichiarazione_firma_genitore: v.acc_qualita === 'genitore',
  }
}
