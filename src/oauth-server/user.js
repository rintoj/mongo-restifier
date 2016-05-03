var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
  schema: {
    name: String,
    userId: {
      type: String,
      required: true,
      index: {
        unique: true
      }
    },
    password: {
      type: String,
      required: true
    },
    roles: [],
    active: {
      type: Boolean,
      required: true,
      default: true
    }
  }
});

module.exports = mongoose.model('User', UserSchema);