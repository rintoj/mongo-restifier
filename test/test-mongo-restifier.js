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

}));

describe('Todo', function() {

  it('should be accessible only with an access token /todo GET', function(done) {
    chai.request(instance.app)
      .get('/story')
      .end(function(err, res) {
        res.should.have.status(401);
        done();
      });
  });
  
   it('should be accessible only with an access token /todo POST', function(done) {
    chai.request(instance.app)
      .post('/story')
      .end(function(err, res) {
        res.should.have.status(401);
        done();
      });
  });
  
   it('should be accessible only with an access token /todo PUT', function(done) {
    chai.request(instance.app)
      .put('/story')
      .end(function(err, res) {
        res.should.have.status(401);
        done();
      });
  });
  
   it('should be accessible only with an access token /todo DELETE', function(done) {
    chai.request(instance.app)
      .delete('/story')
      .end(function(err, res) {
        res.should.have.status(401);
        done();
      });
  });

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

  xit('should list ALL stories on /todo GET', function(done) {
    chai.request(instance.app)
      .get('/todo')
      .end(function(err, res) {
        console.log(res);
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        done();
      });
  });


});