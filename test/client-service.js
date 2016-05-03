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

describe('Client Service', function() {

  before(function(done) {
    setup.ready(done);
  });

  it('should NOT CREATE CLEINT without access token when using PUT /api/oauth2/client', function(done) {
    chai.request(server)
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
    chai.request(server)
      .put('/api/oauth2/client')
      .set('authorization', setup.accessToken)
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
    chai.request(server)
      .get('/api/oauth2/client/sample-client-id')
      .end(function(err, res) {
        res.should.have.status(401);
        res.should.be.json;
        res.body.should.be.a('object');
        done();
      });
  });

  it('should RETURN CLEINT with access token when using GET /api/oauth2/client/sample-client-id', function(done) {
    chai.request(server)
      .get('/api/oauth2/client/sample-client-id')
      .set('authorization', setup.accessToken)
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
    chai.request(server)
      .put('/api/oauth2/client')
      .auth(setup.clientId, setup.clientSecret)
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
    chai.request(server)
      .put('/api/oauth2/client')
      .set('authorization', setup.accessToken)
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
    chai.request(server)
      .get('/api/oauth2/client?count=true')
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

  it('should NOT DELETE MULTIPLE CLIENTS without access token when using DELETE /api/oauth2/client', function(done) {
    chai.request(server)
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

  it('should DELETE MULTIPLE CLIENTS with access token when using DELETE /api/oauth2/client', function(done) {
    chai.request(server)
      .delete('/api/oauth2/client')
      .set('authorization', setup.accessToken)
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