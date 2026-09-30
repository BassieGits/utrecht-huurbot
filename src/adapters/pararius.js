async function fetchListings(page, url) {
  // Niet op 'networkidle' wachten: trackers houden het netwerk bezig, vooral op CI-runners.
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  try {
    await page.waitForSelector('li.search-list__item--listing, .search-list__empty, h1', { timeout: 30000 });
  } catch (err) {
    const title = await page.title().catch(() => '?');
    throw new Error(`Pagina niet geladen (titel: "${title}"): ${err.message}`);
  }
  await page.waitForTimeout(1000);

  if ((await page.$$('li.search-list__item--listing')).length === 0) {
    const title = await page.title().catch(() => '?');
    const h1 = await page.textContent('h1').catch(() => null);
    console.warn(`Pararius: geen woningen op pagina (titel: "${title}", h1: "${(h1 || '').replace(/\s+/g, ' ').trim()}")`);
  }

  return page.$$eval('li.search-list__item--listing', (items) =>
    items
      .map((li) => {
        const link = li.querySelector('a.listing-search-item__link');
        const href = link ? link.getAttribute('href') : null;
        if (!href) return null;

        const idMatch = href.match(/\/([0-9a-f]{6,12})\//i);
        const id = idMatch ? idMatch[1] : href;

        const text = (selector) => {
          const el = li.querySelector(selector);
          return el ? el.textContent.replace(/\s+/g, ' ').trim() : null;
        };

        const features = Array.from(li.querySelectorAll('.illustrated-features__item')).map((el) =>
          el.textContent.replace(/\s+/g, ' ').trim()
        );

        return {
          id,
          title: text('.listing-search-item__title'),
          address: text('.listing-search-item__sub-title'),
          price: text('.listing-search-item__price'),
          features,
          url: href.startsWith('http') ? href : `https://www.pararius.nl${href}`,
        };
      })
      .filter(Boolean)
  );
}

module.exports = { label: 'Pararius', fetchListings };
