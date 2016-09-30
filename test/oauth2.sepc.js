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
var util = require('./conf/util');

describe('oAuth2 service', function () {

  before(function (done) {
    util.setup(done);
  });

  it('should ALLOW ACCESS to OPTIONS /api/todo without token', function (done) {
    chai.request(util.instance.app)
      .options('/api/todo')
      .end(function (err, res) {
        res.should.have.status(200);
        res.should.be.html;
        res.text.should.equal('PUT,GET,POST,DELETE');
        done();
      });
  });

  it('should DENY ACCESS to GET /api/todo without token', function (done) {
    chai.request(util.instance.app)
      .get('/api/todo')
      .end(function (err, res) {
        res.should.have.status(401);
        done();
      });
  });

  it('should DENY ACCESS to POST /api/todo without token', function (done) {
    chai.request(util.instance.app)
      .post('/api/todo')
      .end(function (err, res) {
        res.should.have.status(401);
        done();
      });
  });

  it('should DENY ACCESS to PUT /api/todo without token', function (done) {
    chai.request(util.instance.app)
      .put('/api/todo')
      .end(function (err, res) {
        res.should.have.status(401);
        done();
      });
  });

  it('should DENY ACCESS to DELETE /api/todo without token', function (done) {
    chai.request(util.instance.app)
      .delete('/api/todo')
      .end(function (err, res) {
        res.should.have.status(401);
        done();
      });
  });

  it('should ISSUE TOKEN with POST /api/oauth2/token', function (done) {
    util.acquireAccessToken(function (err, res) {
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

  it('should ALLOW ACCESS to OPTIONS /api/todo with token', function (done) {
    chai.request(util.instance.app)
      .options('/api/todo')
      .set('authorization', util.accessToken)
      .end(function (err, res) {
        res.should.have.status(200);
        res.should.be.html;
        res.text.should.equal('PUT,GET,POST,DELETE');
        done();
      });
  });

  it('should ALLOW ACCESS to GET /api/todo with token', function (done) {
    chai.request(util.instance.app)
      .get('/api/todo')
      .set('authorization', util.accessToken)
      .end(function (err, res) {
        res.should.have.status(200);
        done();
      });
  });

  it('should ALLOW ACCESS to POST /api/todo with token', function (done) {
    chai.request(util.instance.app)
      .post('/api/todo')
      .set('authorization', util.accessToken)
      .end(function (err, res) {
        res.should.have.status(200);
        done();
      });
  });

  it('should ALLOW ACCESS to PUT /api/todo with token', function (done) {
    chai.request(util.instance.app)
      .put('/api/todo')
      .set('authorization', util.accessToken)
      .send({
        "title": "Sample note"
      })
      .end(function (err, res) {
        res.should.have.status(200);
        done();
      });
  });

  it('should ALLOW ACCESS to DELETE /api/todo with token', function (done) {
    chai.request(util.instance.app)
      .delete('/api/todo')
      .set('authorization', util.accessToken)
      .send({
        "title": "Sample note"
      })
      .end(function (err, res) {
        res.should.have.status(200);
        done();
      });
  });

  it('should REISSUE TOKEN when POST /api/oauth2/token is called with refresh_token', function (done) {
    util.acquireAccessToken(function (err, res) {
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

  it('should REVOKE TOKEN with POST /api/oauth2/revoke', function (done) {
    chai.request(util.instance.app)
      .post('/api/oauth2/revoke')
      .set('authorization', util.accessToken)
      .end(function (err, res) {
        res.should.have.status(200);
        res.should.be.json;
        done();
      });
  });

  it('should DENY ACCESS when a revoked token is used with GET /api/todo', function (done) {
    chai.request(util.instance.app)
      .get('/api/todo')
      .set('content-type', 'application/json')
      .set('authorization', util.accessToken)
      .end(function (err, res) {
        res.should.have.status(401);
        res.should.be.json;
        done();
      });
  });

  it('should DENY ACCESS when POST /api/oauth2/token is called with revoked refresh_token', function (done) {
    util.acquireAccessToken(function (err, res) {
      res.should.have.status(401);
      done();
    }, true);
  });

});