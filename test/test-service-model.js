var app = require('express')();
var chai = require('chai');
var should = chai.should();
var mongoose = require('mongoose');
var chaiHttp = require('chai-http');
var ServiceModel = require('../core/service-model');


// intial setup
chai.use(chaiHttp);

// connect to the databse, throw error and come out if db is not available
mongoose.connect('mongodb://localhost/test', function(error) {
  if (error) throw ('Connect to mongodb: ' + error);
});

// setup nodejs api server using express.js
var service = ServiceModel.create('Stories', {
  url: '/story',

  userSpace: {
    field: "_user"
  },
  timestamps: true,

  schema: {
    id: {
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
    },
    createdDate: {
      type: Date,
      required: true,
      default: Date.now
    }
  },

  permissions: function() {
    return {
      item: {
        read: ['None'],
        write: ['None'],
        delete: ['None']
      },
      bulk: {
        read: ['None'],
        write: ['None'],
        delete: ['None']
      }
    };
  },

  configure: function() {
    console.log('configure');
    // this.model.path('name').set(function(v) {
    //   return capitalize(v);
    // });
  }
});
service.register(app);

describe('Stories', function() {

  it('should add a SINGLE story /story PUT', function(done) {
    chai.request(app)
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


  xit('should list ALL stories on /stories GET', function(done) {
    chai.request(app)
      .get('/stories')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        done();
      });
  });


});