const mongoose = require('mongoose');

const TARequestSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  requested_time: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model('TARequest', TARequestSchema);
