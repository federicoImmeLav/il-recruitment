# Collegare il Google Modulo di iscrizione Open Day

Ogni risposta al modulo diventa, in pochi secondi, un'iscrizione **"Da approvare"**
nel Monitoraggio Open Day dell'app.

## 1. Preparare il modulo

- Una domanda **a menu a tendina** (o scelta multipla) con titolo `Open Day`, un'opzione
  per ogni data, ad es. `Sabato 18 ottobre 2026 — ore 10:00`.
- Domande obbligatorie: `Cognome studente`, `Nome studente`, `Cellulare`, `Open Day`.
- Consigliata obbligatoria: `Email` (serve per le conferme e i promemoria gratuiti via email).
- Facoltative: `Data di nascita` (tipo *Data*), `Scuola di provenienza`, `Classe`,
  `Comune di residenza`, `Cognome genitore`, `Nome genitore`, `Corso di interesse`,
  `Secondo corso di interesse`, `Note`.
- Se usi titoli diversi, correggili nella `MAPPA` in cima a `Code.gs`.
- Per i corsi, le opzioni devono **iniziare** col nome del corso come nell'app
  (`Cucina`, `Sala Bar`, `Informatica`, …): es. `Cucina — Operatore della ristorazione` va bene.
- Nel testo del modulo riporta l'informativa privacy e che la famiglia verrà contattata
  via email/WhatsApp/SMS per la conferma e un promemoria.

## 2. Collegare ogni Open Day dell'app

Nell'app, **Open Day → Modifica**, campo **"Etichetta modulo Google"**: incolla il testo
**identico** dell'opzione del menu (maiuscole e spazi non contano). Le risposte con
un'opzione non collegata non si perdono: compaiono in **Impostazioni → Import Google Moduli**
come "Open Day non trovato"; dopo aver sistemato l'etichetta, rilancia `reinviaTutte`.

## 3. Installare lo script

1. Dal modulo: **⋮ → Apps Script**.
2. Sostituisci il contenuto di `Codice.gs` con quello di `Code.gs` e salva.
3. **Impostazioni progetto (⚙) → Proprietà script → Aggiungi**:
   - `WEBHOOK_URL` = `https://<ref-progetto>.supabase.co/functions/v1/google-forms-webhook`
   - `WEBHOOK_SECRET` = lo stesso valore impostato su Supabase come `GOOGLE_FORMS_SECRET`
4. **Attivatori (⏰) → Aggiungi attivatore**: funzione `onFormSubmit`, origine *Dal modulo*,
   tipo *All'invio del modulo*. Autorizza lo script quando richiesto.
5. Prova: esegui `provaUltimaRisposta` (menu in alto) e controlla il log; poi fai una
   risposta di prova dal modulo e verifica che compaia nel Monitoraggio.
6. Per importare le risposte arrivate prima del collegamento esegui `reinviaTutte`
   (le risposte già importate vengono saltate).

Il segreto **non va mai scritto in `Code.gs`** (il repository è pubblico): solo nelle
Proprietà script.
