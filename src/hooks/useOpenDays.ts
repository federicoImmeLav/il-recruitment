import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { OpenDay, OpenDayPublic } from '../types/database.types'

/** Elenco completo, solo staff (RLS: is_staff()). */
export function useOpenDays(edizioneId?: string) {
  return useQuery({
    queryKey: ['open_days', edizioneId ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('open_days').select('*').order('data', { ascending: true })
      if (edizioneId) query = query.eq('edizione_id', edizioneId)
      const { data, error } = await query
      if (error) throw error
      return data as OpenDay[]
    },
  })
}

/** Un singolo open day, letto con privilegi staff (usato nel pannello di gestione). */
export function useOpenDay(openDayId: string | undefined) {
  return useQuery({
    queryKey: ['open_day', openDayId],
    enabled: !!openDayId,
    queryFn: async () => {
      const { data, error } = await supabase.from('open_days').select('*').eq('id', openDayId!).single()
      if (error) throw error
      return data as OpenDay
    },
  })
}

/** Solo gli open day aperti, colonne pubbliche — usato dal form di registrazione (anon). */
export function useOpenDaysPublic() {
  return useQuery({
    queryKey: ['open_days_public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('open_days')
        .select('id, edizione_id, data, ora, posti_max, tipo, stato')
        .eq('stato', 'aperto')
        .order('data', { ascending: true })
      if (error) throw error
      return data as OpenDayPublic[]
    },
  })
}

export function useOpenDayPublic(openDayId: string | undefined) {
  return useQuery({
    queryKey: ['open_day_public', openDayId],
    enabled: !!openDayId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('open_days')
        .select('id, edizione_id, data, ora, posti_max, tipo, stato')
        .eq('id', openDayId!)
        .single()
      if (error) throw error
      return data as OpenDayPublic
    },
  })
}

export function usePostiDisponibili(openDayId: string | undefined) {
  return useQuery({
    queryKey: ['posti_disponibili', openDayId],
    enabled: !!openDayId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('posti_disponibili', { p_open_day_id: openDayId! })
      if (error) throw error
      return data as number
    },
  })
}

export function useCreateOpenDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      input: Pick<OpenDay, 'edizione_id' | 'data' | 'ora' | 'posti_max' | 'tipo' | 'stato'> &
        Partial<Pick<OpenDay, 'operatore_id' | 'note'>>,
    ) => {
      const { data, error } = await supabase.from('open_days').insert(input).select().single()
      if (error) throw error
      return data as OpenDay
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['open_days'] }),
  })
}

export function useUpdateOpenDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<OpenDay> & { id: string }) => {
      const { data, error } = await supabase.from('open_days').update(patch).eq('id', id).select().single()
      if (error) throw error
      return data as OpenDay
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['open_days'] }),
  })
}
