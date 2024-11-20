const Match = require('../models/Match');

async function updateMatchStatuses() {
  console.log('Updating match statuses...');
  await Match.updateStatuses();
}

module.exports = { updateMatchStatuses };
