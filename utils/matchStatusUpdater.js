const Match = require('../models/Match');

async function updateMatchStatuses() {
  await Match.updateStatuses();
}

module.exports = { updateMatchStatuses };
