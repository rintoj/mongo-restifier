var mongoose = require('mongoose');

var CounterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

Counter = mongoose.model('Counter', CounterSchema);
Counter.increment = function(id, callback) {
  var self = this;
  self.findByIdAndUpdate({
    _id: id
  }, {
    $inc: {
      seq: 1
    }
  }, function(error, value) {
    if (error) callback(error);
    if (value === null) {
      return self.create({
        _id: id,
        seq: 1
      }, function(error, value) {
        if (error) callback(error);
        callback(null, 1);
      })
    }

    callback(null, value.seq);
  });
};

module.exports = Counter;