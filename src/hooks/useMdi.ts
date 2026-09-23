import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { KioskDatiIscritto, KioskIscritto, Mdi } from '../types/database.types'

interface MdiFilters {
  openDayId?: string
  soloDaEsportare?: boolean
  ricerca?: string
}

export function useMdiList(filters: MdiFilters = {}) {
  return useQuery({
    queryKey: ['mdi', filters],
    queryFn: async () => {
      let query = supabase.from('mdi').select('*').order('created_at', { ascending: false })
      if (filters.openDayId) query = query.eq('open_day_id', filters.openDayId)
      if (filters.soloDaEsportare) query = query.eq('esportato_innovaplan', false)
      if (filters.ricerca) {
        query = query.or(`all_cognome.ilike.%${filters.ricerca}%,all_nome.ilike.%${filters.ricerca}%`)
      }
      const { data, error } = await query
      if (error) throw error
      return data as Mdi[]
    },
  })
}

export function useMdiDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['mdi_detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('mdi').select('*').eq('id', id!).single()
      if (error) throw error
      return data as Mdi
    },
  })
}

export type CreateMdiInput = Omit<
  Mdi,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'esportato_innovaplan'
  | 'esportato_innovaplan_at'
  | 'esportato_innovaplan_by'
  | 'stato_lavorazione'
>

/**
 * Insert senza `.select()`: il kiosk gira come anon, che per RLS puo' inserire
 * una MDI ma non rileggerla (nemmeno quella appena creata).
 */
export function useCreateMdi() {
  return useMutation({
    mutationFn: async (input: CreateMdiInput) => {
      const { error } = await supabase.from('mdi').insert(input)
      if (error) throw error
    },
  })
}

/** Ricerca iscritti presenti oggi all'open day (RPC pubblica, vedi 0004_kiosk_mdi.sql). */
export function useKioskCercaIscritti(openDayId: string | undefined, query: string) {
  const q = query.trim()
  return useQuery({
    queryKey: ['kiosk_cerca_iscritti', openDayId, q.toLowerCase()],
    enabled: !!openDayId && q.length >= 2,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('kiosk_cerca_iscritti', { p_open_day_id: openDayId!, p_query: q })
      if (error) throw error
      return (data ?? []) as KioskIscritto[]
    },
  })
}

/** Dati di precompilazione di un iscritto scelto dalla ricerca del kiosk. */
export async function fetchKioskDatiIscritto(bookingId: string) {
  const { data, error } = await supabase.rpc('kiosk_dati_iscritto', { p_booking_id: bookingId })
  if (error) throw error
  const rows = (data ?? []) as KioskDatiIscritto[]
  return rows[0] ?? null
}

export function useToggleExportInnovaplan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, esportato, staffId }: { id: string; esportato: boolean; staffId: string }) => {
      const { data, error } = await supabase
        .from('mdi')
        .update({
          esportato_innovaplan: esportato,
          esportato_innovaplan_at: esportato ? new Date().toISOString() : null,
          esportato_innovaplan_by: esportato ? staffId : null,
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Mdi
    },
    onSuccess: (mdi) => {
      queryClient.invalidateQueries({ queryKey: ['mdi'] })
      queryClient.invalidateQueries({ queryKey: ['mdi_detail', mdi.id] })
    },
  })
}

export function useUpdateMdiStato() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, stato_lavorazione }: { id: string; stato_lavorazione: string }) => {
      const { data, error } = await supabase.from('mdi').update({ stato_lavorazione }).eq('id', id).select().single()
      if (error) throw error
      return data as Mdi
    },
    onSuccess: (mdi) => {
      queryClient.invalidateQueries({ queryKey: ['mdi'] })
      queryClient.invalidateQueries({ queryKey: ['mdi_detail', mdi.id] })
    },
  })
}
