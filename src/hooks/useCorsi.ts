import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Corso } from '../types/database.types'

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

/** Codice ministeriale (IND_MINISTERIALE) di un corso, usato dall'export INNOVAPLAN. */
export function useUpdateCodiceCorso() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, codice_ministeriale }: { id: string; codice_ministeriale: string | null }) => {
      const { error } = await supabase.from('corsi').update({ codice_ministeriale }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['corsi'] }),
  })
}
