var chai = require('chai');
var should = chai.should();

var mongoRestifier = require('../src/index');

// intial setup
chai.use(require('chai-http'));
chai.use(require("chai-sorted"));
chai.use(require('chai-things'));

var AuthService = function AuthService() {

    var self = this;

    self.accessToken;
    self.refreshToken;
    self.clientId = '7d65d9b6-5cae-4db7-b19d-56cbdd25eaab';
    self.clientSecret = 'a0c7b741-b18b-47eb-b6df-48a0bd3cde2e';

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
                "username": "superuser@system.com",
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
}

module.exports = new AuthService();