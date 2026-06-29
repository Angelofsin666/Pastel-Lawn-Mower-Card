# Pastel Lawn Mower Card

Custom Lovelace card per Home Assistant per il robot tagliaerba, con
illustrazione **statica** (nessuna animazione, su richiesta esplicita) in
stile pastello coerente con le altre card Pastel della stessa dashboard.

## Funzionalità

- Illustrazione del robot tagliaerba: immagine statica fornita con il
  repository (`lawn-mower-romario.png`), fedele al disegno originale.
  Nessuna animazione, su richiesta esplicita.
- Badge di stato in alto, sempre nel colore di base scelto, basato sui **6
  stati nativi e documentati dell'entità `lawn_mower` di Home Assistant**:
  `mowing` (In funzione), `docked` (Alla base), `paused` (In pausa),
  `returning` (Ritorno alla base), `error` (Errore), più
  `unavailable`/`unknown`.
- Batteria (%, con barra di progresso), Area (m²) e Tempo rimanente (h:min)
  da tre sensori opzionali e indipendenti.
- Bottoni **Pausa** e **Ricarica**, collegati ai servizi nativi
  `lawn_mower.pause` e `lawn_mower.dock` — nessuna configurazione aggiuntiva
  richiesta oltre all'entità del tagliaerba.
- I bottoni si disabilitano automaticamente quando l'azione non avrebbe
  senso nello stato attuale: **Pausa** è attivo solo durante `mowing`;
  **Ricarica** è disabilitato se il robot è già `docked` o `returning`.
- Tap su illustrazione, badge, o ogni singolo dato → apre il popup
  "more-info" nativo di Home Assistant dell'entità corrispondente.
- Colore di base della card personalizzabile (8 tonalità pastello) tramite
  editor visuale.

## Installazione

### Tramite HACS
1. HACS → Frontend → menu (⋮) → **Repository personalizzati**
2. Aggiungi l'URL del repository GitHub, categoria "Lovelace"
3. Cerca "Pastel Lawn Mower Card" e installala

### Manuale
1. Copia `pastel-lawn-mower-card.js` **e** `lawn-mower-romario.png` in
   `config/www/pastel-lawn-mower-card/` (stessa cartella, l'immagine deve
   stare vicino al file JS)
2. Aggiungi la risorsa in **Impostazioni → Dashboard → Risorse**:
   - URL: `/local/pastel-lawn-mower-card/pastel-lawn-mower-card.js`
   - Tipo: **JavaScript Module** (obbligatorio: il file usa `import`
     dinamici a livello principale)
3. Se installi manualmente (non via HACS), aggiorna anche `image_url` nella
   configurazione della card a `/local/pastel-lawn-mower-card/lawn-mower-romario.png`
   (il default punta al percorso HACS `/hacsfiles/...`, che non esiste in
   un'installazione manuale)

## Configurazione (YAML)

```yaml
type: custom:pastel-lawn-mower-card
title: Romario
subtitle: Robot tagliaerba
icon: mdi:robot-mower
color: green
mower_entity: lawn_mower.romario
battery_entity: sensor.romario_batteria
area_entity: sensor.romario_area
time_remaining_entity: sensor.romario_tempo_rimanente
```

`image_url` è opzionale: se omesso, la card usa l'immagine di default
fornita con il repository. Per usare un disegno diverso (un altro robot, un
altro colore di carrozzeria), basta indicare un URL diverso:

```yaml
image_url: /local/il-mio-tagliaerba-personalizzato.png
```

Puoi anche configurarla interamente dall'editor visuale dalla dashboard:
solo `mower_entity` è obbligatoria, gli altri tre sensori sono opzionali —
se non li configuri, la card mostra semplicemente illustrazione + badge di
stato + bottoni.

### Colori disponibili
`amber` · `blue` · `green` · `pink` · `purple` · `red` · `teal` · `orange`

## Note tecniche

- `mower_entity` deve essere un'entità del dominio nativo `lawn_mower` di
  Home Assistant (qualsiasi integrazione che lo implementa, es. Husqvarna
  Automower, Worx Landroid, Dreame/MOVA via l'integrazione community
  `dreame-mower`, MQTT lawn mower, ecc.).
- `time_remaining_entity` è interpretata come **minuti totali** (es. `80`
  → mostrato come `1:20`). Se la tua entità espone il tempo in un formato
  diverso (secondi, stringa già formattata), serve un sensore template
  intermedio che la converta in minuti.
- La rilevazione di "dato non disponibile" sui sensori numerici copre stato
  assente, `null`, le stringhe `"unknown"`/`"unavailable"`, o un valore non
  numerico: in questi casi quel blocco specifico (batteria/area/tempo) non
  viene mostrato, senza generare errori.
- L'illustrazione è un'immagine statica (`lawn-mower-romario.png`)
  distribuita nel repository HACS, servita automaticamente al percorso
  `/hacsfiles/pastel-lawn-mower-card/lawn-mower-romario.png`. A differenza
  delle altre card Pastel (che disegnano l'icona via SVG dinamico colorato
  in base al tema), qui il colore di base influisce solo su badge, barra
  batteria e bottoni — non sull'illustrazione stessa, che resta
  un'immagine fissa indipendente dalla palette.
- Carica `lit-element` da CDN per stabilità nel tempo (stesso approccio
  delle altre card Pastel).
- L'editor usa i componenti nativi `ha-entity-picker` di Home Assistant
  (stesso trade-off di stabilità descritto nelle altre card Pastel con
  editor avanzato).
