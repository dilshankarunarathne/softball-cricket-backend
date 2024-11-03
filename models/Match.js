const mongoose = require('./db');

const MatchSchema = new mongoose.Schema({
  team1: { type: String, required: true },
  team2: { type: String, required: true },
  date: { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  location: { type: String, required: true }
});

module.exports = mongoose.model('Match', MatchSchema);
