# Projectcontext voor Claude Code

Persoonlijke notifier die huurwoningen in Utrecht zoekt voor een familielid en via Telegram meldt. Node 22, Playwright (Chromium), geen andere frameworks. Draait via GitHub Actions elk kwartier; state staat in `state/seen.json` en wordt door de workflow gecommit.

## Structuur
- `src/index.js`: hoofdrun; loopt alle zoekopdrachten uit `config.json` af, vergelijkt met state, stuurt meldingen.
- `src/adapters/<site>.js`: één scraper per bron. Exporteert `label` en `fetchListings(page, url)` die `{ id, title, address, price, features, url }[]` teruggeeft. Wordt automatisch geladen via `src/adapters/index.js`; bestandsnaam = `site`-waarde in config.
- `src/test-adapter.js`: `npm run test:adapter -- <site> "<url>"` draait één adapter los, zonder state of Telegram. Gebruik dit altijd om een adapter te verifiëren.
- `src/huurtoeslag.js`: leest voor elke nieuwe woning één keer de detailpagina en zet een inschatting (✅/❌/❔) of huurtoeslag mogelijk is (eigen ingang, keuken, toilet, badkamer) in de melding.
- `src/notify.js`, `src/state.js`, `src/manage-searches.js`: generiek, niet aanpassen tenzij gevraagd.

## Werkafspraken
- Test elke nieuwe of gewijzigde adapter live met `npm run test:adapter` en laat de output zien voordat je hem als klaar beschouwt. Controleer: meer dan 0 resultaten, elke woning heeft id, url en prijs, geen dubbele ids.
- `id` moet stabiel zijn over runs heen (bij voorkeur een id of slug uit de URL), anders komen er dubbele meldingen.
- Wees zuinig met requests: geen parallelle scraping, geen loops die een site herhaald bevragen. Respecteer robots.txt van makelaarssites; meld het als een site scrapen uitsluit en sla hem dan over.
- Als een site zijn aanbod via een externe widget of API laadt die niet in de pagina staat, meld dat en stel voor hem over te slaan in plaats van er lang omheen te bouwen.
- Commit geen `.env`, tokens of chat-ids.
- Communiceer in het Nederlands.
