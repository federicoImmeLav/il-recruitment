import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Material Symbols e' caricato da Google Fonts con il solo sottoinsieme `icon_names` elencato in
// index.html: un'icona usata nel codice ma assente dall'elenco comparirebbe come testo.

const radice = join(__dirname, '..', '..', '..')

function fileTsx(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) return fileTsx(p)
    return p.endsWith('.tsx') ? [p] : []
  })
}

function iconeUsate(): Set<string> {
  const nomi = new Set<string>()
  for (const f of fileTsx(join(radice, 'src'))) {
    const s = readFileSync(f, 'utf-8')
    for (const m of s.matchAll(/\b(?:icon|trailingIcon|name)="([a-z_]+)"/g)) nomi.add(m[1])
    for (const m of s.matchAll(/\b(?:icon|trailingIcon|name)=\{([^}]*)\}/g))
      for (const q of m[1].matchAll(/'([a-z_]+)'/g)) nomi.add(q[1])
    for (const m of s.matchAll(/\bicon(?::| =) '([a-z_]+)'/g)) nomi.add(m[1])
  }
  return nomi
}

function iconeCaricate(): string[] {
  const html = readFileSync(join(radice, 'index.html'), 'utf-8')
  const m = html.match(/icon_names=([a-z_,]+)/)
  return m ? m[1].split(',') : []
}

describe('icone Material Symbols', () => {
  it('ogni icona usata nel codice è nel sottoinsieme caricato in index.html', () => {
    const caricate = new Set(iconeCaricate())
    const mancanti = [...iconeUsate()].filter((n) => !caricate.has(n)).sort()
    expect(mancanti).toEqual([])
  })

  it("l'elenco icon_names è in ordine alfabetico (richiesto da Google Fonts)", () => {
    const elenco = iconeCaricate()
    expect(elenco).toEqual([...elenco].sort())
  })
})
