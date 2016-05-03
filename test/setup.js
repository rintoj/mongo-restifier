var chai = require('chai');
var chain = require('../src/util/chain');
var should = chai.should();
var mongoose = require('mongoose');

var mongoRestifier = require('../src/index');

// intial setup
chai.use(require('chai-http'));
chai.use(require("chai-sorted"));
chai.use(require('chai-things'));

var AuthService = function AuthService() {

    var self = this;

    self.accessToken;
    self.refreshToken;
    self.startedUp = false;
    self.startupInProgress = false;
    self.clientId = '7d65d9b6-5cae-4db7-b19d-56cbdd25eaab';
    self.clientSecret = 'a0c7b741-b18b-47eb-b6df-48a0bd3cde2e';
    self.readyCallback = [];

    self.instance = mongoRestifier('./test/api.test.conf.json')

    // define "Todo" model
    .register(mongoRestifier.defineModel("Todo", {

        // api end point
        url: '/todo',

        // schema definition - supports everything that mongoose schema supports
        schema: {

            index: {
                type: Number,
                required: true,
                min: 1,
                autoIncrement: true,
                idField: true
            },
            title: {
                type: String,
                required: true
            },
            description: String,
            status: {
                type: String,
                required: true,
                default: 'new',
                enum: ['new', 'progress', 'done', 'hold']
            }
        },

        userSpace: {
            field: "_user"
        },
        timestamps: true

    }))

    .startup();

    self.aquireAccessToken = function aquireAccessToken(callback, useRefreshToken) {

        var request = chai.request(self.instance.app)
            .post('/api/oauth2/token')
            .set('content-type', 'application/x-www-form-urlencoded')
            .auth(self.clientId, self.clientSecret)
            .send(!useRefreshToken ? {
                "grant_type": "password",
                "username": "testuser@system.com",
                "password": "c3lzYWRtaW4="
            } : {
                "grant_type": "refresh_token",
                "refresh_token": self.refreshToken
            })
            .end(function(err, res) {
                if (res.status === 200) {
                    self.accessToken = 'Bearer ' + res.body.access_token;
                    self.refreshToken = res.body.refresh_token;
                }
                if (typeof callback === 'function') callback(err, res);
            });

        return self;
    };

    self.ready = function(callback) {
        if (self.startedUp) {
            callback();
        } else {
            self.readyCallback.push(callback);
        }

        if (self.startupInProgress) {
            return this;
        }

        self.startupInProgress = true;

        chain.start()
            .add(function(callback) {
                mongoose.createConnection(self.instance.properties.database.url, callback);
            })
            .add(function(callback) {
                mongoose.connection.db.dropDatabase(callback);
            })
            .add(function(callback) {
                mongoose.model('Client').remove({}, callback);
            })
            .add(function(callback) {
                mongoose.model('Client').create({
                    name: 'Test client',
                    clientId: self.clientId,
                    clientSecret: self.clientSecret
                }, callback);
            })
            .add(function(callback) {
                mongoose.model('User').create({
                    name: "Sample User",
                    userId: "testuser@system.com",
                    password: "c3lzYWRtaW4=",
                    "roles": ["admin"]
                }, callback);
            })
            .add(function(callback) {
                self.aquireAccessToken(callback);
            })
            .add(function(callback) {
                self.startedUp = true;
                self.readyCallback.map(function(callback) {
                    callback();
                });
            })
            .exec(function(responses) {
                console.log(responses);
            });
    };
}

module.exports = new AuthService();