import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Edizione } from '../types/database.types'

export function useEdizioni() {
  return useQuery({
    queryKey: ['edizioni'],
    queryFn: async () => {
      const { data, error } = await supabase.from('edizioni').select('*').order('anno', { ascending: false })
      if (error) throw error
      return data as Edizione[]
    },
  })
}

export function useCreateEdizione() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: Pick<Edizione, 'nome' | 'anno' | 'data_apertura' | 'data_chiusura' | 'stato'>) => {
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
