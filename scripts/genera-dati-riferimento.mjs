// Genera i dati di riferimento PUBBLICI usati dalla MDI e dall'export INNOVAPLAN:
//   src/data/comuni.json                 [nome, sigla provincia, codice catastale]   (ISTAT)
//   src/data/paesi.json                  [nome, codice catastale estero "Zxxx"]      (ISTAT via HL7 Italia)
//   src/data/scuole-medie-lombardia.json [codice meccanografico, denominazione, comune]  (MIUR open data)
//
// Uso:  node scripts/genera-dati-riferimento.mjs
// Da rilanciare quando cambiano i comuni o esce l'anagrafe scuole di un nuovo anno
// (aggiornare ANNO_MIUR). Nessun dato personale: solo elenchi pubblici.

import { mkdir, writeFile } from 'node:fs/promises'

const ANNO_MIUR = '20262720260901'
const FONTI = {
  comuni: 'https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv',
  paesi: 'https://www.hl7.it/fhir/base/CodeSystem-istat-unitaAmministrativeTerritorialiEstere.json',
  scuoleStatali: `https://dati.istruzione.it/opendata/opendata/catalogo/elements1/SCUANAGRAFESTAT${ANNO_MIUR}.csv`,
  scuolePar: `https://dati.istruzione.it/opendata/opendata/catalogo/elements1/SCUANAGRAFEPAR${ANNO_MIUR}.csv`,
}

/** Parser CSV minimale: virgolette, separatore configurabile, a capo dentro i campi. */
function parseCsv(text, sep) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === sep) {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += c
  }
  if (field || row.length) rows.push([...row, field])
  const [header, ...data] = rows.filter((r) => r.some((v) => v.trim()))
  const h = header.map((x) => x.replace(/\s+/g, ' ').trim())
  return data.map((r) => Object.fromEntries(h.map((k, i) => [k, (r[i] ?? '').trim()])))
}

async function scarica(url, encoding = 'utf-8') {
  const res = await fetch(url, { headers: { 'User-Agent': 'il-recruitment/genera-dati-riferimento' } })
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  const buf = await res.arrayBuffer()
  const text = new TextDecoder(encoding).decode(buf).replace(/^﻿/, '')
  if (text.trimStart().startsWith('<')) throw new Error(`${url}: ricevuta una pagina HTML invece dei dati`)
  return text
}

const titolo = (s) => s.toLowerCase().replace(/(^|[\s'’(-])(\p{L})/gu, (_, p, l) => p + l.toUpperCase())
const perNome = (a, b) => a[0].localeCompare(b[0], 'it')

async function comuni() {
  const rows = parseCsv(await scarica(FONTI.comuni, 'windows-1252'), ';')
  return rows
    .map((r) => [r['Denominazione in italiano'], r['Sigla automobilistica'], r['Codice Catastale del comune']])
    .filter(([n, , c]) => n && /^[A-Z]\d{3}$/.test(c))
    .sort(perNome)
}

async function paesi() {
  const json = JSON.parse(await scarica(FONTI.paesi))
  const out = []
  const visita = (concepts) => {
    for (const c of concepts ?? []) {
      const at = c.property?.find((p) => p.code === 'codice-AT')?.valueCode
      if (at && /^Z\d{3}$/.test(at)) out.push([c.display, at])
      visita(c.concept)
    }
  }
  visita(json.concept)
  return out.sort(perNome)
}

async function scuoleMedieLombardia() {
  const righe = [
    ...parseCsv(await scarica(FONTI.scuoleStatali), ','),
    ...parseCsv(await scarica(FONTI.scuolePar), ','),
  ]
  const visti = new Set()
  return righe
    .filter((r) => r.REGIONE === 'LOMBARDIA' && r.DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA.includes('PRIMO GRADO'))
    .filter((r) => !visti.has(r.CODICESCUOLA) && visti.add(r.CODICESCUOLA))
    .map((r) => [r.CODICESCUOLA, r.DENOMINAZIONESCUOLA, titolo(r.DESCRIZIONECOMUNE)])
    .sort((a, b) => a[2].localeCompare(b[2], 'it') || a[1].localeCompare(b[1], 'it'))
}

await mkdir(new URL('../src/data/', import.meta.url), { recursive: true })
for (const [file, genera] of [
  ['comuni.json', comuni],
  ['paesi.json', paesi],
  ['scuole-medie-lombardia.json', scuoleMedieLombardia],
]) {
  const dati = await genera()
  await writeFile(new URL(`../src/data/${file}`, import.meta.url), JSON.stringify(dati) + '\n')
  console.log(`${file}: ${dati.length} righe`)
}
