var mongoose = require('mongoose');

var TokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        index: {
            unique: true
        }
    },
    clientId: {
        type: String,
        required: true
    },
    expires: {
        type: Date
    },
    userId: {
        type: String,
        required: true
    },
    roles: [],
    type: String
});

module.exports = mongoose.model('Token', TokenSchema);