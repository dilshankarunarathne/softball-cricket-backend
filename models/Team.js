const mongoose = require('../db');

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // TODO: add more fields as necessary 
});

module.exports = mongoose.model('Team', TeamSchema);
