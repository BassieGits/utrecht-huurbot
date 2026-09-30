# Stappenplan Utrecht-huurbot

## Vooraf (handmatig)

1. Vraag de maker van parari_bot of je zijn code mag hergebruiken; er staat geen licentie in de repo.
2. Pak deze zip uit in een vaste map, bijvoorbeeld `~/Projecten/utrecht-huurbot`.
3. Maak een Telegram-bot: zoek @BotFather in Telegram, stuur `/newbot`, bewaar de token. Wil je dat je dochter de meldingen ook krijgt, maak dan een Telegram-groep met haar en voeg de bot toe; stuur daarna een bericht in de groep.
4. Zorg dat je lokaal Node 22 en de GitHub CLI (`gh`) hebt, en log in met `gh auth login`. Claude Code kan dit ook voor je nalopen (prompt 1).

## Prompt 1: installeren en eerste test

Open Claude Code in de map en geef:

```
Lees CLAUDE.md en README.md. Controleer of Node 22 en de GitHub CLI geïnstalleerd zijn en ik ingelogd ben; zo niet, vertel me wat ik moet doen. Installeer daarna de dependencies en Chromium voor Playwright. Test de Pararius-adapter met npm run test:adapter tegen de URL in config.json en laat de resultaten zien. Pas niets aan de code aan als de test slaagt.
```

## Prompt 2: zoekopdrachten instellen

Vul de haakjes zelf in.

```
Stel de zoekopdrachten in config.json in voor Utrecht met deze criteria: maximale huur [bedrag] euro, [gestoffeerd/kaal/gemeubileerd/maakt niet uit], minimaal [aantal] m2, wijken [bijvoorbeeld Oost, Binnenstad, Wittevrouwen, of: heel Utrecht]. Zoek eerst uit hoe Pararius deze filters in de URL zet, en maak per wijk een aparte zoekopdracht als dat nodig is. Test elke URL met npm run test:adapter en laat per zoekopdracht het aantal resultaten zien.
```

## Prompt 3: Telegram koppelen en lokaal draaien

Zet eerst zelf je token en chat-id in `.env` (kopie van `.env.example`). Voor het chat-id: open `https://api.telegram.org/bot<TOKEN>/getUpdates` in je browser na een bericht aan de bot of in de groep.

```
Ik heb .env ingevuld. Draai npm start twee keer: de eerste run markeert alles als gezien. Verwijder daarna één id uit state/seen.json en draai opnieuw, zodat ik kan controleren of er een Telegram-melding binnenkomt.
```

## Prompt 4: naar GitHub en automatisch laten draaien

```
Maak met de GitHub CLI een nieuwe PRIVATE repository utrecht-huurbot aan, initialiseer git in deze map en push. Controleer dat .env niet wordt meegecommit. Vertel me daarna precies waar ik in GitHub de secrets TELEGRAM_BOT_TOKEN en TELEGRAM_CHAT_ID invoer; die zet ik zelf. Start daarna de workflow handmatig met gh workflow run, volg de run en meld of hij slaagt en hoeveel minuten hij kostte.
```

Reken na de eerste geslaagde run even uit: minuten per run maal 96 runs per dag maal 30. Zit dat boven je maandlimiet (Settings > Billing), laat de cron dan naar elk half uur zetten.

## Prompt 5 (optioneel): Utrechtse makelaars toevoegen

Pas doen als de basis een week draait en blijkt dat er aanbod gemist wordt.

```
Kijk in de huidige Pararius-resultaten voor Utrecht welke verhuurmakelaars het vaakst voorkomen. Geef me een lijst van de vijf meest voorkomende, met hun eigen aanbodpagina en of hun robots.txt scrapen toestaat. Bouw nog niets.
```

Daarna per gekozen makelaar:

```
Bouw een adapter voor [makelaar] met aanbodpagina [URL], volgens de afspraken in CLAUDE.md. Test hem met npm run test:adapter tot hij meer dan nul woningen met id, url en prijs oplevert, voeg hem toe aan config.json, commit en push.
```

## Onderhoud

Werkt een bron niet meer (geen meldingen meer, of foutmeldingen in de Actions-tab):

```
Bekijk de laatste mislukte runs van de workflow met gh run list en gh run view --log-failed. Stel vast welke adapter faalt, test hem met npm run test:adapter en repareer de selectors. Laat de testoutput zien voordat je commit.
```

Is er een woning gevonden, zet dan in GitHub de workflow uit (Actions > workflow > Disable) of verwijder de repo.
