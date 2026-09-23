-- MDI: dati anagrafici completi richiesti per creare l'anagrafica su INNOVAPLAN,
-- che importa un CSV nel formato SIDI "Alunni e scelte" (Iscrizioni On Line).
-- Export generato dall'area staff (src/features/mdi/export/innovaplanCsv.ts).
--
-- Tutte le colonne sono nullable: le MDI raccolte prima restano valide e
-- l'export segnala i dati mancanti. Le RLS non cambiano: anon puo' solo
-- inserire MDI (policy mdi_insert_public in 0002).
--
-- Codici comune = codice catastale (es. F205 Milano), da elenco ISTAT.
-- Cittadinanza e stato estero di nascita: nome del paese (scelta dell'utente;
-- i codici SIDI non coincidono con quelli ISTAT).

alter table public.mdi
  -- Allievo
  add column all_codice_fiscale text check (all_codice_fiscale ~ '^[A-Z0-9]{16}$'),
  add column all_sesso char(1) check (all_sesso in ('M', 'F')),
  add column all_nato_estero boolean not null default false,
  add column all_comune_nascita_cod text,
  add column all_stato_nascita text,
  add column all_cittadinanza_2 text,
  add column all_residenza_comune_cod text,
  add column all_domicilio_comune_cod text,
  add column all_scuola_provenienza_cod text,
  -- Genitore / tutore firmatario (= "primo genitore" nel tracciato SIDI)
  add column acc_codice_fiscale text check (acc_codice_fiscale ~ '^[A-Z0-9]{16}$'),
  add column acc_data_nascita date,
  add column acc_sesso char(1) check (acc_sesso in ('M', 'F')),
  add column acc_nato_estero boolean not null default false,
  add column acc_comune_nascita text,
  add column acc_comune_nascita_cod text,
  add column acc_stato_nascita text,
  add column acc_cittadinanza text,
  add column acc_residenza_come_allievo boolean not null default true,
  add column acc_residenza_via text,
  add column acc_residenza_citta text,
  add column acc_residenza_comune_cod text,
  add column acc_residenza_prov char(2),
  add column acc_residenza_cap text,
  add column acc_email_2 text;

-- Codice ministeriale dell'indirizzo/qualifica (IND_MINISTERIALE, es. A199):
-- impostato dallo staff in Impostazioni, per ogni corso.
alter table public.corsi
  add column codice_ministeriale text;

alter table public.impostazioni
  add column codice_meccanografico_sede text not null default 'MICF065007',
  add column classificazione_ministeriale text not null default 'R3';
