/**
 * @author rintoj (Rinto Jose)
 * @license The MIT License (MIT)
 *
 * Copyright (c) 2016 rintoj
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the " Software ", to deal
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
var chai = require('chai');
var chain = require('chain-async');
var should = chai.should();
var mongoose = require('mongoose');
var mongoRestifier = require('../src/index');

chai.use(require('chai-http'));
chai.use(require('chai-sorted'));
chai.use(require('chai-things'));

describe('mongo-resifier', function() {

  var instance;
  var accessToken;
  var refreshToken;
  var clientId = '7d65d9b6-5cae-4db7-b19d-56cbdd25eaab';
  var clientSecret = 'a0c7b741-b18b-47eb-b6df-48a0bd3cde2e';

  var aquireAccessToken = function aquireAccessToken(callback, useRefreshToken, user) {

    var request = chai.request(instance.app)
      .post('/api/oauth2/token')
      .set('content-type', 'application/x-www-form-urlencoded')
      .auth(clientId, clientSecret)
      .send(!useRefreshToken ? {
        "grant_type": "password",
        "username": (user && user.userId) || "superuser@system.com",
        "password": (user && user.password) || "c3lzYWRtaW4="
      } : {
        "grant_type": "refresh_token",
        "refresh_token": refreshToken
      })
      .end(function(err, res) {
        if (res.status === 200) {
          accessToken = 'Bearer ' + res.body.access_token;
          refreshToken = res.body.refresh_token;
        }
        if (typeof callback === 'function') callback(err, res);
      });

    return this;
  };

  before(function(done) {

    mongoose.createConnection('mongodb://localhost/test', function() {
      var commands = [];
      Object.keys(mongoose.connection.collections).forEach(function(collectionName) {
        console.log(collectionName);
        commands.push(function(callback) {
          mongoose.connection.collections[collectionName].drop();
          callback();
        });
      });

      commands.push(function createModel(callback) {
        instance = mongoRestifier('./test/api.test.conf.json')

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

        callback();
      });

      chain.series(commands, function() {
        done();
      });

    });

  });

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

    it('should DENY ACCESS when POST /api/oauth2/token is called with revoked refresh_token', function(done) {
      aquireAccessToken(function(err, res) {
        res.should.have.status(401);
        done();
      }, true);
    });

  });

  describe('Todo Service', function() {

    var itemsCount = 0;
    var newIds = [];

    before(function(done) {
      aquireAccessToken(done);
    });

    it('should add a SINGLE item when using PUT /api/todo', function(done) {
      chai.request(instance.app)
        .put('/api/todo')
        .set('authorization', accessToken)
        .send({
          'title': 'Sample story'
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('created');
          res.body.should.have.property('item');
          res.body.item.should.have.property('index');
          res.body.item.should.have.property('title');
          res.body.item.title.should.be.equal('Sample story');
          res.body.item.should.have.property('status');
          res.body.item.status.should.be.equal('new');
          itemsCount++;
          done();
        });
    });

    it('should add MULTIPLE items when using PUT /api/todo', function(done) {
      chai.request(instance.app)
        .put('/api/todo')
        .set('authorization', accessToken)
        .send([{
          'title': 'Sample story1'
        }, {
          'title': 'Sample story2'
        }])
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('saved');
          res.body.should.have.property('result');
          res.body.result.should.have.property('created');
          res.body.result.created.should.be.equal(2);
          res.body.result.should.have.property('newIds');
          res.body.result.newIds.should.have.length(2);
          itemsCount += 2;
          newIds = res.body.result.newIds;
          done();
        });
    });

    it('should update a SINGLE item when using PUT /api/todo/{id}', function(done) {
      chai.request(instance.app)
        .put('/api/todo/' + newIds[0])
        .set('authorization', accessToken)
        .send({
          'title': 'Sample story1'
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('updated');
          res.body.should.have.property('item');
          res.body.item.should.have.property('title');
          res.body.item.title.should.be.equal('Sample story1');
          done();
        });
    });

    it('should update MULTIPLE items when using PUT /api/todo', function(done) {
      chai.request(instance.app)
        .put('/api/todo')
        .set('authorization', accessToken)
        .send([{
          'index': newIds[0],
          'title': 'Sample story'
        }, {
          'index': newIds[1],
          'title': 'Sample story'
        }])
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('saved');
          res.body.should.have.property('result');
          res.body.result.should.have.property('updated');
          res.body.result.updated.should.be.equal(2);
          done();
        });

    });

    it('should NOT UPDATE items, if no change in properties, when using PUT /api/todo', function(done) {

      chai.request(instance.app)
        .put('/api/todo')
        .set('authorization', accessToken)
        .send([{
          'index': newIds[0],
          'title': 'Sample story'
        }, {
          'index': newIds[1],
          'title': 'Sample story'
        }])
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('saved');
          res.body.should.have.property('result');
          res.body.result.should.have.property('updated');
          res.body.result.updated.should.be.equal(0);
          done();
        });
    });

    it('should NOT CREATE, but only UPDATE items, when using PUT /api/todo?updateOnly=true', function(done) {

      chai.request(instance.app)
        .put('/api/todo?updateOnly=true')
        .set('authorization', accessToken)
        .send([{
          'title': 'Sample story1'
        }, {
          'index': newIds[1],
          'title': 'Sample story4'
        }])
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('saved');
          res.body.should.have.property('result');
          res.body.result.should.have.property('created');
          res.body.result.created.should.be.equal(0);
          res.body.result.should.have.property('newIds');
          res.body.result.newIds.should.be.length(0);
          res.body.result.should.have.property('updated');
          res.body.result.updated.should.be.equal(1);
          done();
        });
    });

    it('should NOT UPDATE, but only Create items, when using PUT /api/todo?createOnly=true', function(done) {

      chai.request(instance.app)
        .put('/api/todo?createOnly=true')
        .set('authorization', accessToken)
        .send([{
          'title': 'Sample story1'
        }, {
          'index': newIds[1],
          'title': 'Sample story4'
        }])
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('saved');
          res.body.should.have.property('result');
          res.body.result.should.have.property('created');
          res.body.result.created.should.be.equal(1);
          res.body.result.should.have.property('newIds');
          res.body.result.newIds.should.be.length(1);
          res.body.result.should.not.have.property('updated');
          itemsCount++;
          done();
        });
    });

    it('should REJECT WITH ERROR, when createOnly and updateOnly are used together when using PUT /api/todo', function(done) {
      chai.request(instance.app)
        .put('/api/todo?updateOnly=true&createOnly=true')
        .set('authorization', accessToken)
        .send([{
          'title': 'Sample story1'
        }, {
          'title': 'Sample story2'
        }])
        .end(function(err, res) {
          res.should.have.status(422);
          res.should.be.json;
          done();
        });
    });

    it('should set createdAt and updatedAt when an item is created when using PUT /api/todo', function(done) {
      chai.request(instance.app)
        .put('/api/todo')
        .set('authorization', accessToken)
        .send({
          'title': 'Sample story'
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('created');
          res.body.should.have.property('item');
          res.body.item.should.have.property('createdAt');
          res.body.item.should.have.property('updatedAt');
          itemsCount++;
          done();
        });
    });

    it('should set _user when an item is created when using PUT /api/todo', function(done) {
      chai.request(instance.app)
        .put('/api/todo?fields=_user')
        .set('authorization', accessToken)
        .send({
          'title': 'Sample story'
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('created');
          res.body.should.have.property('item');
          res.body.item.should.have.property('_user');
          res.body.item._user.should.be.equal('superuser@system.com');
          itemsCount++;
          done();
        });
    });

    it('should override _user when an item with _user set, is sent for creation when using PUT /api/todo', function(done) {
      chai.request(instance.app)
        .put('/api/todo?fields=_user')
        .set('authorization', accessToken)
        .send({
          'title': 'Sample story',
          '_user': 'test'
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('created');
          res.body.should.have.property('item');
          res.body.item.should.have.property('_user');
          res.body.item._user.should.be.equal('superuser@system.com');
          itemsCount++;
          done();
        });
    });

    it('should override _user when an item with _user set, is sent for update when using PUT /api/todo/{id}', function(done) {
      chai.request(instance.app)
        .put('/api/todo/' + newIds[0] + '?fields=_user')
        .set('authorization', accessToken)
        .send({
          'title': 'Sample story',
          '_user': 'test'
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('updated');
          res.body.should.have.property('item');
          res.body.item.should.not.have.property('__v');
          res.body.item.should.not.have.property('_id');
          res.body.item.should.have.property('_user');
          res.body.item._user.should.be.equal('superuser@system.com');
          done();
        });
    });

    it('should list ALL todos when using GET /api/todo', function(done) {
      chai.request(instance.app)
        .get('/api/todo')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length(itemsCount);
          done();
        });
    });

    it('should list ALL todos without fields starting with _ when using GET /api/todo', function(done) {
      chai.request(instance.app)
        .get('/api/todo')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.above(1);
          res.body.should.all.not.have.property('__v');
          res.body.should.all.not.have.property('_id');
          res.body.should.all.not.have.property('_user');
          done();
        });
    });

    it('should list ALL todos with fields index and _user when using GET /api/todo?fields=index,_user', function(done) {
      chai.request(instance.app)
        .get('/api/todo?fields=index,_user')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.above(1);
          res.body.should.all.not.have.property('__v');
          res.body.should.all.not.have.property('_id');
          res.body.should.all.not.have.property('id');
          res.body.should.all.not.have.property('title');
          res.body.should.all.have.property('_user');
          res.body.should.all.have.property('index');
          done();
        });
    });

    it('should list ALL todos sorted in ascending order when using GET /api/todo?sort=index', function(done) {
      chai.request(instance.app)
        .get('/api/todo?sort=index')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.above(1);
          res.body.should.all.have.property('index');
          res.body.should.be.sortedBy('index');
          done();
        });
    });

    it('should list ALL todos sorted in decending order when using GET /api/todo?sort=-index', function(done) {
      chai.request(instance.app)
        .get('/api/todo?sort=-index')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.above(1);
          res.body.should.all.have.property('index');
          res.body.should.be.sortedBy('index', true);
          done();
        });
    });

    it('should limit list to 2 items when using GET /api/todo?limit=2', function(done) {
      chai.request(instance.app)
        .get('/api/todo?limit=2')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length(2);
          done();
        });
    });

    it('should skip first 2 items when using GET /api/todo?skip=2&limit=2', function(done) {
      chai.request(instance.app)
        .get('/api/todo?limit=2')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          var firstItem = res.body[0];
          chai.request(instance.app)
            .get('/api/todo?skip=2&limit=2')
            .set('authorization', accessToken)
            .end(function(err, res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('array');
              res.body.should.contain.a.thing.with.property('index', firstItem.index + 2);
              res.body.should.have.length(2);
              done();
            });
        });
    });

    it('should return an item with given id when using GET /api/todo/{id}', function(done) {
      chai.request(instance.app)
        .get('/api/todo?limit=2')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          var firstItem = res.body[0];
          chai.request(instance.app)
            .get('/api/todo/' + firstItem.index)
            .set('authorization', accessToken)
            .end(function(err, res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('array');
              res.body.should.all.have.property('index');
              res.body.should.have.length(1);
              res.body[0].should.be.deep.equal(firstItem);
              done();
            });
        });
    });

    it('should return an item with given index when using GET /api/todo?index={index}', function(done) {
      chai.request(instance.app)
        .get('/api/todo?limit=2')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          var firstItem = res.body[0];
          chai.request(instance.app)
            .get('/api/todo?index=' + firstItem.index)
            .set('authorization', accessToken)
            .end(function(err, res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('array');
              res.body.should.all.have.property('index');
              res.body.should.have.length(1);
              res.body[0].should.be.deep.equal(firstItem);
              done();
            });
        });
    });

    it('should list ALL todos when using POST /api/todo', function(done) {
      chai.request(instance.app)
        .post('/api/todo')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length(itemsCount);
          done();
        });
    });

    it('should list NO todos when using POST /api/todo with body {status: hold}', function(done) {
      chai.request(instance.app)
        .post('/api/todo')
        .set('authorization', accessToken)
        .send({
          status: 'hold'
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length(0);
          done();
        });
    });

    it('should list ALL todos when using GET /api/todo with body {status: hold}', function(done) {
      chai.request(instance.app)
        .get('/api/todo')
        .set('authorization', accessToken)
        .send({
          status: 'hold'
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');

          // should ignore body and apply no filter hence itemsCount instead of 0
          res.body.should.have.length(itemsCount);
          done();
        });
    });

    it('should list ALL todos without fields starting with _ when using POST /api/todo', function(done) {
      chai.request(instance.app)
        .post('/api/todo')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.above(1);
          res.body.should.all.not.have.property('__v');
          res.body.should.all.not.have.property('_id');
          res.body.should.all.not.have.property('_user');
          done();
        });
    });

    it('should list ALL todos with fields index and _user when using POST /api/todo?fields=index,_user', function(done) {
      chai.request(instance.app)
        .post('/api/todo?fields=index,_user')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.above(1);
          res.body.should.all.not.have.property('__v');
          res.body.should.all.not.have.property('_id');
          res.body.should.all.not.have.property('id');
          res.body.should.all.not.have.property('title');
          res.body.should.all.have.property('_user');
          res.body.should.all.have.property('index');
          done();
        });
    });

    it('should list ALL todos sorted in ascending order when using POST /api/todo?sort=index', function(done) {
      chai.request(instance.app)
        .post('/api/todo?sort=index')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.above(1);
          res.body.should.all.have.property('index');
          res.body.should.be.sortedBy('index');
          done();
        });
    });

    it('should list ALL todos sorted in decending order when using POST /api/todo?sort=-index', function(done) {
      chai.request(instance.app)
        .post('/api/todo?sort=-index')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.above(1);
          res.body.should.all.have.property('index');
          res.body.should.be.sortedBy('index', true);
          done();
        });
    });

    it('should limit list to 2 items when using POST /api/todo?limit=2', function(done) {
      chai.request(instance.app)
        .post('/api/todo?limit=2')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length(2);
          done();
        });
    });

    it('should skip first 2 items when using POST /api/todo?skip=2&limit=2', function(done) {
      chai.request(instance.app)
        .post('/api/todo?limit=2')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          var firstItem = res.body[0];
          chai.request(instance.app)
            .post('/api/todo?skip=2&limit=2')
            .set('authorization', accessToken)
            .end(function(err, res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('array');
              res.body.should.contain.a.thing.with.property('index', firstItem.index + 2);
              res.body.should.have.length(2);
              done();
            });
        });
    });

    it('should return an item with given index when using /api/todo?index={index}', function(done) {
      chai.request(instance.app)
        .post('/api/todo?limit=2')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          var firstItem = res.body[0];
          chai.request(instance.app)
            .post('/api/todo?index=' + firstItem.index)
            .set('authorization', accessToken)
            .end(function(err, res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('array');
              res.body.should.all.have.property('index');
              res.body.should.have.length(1);
              res.body[0].should.be.deep.equal(firstItem);
              done();
            });
        });
    });

    it('should update status of an item when using PUT /api/todo/{id} {status=hold}', function(done) {
      chai.request(instance.app)
        .get('/api/todo?limit=2')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          var firstItem = res.body[0];
          firstItem.status.should.not.be.equal('hold');
          chai.request(instance.app)
            .put('/api/todo/' + firstItem.index)
            .set('authorization', accessToken)
            .send({
              status: 'hold'
            })
            .end(function(err, res) {
              res.should.have.status(200);
              chai.request(instance.app)
                .get('/api/todo/' + firstItem.index)
                .set('authorization', accessToken)
                .end(function(err, res) {
                  res.should.have.status(200);
                  res.should.be.json;
                  res.body.should.be.a('array');
                  res.body.should.all.have.property('status');
                  res.body.should.have.length(1);
                  res.body[0].status.should.be.equal('hold');
                  done();
                });
            });
        });
    });

    it('should delete a SINGLE item when access when using DELETE /api/todo/{id}', function(done) {
      chai.request(instance.app)
        .delete('/api/todo/' + newIds[0])
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('deleted');
          res.body.should.have.property('item');
          res.body.item.should.not.have.property('__v');
          res.body.item.should.not.have.property('_id');
          res.body.item.should.not.have.property('_user');
          itemsCount--;
          chai.request(instance.app)
            .get('/api/todo')
            .set('authorization', accessToken)
            .end(function(err, res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('array');
              res.body.should.have.length(itemsCount);
              done();
            });
        });
    });

    it('should RETURN ITEMS with status = new when using GET /api/todo?status=new', function(done) {
      chai.request(instance.app)
        .get('/api/todo?status=new')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length(itemsCount - 1); // one item was updated to 'hold' previously
          done();
        });
    });

    it('should RETURN ITEMS with status = new when using POST /api/todo?status=new', function(done) {
      chai.request(instance.app)
        .post('/api/todo?status=new')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length(itemsCount - 1); // one item was updated to 'hold' previously
          res.body.should.all.not.have.property('__v');
          res.body.should.all.not.have.property('_id');
          res.body.should.all.not.have.property('_user');
          done();
        });
    });

    it('should RETURN ITEMS with status = new when using POST /api/todo', function(done) {
      chai.request(instance.app)
        .post('/api/todo')
        .set('authorization', accessToken)
        .send({
          status: 'new'
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length(itemsCount - 1); // one item was updated to 'hold' previously
          done();
        });
    });

    it('should RETURN ITEMS with a regular expression search when using POST /api/todo', function(done) {
      chai.request(instance.app)
        .post('/api/todo')
        .set('authorization', accessToken)
        .send({
          title: {
            '$regex': '^S.*1$'
          }
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length(1); // one item was updated to 'hold' previously
          done();
        });
    });

    it('should DELETE ALL ITEMS with status = new when using DELETE /api/todo { status: new }', function(done) {
      chai.request(instance.app)
        .get('/api/todo?status=new')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          var count = res.body.length;
          chai.request(instance.app)
            .delete('/api/todo')
            .set('authorization', accessToken)
            .send({
              status: 'new'
            })
            .end(function(err, res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('object');
              res.body.should.have.property('status');
              res.body.status.should.be.equal('deleted');
              res.body.should.have.property('deleted');
              res.body.deleted.should.have.property('n');
              res.body.deleted.n.should.be.equal(count);
              done();
            });
        });
    });

    it('should return maximum of 100 records when using GET /api/todo', function(done) {
      var items = [];
      for (var i = 0; i < 110; i++) {
        items.push({
          title: 'New title'
        });
      }
      chai.request(instance.app)
        .put('/api/todo')
        .set('authorization', accessToken)
        .send(items)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          chai.request(instance.app)
            .get('/api/todo')
            .set('authorization', accessToken)
            .end(function(err, res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('array');
              res.body.should.have.length(100);
              done();
            });
        });
    });

    it('should RETURN COUNT when using GET /api/todo?count=true', function(done) {
      chai.request(instance.app)
        .get('/api/todo?count=true')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.deep.equal({
            count: 111
          });
          done();
        });
    });

    it('should DELETE EVERYTHING when using DELETE /api/todo with no parameters', function(done) {
      chai.request(instance.app)
        .delete('/api/todo')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('deleted');
          res.body.deleted.n.should.be.equal(111);
          chai.request(instance.app)
            .get('/api/todo')
            .set('authorization', accessToken)
            .end(function(err, res) {
              res.should.have.status(200);
              res.should.be.json;
              res.body.should.be.a('array');
              res.body.should.have.length(0);
              done();
            });
        });
    });

  });

  describe('User Service', function() {

    before(function(done) {
      aquireAccessToken(done);
    });

    it('should NOT CREATE USER without BASIC authorization when using PUT /api/oauth2/user', function(done) {
      chai.request(instance.app)
        .put('/api/oauth2/user')
        .send({
          name: "Sample User",
          userId: "sample@user.com",
          password: "ERd"
        })
        .end(function(err, res) {
          res.should.have.status(401);
          res.should.be.json;
          res.body.should.be.a('object');
          done();
        });
    });

    it('should CREATE a SINGLE USER with BASIC authorization when using /api/oauth2/user PUT', function(done) {
      chai.request(instance.app)
        .put('/api/oauth2/user')
        .auth(clientId, clientSecret)
        .send({
          name: "Sample User",
          userId: "sample@user.com",
          password: "ERd"
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.have.equal('created');
          res.body.should.have.property('item');
          res.body.item.should.have.property('userId');
          res.body.item.should.have.property('createdAt');
          res.body.item.should.have.property('updatedAt');
          res.body.item.should.not.have.property('_id');
          res.body.item.should.not.have.property('__v');
          res.body.item.should.not.have.property('password');
          done();
        });
    });


    it('should NOT RETURN user without BASIC authorizatoin when using GET /api/oauth2/user/sample@user.com', function(done) {
      chai.request(instance.app)
        .get('/api/oauth2/user/sample@user.com')
        .end(function(err, res) {
          res.should.have.status(401);
          res.should.be.json;
          res.body.should.be.a('object');
          done();
        });
    });

    it('should RETURN user with BASIC authorizatoin when using GET /api/oauth2/user/sample@user.com', function(done) {
      chai.request(instance.app)
        .get('/api/oauth2/user/sample@user.com')
        .auth(clientId, clientSecret)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length(1);
          res.body.should.all.have.property('userId');
          res.body.should.all.have.property('createdAt');
          res.body.should.all.have.property('updatedAt');
          res.body.should.all.not.have.property('_id');
          res.body.should.all.not.have.property('__v');
          res.body.should.all.not.have.property('password');
          res.body[0].userId.should.be.equal('sample@user.com');
          done();
        });
    });

    it('should NOT CREATE MULTIPLE users without access token when using PUT /api/oauth2/user', function(done) {
      chai.request(instance.app)
        .put('/api/oauth2/user')
        .auth(clientId, clientSecret)
        .send([{
          name: "Sample User",
          userId: "sample1@user.com",
          password: "ERd"
        }, {
          name: "Sample User",
          userId: "sample2@user.com",
          password: "ERd"
        }])
        .end(function(err, res) {
          res.should.have.status(401);
          res.should.be.json;
          done();
        });
    });

    it('should CREATE MULTIPLE users with access token when using PUT /api/oauth2/user', function(done) {
      chai.request(instance.app)
        .put('/api/oauth2/user')
        .set('authorization', accessToken)
        .send([{
          name: "Sample User",
          userId: "sample1@user.com",
          password: "ERd"
        }, {
          name: "Sample User",
          userId: "sample2@user.com",
          password: "ERd"
        }, {
          name: "Sample User",
          userId: "sample3@user.com",
          password: "ERd"
        }])
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('saved');
          res.body.should.have.property('result');
          res.body.result.should.have.property('created');
          res.body.result.created.should.be.equal(3);
          res.body.result.should.have.property('newIds');
          res.body.result.newIds.should.be.length(3);
          res.body.result.newIds.should.be.deep.equal(['sample1@user.com', 'sample2@user.com', 'sample3@user.com']);
          done();
        });
    });

    it('should RETURN COUNT when using GET /api/oauth2/user?count=true', function(done) {
      chai.request(instance.app)
        .get('/api/oauth2/user?count=true')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('count');
          res.body.count.should.be.equal(5);
          done();
        });
    });

    it('should DELETE SINGLE user with access token when using DELETE /api/oauth2/user/{id}', function(done) {
      chai.request(instance.app)
        .delete('/api/oauth2/user/sample1@user.com')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('deleted');
          res.body.should.have.property('item');
          res.body.item.should.be.a('object');
          res.body.item.should.have.property('updatedAt');
          res.body.item.should.have.property('createdAt');
          res.body.item.should.have.property('name');
          res.body.item.name.should.be.equal('Sample User');
          res.body.item.should.have.property('userId');
          res.body.item.userId.should.be.equal('sample1@user.com');
          res.body.item.should.have.property('active');
          res.body.item.active.should.be.equal(true);
          res.body.item.should.have.property('roles');
          res.body.item.roles.should.be.a('array');
          res.body.item.roles.should.be.length(0);
          done();
        });
    });

    it('should NOT DELETE MULTIPLE users without access token when using DELETE /api/oauth2/user', function(done) {
      chai.request(instance.app)
        .delete('/api/oauth2/user')
        .send({
          userId: {
            "$in": ["sample2@user.com", "sample3@user.com"]
          }
        })
        .end(function(err, res) {
          res.should.have.status(401);
          res.should.be.json;
          done();
        });
    });


    it('should NOT DELETE MULTIPLE USERES when using DELETE /api/oauth2/user when array is sent instead of query object in body', function(done) {
      chai.request(instance.app)
        .delete('/api/oauth2/client')
        .set('authorization', accessToken)
        .send([{
          name: "Sample User",
          userId: "sample1@user.com",
          password: "ERd"
        }, {
          name: "Sample User",
          userId: "sample2@user.com",
          password: "ERd"
        }, {
          name: "Sample User",
          userId: "sample3@user.com",
          password: "ERd"
        }])
        .end(function(err, res) {
          res.should.have.status(422);
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal(422);
          res.body.should.have.property('message');
          res.body.message.should.be.equal('Invalid request; body of this request cannot be an array!');
          done();
        });
    });

    it('should DELETE MULTIPLE users with access token when using DELETE /api/oauth2/user', function(done) {
      chai.request(instance.app)
        .delete('/api/oauth2/user')
        .set('authorization', accessToken)
        .send({
          userId: {
            "$in": ["sample2@user.com", "sample3@user.com"]
          }
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('deleted');
          res.body.should.have.property('deleted');
          res.body.deleted.should.be.a('object');
          res.body.deleted.should.have.property('ok');
          res.body.deleted.ok.should.be.equal(1);
          res.body.deleted.should.have.property('n');
          res.body.deleted.n.should.be.equal(2);
          done();
        });
    });

    it('should DENY ACCESS if user is without ADMIN access when using POST,PUT,DELETE /api/oauth2/user ', function(done) {

      chain.series([
        function(callback) {
          chai.request(instance.app)
            .put('/api/oauth2/user')
            .auth(clientId, clientSecret)
            .send({
              name: "Sample User",
              userId: "testuser@user.com",
              password: "ERd",
              roles: ["user"]
            })
            .end(function(err, res) {
              res.should.have.status(200);
              callback();
            });
        },
        function(callback) {
          aquireAccessToken(function(err, res) {
            res.should.have.status(200);
            callback();
          }, false, {
            userId: "testuser@user.com",
            password: "ERd",
          });
        },
        function(callback) {
          chai.request(instance.app)
            .post('/api/oauth2/user')
            .set('authorization', accessToken)
            .end(function(err, res) {
              res.should.have.status(401);
              callback();
            });
        },
        function(callback) {
          chai.request(instance.app)
            .put('/api/oauth2/user')
            .send([{
              name: "Sample User",
              userId: "testuser-new@user.com",
              password: "ERd",
              roles: ["user"]
            }])
            .set('authorization', accessToken)
            .end(function(err, res) {
              res.should.have.status(401);
              callback();
            });
        },
        function(callback) {
          chai.request(instance.app)
            .put('/api/oauth2/user')
            .send([{
              name: "Sample User",
              userId: "testuser-new@user.com",
              password: "ERd",
              roles: ["user"]
            }])
            .set('authorization', accessToken)
            .end(function(err, res) {
              res.should.have.status(401);
              callback();
            });
        }
      ], function(error, response) {
        if (error) throw error;
        done();
      });
    });

  });

  describe('Client Service', function() {

    before(function(done) {
      aquireAccessToken(done);
    });

    it('should NOT CREATE CLEINT without access token when using PUT /api/oauth2/client', function(done) {
      chai.request(instance.app)
        .put('/api/oauth2/client')
        .send({
          name: "Sample Client",
          clientId: "sample-client-id",
          clientSecret: "ERd"
        })
        .end(function(err, res) {
          res.should.have.status(401);
          res.should.be.json;
          res.body.should.be.a('object');
          done();
        });
    });

    it('should CREATE a SINGLE CLEINT with access token when using /api/oauth2/client PUT', function(done) {
      chai.request(instance.app)
        .put('/api/oauth2/client')
        .set('authorization', accessToken)
        .send({
          name: "Sample Client",
          clientId: "sample-client-id",
          clientSecret: "ERd"
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.have.equal('created');
          res.body.should.have.property('item');
          res.body.item.should.have.property('clientId');
          res.body.item.should.have.property('createdAt');
          res.body.item.should.have.property('updatedAt');
          res.body.item.should.not.have.property('_id');
          res.body.item.should.not.have.property('__v');
          res.body.item.should.not.have.property('clientSecret');
          done();
        });
    });

    it('should NOT RETURN CLEINT without access token when using GET /api/oauth2/client/sample-client-id', function(done) {
      chai.request(instance.app)
        .get('/api/oauth2/client/sample-client-id')
        .end(function(err, res) {
          res.should.have.status(401);
          res.should.be.json;
          res.body.should.be.a('object');
          done();
        });
    });

    it('should RETURN CLEINT with access token when using GET /api/oauth2/client/sample-client-id', function(done) {
      chai.request(instance.app)
        .get('/api/oauth2/client/sample-client-id')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length(1);
          res.body.should.all.have.property('clientId');
          res.body.should.all.have.property('createdAt');
          res.body.should.all.have.property('updatedAt');
          res.body.should.all.not.have.property('_id');
          res.body.should.all.not.have.property('__v');
          res.body.should.all.not.have.property('clientSecret');
          res.body[0].clientId.should.be.equal('sample-client-id');
          done();
        });
    });

    it('should NOT CREATE MULTIPLE CLIENTS without access token when using PUT /api/oauth2/client', function(done) {
      chai.request(instance.app)
        .put('/api/oauth2/client')
        .auth(clientId, clientSecret)
        .send([{
          name: "Sample Client",
          clientId: "sample1-client-id",
          clientSecret: "ERd"
        }, {
          name: "Sample Client",
          clientId: "sample2-client-id",
          clientSecret: "ERd"
        }])
        .end(function(err, res) {
          res.should.have.status(401);
          res.should.be.json;
          done();
        });
    });

    it('should CREATE MULTIPLE CLIENTS with access token when using PUT /api/oauth2/client', function(done) {
      chai.request(instance.app)
        .put('/api/oauth2/client')
        .set('authorization', accessToken)
        .send([{
          name: "Sample Client",
          clientId: "sample1-client-id",
          clientSecret: "ERd"
        }, {
          name: "Sample Client",
          clientId: "sample2-client-id",
          clientSecret: "ERd"
        }])
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('saved');
          res.body.should.have.property('result');
          res.body.result.should.have.property('created');
          res.body.result.created.should.be.equal(2);
          res.body.result.should.have.property('newIds');
          res.body.result.newIds.should.be.length(2);
          res.body.result.newIds.should.be.deep.equal(['sample1-client-id', 'sample2-client-id']);
          done();
        });
    });

    it('should RETURN COUNT of CLIENTS when using GET /api/oauth2/client?count=true', function(done) {
      chai.request(instance.app)
        .get('/api/oauth2/client?count=true')
        .set('authorization', accessToken)
        .end(function(err, res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.deep.equal({
            count: 4
          });
          done();
        });
    });

    it('should NOT DELETE MULTIPLE CLIENTS without access token when using DELETE /api/oauth2/client', function(done) {
      chai.request(instance.app)
        .delete('/api/oauth2/client')
        .send([{
          name: "Sample Client",
          clientId: "sample1-client-id",
          clientSecret: "ERd"
        }, {
          name: "Sample Client",
          clientId: "sample2-client-id",
          clientSecret: "ERd"
        }])
        .end(function(err, res) {
          res.should.have.status(401);
          res.should.be.json;
          done();
        });
    });

    it('should NOT DELETE MULTIPLE CLIENTS when using DELETE /api/oauth2/client when array is sent instead of query object in body', function(done) {
      chai.request(instance.app)
        .delete('/api/oauth2/client')
        .set('authorization', accessToken)
        .send([{
          name: "Sample Client",
          clientId: "sample1-client-id",
          clientSecret: "ERd"
        }, {
          name: "Sample Client",
          clientId: "sample2-client-id",
          clientSecret: "ERd"
        }])
        .end(function(err, res) {
          res.should.have.status(422);
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal(422);
          res.body.should.have.property('message');
          res.body.message.should.be.equal('Invalid request; body of this request cannot be an array!');

          done();
        });
    });

    it('should DELETE MULTIPLE CLIENTS with access token when using DELETE /api/oauth2/client when query object in body', function(done) {
      chai.request(instance.app)
        .delete('/api/oauth2/client')
        .set('authorization', accessToken)
        .send({
          clientId: {
            $in: ['sample1-client-id', 'sample2-client-id']
          }
        })
        .end(function(err, res) {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.should.have.property('status');
          res.body.status.should.be.equal('deleted');
          res.body.should.have.property('deleted');
          res.body.deleted.should.be.a('object');
          res.body.deleted.should.have.property('ok');
          res.body.deleted.ok.should.be.equal(1);
          res.body.deleted.should.have.property('n');
          res.body.deleted.n.should.be.equal(2);
          done();
        });
    });

  });

});