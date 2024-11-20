const mongoose = require('../db');

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  team: { type: String, required: true },
  batting_style: { type: String, default: null },
  bowling_style: { type: String, default: null },
  phone_number: { type: String, default: null },
  email: { type: String, default: null },
  date_of_birth: { type: Date, default: null },
  first_name: { type: String, default: null },
  last_name: { type: String, default: null },
  // ranking data
  matches_played: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
});

module.exports = mongoose.model('Player', PlayerSchema);
