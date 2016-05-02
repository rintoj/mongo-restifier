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
var mongoRestifier = require('../src/index');

// intial setup
chai.use(require('chai-http'));
chai.use(require("chai-sorted"));
chai.use(require('chai-things'));

// configure the api
var instance = mongoRestifier('./test/api.test.conf.json')

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
        if (res.status === 200) {
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.have.property('access_token');
          res.body.should.have.property('refresh_token');
          accessToken = 'Bearer ' + res.body.access_token;
          refreshToken = res.body.refresh_token;
        }
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
    
    it('should add a SINGLE item through /api/todo PUT', function(done) {
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

    it('should add MULTIPLE items through /api/todo PUT', function(done) {
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

    it('should update a SINGLE item through /api/todo/{id} PUT', function(done) {
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

    it('should update MULTIPLE items through /api/todo PUT', function(done) {
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

    it('should NOT UPDATE items, if no change in properties, through /api/todo PUT', function(done) {

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

    it('should NOT CREATE, but only UPDATE items, with /api/todo?updateOnly=true PUT', function(done) {

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

    it('should NOT UPDATE, but only Create items, with /api/todo?createOnly=true PUT', function(done) {

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

    it('should REJECT WITH ERROR, when createOnly and updateOnly are used together with /api/todo PUT', function(done) {
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

    it('should set createdAt and updatedAt when an item is created through /api/todo PUT', function(done) {
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

    it('should set _user when an item is created through /api/todo PUT', function(done) {
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

    it('should override _user when an item with _user set, is sent for creation through /api/todo PUT', function(done) {
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


    it('should override _user when an item with _user set, is sent for update through /api/todo/{id} PUT', function(done) {
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
          res.body.item.should.have.property('_user');
          res.body.item._user.should.be.equal('superuser@system.com');
          done();
        });
    });


    it('should list ALL todos on /api/todo GET', function(done) {
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

    it('should list ALL todos without fields starting with _ on /api/todo GET', function(done) {
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

    it('should list ALL todos with fields index and _user on /api/todo?fields=index,_user GET', function(done) {
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

    it('should list ALL todos sorted in ascending order on /api/todo?sort=index GET', function(done) {
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

    it('should list ALL todos sorted in decending order on /api/todo?sort=-index GET', function(done) {
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

    it('should limit list to 2 items on /api/todo?limit=2 GET', function(done) {
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

    it('should skip first 2 items on /api/todo?skip=2&limit=2 GET', function(done) {
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

    it('should return an item with given id /api/todo/{id} GET', function(done) {
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

    it('should return an item with given index /api/todo?index={index} GET', function(done) {
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

    it('should update status of an item on /api/todo/{id} PUT {status=hold}', function(done) {
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

  });
});