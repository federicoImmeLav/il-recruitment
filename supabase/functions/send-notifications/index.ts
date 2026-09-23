// Invia le notifiche in coda (approvazione, rifiuto, reminder).
//
// Chiamata da:
//   - pg_cron ogni 5 minuti (0007_cron_notifiche.sql), con header x-cron-secret;
//   - l'area staff subito dopo un'approvazione/rifiuto, con il JWT dell'operatore
//     (verificato: deve essere staff attivo).

import { createClient } from 'npm:@supabase/supabase-js@2'
import { CORS_HEADERS, adminClient, segretoValido } from '../_shared/util.ts'
import { invia, type NotificaDaInviare } from '../_shared/canali.ts'

const MAX_TENTATIVI = 5

async function autorizzato(req: Request) {
  if (segretoValido(req.headers.get('x-cron-secret'), Deno.env.get('NOTIFICHE_CRON_SECRET'))) return true
  const authorization = req.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return false
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  })
  const { data } = await client.rpc('is_staff')
  return data === true
}

function risposta(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return risposta({ error: 'Metodo non consentito' }, 405)
  if (!(await autorizzato(req))) return risposta({ error: 'Non autorizzato' }, 401)

  const db = adminClient()
  const { data: notifiche, error } = await db.rpc('prendi_notifiche_da_inviare', { p_limite: 50 })
  if (error) return risposta({ error: error.message }, 500)

  let inviate = 0
  let errori = 0
  for (const n of (notifiche ?? []) as (NotificaDaInviare & { tentativi: number })[]) {
    let esito
    try {
      esito = await invia(n)
    } catch (e) {
      esito = { ok: false as const, errore: e instanceof Error ? e.message : String(e), definitivo: false }
    }

    if (esito.ok) {
      inviate++
      await db
        .from('notifiche')
        .update({ stato: 'inviata', sent_at: new Date().toISOString(), errore: null, in_invio_at: null })
        .eq('id', n.id)
    } else {
      errori++
      const definitivo = esito.definitivo || n.tentativi >= MAX_TENTATIVI
      await db
        .from('notifiche')
        .update({ stato: definitivo ? 'errore' : 'in_coda', errore: esito.errore, in_invio_at: null })
        .eq('id', n.id)
    }
  }

  return risposta({ elaborate: notifiche?.length ?? 0, inviate, errori })
})
