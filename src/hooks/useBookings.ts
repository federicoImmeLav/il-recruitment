import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { Booking, CanaleIscrizione } from '../types/database.types'

/** Elenco iscrizioni di un open day, solo staff. */
export function useBookings(openDayId: string | undefined) {
  return useQuery({
    queryKey: ['bookings', openDayId],
    enabled: !!openDayId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('open_day_id', openDayId!)
        .order('registered_at', { ascending: true })
      if (error) throw error
      return data as Booking[]
    },
  })
}

export interface CreateBookingInput {
  open_day_id: string
  cognome: string
  nome: string
  telefono: string
  data_nascita?: string | null
  scuola?: string | null
  classe?: string | null
  residenza?: string | null
  email?: string | null
  corso_id?: string | null
  corso2_id?: string | null
  canale?: CanaleIscrizione
  flag_seconda_media?: boolean
}

/** Unico punto di creazione prenotazione (RPC), usato sia dal form pubblico sia dai walk-in staff. */
export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const { data, error } = await supabase.rpc('create_booking', {
        p_open_day_id: input.open_day_id,
        p_cognome: input.cognome,
        p_nome: input.nome,
        p_telefono: input.telefono,
        p_data_nascita: input.data_nascita ?? null,
        p_scuola: input.scuola ?? null,
        p_classe: input.classe ?? null,
        p_residenza: input.residenza ?? null,
        p_email: input.email ?? null,
        p_corso_id: input.corso_id ?? null,
        p_corso2_id: input.corso2_id ?? null,
        p_canale: input.canale ?? 'online',
        p_flag_seconda_media: input.flag_seconda_media ?? false,
      })
      if (error) throw error
      return data as unknown as Booking
    },
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', booking.open_day_id] })
      queryClient.invalidateQueries({ queryKey: ['posti_disponibili', booking.open_day_id] })
    },
  })
}

export function useUpdateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, open_day_id: _open_day_id, ...patch }: Partial<Booking> & { id: string; open_day_id: string }) => {
      const { data, error } = await supabase.from('bookings').update(patch).eq('id', id).select().single()
      if (error) throw error
      return data as Booking
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', variables.open_day_id] })
    },
  })
}

export function useCheckIn() {
  const update = useUpdateBooking()
  return {
    ...update,
    checkIn: (booking: Booking, checked: boolean) =>
      update.mutateAsync({
        id: booking.id,
        open_day_id: booking.open_day_id,
        checked_in: checked,
        checked_in_at: checked ? new Date().toISOString() : null,
      }),
  }
}

/**
 * Sposta un iscritto in un altro indirizzo / gruppo d'interesse: aggiorna
 * `corso_id` (il gruppo coincide con l'indirizzo), `corso_iniziale_id` resta
 * quello dell'iscrizione per sapere chi ha cambiato idea.
 */
export function useSpostaIndirizzo() {
  const update = useUpdateBooking()
  return {
    ...update,
    sposta: (booking: Booking, corsoId: string | null) =>
      update.mutateAsync({ id: booking.id, open_day_id: booking.open_day_id, corso_id: corsoId }),
  }
}

/**
 * Approva (sempre "confermata", anche oltre i posti massimi) o rifiuta una
 * richiesta: la RPC accoda anche la notifica alla famiglia. Subito dopo prova a
 * inviare la coda, senza attendere il giro del cron (ogni 5 minuti).
 */
export function useDecidiIscrizione() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ booking, approva, motivo }: { booking: Booking; approva: boolean; motivo?: string }) => {
      const { data, error } = await supabase.rpc('decidi_iscrizione', {
        p_booking_id: booking.id,
        p_approva: approva,
        p_motivo: motivo?.trim() || null,
      })
      if (error) throw error
      return data as unknown as Booking
    },
    onSuccess: async (booking) => {
      queryClient.invalidateQueries({ queryKey: ['bookings', booking.open_day_id] })
      queryClient.invalidateQueries({ queryKey: ['notifiche', booking.open_day_id] })
      await inviaCodaNotifiche()
      queryClient.invalidateQueries({ queryKey: ['notifiche', booking.open_day_id] })
    },
  })
}

/** Avvia l'invio delle notifiche in coda (Edge Function send-notifications). Errori non bloccanti: ci ripensa il cron. */
export async function inviaCodaNotifiche() {
  try {
    await supabase.functions.invoke('send-notifications', { body: {} })
  } catch {
    // La notifica resta in coda e verra' inviata al prossimo giro del cron.
  }
}
