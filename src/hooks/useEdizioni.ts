import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Edizione } from '../types/database.types'

/** Edizioni della sede indicata, o di tutte le sedi dell'utente (RLS) se `sedeId` manca. */
export function useEdizioni(sedeId?: string) {
  return useQuery({
    queryKey: ['edizioni', sedeId ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('edizioni').select('*').order('anno', { ascending: false })
      if (sedeId) query = query.eq('sede_id', sedeId)
      const { data, error } = await query
      if (error) throw error
      return data as Edizione[]
    },
  })
}

export function useCreateEdizione() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Pick<Edizione, 'sede_id' | 'nome' | 'anno' | 'data_apertura' | 'data_chiusura' | 'stato'>) => {
      const { data, error } = await supabase.from('edizioni').insert(input).select().single()
      if (error) throw error
      return data as Edizione
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['edizioni'] }),
  })
}

export function useUpdateEdizione() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Edizione> & { id: string }) => {
      const { data, error } = await supabase.from('edizioni').update(patch).eq('id', id).select().single()
      if (error) throw error
      return data as Edizione
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['edizioni'] }),
  })
}
