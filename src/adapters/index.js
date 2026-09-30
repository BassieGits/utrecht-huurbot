const fs = require('fs');
const path = require('path');

// Laadt automatisch elke adapter in deze map. De bestandsnaam (zonder .js) is de
// `site`-waarde in config.json. Een nieuwe makelaar toevoegen = alleen een nieuw bestand.
function loadAdapters() {
  const adapters = {};
  for (const file of fs.readdirSync(__dirname)) {
    if (!file.endsWith('.js') || file === 'index.js') continue;
    const name = path.basename(file, '.js');
    const adapter = require(path.join(__dirname, file));
    if (typeof adapter.fetchListings !== 'function') {
      console.warn(`Adapter "${name}" heeft geen fetchListings-functie, overgeslagen.`);
      continue;
    }
    adapters[name] = adapter;
  }
  return adapters;
}

module.exports = { loadAdapters };
