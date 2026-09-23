import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'
import { mockSupabase } from './demo/mockSupabase'

/**
 * Modalita' demo (`npm run demo`): client finto in memoria con dati di esempio e
 * sessione staff simulata, per vedere la UI senza un progetto Supabase. Attiva solo
 * col dev server (import.meta.env.DEV), mai in una build di produzione.
 */
export const isDemoMode = import.meta.env.DEV && import.meta.env.MODE === 'demo'

function createRealClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Variabili VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY mancanti. Copia .env.example in .env.local e compilalo (oppure usa `npm run demo`).',
    )
  }
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

export const supabase: SupabaseClient<Database> = isDemoMode
  ? (mockSupabase as unknown as SupabaseClient<Database>)
  : createRealClient()
