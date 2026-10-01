# Collegare il Google Modulo di iscrizione Open Day

Il Google Modulo è **l'unico** modo per iscriversi agli Open Day (l'app non ha una pagina
di iscrizione propria). C'è **un solo modulo** per città, oggi solo Milano, con tutte le
date in un'unica domanda. Ogni risposta diventa, in pochi secondi, un'iscrizione
**"Da approvare"** nel Monitoraggio Open Day: lo staff la approva o la rifiuta dall'app e
parte l'email alla famiglia.

## 1. Preparare il modulo

Usa questi titoli **identici** (maiuscole e spazi a fine titolo non contano). Se ne cambi
uno, correggilo anche nella `MAPPA` in cima a `Code.gs`.

| Titolo della domanda | Tipo | Obbligatoria |
|---|---|---|
| `Data dell'Open Day` | Scelta multipla (una sola risposta), un'opzione per data | sì |
| `Cognome dello studente` | Risposta breve | sì |
| `Nome dello studente` | Risposta breve | sì |
| `Data di nascita dello studente` | Data | sì |
| `Classe frequentata` | Scelta multipla: `2ª media`, `3ª media`, `Superiori`, `Altro` | sì |
| `Scuola di provenienza` | Risposta breve | no |
| `Comune di residenza` | Risposta breve | no |
| `Cognome del genitore` | Risposta breve | sì |
| `Nome del genitore` | Risposta breve | sì |
| `Cellulare` | Risposta breve | sì |
| `Email` | Risposta breve, con convalida "indirizzo email" | sì |
| `Indirizzo di interesse` | Scelta multipla, un'opzione per corso | no |
| `Seconda preferenza` | Scelta multipla, un'opzione per corso | no |
| `Note` | Paragrafo | no |

- Le opzioni di `Data dell'Open Day` sono testo libero, ad es.
  `Sabato 18 ottobre 2026 — ore 10:00`: vanno collegate agli Open Day dell'app (punto 2).
- `Classe frequentata`: le opzioni che iniziano con `2` segnano lo studente come
  "in seconda media" nell'app.
- Per gli indirizzi, le opzioni devono **iniziare** col nome del corso come nell'app
  (`Cucina`, `Sala Bar`, `Informatica`, …): es. `Cucina — Operatore della ristorazione` va bene.
- Il webhook scarta solo le risposte senza data, cognome, nome o cellulare; le altre
  domande obbligatorie le fa rispettare il modulo.
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
   - `WEBHOOK_SECRET` = lo stesso valore impostato su Supabase come segreto della città
     (`GOOGLE_FORMS_SECRET` per Milano, `GOOGLE_FORMS_SECRET_TORINO` per Torino, …)
   - `CITTA`: non serve per Milano (è il valore predefinito); vedi "Altre città" in fondo
4. **Attivatori (⏰) → Aggiungi attivatore**: funzione `onFormSubmit`, origine *Dal modulo*,
   tipo *All'invio del modulo*. Autorizza lo script quando richiesto.
5. Prova: esegui `provaUltimaRisposta` (menu in alto) e controlla il log; poi fai una
   risposta di prova dal modulo e verifica che compaia nel Monitoraggio.
6. Per importare le risposte arrivate prima del collegamento esegui `reinviaTutte`
   (le risposte già importate vengono saltate).

Il segreto **non va mai scritto in `Code.gs`** (il repository è pubblico): solo nelle
Proprietà script.

## Altre città (per il futuro)

Oggi c'è solo il modulo di Milano. Se in futuro servirà un'altra città, avrà il **proprio**
Google Modulo con la propria copia di questo script: stesso `WEBHOOK_URL`, ma `CITTA` e `WEBHOOK_SECRET` della città. Su Supabase:

```bash
npx supabase secrets set --project-ref <ref> GOOGLE_FORMS_SECRET_TORINO=<stringa-casuale-lunga>
```

Le etichette degli Open Day devono essere uniche **nella città** (l'app lo verifica): con
più sedi nello stesso modulo conviene metterci il nome della sede, es.
`Torino Centro — Sabato 18 ottobre 2026 — ore 10:00`. Il primo corso scelto viene cercato
tra quelli della sede dell'Open Day, il secondo anche tra quelli delle altre sedi della
città. Nel registro "Import Google Moduli" ogni operatore vede solo le risposte dei
moduli delle proprie città.
