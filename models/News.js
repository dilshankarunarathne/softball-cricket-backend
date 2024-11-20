const mongoose = require('../db');

const NewsSchema = new mongoose.Schema({
  image: { type: String, required: false }, // URL or path to the image
  description: { type: String, required: true },
  created_time: { type: Date, default: Date.now }
});

module.exports = mongoose.model('News', NewsSchema);
