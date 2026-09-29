import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Citta, Profile, Sede, SedePublic, StaffAmbito, StatisticheSede } from '../types/database.types'

export type SedeModificabile = Partial<Omit<Sede, 'id' | 'created_at' | 'updated_at'>>

const COLONNE_SEDE_PUBBLICHE ='id, citta_id, nome, slug, attiva, ordine, luogo, indicazioni, luogo_firma'

export function useCitta() {
  return useQuery({
    queryKey: ['citta'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('citta').select('*').order('nome')
      if (error) throw error
      return data as Citta[]
    },
  })
}

/** Tutte le sedi con la configurazione completa (RLS: solo staff). */
export function useSedi() {
  return useQuery({
    queryKey: ['sedi'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('sedi').select('*').order('ordine').order('nome')
      if (error) throw error
      return data as Sede[]
    },
  })
}

/** Sedi attive, solo colonne pubbliche: kiosk e form pubblici (anon). */
export function useSediPubbliche() {
  return useQuery({
    queryKey: ['sedi_public'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sedi')
        .select(COLONNE_SEDE_PUBBLICHE)
        .eq('attiva', true)
        .order('ordine')
        .order('nome')
      if (error) throw error
      return data as SedePublic[]
    },
  })
}

/** Id delle sedi su cui l'utente loggato ha accesso (admin = tutte). */
export async function fetchSediAccessibili() {
  const { data, error } = await supabase.rpc('sedi_accessibili')
  if (error) throw error
  return (data ?? []) as string[]
}

export function useSalvaSede() {
  const queryClient = useQueryClient()
  return useMutation({
    /** Senza `id` crea una sede nuova (solo admin, RLS). */
    mutationFn: async ({ id, patch }: { id?: string; patch: SedeModificabile }) => {
      const query = id
        ? supabase.from('sedi').update(patch).eq('id', id)
        : supabase.from('sedi').insert(patch as SedeModificabile & Pick<Sede, 'citta_id' | 'nome' | 'slug'>)
      const { data, error } = await query.select().single()
      if (error) throw error
      return data as Sede
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sedi'] })
      queryClient.invalidateQueries({ queryKey: ['sedi_public'] })
      queryClient.invalidateQueries({ queryKey: ['sedi_accessibili'] })
    },
  })
}

export function useCreaCitta() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Pick<Citta, 'nome' | 'slug' | 'regione'>) => {
      const { data, error } = await supabase.from('citta').insert(input).select().single()
      if (error) throw error
      return data as Citta
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['citta'] }),
  })
}

// --- Utenti staff e ambiti (pagina admin) ------------------------------------

export function useProfili() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('nome_completo')
      if (error) throw error
      return data as Profile[]
    },
  })
}

export function useStaffAmbiti() {
  return useQuery({
    queryKey: ['staff_ambiti'],
    queryFn: async () => {
      const { data, error } = await supabase.from('staff_ambiti').select('*')
      if (error) throw error
      return data as StaffAmbito[]
    },
  })
}

export function useAggiornaProfilo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Pick<Profile, 'id'> & Partial<Pick<Profile, 'nome_completo' | 'attivo' | 'is_admin'>>) => {
      const { error } = await supabase.from('profiles').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  })
}

export function useAggiungiAmbito() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { profile_id: string; citta_id?: string; sede_id?: string }) => {
      const { error } = await supabase.from('staff_ambiti').insert(input)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff_ambiti'] }),
  })
}

export function useRimuoviAmbito() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('staff_ambiti').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff_ambiti'] }),
  })
}

// --- Dashboard comparativa ---------------------------------------------------

export function useStatisticheSedi(anno: string | null) {
  return useQuery({
    queryKey: ['statistiche_sedi', anno],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('statistiche_sedi', { p_anno: anno })
      if (error) throw error
      return (data ?? []) as StatisticheSede[]
    },
  })
}
