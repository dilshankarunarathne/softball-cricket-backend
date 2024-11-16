const mongoose = require('../db');

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  matches: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  // TODO: add more fields as necessary 
});

module.exports = mongoose.model('Team', TeamSchema);
