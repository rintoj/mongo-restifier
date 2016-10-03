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

describe('Rest Api history service', function () {

    before(function (done) {
        util.setup(function () {
            util.acquireAccessToken(done);
        });
    });

    it('should add a SINGLE item when using PUT /api/task and create no history item', function (done) {
        chai.request(util.instance.app)
            .put('/api/task')
            .set('authorization', util.accessToken)
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
                chai.request(util.instance.app)
                    .get('/api/task/id1')
                    .set('authorization', util.accessToken)
                    .send({
                        'title': 'Sample story'
                    })
                    .end(function (err, res) {
                        done();
                    })
            });
    });

});