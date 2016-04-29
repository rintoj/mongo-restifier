/**
 * @author rintoj (Rinto Jose)
 * @license The MIT License (MIT)
 *
 * Copyright (c) 2016 rintoj
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the " Software "), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED " AS IS ", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
var app = require('express')();
var chai = require('chai');
var should = chai.should();
var mongoose = require('mongoose');
var chaiHttp = require('chai-http');
var mongoRestifier = require('../src/index');

// intial setup
chai.use(chaiHttp);

// configure the api
var instance = mongoRestifier('./test/api.test.conf.json')

// define "Todo" model
.register(mongoRestifier.defineModel("Todo", {

  // api end point
  url: '/todo',

  // schema definition - supports everything that mongoose schema supports
  schema: {
    index: {
      type: Number, // type of this attribute
      autoIncrement: true, // auto increment this attribute
      idField: true // serves as id attribute replacing _id
    },
    title: {
      type: String,
      required: true
    },
    description: String, // attribute definition can be as simple as this
    status: String,
  }

}))

.startup();

describe('mongo-restifier', function() {

  var accessToken, refreshToken;

  var aquireAccessToken = function aquireAccessToken(callback, useRefreshToken) {
    var request = chai.request(instance.app)
      .post('/api/oauth2/token')
      .set('content-type', 'application/x-www-form-urlencoded')
      .auth('7d65d9b6-5cae-4db7-b19d-56cbdd25eaab', 'a0c7b741-b18b-47eb-b6df-48a0bd3cde2e')
      .send(!useRefreshToken ? {
        "grant_type": "password",
        "username": "superuser@system.com",
        "password": "c3lzYWRtaW4="
      } : {
        "grant_type": "refresh_token",
        "refresh_token": refreshToken
      })
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('access_token');
        res.body.should.have.property('refresh_token');
        accessToken = 'Bearer ' + res.body.access_token;
        refreshToken = res.body.refresh_token;
        if (typeof callback === 'function') callback(err, res);
      });
  };

  describe('OAuth2 Service', function() {

    it('should ALLOW ACCESS to OPTIONS /api/todo without token', function(done) {
      chai.request(instance.app)
        .options('/api/todo')
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.html;
          res.text.should.equal('PUT,GET,POST,DELETE');
          done();
        });
    });

    it('should DENY ACCESS to GET /api/todo without token', function(done) {
      chai.request(instance.app)
        .get('/api/todo')
        .end(function(err, res) {
          res.should.have.status(401);
          done();
        });
    });

    it('should DENY ACCESS to POST /api/todo without token', function(done) {
      chai.request(instance.app)
        .post('/api/todo')
        .end(function(err, res) {
          res.should.have.status(401);
          done();
        });
    });

    it('should DENY ACCESS to PUT /api/todo without token', function(done) {
      chai.request(instance.app)
        .put('/api/todo')
        .end(function(err, res) {
          res.should.have.status(401);
          done();
        });
    });

    it('should DENY ACCESS to DELETE /api/todo without token', function(done) {
      chai.request(instance.app)
        .delete('/api/todo')
        .end(function(err, res) {
          res.should.have.status(401);
          done();
        });
    });

    it('should ISSUE TOKEN with POST /api/oauth2/token', function(done) {
      aquireAccessToken(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('token_type');
        res.body.should.have.property('access_token');
        res.body.should.have.property('expires_in');
        res.body.should.have.property('refresh_token');
        done();
      });
    });

    it('should ALLOW ACCESS to OPTIONS /api/todo with token', function(done) {
      chai.request(instance.app)
        .options('/api/todo')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.html;
          res.text.should.equal('PUT,GET,POST,DELETE');
          done();
        });
    });

    it('should ALLOW ACCESS to GET /api/todo with token', function(done) {
      chai.request(instance.app)
        .get('/api/todo')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          done();
        });
    });

    it('should ALLOW ACCESS to POST /api/todo with token', function(done) {
      chai.request(instance.app)
        .post('/api/todo')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          done();
        });
    });

    it('should ALLOW ACCESS to PUT /api/todo with token', function(done) {
      chai.request(instance.app)
        .put('/api/todo')
        .set('authorization', accessToken)
        .send({
          "title": "Sample note"
        })
        .end(function(err, res) {
          res.should.have.status(200);
          done();
        });
    });

    it('should ALLOW ACCESS to DELETE /api/todo with token', function(done) {
      chai.request(instance.app)
        .delete('/api/todo')
        .set('authorization', accessToken)
        .send({
          "title": "Sample note"
        })
        .end(function(err, res) {
          res.should.have.status(200);
          done();
        });
    });

    it('should REISSUE TOKEN when POST /api/oauth2/token is called with refresh_token', function(done) {
      aquireAccessToken(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('token_type');
        res.body.should.have.property('access_token');
        res.body.should.have.property('expires_in');
        res.body.should.have.property('refresh_token');
        done();
      }, true);
    });

    it('should REVOKE TOKEN with POST /api/oauth2/revoke', function(done) {
      chai.request(instance.app)
        .post('/api/oauth2/revoke')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          done();
        });
    });

    it('should DENY ACCESS when a revoked token is used with GET /api/todo', function(done) {
      chai.request(instance.app)
        .get('/api/todo')
        .set('content-type', 'application/json')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(401);
          res.should.be.json;
          done();
        });
    });
  });

  describe('Todo Service', function() {

    before(function(done) {
      aquireAccessToken(done);
    })

    xit('should add a SINGLE story /story PUT', function(done) {
      chai.request(instance.app)
        .post('/story')
        .send({
          'title': 'Sample story'
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('SUCCESS');
          res.body.SUCCESS.should.be.a('object');
          res.body.SUCCESS.should.have.property('name');
          res.body.SUCCESS.should.have.property('lastName');
          res.body.SUCCESS.should.have.property('_id');
          res.body.SUCCESS.name.should.equal('Java');
          res.body.SUCCESS.lastName.should.equal('Script');
          done();
        });
    });

    xit('should list ALL stories on /api/todo GET', function(done) {
      chai.request(instance.app)
        .get('/api/todo')
        .end(function(err, res) {
          console.log(res);
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          done();
        });
    });


  });
});