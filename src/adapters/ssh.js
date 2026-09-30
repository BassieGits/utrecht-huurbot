// SSH Student Housing. Het aanbod staat voor alle steden op één pagina en de filters werken
// alleen in de browser. Daarom filtert deze adapter zelf op instellingen na de # in de URL
// (die wordt niet naar SSH gestuurd), bijv.
// https://www.sshxl.nl/nl/aanbod#stad=utrecht&max=1000&m2=14
async function fetchListings(page, url) {
  const [baseUrl, hash = ''] = url.split('#');
  const filters = new URLSearchParams(hash);
  const city = (filters.get('stad') || '').toLowerCase();
  const maxPrice = Number(filters.get('max')) || Infinity;
  const minM2 = Number(filters.get('m2')) || 0;

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('article.card--property', { timeout: 30000 });
  await page.waitForTimeout(1000);

  const listings = await page.$$eval('article.card--property', (cards) =>
    cards
      .map((card) => {
        const link = card.querySelector('a.card__link');
        const href = link ? link.href : null;
        if (!href) return null;

        const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : null);
        const title = text(card.querySelector('.card__title'));
        const price = text(card.querySelector('.price-tag'));

        // Lijstregels hebben een verborgen label ("Oppervlakte: ") gevolgd door de waarde.
        const props = {};
        for (const li of card.querySelectorAll('.list--iconed .list__item')) {
          const label = text(li.querySelector('.sr-text')) || '';
          props[label.replace(/:$/, '')] = text(li).replace(label, '').trim();
        }

        // Numeriek aanbod-id uit de URL, bijv. /nl/aanbod/1478105-europaplein-286 → 1478105.
        const idMatch = href.match(/\/aanbod\/(\d+)/);

        return {
          id: idMatch ? idMatch[1] : href,
          title: props['Type woning'] ? props['Type woning'][0].toUpperCase() + props['Type woning'].slice(1) : title,
          address: title,
          price,
          features: [
            props['Oppervlakte'],
            props['Manier van toewijzing'] && `toewijzing: ${props['Manier van toewijzing']}`,
            props['Type contract'],
            text(card.querySelector('.card__intro')),
            text(card.querySelector('.card__footer')),
          ].filter(Boolean),
          huurtoeslagText: props['Huur bij max.huurtoeslag'] || null,
          zelfstandig: /^zelfstandig/i.test(props['Type woning'] || ''),
          m2: Number((props['Oppervlakte'] || '').replace(/[^\d]/g, '')) || 0,
          url: href,
        };
      })
      .filter(Boolean)
  );

  const euro = (s) => Number(String(s || '').replace(/[^\d,]/g, '').replace(',', '.')) || 0;

  return listings
    .filter((l) => !city || (l.address || '').toLowerCase().endsWith(`, ${city}`))
    .filter((l) => euro(l.price) <= maxPrice)
    .filter((l) => l.m2 >= minM2)
    .map(({ huurtoeslagText, zelfstandig, m2, ...l }) => ({
      ...l,
      // SSH vermeldt zelf de huur na maximale huurtoeslag; dat is betrouwbaarder dan de eigen inschatting.
      huurtoeslag: huurtoeslagText
        ? /geen huurtoeslag/i.test(huurtoeslagText)
          ? '❌ Huurtoeslag: niet mogelijk volgens SSH'
          : `✅ Huurtoeslag volgens SSH: ${huurtoeslagText}`
        : zelfstandig
          ? '❔ Huurtoeslag: zelfstandige woning, maar SSH noemt geen bedrag'
          : '❌ Huurtoeslag: waarschijnlijk niet (onzelfstandige woonruimte volgens SSH)',
    }));
}

module.exports = { label: 'SSH', fetchListings };
