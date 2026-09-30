# Utrecht-huurbot

Checkt periodiek Pararius (en eventueel Utrechtse verhuurmakelaars) op nieuwe huurwoningen in Utrecht en stuurt een Telegram-melding zodra er eentje verschijnt. Elke melding vermeldt de bron.

Gebaseerd op [wegjeroen/parari_bot](https://github.com/wegjeroen/parari_bot) (Amsterdam). Aangepast: Amsterdamse makelaars verwijderd, adapters worden automatisch geladen, testscript per adapter toegevoegd, check elk kwartier in plaats van elke vijf minuten.

## Belangrijk om te weten

Pararius blokkeert kale HTTP-requests; het script gebruikt daarom een headless browser (Playwright) en checkt elke zoekopdracht in een verse browsersessie met een pauze ertussen. Gebruik dit alleen voor een persoonlijke zoektocht en houd de frequentie bescheiden.

## Lokaal draaien

```bash
npm install
npx playwright install chromium
cp .env.example .env   # vul Telegram-gegevens in
npm start
```

De eerste run markeert alle huidige woningen stil als gezien; meldingen komen pas bij volgende runs.

## Een adapter testen (zonder meldingen, zonder state)

```bash
npm run test:adapter -- pararius "https://www.pararius.nl/huurwoningen/utrecht/0-1500"
```

## Zoekopdrachten beheren

Stel je filters in op pararius.nl en kopieer de URL uit de adresbalk.

```bash
npm run search:add -- "Utrecht Oost tot 1400" "https://www.pararius.nl/huurwoningen/utrecht/wijk-oost/0-1400"
npm run search:list
npm run search:remove -- "Utrecht tot 1500"
```

## Telegram-bot instellen

1. Open Telegram, zoek **@BotFather**, stuur `/newbot` en volg de instructies. Je krijgt een **bot token**.
2. Stuur een willekeurig bericht naar je nieuwe bot (anders kan hij niet naar je terugsturen).
3. Haal je **chat ID** op: open in je browser
   `https://api.telegram.org/bot<JOUW_TOKEN>/getUpdates`
   en zoek `"chat":{"id": ...}` in de JSON-respons. (Alternatief: stuur een bericht naar `@userinfobot`.)

## Op GitHub draaien

1. Maak een **private** repository aan en push deze map ernaartoe.
2. Voeg onder **Settings > Secrets and variables > Actions** de secrets `TELEGRAM_BOT_TOKEN` en `TELEGRAM_CHAT_ID` toe.
3. Start de workflow één keer handmatig via de Actions-tab ("Run workflow"). Daarna draait hij elk kwartier.

Let op: een private repo heeft op een gratis account een beperkt aantal Actions-minuten per maand. Controleer het verbruik onder Settings > Billing. GitHub zet scheduled workflows uit na 60 dagen zonder repo-activiteit; zolang er nieuwe woningen binnenkomen (commits naar `state/seen.json`) blijft hij actief.

## Makelaar toevoegen

1. Maak `src/adapters/<naam>.js` met `fetchListings(page, url)` die een array `{ id, title, address, price, features, url }` teruggeeft, plus een `label`.
2. Test met `npm run test:adapter -- <naam> "<url>"`.
3. Voeg toe met `npm run search:add -- "<weergavenaam>" "<url>" <naam>`.

Registreren in `index.js` is niet meer nodig; adapters worden automatisch geladen.
