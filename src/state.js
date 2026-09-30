const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, '..', 'state', 'seen.json');

function loadState() {
  if (!fs.existsSync(STATE_PATH)) return {};
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
}

function saveState(state) {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + '\n');
}

module.exports = { loadState, saveState };
