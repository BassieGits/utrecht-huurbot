const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const STATE_PATH = path.join(__dirname, '..', 'state', 'seen.json');

function loadJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function saveJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function main() {
  const [, , command, ...args] = process.argv;
  const config = loadJson(CONFIG_PATH, []);

  if (command === 'add') {
    const [name, url, site = 'pararius'] = args;
    if (!name || !url) {
      console.error('Gebruik: npm run search:add -- "<naam>" "<url>" [site]');
      process.exit(1);
    }
    if (config.some((s) => s.name === name)) {
      console.error(`Er bestaat al een zoekopdracht met de naam "${name}".`);
      process.exit(1);
    }
    config.push({ name, site, url });
    saveJson(CONFIG_PATH, config);
    console.log(`Zoekopdracht "${name}" toegevoegd. Eerste run markeert huidige resultaten stil als gezien.`);
    return;
  }

  if (command === 'list') {
    if (config.length === 0) {
      console.log('Geen zoekopdrachten geconfigureerd.');
      return;
    }
    config.forEach((s) => console.log(`- ${s.name} [${s.site}]\n  ${s.url}`));
    return;
  }

  if (command === 'remove') {
    const [name] = args;
    if (!name) {
      console.error('Gebruik: npm run search:remove -- "<naam>"');
      process.exit(1);
    }
    const next = config.filter((s) => s.name !== name);
    if (next.length === config.length) {
      console.error(`Geen zoekopdracht gevonden met de naam "${name}".`);
      process.exit(1);
    }
    saveJson(CONFIG_PATH, next);

    const state = loadJson(STATE_PATH, {});
    if (state[name]) {
      delete state[name];
      saveJson(STATE_PATH, state);
    }
    console.log(`Zoekopdracht "${name}" verwijderd.`);
    return;
  }

  console.error('Onbekend commando. Gebruik: add | list | remove');
  process.exit(1);
}

main();
