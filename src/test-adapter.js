// Test één adapter tegen één URL, zonder state aan te passen en zonder Telegram-meldingen.
// Gebruik: npm run test:adapter -- <site> "<url>"
// Voorbeeld: npm run test:adapter -- pararius "https://www.pararius.nl/huurwoningen/utrecht/0-1500"

const { chromium } = require('playwright');
const { loadAdapters } = require('./adapters');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function main() {
  const [, , site, url] = process.argv;
  const adapters = loadAdapters();

  if (!site || !url) {
    console.error('Gebruik: npm run test:adapter -- <site> "<url>"');
    console.error(`Beschikbare adapters: ${Object.keys(adapters).join(', ')}`);
    process.exit(1);
  }
  const adapter = adapters[site];
  if (!adapter) {
    console.error(`Onbekende adapter "${site}". Beschikbaar: ${Object.keys(adapters).join(', ')}`);
    process.exit(1);
  }

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ userAgent: USER_AGENT, locale: 'nl-NL' });
    const page = await context.newPage();
    const listings = await adapter.fetchListings(page, url);

    console.log(`${listings.length} woning(en) gevonden via ${adapter.label || site}:\n`);
    for (const l of listings) {
      console.log(`- [${l.id}] ${l.title || '(geen titel)'} | ${l.address || '(geen adres)'} | ${l.price || '(geen prijs)'}`);
      if (l.features && l.features.length) console.log(`  ${l.features.join(' · ')}`);
      console.log(`  ${l.url}`);
    }

    const problems = listings.filter((l) => !l.id || !l.url || !l.price);
    if (listings.length === 0) console.warn('\nLET OP: 0 resultaten. Selector klopt waarschijnlijk niet, of de site blokkeert.');
    if (problems.length) console.warn(`\nLET OP: ${problems.length} woning(en) zonder id, url of prijs.`);
    const ids = listings.map((l) => l.id);
    if (new Set(ids).size !== ids.length) console.warn('\nLET OP: dubbele ids, deduplicatie gaat dan mis.');
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Fout:', err);
  process.exit(1);
});
