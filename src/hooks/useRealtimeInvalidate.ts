import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

/**
 * Sottoscrizione Supabase Realtime su `bookings`/`mdi` filtrata per open day:
 * invalida le query React Query interessate cosi' la dashboard di monitoraggio
 * si aggiorna da sola, senza polling, quando qualcuno registra/checka-in altrove.
 */
export function useRealtimeOpenDay(openDayId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!openDayId) return

    const channel = supabase
      .channel(`open_day_${openDayId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings', filter: `open_day_id=eq.${openDayId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['bookings', openDayId] })
          queryClient.invalidateQueries({ queryKey: ['posti_disponibili', openDayId] })
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mdi', filter: `open_day_id=eq.${openDayId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['mdi'] })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [openDayId, queryClient])
}
