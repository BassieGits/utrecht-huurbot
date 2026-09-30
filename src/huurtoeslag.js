// Schat in of een woning in aanmerking komt voor huurtoeslag. Daarvoor moet de woning
// zelfstandig zijn: eigen toegangsdeur, keuken, toilet en badkamer. Dit is een inschatting
// op basis van de advertentietekst, geen garantie.

const FACILITIES = [
  { name: 'keuken', re: /keuken|kitchen|kookgelegenheid/ },
  { name: 'badkamer', re: /badkamer|douche|bathroom|shower|sanitair/ },
  { name: 'toilet', re: /toilet|\bwc\b/ },
  { name: 'ingang', re: /ingang|voordeur|toegangsdeur|entrance/ },
];

const SHARED_WORD = /gedeeld|gemeenschappelijk|shared|\bdelen\b|te delen|samen te gebruiken/;
const OWN_WORD = /\beigen\b|\bprivate\b|\bown\b|\bpriv[eé]\b/;

// Loopt de tekst per zin en per komma-deel af. Een deel zonder "eigen"/"gedeeld" erft het
// laatst genoemde, zodat "eigen keuken, badkamer en toilet" alle drie als eigen telt.
function classifyFacilities(text) {
  const own = new Set();
  const shared = new Set();
  for (const sentence of text.split(/[.!?;\n]+/)) {
    if (!FACILITIES.some((f) => f.re.test(sentence))) continue;
    let marker = null;
    for (const part of sentence.split(',')) {
      const s = SHARED_WORD.test(part);
      const o = OWN_WORD.test(part);
      if (s && !o) marker = 'shared';
      else if (o && !s) marker = 'own';
      else if (s && o) marker = part.search(SHARED_WORD) > part.search(OWN_WORD) ? 'shared' : 'own';
      if (!marker) continue;
      for (const f of FACILITIES) if (f.re.test(part)) (marker === 'own' ? own : shared).add(f.name);
    }
    // "De keuken en badkamer worden gedeeld": markering staat pas aan het eind van de zin.
    if (SHARED_WORD.test(sentence) && !OWN_WORD.test(sentence)) {
      for (const f of FACILITIES) if (f.re.test(sentence)) shared.add(f.name);
    }
  }
  return { own: [...own].filter((f) => !shared.has(f)), shared: [...shared] };
}

function assessHuurtoeslag(listing, detailText) {
  const title = `${listing.title || ''} ${listing.url || ''}`.toLowerCase();
  const text = (detailText || '').toLowerCase().replace(/[ \t]+/g, ' ');

  if (text) {
    if (/huurtoeslag\s+(is\s+)?(niet|geen)\s+mogelijk|geen\s+(recht\s+op\s+)?huurtoeslag|niet\s+in\s+aanmerking\s+voor\s+huurtoeslag|no\s+(rent|housing)\s+(allowance|benefit)/.test(text)) {
      return '❌ Huurtoeslag: niet mogelijk volgens de advertentie';
    }
    const { own, shared } = classifyFacilities(text);
    if (/onzelfstandig|niet[- ]zelfstandig|non[- ]self[- ]contained/.test(text) || shared.length) {
      const reden = shared.length ? `gedeelde ${shared.join(', ')}` : 'onzelfstandige woonruimte';
      return `❌ Huurtoeslag: waarschijnlijk niet (${reden})`;
    }
    if (/huurtoeslag\s+(is\s+)?mogelijk|recht\s+op\s+huurtoeslag|in\s+aanmerking\s+voor\s+huurtoeslag|huurtoeslag\s+aan\s+(te\s+)?vragen/.test(text)) {
      return '✅ Huurtoeslag: mogelijk volgens de advertentie';
    }
    if (/\bzelfstandige?\b|self[- ]contained/.test(text)) {
      const extra = own.length ? `, eigen ${own.join(', ')}` : '';
      return `✅ Huurtoeslag: waarschijnlijk wel (zelfstandige woonruimte${extra})`;
    }
    if (own.length === FACILITIES.length || (own.length >= 3 && !own.includes('ingang'))) {
      return `✅ Huurtoeslag: waarschijnlijk wel (eigen ${own.join(', ')})`;
    }
  }

  if (/\bkamer\b|kamer-te-huur|\/kamer\//.test(title) && !/appartement|studio/.test(title)) {
    return '❌ Huurtoeslag: waarschijnlijk niet (kamer, meestal gedeelde voorzieningen)';
  }
  return text
    ? '❔ Huurtoeslag: onbekend, advertentie noemt niet of keuken, badkamer, toilet en ingang eigen zijn'
    : '❔ Huurtoeslag: onbekend, advertentie kon niet gelezen worden';
}

// Haalt de tekst van de detailpagina op; geeft null terug als dat mislukt (bijv. botcontrole).
async function fetchDetailText(page, url) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const title = await page.title();
    if (/even geduld|just a moment/i.test(title)) return null;
    return await page.evaluate(() => document.body.innerText);
  } catch (err) {
    return null;
  }
}

module.exports = { assessHuurtoeslag, fetchDetailText };
