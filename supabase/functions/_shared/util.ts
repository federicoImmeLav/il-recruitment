// Utility condivise dalle Edge Functions (runtime Deno di Supabase).
import { createClient } from 'npm:@supabase/supabase-js@2'

/** Client con service role: bypassa le RLS, usarlo SOLO lato server. */
export function adminClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY mancanti')
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Confronto a tempo costante, per non rivelare il segreto tramite i tempi di risposta. */
export function segretoValido(ricevuto: string | null, atteso: string | undefined) {
  if (!ricevuto || !atteso) return false
  const a = new TextEncoder().encode(ricevuto)
  const b = new TextEncoder().encode(atteso)
  let diff = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0)
  return diff === 0
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
