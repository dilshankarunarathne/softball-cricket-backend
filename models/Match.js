const mongoose = require('../db');

const MatchSchema = new mongoose.Schema({
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  date: { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  location: { type: String, required: true },

  // result fields
  team1_score: { type: Number, default: 0 },
  team2_score: { type: Number, default: 0 },
  team1_wickets: { type: Number, default: 0 },
  team2_wickets: { type: Number, default: 0 },
  winner: { type: String, default: '' },
  status: { type: String, default: 'pending' },

  // dynamic fields
  // TODO: add more fields as necessary
});

module.exports = mongoose.model('Match', MatchSchema);
