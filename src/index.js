require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const { loadState, saveState } = require('./state');
const { sendTelegramMessage } = require('./notify');
const { loadAdapters } = require('./adapters');
const { assessHuurtoeslag, fetchDetailText } = require('./huurtoeslag');

const ADAPTERS = loadAdapters();

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return [];
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

async function run() {
  const searches = loadConfig();
  if (searches.length === 0) {
    console.log('Geen zoekopdrachten geconfigureerd. Gebruik "npm run search:add -- \\"naam\\" \\"url\\"".');
    return;
  }

  const state = loadState();
  const browser = await chromium.launch();

  try {
    for (let i = 0; i < searches.length; i += 1) {
      const search = searches[i];
      const adapter = ADAPTERS[search.site];
      if (!adapter) {
        console.warn(`Onbekende site "${search.site}" voor zoekopdracht "${search.name}", overgeslagen.`);
        continue;
      }

      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // Elke zoekopdracht krijgt een eigen, verse browsercontext (geen gedeelde cookies/sessie)
      // om te voorkomen dat opeenvolgende requests als verdacht bot-verkeer worden aangemerkt.
      const context = await browser.newContext({ userAgent: USER_AGENT, locale: 'nl-NL' });
      const page = await context.newPage();

      console.log(`Check "${search.name}" (${search.site})...`);
      let listings;
      try {
        listings = await adapter.fetchListings(page, search.url);
      } catch (err) {
        console.error(`Fout bij ophalen van "${search.name}": ${err.message}`);
        await context.close();
        continue;
      }
      await context.close();

      const isFirstRun = !state[search.name];
      const previousSeen = state[search.name] || [];
      const seen = new Set(previousSeen);

      if (!isFirstRun && listings.length === 0 && previousSeen.length > 0) {
        console.warn(
          `"${search.name}" leverde 0 woningen op terwijl er eerder ${previousSeen.length} bekend waren — waarschijnlijk een mislukte/geblokkeerde poging, state wordt niet aangepast.`
        );
        continue;
      }

      const newListings = listings.filter((listing) => !seen.has(listing.id));

      if (isFirstRun) {
        console.log(
          `Eerste run voor "${search.name}": ${listings.length} bestaande woning(en) worden gemarkeerd als gezien (geen meldingen).`
        );
      } else if (newListings.length > 0) {
        console.log(`${newListings.length} nieuwe woning(en) gevonden voor "${search.name}".`);
        for (const listing of newListings) {
          // Alleen voor nieuwe woningen: één keer de detailpagina lezen voor de huurtoeslag-inschatting.
          const detailContext = await browser.newContext({ userAgent: USER_AGENT, locale: 'nl-NL' });
          const detailText = await fetchDetailText(await detailContext.newPage(), listing.url);
          await detailContext.close();
          listing.huurtoeslag = assessHuurtoeslag(listing, detailText);
          console.log(`  ${listing.title}: ${listing.huurtoeslag}`);
          await sendTelegramMessage(search.name, adapter.label || search.site, listing);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } else {
        console.log(`Geen nieuwe woningen voor "${search.name}".`);
      }

      state[search.name] = listings.map((listing) => listing.id);
    }
  } finally {
    await browser.close();
  }

  saveState(state);
}

run().catch((err) => {
  console.error('Onverwachte fout:', err);
  process.exit(1);
});
