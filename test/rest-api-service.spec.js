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
var should = chai.should();

describe('Rest Api service', function () {

    var itemsCount = 0;
    var newIds = [];

    before(function (done) {
        util.setup(function () {
            util.acquireAccessToken(done);
        });
    });

    it('should add a SINGLE item when using PUT /api/todo', function (done) {
        chai.request(util.instance.app)
            .put('/api/todo')
            .set('authorization', util.accessToken)
            .send({
                'title': 'Sample story'
            })
            .end(function (err, res) {
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

    it('should add MULTIPLE items when using PUT /api/todo', function (done) {
        chai.request(util.instance.app)
            .put('/api/todo')
            .set('authorization', util.accessToken)
            .send([{
                'title': 'Sample story1'
            }, {
                'title': 'Sample story2'
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
                res.body.result.newIds.should.have.length(2);
                itemsCount += 2;
                newIds = res.body.result.newIds;
                done();
            });
    });

    it('should generate id for when SINGLE item is added using PUT /api/task', function (done) {
        chai.request(util.instance.app)
            .put('/api/task')
            .set('authorization', util.accessToken)
            .send({
                'title': 'Sample story'
            })
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('status');
                res.body.status.should.be.equal('created');
                res.body.should.have.property('item');
                res.body.item.should.have.property('id');
                res.body.item.should.have.property('title');
                res.body.item.id.should.be.a('string');
                res.body.item.id.should.not.be.equal('');
                res.body.item.title.should.be.equal('Sample story');
                done();
            });
    });

    it('should generate id for when MULTIPLE items are added using PUT /api/task', function (done) {
        chai.request(util.instance.app)
            .put('/api/task')
            .set('authorization', util.accessToken)
            .send([{
                'title': 'Sample story'
            }, {
                'title': 'Sample story2'
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
                res.body.result.newIds[0].should.a('string');
                res.body.result.newIds[0].should.be.not.equal('');
                res.body.result.newIds[1].should.a('string');
                res.body.result.newIds[1].should.be.not.equal('');
                done();
            });
    });

    it('should update a SINGLE item when using PUT /api/todo/{id}', function (done) {
        chai.request(util.instance.app)
            .put('/api/todo/' + newIds[0])
            .set('authorization', util.accessToken)
            .send({
                'title': 'Sample story1'
            })
            .end(function (err, res) {
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

    it('should update MULTIPLE items when using PUT /api/todo', function (done) {
        chai.request(util.instance.app)
            .put('/api/todo')
            .set('authorization', util.accessToken)
            .send([{
                'index': newIds[0],
                'title': 'Sample story'
            }, {
                'index': newIds[1],
                'title': 'Sample story'
            }])
            .end(function (err, res) {
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

    it('should NOT UPDATE items, if no change in properties, when using PUT /api/todo', function (done) {

        chai.request(util.instance.app)
            .put('/api/todo')
            .set('authorization', util.accessToken)
            .send([{
                'index': newIds[0],
                'title': 'Sample story'
            }, {
                'index': newIds[1],
                'title': 'Sample story'
            }])
            .end(function (err, res) {
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

    it('should NOT CREATE, but only UPDATE items, when using PUT /api/todo?updateOnly=true', function (done) {

        chai.request(util.instance.app)
            .put('/api/todo?updateOnly=true')
            .set('authorization', util.accessToken)
            .send([{
                'title': 'Sample story1'
            }, {
                'index': newIds[1],
                'title': 'Sample story4'
            }])
            .end(function (err, res) {
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

    it('should NOT UPDATE, but only Create items, when using PUT /api/todo?createOnly=true', function (done) {

        chai.request(util.instance.app)
            .put('/api/todo?createOnly=true')
            .set('authorization', util.accessToken)
            .send([{
                'title': 'Sample story1'
            }, {
                'index': newIds[1],
                'title': 'Sample story4'
            }])
            .end(function (err, res) {
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

    it('should REJECT WITH ERROR, when createOnly and updateOnly are used together when using PUT /api/todo', function (done) {
        chai.request(util.instance.app)
            .put('/api/todo?updateOnly=true&createOnly=true')
            .set('authorization', util.accessToken)
            .send([{
                'title': 'Sample story1'
            }, {
                'title': 'Sample story2'
            }])
            .end(function (err, res) {
                res.should.have.status(422);
                res.should.be.json;
                done();
            });
    });

    it('should set createdAt and updatedAt when an item is created when using PUT /api/todo', function (done) {
        chai.request(util.instance.app)
            .put('/api/todo')
            .set('authorization', util.accessToken)
            .send({
                'title': 'Sample story'
            })
            .end(function (err, res) {
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

    it('should set _user when an item is created when using PUT /api/todo', function (done) {
        chai.request(util.instance.app)
            .put('/api/todo?fields=_user')
            .set('authorization', util.accessToken)
            .send({
                'title': 'Sample story'
            })
            .end(function (err, res) {
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

    it('should override _user when an item with _user set, is sent for creation when using PUT /api/todo', function (done) {
        chai.request(util.instance.app)
            .put('/api/todo?fields=_user')
            .set('authorization', util.accessToken)
            .send({
                'title': 'Sample story',
                '_user': 'test'
            })
            .end(function (err, res) {
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

    it('should override _user when an item with _user set, is sent for update when using PUT /api/todo/{id}', function (done) {
        chai.request(util.instance.app)
            .put('/api/todo/' + newIds[0] + '?fields=_user')
            .set('authorization', util.accessToken)
            .send({
                'title': 'Sample story',
                '_user': 'test'
            })
            .end(function (err, res) {
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

    it('should list ALL todos when using GET /api/todo', function (done) {
        chai.request(util.instance.app)
            .get('/api/todo')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                res.body.should.have.length(itemsCount);
                done();
            });
    });

    it('should list ALL todos without fields starting with _ when using GET /api/todo', function (done) {
        chai.request(util.instance.app)
            .get('/api/todo')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
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

    it('should list ALL todos with fields index and _user when using GET /api/todo?fields=index,_user', function (done) {
        chai.request(util.instance.app)
            .get('/api/todo?fields=index,_user')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
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

    it('should list ALL todos sorted in ascending order when using GET /api/todo?sort=index', function (done) {
        chai.request(util.instance.app)
            .get('/api/todo?sort=index')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                res.body.should.have.length.above(1);
                res.body.should.all.have.property('index');
                res.body.should.be.sortedBy('index');
                done();
            });
    });

    it('should list ALL todos sorted in decending order when using GET /api/todo?sort=-index', function (done) {
        chai.request(util.instance.app)
            .get('/api/todo?sort=-index')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                res.body.should.have.length.above(1);
                res.body.should.all.have.property('index');
                res.body.should.be.sortedBy('index', true);
                done();
            });
    });

    it('should limit list to 2 items when using GET /api/todo?limit=2', function (done) {
        chai.request(util.instance.app)
            .get('/api/todo?limit=2')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                res.body.should.have.length(2);
                done();
            });
    });

    it('should skip first 2 items when using GET /api/todo?skip=2&limit=2', function (done) {
        chai.request(util.instance.app)
            .get('/api/todo?limit=2')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                var firstItem = res.body[0];
                chai.request(util.instance.app)
                    .get('/api/todo?skip=2&limit=2')
                    .set('authorization', util.accessToken)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('array');
                        res.body.should.contain.a.thing.with.property('index', firstItem.index + 2);
                        res.body.should.have.length(2);
                        done();
                    });
            });
    });

    it('should return an item with given id when using GET /api/todo/{id}', function (done) {
        chai.request(util.instance.app)
            .get('/api/todo?limit=2')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                var firstItem = res.body[0];
                chai.request(util.instance.app)
                    .get('/api/todo/' + firstItem.index)
                    .set('authorization', util.accessToken)
                    .end(function (err, res) {
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

    it('should return an item with given index when using GET /api/todo?index={index}', function (done) {
        chai.request(util.instance.app)
            .get('/api/todo?limit=2')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                var firstItem = res.body[0];
                chai.request(util.instance.app)
                    .get('/api/todo?index=' + firstItem.index)
                    .set('authorization', util.accessToken)
                    .end(function (err, res) {
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

    it('should list ALL todos when using POST /api/todo', function (done) {
        chai.request(util.instance.app)
            .post('/api/todo')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                res.body.should.have.length(itemsCount);
                done();
            });
    });

    it('should list NO todos when using POST /api/todo with body {status: hold}', function (done) {
        chai.request(util.instance.app)
            .post('/api/todo')
            .set('authorization', util.accessToken)
            .send({
                status: 'hold'
            })
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                res.body.should.have.length(0);
                done();
            });
    });

    it('should list ALL todos when using GET /api/todo with body {status: hold}', function (done) {
        chai.request(util.instance.app)
            .get('/api/todo')
            .set('authorization', util.accessToken)
            .send({
                status: 'hold'
            })
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');

                // should ignore body and apply no filter hence itemsCount instead of 0
                res.body.should.have.length(itemsCount);
                done();
            });
    });

    it('should list ALL todos without fields starting with _ when using POST /api/todo', function (done) {
        chai.request(util.instance.app)
            .post('/api/todo')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
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

    it('should list ALL todos with fields index and _user when using POST /api/todo?fields=index,_user', function (done) {
        chai.request(util.instance.app)
            .post('/api/todo?fields=index,_user')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
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

    it('should list ALL todos sorted in ascending order when using POST /api/todo?sort=index', function (done) {
        chai.request(util.instance.app)
            .post('/api/todo?sort=index')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                res.body.should.have.length.above(1);
                res.body.should.all.have.property('index');
                res.body.should.be.sortedBy('index');
                done();
            });
    });

    it('should list ALL todos sorted in decending order when using POST /api/todo?sort=-index', function (done) {
        chai.request(util.instance.app)
            .post('/api/todo?sort=-index')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                res.body.should.have.length.above(1);
                res.body.should.all.have.property('index');
                res.body.should.be.sortedBy('index', true);
                done();
            });
    });

    it('should limit list to 2 items when using POST /api/todo?limit=2', function (done) {
        chai.request(util.instance.app)
            .post('/api/todo?limit=2')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                res.body.should.have.length(2);
                done();
            });
    });

    it('should skip first 2 items when using POST /api/todo?skip=2&limit=2', function (done) {
        chai.request(util.instance.app)
            .post('/api/todo?limit=2')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                var firstItem = res.body[0];
                chai.request(util.instance.app)
                    .post('/api/todo?skip=2&limit=2')
                    .set('authorization', util.accessToken)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('array');
                        res.body.should.contain.a.thing.with.property('index', firstItem.index + 2);
                        res.body.should.have.length(2);
                        done();
                    });
            });
    });

    it('should return an item with given index when using /api/todo?index={index}', function (done) {
        chai.request(util.instance.app)
            .post('/api/todo?limit=2')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                var firstItem = res.body[0];
                chai.request(util.instance.app)
                    .post('/api/todo?index=' + firstItem.index)
                    .set('authorization', util.accessToken)
                    .end(function (err, res) {
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

    it('should update status of an item when using PUT /api/todo/{id} {status=hold}', function (done) {
        chai.request(util.instance.app)
            .get('/api/todo?limit=2')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                var firstItem = res.body[0];
                firstItem.status.should.not.be.equal('hold');
                chai.request(util.instance.app)
                    .put('/api/todo/' + firstItem.index)
                    .set('authorization', util.accessToken)
                    .send({
                        status: 'hold'
                    })
                    .end(function (err, res) {
                        res.should.have.status(200);
                        chai.request(util.instance.app)
                            .get('/api/todo/' + firstItem.index)
                            .set('authorization', util.accessToken)
                            .end(function (err, res) {
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

    it('should delete a SINGLE item when access when using DELETE /api/todo/{id}', function (done) {
        chai.request(util.instance.app)
            .delete('/api/todo/' + newIds[0])
            .set('authorization', util.accessToken)
            .end(function (err, res) {
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
                chai.request(util.instance.app)
                    .get('/api/todo')
                    .set('authorization', util.accessToken)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('array');
                        res.body.should.have.length(itemsCount);
                        done();
                    });
            });
    });

    it('should RETURN ITEMS with status = new when using GET /api/todo?status=new', function (done) {
        chai.request(util.instance.app)
            .get('/api/todo?status=new')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                res.body.should.have.length(itemsCount - 1); // one item was updated to 'hold' previously
                done();
            });
    });

    it('should RETURN ITEMS with status = new when using POST /api/todo?status=new', function (done) {
        chai.request(util.instance.app)
            .post('/api/todo?status=new')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
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

    it('should RETURN ITEMS with status = new when using POST /api/todo', function (done) {
        chai.request(util.instance.app)
            .post('/api/todo')
            .set('authorization', util.accessToken)
            .send({
                status: 'new'
            })
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                res.body.should.have.length(itemsCount - 1); // one item was updated to 'hold' previously
                done();
            });
    });

    it('should RETURN ITEMS with a regular expression search when using POST /api/todo', function (done) {
        chai.request(util.instance.app)
            .post('/api/todo')
            .set('authorization', util.accessToken)
            .send({
                title: {
                    '$regex': '^S.*1$'
                }
            })
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                res.body.should.have.length(1); // one item was updated to 'hold' previously
                done();
            });
    });

    it('should DELETE ALL ITEMS with status = new when using DELETE /api/todo { status: new }', function (done) {
        chai.request(util.instance.app)
            .get('/api/todo?status=new')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('array');
                var count = res.body.length;
                chai.request(util.instance.app)
                    .delete('/api/todo')
                    .set('authorization', util.accessToken)
                    .send({
                        status: 'new'
                    })
                    .end(function (err, res) {
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

    it('should return maximum of 100 records when using GET /api/todo', function (done) {
        var items = [];
        for (var i = 0; i < 110; i++) {
            items.push({
                title: 'New title'
            });
        }
        chai.request(util.instance.app)
            .put('/api/todo')
            .set('authorization', util.accessToken)
            .send(items)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                chai.request(util.instance.app)
                    .get('/api/todo')
                    .set('authorization', util.accessToken)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('array');
                        res.body.should.have.length(100);
                        done();
                    });
            });
    });

    it('should RETURN COUNT when using GET /api/todo?count=true', function (done) {
        chai.request(util.instance.app)
            .get('/api/todo?count=true')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.deep.equal({
                    count: 111
                });
                done();
            });
    });

    it('should DELETE EVERYTHING when using DELETE /api/todo with no parameters', function (done) {
        chai.request(util.instance.app)
            .delete('/api/todo')
            .set('authorization', util.accessToken)
            .end(function (err, res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.should.be.a('object');
                res.body.should.have.property('deleted');
                res.body.deleted.n.should.be.equal(111);
                chai.request(util.instance.app)
                    .get('/api/todo')
                    .set('authorization', util.accessToken)
                    .end(function (err, res) {
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.should.be.a('array');
                        res.body.should.have.length(0);
                        done();
                    });
            });
    });

});