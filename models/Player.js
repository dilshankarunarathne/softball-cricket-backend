const mongoose = require('../db');

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  team: { type: String, required: true },

  // ranking data
  matches_played: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
});

module.exports = mongoose.model('Player', PlayerSchema);
