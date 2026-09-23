import { useQuery } from '@tanstack/react-query'
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
