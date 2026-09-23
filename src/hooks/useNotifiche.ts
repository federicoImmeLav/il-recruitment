import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { GoogleFormImportLog, Impostazioni, Notifica } from '../types/database.types'
import { inviaCodaNotifiche } from './useBookings'

/** Notifiche (conferme, rifiuti, promemoria) di un Open Day, solo staff. */
export function useNotifiche(openDayId: string | undefined) {
  return useQuery({
    queryKey: ['notifiche', openDayId],
    enabled: !!openDayId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifiche')
        .select('*')
        .eq('open_day_id', openDayId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Notifica[]
    },
  })
}

/** Segna come inviata una notifica WhatsApp manuale, o rimette in coda una notifica in errore. */
export function useAggiornaNotifica() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ notifica, azione }: { notifica: Notifica; azione: 'inviata' | 'riprova' }) => {
      const patch =
        azione === 'inviata'
          ? { stato: 'inviata' as const, sent_at: new Date().toISOString(), errore: null }
          : { stato: 'in_coda' as const, errore: null }
      const { error } = await supabase.from('notifiche').update(patch).eq('id', notifica.id)
      if (error) throw error
      if (azione === 'riprova') await inviaCodaNotifiche()
      return notifica
    },
    onSuccess: (notifica) => queryClient.invalidateQueries({ queryKey: ['notifiche', notifica.open_day_id] }),
  })
}

export function useImpostazioni() {
  return useQuery({
    queryKey: ['impostazioni'],
    queryFn: async () => {
      const { data, error } = await supabase.from('impostazioni').select('*').eq('id', 1).single()
      if (error) throw error
      return data as Impostazioni
    },
  })
}

export function useUpdateImpostazioni() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Omit<Impostazioni, 'id' | 'updated_at'>>) => {
      const { error } = await supabase.from('impostazioni').update(patch).eq('id', 1)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['impostazioni'] }),
  })
}

/** Ultime risposte ricevute dal Google Modulo, con esito dell'import. */
export function useImportLog() {
  return useQuery({
    queryKey: ['google_form_import_log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('google_form_import_log')
        .select('*')
        .order('ricevuto_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as GoogleFormImportLog[]
    },
  })
}
