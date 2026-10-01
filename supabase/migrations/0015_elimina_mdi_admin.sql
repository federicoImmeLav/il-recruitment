-- 0015 — Eliminazione delle MDI riservata agli admin
--
-- Prima bastava avere accesso alla sede (mdi_delete_sede, 0011). Come per le
-- iscrizioni (0014), l'eliminazione definitiva resta all'admin; nessuna tabella
-- dipende da `mdi`, quindi non ci sono cascate.

drop policy "mdi_delete_sede" on public.mdi;

create policy "mdi_delete_admin" on public.mdi for delete
  to authenticated
  using ((select public.is_admin()) and sede_id = any ((select public.sedi_accessibili())::uuid[]));
