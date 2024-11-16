const mongoose = require('../db');

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  user_type: String,

  // non-mandetory fields
  firstName: { type: String, default: '' }, 
  lastName: { type: String, default: '' },
  email: { type: String, default: '' },
  phoneNumber: { type: String, default: '' }
});

module.exports = mongoose.model('User', UserSchema);
