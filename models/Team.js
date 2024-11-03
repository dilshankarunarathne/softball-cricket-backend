const mongoose = require('./db');

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  coach: { type: String, required: true },
  players: [{ type: String, required: true }]
});

module.exports = mongoose.model('Team', TeamSchema);
