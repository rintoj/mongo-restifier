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
var _ = require('lodash');
var mongoose = require('mongoose');
var ServiceEndpoint = require('./generic-service');
var autoIncrement = require('mongoose-auto-increment');

var autoIncrementRegistered = false;
var preconfigured = false;

var createContext = function(name, options) {

  var context = {};
  var fields = Object.keys(options || {});

  // create readonly context
  fields.forEach(function(name) {
    Object.defineProperty(context, name, {
      get: function() {
        return options[name] && (typeof options[name] === 'function' ? options[name].call(context) : options[name]);
      }
    });
  });

  // set name to the context
  Object.defineProperty(context, "name", {
    get: function() {
      return name;
    }
  });

  return context;
};

/**
 * Service model creates a service that can serve a collection from mongo db
 * 
 * @param context The context of the service
 */
var ServiceModel = function ServiceModel(context) {

  // basic validation
  if (!context.name || context.name === '') {
    throw '"name" is mandatory!';
  }
  if (!context.schema || context.schema === '') {
    throw '"schema" is mandatory!';
  }

  // setting up user specific collection
  var userField;
  if (context.userSpace === true || typeof context.userSpace === 'object') {
    userField = "_user";
    if (typeof context.userSpace === 'object' && context.userSpace.field) {
      userField = context.userSpace.field;
    }
    context.schema[userField] = {
      type: String,
      required: true
    };
  }

  // create projection
  context.projection = Object.keys(context.schema).filter(function(item) {
    return item.indexOf("_") === 0;
  }).concat(["__v"]).map(function(item) {
    return "-" + item;
  }).join(",");

  // Get and validate id field
  var idField;
  Object.keys(context.schema).forEach(function(item) {
    if (typeof context.schema[item] === 'object' && context.schema[item].idField) {
      if (idField) {
        throw `Schema Error: more than one id field found in '${context.name}': ` + idField.join(",");
      }
      idField = context.schema[item]; // clone
      idField.name = item;
    }
  });

  // create _id as the same type of idField
  if (idField) {
    context.schema._id = {
      type: idField.type
    }
  }

  // create schema
  context.modelSchema = new mongoose.Schema(context.schema, {
    strict: true,
    timestamps: context.timestamps
  });

  // create model
  context.model = mongoose.model(context.name, context.modelSchema);

  // setup autoincrement feature
  if (!autoIncrementRegistered) {
    autoIncrement.initialize(mongoose.connection);
    autoIncrementRegistered = true;
  }

  // validate auto increment fields
  var autoIncrementFields = _.filter(_.keys(context.schema), function(field) {
    if (context.schema[field].type !== Number && context.schema[field].autoIncrement) {
      throw `Schema Error: ${context.name}.${field} is not a number field. autoIncrement = true is an invalid configuration!`
    }
    if (context.schema[field].autoIncrement) {
      context.model.schema.plugin(autoIncrement.plugin, {
        model: context.name,
        field: field,
        startAt: Math.max(context.schema[field].startAt || 0, context.schema[field].min || 1),
        incrementBy: context.schema[field].incrementBy || 1
      });
    }
  });

  // map custom id field
  if (idField) {
    var mapIdField = function(next) {
      if (this[idField.name] !== undefined) {
        this._id = this[idField.name];
      }
      next();
    };

    context.modelSchema.pre("update", mapIdField);
    context.modelSchema.pre("save", mapIdField);

    context.modelSchema.set("toJSON", {
      transform: function(doc, ret, options) {
        // remove the _id of every document before returning the result
        ret[idField.name] = ret._id;
        delete ret._id;
      }
    });
  }

  // create generic service for the given schema and model
  context.service = new ServiceEndpoint(context.model, {
    userField: userField,
    idField: idField,
    projection: context.projection
  });

  // if setup required do so here
  if (typeof context.configure === 'function') {
    console.log('setup done!');
  }
  // bind all the routes
  context.service.bind();

  // defined current context;
  this.context = context;

  /**
   * Register this model as a service
   * 
   * @param app Express application instance
   * @param baseUrl The base url for the api
   */
  this.register = function register(app, baseUrl, noErrorHandler) {

    // register the router
    app.use((baseUrl ? baseUrl : "") + (context.url ? context.url : ""), context.service.router);

    if (!preconfigured && noErrorHandler !== true) {

      // register an error hanlder for generic-model if not registered already for this app
      app.use(function(error, request, response, next) {

        if (error && error.errors) {
          // normalize errors to readable format
          _.keys(error.errors).map(function(key) {
            error.errors[key] = error.errors[key].message.replace('`', '\'')
          });

          // send status 422 - Unprocessable Entity (validation error)
          response.status(error.status || 422);
          return response.json({
            message: error.message,
            error: error.errors
          });
        }

        // send status 500 - internal server error
        response.status(error.status || 500);
        response.json({
          message: error.message,
          error: error
        });
      });
      preconfigured = true;
    }
  }
};

/**
 * Creates a service
 * 
 * @param name Name of the service (mandatory)
 * @param options Options as object in the format:
 * {
 *    schema: {  // mandatory
 *      field1: {
 *        type: String | Number | Date
 * 
 *        // validations
 *        required: true,
 *        required: [true, 'User phone number required']  // custom message
 *        enum: ['Coffee', 'Tea'],    // only if type = String
 *        minlength: number,          // only if type = String
 *        maxlength: number,          // only if type = String
 *        min: number,                // only if type = Number
 *        max: number,                // only if type = Number
 * 
 *        // custom validation
 *        validate: {
 *           validator: function(v) {
 *             return /\d{3}-\d{3}-\d{4}/.test(v);
 *           },
 *           message: '{VALUE} is not a valid phone number!'
 *        },
 *         
 *        // options 
 *        idField: boolean,           // one and only one field can be id
 *        autoIncrement: boolean,     // only if type = Number
 *        startAt: number,            // only if type = Number
 *        incrementBy: number,        // only if type = Number  
 *      }
 *    },
 *    permissions: Object,
 *    configure: Function,
 *    url: String,
 *    userSpace: Boolean
 * }
 * 
 * All of these can be a value with the specified type or a function that return the same type.
 * 
 * @returns (description)
 */
module.exports = function defineModel(name, options) {
  return new ServiceModel(createContext(name, options));
};