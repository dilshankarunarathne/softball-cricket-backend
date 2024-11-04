const mongoose = require('../db');

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  user_type: String,
});

module.exports = mongoose.model('User', UserSchema);
