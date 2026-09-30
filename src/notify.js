function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function sendTelegramMessage(searchName, sourceLabel, listing) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn('TELEGRAM_BOT_TOKEN of TELEGRAM_CHAT_ID ontbreekt in de omgeving, melding overgeslagen.');
    return;
  }

  const lines = [`\u{1F3E0} <b>Nieuwe woning — bron: ${escapeHtml(sourceLabel)}</b>`];
  if (searchName !== sourceLabel) {
    lines.push(`Zoekopdracht: ${escapeHtml(searchName)}`);
  }
  lines.push(escapeHtml(listing.title), escapeHtml(listing.address), escapeHtml(listing.price));
  if (listing.features && listing.features.length) {
    lines.push(escapeHtml(listing.features.join(' · ')));
  }
  lines.push(listing.url);

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join('\n'),
      parse_mode: 'HTML',
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Telegram-melding mislukt (${response.status}): ${body}`);
  }
}

module.exports = { sendTelegramMessage };
