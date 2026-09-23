import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Corso, OpenDayCorso } from '../types/database.types'
import { useCorsi } from './useCorsi'

export type IndirizzoOpenDay = { corso: Corso; posti_max: number | null }

/**
 * Indirizzi presentati in un Open Day, nell'ordine configurato. Se l'Open Day
 * non ha una configurazione (`configurati: false`) valgono tutti i corsi attivi.
 * Leggibile anche da anon per gli Open Day aperti (form pubblico).
 */
export function useOpenDayCorsi(openDayId: string | undefined) {
  const corsi = useCorsi()
  const righe = useQuery({
    queryKey: ['open_day_corsi', openDayId],
    enabled: !!openDayId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('open_day_corsi')
        .select('*')
        .eq('open_day_id', openDayId!)
        .order('ordine')
      if (error) throw error
      return data as OpenDayCorso[]
    },
  })

  const configurati = (righe.data?.length ?? 0) > 0
  const indirizzi: IndirizzoOpenDay[] | undefined =
    corsi.data && righe.data
      ? configurati
        ? righe.data.flatMap((r) => {
            const corso = corsi.data.find((c) => c.id === r.corso_id)
            return corso ? [{ corso, posti_max: r.posti_max }] : []
          })
        : corsi.data.map((corso) => ({ corso, posti_max: null }))
      : undefined

  return {
    indirizzi,
    configurati,
    isLoading: corsi.isLoading || righe.isLoading,
    error: corsi.error ?? righe.error,
  }
}

/** Configurazioni di tutti gli Open Day (solo staff), per i riepiloghi in elenco. */
export function useOpenDayCorsiTutti() {
  return useQuery({
    queryKey: ['open_day_corsi', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('open_day_corsi').select('*').order('ordine')
      if (error) throw error
      return data as OpenDayCorso[]
    },
  })
}

/** Sostituisce la configurazione indirizzi di un Open Day (lista vuota = tutti i corsi attivi). */
export function useImpostaCorsiOpenDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      openDayId,
      corsi,
    }: {
      openDayId: string
      corsi: { corso_id: string; posti_max: number | null }[]
    }) => {
      const { error } = await supabase.rpc('imposta_corsi_open_day', { p_open_day_id: openDayId, p_corsi: corsi })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['open_day_corsi'] }),
  })
}
