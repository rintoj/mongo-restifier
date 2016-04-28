var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  name: String,
  userId: {
    type: String,
    index: {
      unique: true
    }
  },
  password: String,
  roles: [],
  active: {
    type: Boolean,
    default: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);