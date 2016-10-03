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
var should = chai.should();
var mongoose = require('mongoose');

describe('Rest Api history service', function () {

    before(function (done) {
        util.setup(function () {
            mongoose.connection.collections['task'].drop();
            mongoose.connection.collections['task_history'].drop();
            done();
        });
    });

    it('should add a SINGLE item when using PUT /api/task and create no history item', function (done) {
        var tests = [];
        tests.push(function (taskDone) {
            chai.request(util.instance.app)
                .put('/api/task')
                .send({
                    'id': 'id1',
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
                    res.body.item.title.should.be.equal('Sample story');
                    taskDone();
                });
        });

        tests.push(function (taskDone) {
            chai.request(util.instance.app)
                .get('/api/task/id1/version')
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('array');
                    res.body.should.be.length(1);
                    res.body.should.all.have.property('title')
                    res.body.should.all.have.property('id')
                    res.body.should.all.have.property('history');
                    taskDone();
                });
        });

        chain.series(tests, done);
    });

    it('should update an item when using PUT /api/task and create a history entry', function (done) {
        var tests = [];
        tests.push(function (taskDone) {
            chai.request(util.instance.app)
                .put('/api/task')
                .send({
                    'id': 'id1',
                    'title': 'Sample story 2'
                })
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('object');
                    res.body.should.have.property('status');
                    res.body.status.should.be.equal('updated');
                    taskDone();
                });
        });

        tests.push(function (taskDone) {
            chai.request(util.instance.app)
                .get('/api/task/id1/version')
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('array');
                    res.body.should.be.length(2);
                    res.body.should.all.have.property('id');
                    res.body.should.all.have.property('title');
                    res.body.should.all.have.property('history');
                    taskDone();
                });
        });

        chain.series(tests, done);
    });

    it('should update multiple item when using PUT /api/task and create history entry for each', function (done) {
        var tests = [];
        tests.push(function (taskDone) {
            chai.request(util.instance.app)
                .put('/api/task')
                .send([{
                    'id': 'item1',
                    'title': 'Sample story 1'
                }, {
                    'id': 'item2',
                    'title': 'Sample story 2'
                }])
                .end(function (err, res) {
                    res.should.have.status(200);
                    taskDone();
                });
        });

        tests.push(function (taskDone) {
            chai.request(util.instance.app)
                .get('/api/task/item1/version')
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('array');
                    res.body.should.be.length(1);
                    taskDone();
                });
        });

        tests.push(function (taskDone) {
            chai.request(util.instance.app)
                .get('/api/task/item2/version')
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('array');
                    res.body.should.be.length(1);
                    taskDone();
                });
        });

        tests.push(function (taskDone) {
            chai.request(util.instance.app)
                .put('/api/task')
                .send([{
                    'id': 'item1',
                    'title': 'Sample story 10'
                }, {
                    'id': 'item2',
                    'title': 'Sample story 20'
                }])
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('object');
                    res.body.should.have.property('status');
                    res.body.status.should.be.equal('saved');
                    taskDone();
                });
        });

        tests.push(function (taskDone) {
            chai.request(util.instance.app)
                .get('/api/task/item1/version')
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('array');
                    res.body.should.be.length(2);
                    taskDone();
                });
        });

        tests.push(function (taskDone) {
            chai.request(util.instance.app)
                .get('/api/task/item2/version')
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('array');
                    res.body.should.be.length(2);
                    taskDone();
                });
        });

        chain.series(tests, done);
    });

    it('should update an item when using PUT /api/task and create history entry only if there is a change', function (done) {
        var tests = [];
        tests.push(function (taskDone) {
            chai.request(util.instance.app)
                .put('/api/task')
                .send([{
                    'id': 'sample-item1',
                    'title': 'Sample story 1'
                }])
                .end(function (err, res) {
                    res.should.have.status(200);
                    taskDone();
                });
        });

        tests.push(function (taskDone) {
            chai.request(util.instance.app)
                .get('/api/task/sample-item1/version')
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('array');
                    res.body.should.be.length(1);
                    taskDone();
                });
        });
        
        tests.push(function (taskDone) {
            chai.request(util.instance.app)
                .put('/api/task')
                .send([{
                    'id': 'sample-item1',
                    'title': 'Sample story 1'
                }])
                .end(function (err, res) {
                    res.should.have.status(200);
                    taskDone();
                });
        });

        tests.push(function (taskDone) {
            chai.request(util.instance.app)
                .get('/api/task/sample-item1/version')
                .end(function (err, res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('array');
                    res.body.should.be.length(1);
                    taskDone();
                });
        });

        chain.series(tests, done);
    });

});