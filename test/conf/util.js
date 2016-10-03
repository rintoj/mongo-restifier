var chai = require('chai');
var chain = require('chain-async');
var mongoose = require('mongoose');
var noteModel = require('./note.model');
var todoModel = require('./todo.model');
var taskModel = require('./task.model');
var mongoRestifier = require('../../src/index')

var should = chai.should();
chai.use(require('chai-http'));
chai.use(require('chai-sorted'));
chai.use(require('chai-things'));

module.exports = {
    clientId: '7d65d9b6-5cae-4db7-b19d-56cbdd25eaab',
    clientSecret: 'a0c7b741-b18b-47eb-b6df-48a0bd3cde2e',

    acquireAccessToken: function acquireAccessToken(callback, useRefreshToken, user) {
        var self = this;
        var request = chai.request(self.instance.app)
            .post('/api/oauth2/token')
            .set('content-type', 'application/x-www-form-urlencoded')
            .auth(self.clientId, self.clientSecret)
            .send(!useRefreshToken ? {
                "grant_type": "password",
                "username": (user && user.userId) || "superuser@system.com",
                "password": (user && user.password) || "c3lzYWRtaW4="
            } : {
                "grant_type": "refresh_token",
                "refresh_token": self.refreshToken
            })
            .end(function (err, res) {
                if (res.status === 200) {
                    self.accessToken = 'Bearer ' + res.body.access_token;
                    self.refreshToken = res.body.refresh_token;
                }
                if (typeof callback === 'function') callback(err, res);
            });

        return this;
    },

    setup: function (done) {
        var self = this;
        if (self.instance != undefined) {
            done();
            return self;
        }
        mongoose.createConnection('mongodb://localhost/test', function () {
            var commands = [];
            Object.keys(mongoose.connection.collections).forEach(function (collectionName) {
                commands.push(function (callback) {
                    mongoose.connection.collections[collectionName].drop();
                    callback();
                });
            });

            commands.push(function createModel(callback) {

                self.instance = mongoRestifier('./test/conf/api.test.conf.json')
                    .registerModel(noteModel)
                    .registerModel(todoModel)
                    .registerModel(taskModel)
                    .startup();

                callback();
            });

            chain.series(commands, function () {
                done();
            });

        });
    }
}