import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Corso } from '../types/database.types'

/**
 * Corsi attivi di tutte le sedi: servono per i nomi (lookup per id) e per le
 * preferenze MDI cross-sede. Per l'elenco di una sede usare `corsiDellaSede`.
 */
export function useCorsi() {
  return useQuery({
    queryKey: ['corsi'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('corsi').select('*').eq('attivo', true).order('ordine')
      if (error) throw error
      return data as Corso[]
    },
  })
}

export function corsiDellaSede(corsi: Corso[] | undefined, sedeId: string | undefined) {
  return sedeId ? (corsi ?? []).filter((c) => c.sede_id === sedeId) : []
}

/** Tutti i corsi di una sede, anche disattivati (gestione in Impostazioni, solo staff). */
export function useCorsiGestione(sedeId: string | undefined) {
  return useQuery({
    queryKey: ['corsi', 'gestione', sedeId],
    enabled: !!sedeId,
    queryFn: async () => {
      const { data, error } = await supabase.from('corsi').select('*').eq('sede_id', sedeId!).order('ordine')
      if (error) throw error
      return data as Corso[]
    },
  })
}

export type CorsoModificabile = Pick<Corso, 'nome' | 'qualifica' | 'ordine' | 'attivo' | 'codice_ministeriale'>

/** Crea (senza id) o aggiorna un corso della sede; il codice ministeriale serve all'export INNOVAPLAN. */
export function useSalvaCorso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, sedeId, patch }: { id?: string; sedeId: string; patch: Partial<CorsoModificabile> }) => {
      const { error } = id
        ? await supabase.from('corsi').update(patch).eq('id', id)
        : await supabase.from('corsi').insert({ nome: '', qualifica: '', ...patch, sede_id: sedeId })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['corsi'] }),
  })
}
