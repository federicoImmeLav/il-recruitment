import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { OpenDay, OpenDayPublic } from '../types/database.types'

/** Elenco staff (RLS: solo le sedi dell'utente), filtrabile per edizione o sede. */
export function useOpenDays({ edizioneId, sedeId }: { edizioneId?: string; sedeId?: string } = {}) {
  return useQuery({
    queryKey: ['open_days', edizioneId ?? 'all', sedeId ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('open_days').select('*').order('data', { ascending: true })
      if (edizioneId) query = query.eq('edizione_id', edizioneId)
      if (sedeId) query = query.eq('sede_id', sedeId)
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

const COLONNE_PUBBLICHE = 'id, edizione_id, sede_id, data, ora, posti_max, tipo, stato'

/** Solo gli open day aperti di una sede, colonne pubbliche — usato dal kiosk (anon). */
export function useOpenDaysPublic(sedeId: string | undefined) {
  return useQuery({
    queryKey: ['open_days_public', sedeId],
    enabled: !!sedeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('open_days')
        .select(COLONNE_PUBBLICHE)
        .eq('stato', 'aperto')
        .eq('sede_id', sedeId!)
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
        .select(COLONNE_PUBBLICHE)
        .eq('id', openDayId!)
        .single()
      if (error) throw error
      return data as OpenDayPublic
    },
  })
}

export function useCreateOpenDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (
      input: Pick<OpenDay, 'edizione_id' | 'data' | 'ora' | 'posti_max' | 'tipo' | 'stato'> &
        Partial<Pick<OpenDay, 'operatore_id' | 'note' | 'etichetta_modulo' | 'luogo_override'>>,
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
