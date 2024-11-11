const mongoose = require('../db');

const NotificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  time_created: { type: Date, default: Date.now },
  seen_by: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Notification', NotificationSchema);
