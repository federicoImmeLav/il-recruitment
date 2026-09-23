-- Seed dei 9 corsi IeFP, derivati dal modulo MDI cartaceo esistente.

insert into public.corsi (nome, qualifica, ordine) values
  ('Cucina', 'Operatore della ristorazione - preparazione pasti', 1),
  ('Sala Bar', 'Operatore della ristorazione - servizi di sala e bar', 2),
  ('Panificazione e pasticceria', 'Operatore della ristorazione - panificazione e pasticceria', 3),
  ('Acconciatura', 'Operatore del benessere - acconciatura', 4),
  ('Estetica', 'Operatore del benessere - estetica', 5),
  ('Informatica', 'Operatore informatico', 6),
  ('Grafica', 'Operatore grafico', 7),
  ('Comunicazione Digitale', 'Operatore della comunicazione digitale', 8),
  ('Elettricità e domotica', 'Operatore elettrico - impianti civili e domotica', 9)
on conflict (nome) do nothing;
