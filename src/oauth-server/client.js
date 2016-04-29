var uuid = require('uuid');
var mongoose = require('mongoose');

var ClientSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
    default: uuid.v4(),
    index: {
      unique: true
    }
  },
  clientSecret: {
    type: String,
    required: true,
    default: uuid.v4()
  },
  name: {
    type: String,
    required: true,
    index: {
      unique: true
    }
  },
  description: {
    type: String,
    required: false
  },
  active: {
    type: Boolean,
    required: true,
    default: false
  },
  grantType: {
    type: Array,
    required: true,
    default: ["password", "refresh_token"]
  },
  expires: {
    type: Date,
    default: new Date(+new Date() + 365 * 24 * 60 * 60 * 1000)
  }
});

module.exports = mongoose.model('Client', ClientSchema);