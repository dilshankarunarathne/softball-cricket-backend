const mongoose = require('../db');

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  team: { type: String, required: true },
  runs_scored: { type: Number, default: 0 },
  wickets_taken: { type: Number, default: 0 },
  overs_bowled: { type: Number, default: 0 }
});

module.exports = mongoose.model('Player', PlayerSchema);
