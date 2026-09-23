/**
 * Google Modulo "Iscrizione Open Day" -> app IL Recruitment.
 *
 * Ad ogni risposta inviata, manda i dati alla Edge Function
 * `google-forms-webhook`, che crea l'iscrizione "da approvare".
 * Istruzioni complete: integrations/google-forms/README.md
 *
 * NESSUN SEGRETO IN QUESTO FILE: URL e segreto vanno in
 * Impostazioni progetto -> Proprietà script:
 *   WEBHOOK_URL     https://<ref>.supabase.co/functions/v1/google-forms-webhook
 *   WEBHOOK_SECRET  lo stesso valore del secret GOOGLE_FORMS_SECRET su Supabase
 */

/**
 * Titolo ESATTO di ogni domanda del modulo -> campo dell'app.
 * Modifica i titoli a sinistra se nel tuo modulo sono diversi.
 * Le domande non presenti nel modulo vengono semplicemente ignorate.
 */
var MAPPA = {
  'Open Day': 'openDay', // domanda a menu/scelta multipla con le date (obbligatoria)
  'Cognome studente': 'cognome', // obbligatoria
  'Nome studente': 'nome', // obbligatoria
  'Data di nascita': 'dataNascita',
  'Scuola di provenienza': 'scuola',
  'Classe': 'classe',
  'Comune di residenza': 'residenza',
  'Cognome genitore': 'accCognome',
  'Nome genitore': 'accNome',
  'Cellulare': 'telefono', // obbligatoria
  'Email': 'email', // consigliata obbligatoria: serve per le conferme via email
  'Corso di interesse': 'corso1',
  'Secondo corso di interesse': 'corso2',
  'Note': 'note',
};

/** Trigger installabile "All'invio del modulo" (vedi README). */
function onFormSubmit(e) {
  inviaRisposta_(e.response);
}

/**
 * Da eseguire a mano una volta (menu Esegui) per importare le risposte già
 * arrivate prima di collegare lo script. Le risposte già importate vengono
 * riconosciute e saltate, quindi si può rilanciare senza creare doppioni.
 */
function reinviaTutte() {
  var risposte = FormApp.getActiveForm().getResponses();
  var esiti = {};
  risposte.forEach(function (r) {
    var esito = inviaRisposta_(r);
    esiti[esito] = (esiti[esito] || 0) + 1;
  });
  Logger.log('Risposte elaborate: ' + risposte.length + ' — ' + JSON.stringify(esiti));
}

/** Prova la configurazione inviando l'ultima risposta ricevuta. */
function provaUltimaRisposta() {
  var risposte = FormApp.getActiveForm().getResponses();
  if (!risposte.length) throw new Error('Il modulo non ha ancora risposte');
  Logger.log('Esito: ' + inviaRisposta_(risposte[risposte.length - 1]));
}

function inviaRisposta_(risposta) {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('WEBHOOK_URL');
  var secret = props.getProperty('WEBHOOK_SECRET');
  if (!url || !secret) throw new Error('Imposta WEBHOOK_URL e WEBHOOK_SECRET nelle Proprietà script');

  var payload = {
    responseId: risposta.getId(),
    submittedAt: Utilities.formatDate(risposta.getTimestamp(), 'Europe/Rome', 'dd/MM/yyyy HH:mm'),
  };
  risposta.getItemResponses().forEach(function (ir) {
    var campo = MAPPA[ir.getItem().getTitle().trim()];
    if (!campo) return;
    var valore = ir.getResponse();
    payload[campo] = Array.isArray(valore) ? valore.join(', ') : String(valore);
  });
  // Se il modulo raccoglie l'email in automatico ("Raccogli indirizzi email").
  if (!payload.email && risposta.getRespondentEmail()) payload.email = risposta.getRespondentEmail();

  var ultimoErrore = '';
  for (var tentativo = 1; tentativo <= 3; tentativo++) {
    try {
      var res = UrlFetchApp.fetch(url, {
        method: 'post',
        contentType: 'application/json',
        headers: { 'x-webhook-secret': secret },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      });
      var codice = res.getResponseCode();
      if (codice === 200) return JSON.parse(res.getContentText()).esito;
      ultimoErrore = 'HTTP ' + codice + ': ' + res.getContentText();
      if (codice === 401 || codice === 400) break; // configurazione errata: inutile ritentare
    } catch (err) {
      ultimoErrore = String(err);
    }
    Utilities.sleep(2000 * tentativo);
  }
  // L'errore compare in "Esecuzioni" dell'editor Apps Script; Google invia anche
  // un'email di notifica degli errori del trigger al proprietario dello script.
  throw new Error('Invio risposta ' + payload.responseId + ' non riuscito: ' + ultimoErrore);
}
