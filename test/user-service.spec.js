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
var chain = require('chain-async');

describe('User service', function () {

    var itemsCount = 0;
    var newIds = [];

    before(function (done) {
        util.setup(function () {
            util.acquireAccessToken(done);
        });
    });
    it('should NOT CREATE USER without BASIC authorization when using PUT /api/oauth2/user', function (done) {
        chai.request(util.instance.app)
            .put('/api/oauth2/user')
            .send({
                name: "Sample User",
                userId: "sample@user.com",
                password: "ERd"
            })
            .end(function (err, res) {
                res.should.have.status(401);
                res.should.be.json;
                res.body.should.be.a('object');
                done();
            });
    });

    it('should CREATE a SINGLE USER with BASIC authorization when using /api/oauth2/user PUT', function (done) {
        chai.request(util.instance.app)
            .put('/api/oauth2/user')
            .auth(util.clientId, util.clientSecret)
            .send({
                name: "Sample User",
                userId: "sample@user.com",
                password: "ERd"
            })
            .end(function (err, res) {
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


    it('should NOT RETURN user without BASIC authorizatoin when using GET /api/oauth2/user/sample@user.com', function (done) {
        chai.request(util.instance.app)
            .get('/api/oauth2/user/sample@user.com')
            .end(function (err, res) {
                res.should.have.status(401);
                res.should.be.json;
                res.body.should.be.a('object');
                done();
            });
    });

    it('should RETURN user with BASIC authorizatoin when using GET /api/oauth2/user/sample@user.com', function (done) {
        chai.request(util.instance.app)
            .get('/api/oauth2/user/sample@user.com')
            .auth(util.clientId, util.clientSecret)
            .end(function (err, res) {
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

    it('should NOT CREATE MULTIPLE users without access token when using PUT /api/oauth2/user', function (done) {
        chai.request(util.instance.app)
            .put('/api/oauth2/user')
            .auth(util.clientId, util.clientSecret)
            .send([{
                name: "Sample User",
                userId: "sample1@user.com",
                password: "ERd"
            }, {
                name: "Sample User",
                userId: "sample2@user.com",
                password: "ERd"
            }])
            .end(function (err, res) {
                res.should.have.status(401);
                res.should.be.json;
                done();
            });
    });

    it('should CREATE MULTIPLE users with access token when using PUT /api/oauth2/user', function (done) {
        chai.request(util.instance.app)
            .put('/api/oauth2/user')
            .set('authorization', util.accessToken)
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
            .end(function (err, res) {
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

    it('should RETURN COUNT when using GET /api/oauth2/user?count=true', function (done) {
        chai.request(util.instance.app)
            .get('/api/oauth2/user?count=true')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('count');
                res.body.count.should.be.equal(5);
                done();
            });
    });

    it('should DELETE SINGLE user with access token when using DELETE /api/oauth2/user/{id}', function (done) {
        chai.request(util.instance.app)
            .delete('/api/oauth2/user/sample1@user.com')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
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

    it('should NOT DELETE MULTIPLE users without access token when using DELETE /api/oauth2/user', function (done) {
        chai.request(util.instance.app)
            .delete('/api/oauth2/user')
            .send({
                userId: {
                    "$in": ["sample2@user.com", "sample3@user.com"]
                }
            })
            .end(function (err, res) {
                res.should.have.status(401);
                res.should.be.json;
                done();
            });
    });


    it('should NOT DELETE MULTIPLE USERES when using DELETE /api/oauth2/user when array is sent instead of query object in body', function (done) {
        chai.request(util.instance.app)
            .delete('/api/oauth2/client')
            .set('authorization', util.accessToken)
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
            .end(function (err, res) {
                res.should.have.status(422);
                res.body.should.be.a('object');
                res.body.should.have.property('status');
                res.body.status.should.be.equal(422);
                res.body.should.have.property('message');
                res.body.message.should.be.equal('Invalid request; body of this request cannot be an array!');
                done();
            });
    });

    it('should DELETE MULTIPLE users with access token when using DELETE /api/oauth2/user', function (done) {
        chai.request(util.instance.app)
            .delete('/api/oauth2/user')
            .set('authorization', util.accessToken)
            .send({
                userId: {
                    "$in": ["sample2@user.com", "sample3@user.com"]
                }
            })
            .end(function (err, res) {
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

    it('should DENY ACCESS if user is without ADMIN access when using POST,PUT,DELETE /api/oauth2/user ', function (done) {

        chain.series([
            function (callback) {
                chai.request(util.instance.app)
                    .put('/api/oauth2/user')
                    .auth(util.clientId, util.clientSecret)
                    .send({
                        name: "Sample User",
                        userId: "testuser@user.com",
                        password: "ERd",
                        roles: ["user"]
                    })
                    .end(function (err, res) {
                        res.should.have.status(200);
                        callback();
                    });
            },
            function (callback) {
                util.acquireAccessToken(function (err, res) {
                    res.should.have.status(200);
                    callback();
                }, false, {
                    userId: "testuser@user.com",
                    password: "ERd",
                });
            },
            function (callback) {
                chai.request(util.instance.app)
                    .post('/api/oauth2/user')
                    .set('authorization', util.accessToken)
                    .end(function (err, res) {
                        res.should.have.status(401);
                        callback();
                    });
            },
            function (callback) {
                chai.request(util.instance.app)
                    .put('/api/oauth2/user')
                    .send([{
                        name: "Sample User",
                        userId: "testuser-new@user.com",
                        password: "ERd",
                        roles: ["user"]
                    }])
                    .set('authorization', util.accessToken)
                    .end(function (err, res) {
                        res.should.have.status(401);
                        callback();
                    });
            },
            function (callback) {
                chai.request(util.instance.app)
                    .put('/api/oauth2/user')
                    .send([{
                        name: "Sample User",
                        userId: "testuser-new@user.com",
                        password: "ERd",
                        roles: ["user"]
                    }])
                    .set('authorization', util.accessToken)
                    .end(function (err, res) {
                        res.should.have.status(401);
                        callback();
                    });
            }
        ], function (error, response) {
            if (error) throw error;
            done();
        });
    });

});

describe('Client Service', function () {

    before(function (done) {
        util.acquireAccessToken(done);
    });

    it('should NOT CREATE CLEINT without access token when using PUT /api/oauth2/client', function (done) {
        chai.request(util.instance.app)
            .put('/api/oauth2/client')
            .send({
                name: "Sample Client",
                clientId: "sample-client-id",
                clientSecret: "ERd"
            })
            .end(function (err, res) {
                res.should.have.status(401);
                res.should.be.json;
                res.body.should.be.a('object');
                done();
            });
    });

    it('should CREATE a SINGLE CLEINT with access token when using /api/oauth2/client PUT', function (done) {
        chai.request(util.instance.app)
            .put('/api/oauth2/client')
            .set('authorization', util.accessToken)
            .send({
                name: "Sample Client",
                clientId: "sample-client-id",
                clientSecret: "ERd"
            })
            .end(function (err, res) {
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
                res.body.item.should.not.have.property('util.clientSecret');
                done();
            });
    });

    it('should NOT RETURN CLEINT without access token when using GET /api/oauth2/client/sample-client-id', function (done) {
        chai.request(util.instance.app)
            .get('/api/oauth2/client/sample-client-id')
            .end(function (err, res) {
                res.should.have.status(401);
                res.should.be.json;
                res.body.should.be.a('object');
                done();
            });
    });

    it('should RETURN CLIENT with access token when using GET /api/oauth2/client/sample-client-id', function (done) {
        chai.request(util.instance.app)
            .get('/api/oauth2/client/sample-client-id')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
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

    it('should NOT CREATE MULTIPLE CLIENTS without access token when using PUT /api/oauth2/client', function (done) {
        chai.request(util.instance.app)
            .put('/api/oauth2/client')
            .auth(util.clientId, util.clientSecret)
            .send([{
                name: "Sample Client",
                clientId: "sample1-client-id",
                clientSecret: "ERd"
            }, {
                name: "Sample Client",
                clientId: "sample2-client-id",
                clientSecret: "ERd"
            }])
            .end(function (err, res) {
                res.should.have.status(401);
                res.should.be.json;
                done();
            });
    });

    it('should CREATE MULTIPLE CLIENTS with access token when using PUT /api/oauth2/client', function (done) {
        chai.request(util.instance.app)
            .put('/api/oauth2/client')
            .set('authorization', util.accessToken)
            .send([{
                name: "Sample Client",
                clientId: "sample1-client-id",
                clientSecret: "ERd"
            }, {
                name: "Sample Client",
                clientId: "sample2-client-id",
                clientSecret: "ERd"
            }])
            .end(function (err, res) {
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

    it('should RETURN COUNT of CLIENTS when using GET /api/oauth2/client?count=true', function (done) {
        chai.request(util.instance.app)
            .get('/api/oauth2/client?count=true')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.deep.equal({
                    count: 4
                });
                done();
            });
    });

    it('should NOT DELETE MULTIPLE CLIENTS without access token when using DELETE /api/oauth2/client', function (done) {
        chai.request(util.instance.app)
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
            .end(function (err, res) {
                res.should.have.status(401);
                res.should.be.json;
                done();
            });
    });

    it('should NOT DELETE MULTIPLE CLIENTS when using DELETE /api/oauth2/client when array is sent instead of query object in body', function (done) {
        chai.request(util.instance.app)
            .delete('/api/oauth2/client')
            .set('authorization', util.accessToken)
            .send([{
                name: "Sample Client",
                clientId: "sample1-client-id",
                clientSecret: "ERd"
            }, {
                name: "Sample Client",
                clientId: "sample2-client-id",
                clientSecret: "ERd"
            }])
            .end(function (err, res) {
                res.should.have.status(422);
                res.body.should.be.a('object');
                res.body.should.have.property('status');
                res.body.status.should.be.equal(422);
                res.body.should.have.property('message');
                res.body.message.should.be.equal('Invalid request; body of this request cannot be an array!');

                done();
            });
    });

    it('should DELETE MULTIPLE CLIENTS with access token when using DELETE /api/oauth2/client when query object in body', function (done) {
        chai.request(util.instance.app)
            .delete('/api/oauth2/client')
            .set('authorization', util.accessToken)
            .send({
                clientId: {
                    $in: ['sample1-client-id', 'sample2-client-id']
                }
            })
            .end(function (err, res) {
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