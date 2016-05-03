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
var chai = require('chai');
var setup = require('./setup');
 
xdescribe('User Service', function() {

  before(function(done) {
    setup.aquireAccessToken(done);
  });

  it('should NOT CREATE USER without BASIC authorization when using PUT /api/oauth2/user', function(done) {
    chai.request(server)
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
    chai.request(server)
      .put('/api/oauth2/user')
      .auth(setup.clientId, setup.clientSecret)
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
    chai.request(server)
      .get('/api/oauth2/user/sample@user.com')
      .end(function(err, res) {
        res.should.have.status(401);
        res.should.be.json;
        res.body.should.be.a('object');
        done();
      });
  });

  it('should RETURN user with BASIC authorizatoin when using GET /api/oauth2/user/sample@user.com', function(done) {
    chai.request(server)
      .get('/api/oauth2/user/sample@user.com')
      .auth(setup.clientId, setup.clientSecret)
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
    chai.request(server)
      .put('/api/oauth2/user')
      .auth(setup.clientId, setup.clientSecret)
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
    chai.request(server)
      .put('/api/oauth2/user')
      .set('authorization', setup.accessToken)
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
        res.body.result.newIds.should.be.deep.equal(['sample1@user.com', 'sample2@user.com']);
        done();
      });
  });

  it('should RETURN COUNT when using GET /api/oauth2/user?count=true', function(done) {
    chai.request(server)
      .get('/api/oauth2/user?count=true')
      .set('authorization', setup.accessToken)
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.deep.equal({
          count: 4
        });
        done();
      });
  });

  it('should NOT DELETE MULTIPLE users without access token when using DELETE /api/oauth2/user', function(done) {
    chai.request(server)
      .delete('/api/oauth2/user')
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

  it('should DELETE MULTIPLE users with access token when using DELETE /api/oauth2/user', function(done) {
    chai.request(server)
      .delete('/api/oauth2/user')
      .set('authorization', setup.accessToken)
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
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.deep.equal({
          status: 'deleted',
          deleted: {
            ok: 1,
            n: 4
          }
        });
        done();
      });
  });

}); 