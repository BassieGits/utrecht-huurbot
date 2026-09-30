// Van der Huizen Vastgoedbeheer. Filters staan in de URL, bijv.
// https://www.vanderhuizen.com/huurwoningen?city[]=utrecht-1&price_to=1000
async function fetchListings(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('article.House.Item, .inner h3', { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(1000);

  return page.$$eval('article.House.Item', (items) =>
    items
      .map((article) => {
        const link = article.querySelector('.inner h3 a');
        const href = link ? link.href : null;
        if (!href) return null;

        const text = (selector) => {
          const el = article.querySelector(selector);
          return el ? el.textContent.replace(/\s+/g, ' ').trim() : null;
        };

        // Pad na /te-huur/ (stad + slug) is stabiel en uniek, bijv. "utrecht-1/te-huur-studentenkamer-in-utrecht-overvecht".
        const idMatch = href.match(/\/te-huur\/(.+?)\/?$/);
        const features = [text('.category'), text('figcaption')].filter(Boolean);

        return {
          id: idMatch ? idMatch[1] : href,
          title: [text('.category'), text('.inner h3')].filter(Boolean).join(' '),
          address: [text('.inner h3'), text('.inner h4')].filter(Boolean).join(', '),
          price: text('.price'),
          features,
          url: href,
        };
      })
      .filter(Boolean)
  );
}

module.exports = { label: 'Van der Huizen', fetchListings };
