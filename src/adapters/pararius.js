async function fetchListings(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForSelector('h1', { timeout: 20000 });
  await page.waitForTimeout(500);

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
