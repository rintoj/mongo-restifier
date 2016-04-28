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
var express = require('express');
var Promise = require('mpromise');
var mongoose = require('../util/Promise');

/**
 * Creates service end point with GET, POST, PUT and DELETE methods
 * 
 * @param model Mongoose model to be used by the service
 */
module.exports = function ServiceEndpoint(model, options) {

  if (!model) {
    throw '"model" is mandatory for ServiceEndpoint';
  }

  options = options || {};

  this.router = express.Router();

  /**
   * Send response back to client. If item is not found return 404
   * 
   * @private 
   * @param response Http response
   * @param item Item to be send. If not defined 404 error code will be returned
   * @param status Any status message to be returned other than the result (item) itself
   * @param id Id of the item incase 404 is to be sent
   */
  var send = function send(response, item, status, id) {
    // var item = apifiable ? _.pick(item, apifiable) : item;
    if (item) {
      return response.json(status ? {
        status: status,
        item: item
      } : item);
    }
    return respond(response, 404, {
      status: 404,
      message: 'Invalid resource id ' + id + '!'
    });
  };

  /**
   /**
   * Send response back to client after a bulk update request
   * 
   * @private 
   * @param response Http response
   * @param result As array with first element as the result from create operation and the second
   *               element as the status from bulk update operation
   * @param multi Boolean value. True if the bulk operation was performed on more than one item
   */
  var sendBulkResult = function sendBulkResult(response, result, multi) {

    // if multi request do this
    if (multi) {
      var newIds = result[0].map(function(item) {
        return item._id;
      });
      return response.json({
        status: "saved",
        result: {
          updated: result[1].nModified,
          created: newIds.length,
          newIds: newIds
        }
      });
    }

    // if single request and the request was create
    if (result[0].length > 0) {
      return send(response, result[0][0], "created");
    }

    // if single request, the request was update and the item was modified
    if (result[1].nModified > 0) {
      return response.json({
        status: "updated"
      });
    }

    // if single request, the request was update and the item was NOT modified
    return respond(response, 304, {
      status: "nochange"
    });
  }

  /**
   * Respond to the client with given status code and reply
   * 
   * @private
   * @param response Http response object
   * @param statusCode Http status code
   * @param reply The object to be returned as the body
   */
  var respond = function respond(response, statusCode, reply) {
    response.status(statusCode);
    response.json(reply);
  };

  /**
   * Identify and return id field
   * 
   * @private
   * @returns Returns name of the id field as string
   */
  var idField = function idField() {
    return options.idField ? options.idField.name : "_id";
  }

  /**
   * Identify existing items from the given set of items
   * 
   * @private
   * @param items Array of items (objects)
   * @returns Returns an object with 'new', 'existing' and 'existingIds' attributes as arrays
   */
  var segregateExisting = function segregateExisting(items) {

    var promise = new Promise();

    if (!(items instanceof Array)) {
      items = [items];
    }

    var segregatedItems = {
      new: [],
      existing: [],
      existingIds: []
    };

    if (items.length === 0) {
      promise.fulfill(segregatedItems);
      return promise;
    }

    var id = idField();
    var ids = _.map(items, function(item) {
      return item[id]
    }).filter(function(item) {
      return item !== undefined;
    });

    model.find().where("_id").in(ids).select("_id").exec(function(error, result) {
      if (error) return promise.reject(error);

      // find existing ids
      segregatedItems.existingIds = _.map(result, function(item) {
        return item._id;
      });

      items.forEach(function(item) {
        segregatedItems[segregatedItems.existingIds.indexOf(item[id]) >= 0 ? "existing" : "new"].push(item);
      });

      promise.fulfill(segregatedItems);
    });

    return promise;
  };

  /**
   * Perform a bulk create operation.
   * 
   * TODO: Improve the performance by calling model.collection.insert
   * 
   * @private
   * @param items Items to be bulk inserted. The items must be pre-validated for its non-existance
   * @returns Returns a Promise
   */
  var bulkCreate = function bulkCreate(items) {
    var promise = new Promise();
    if (items.length === 0) {
      promise.fulfill([]);
      return promise;
    }
    model.create(items, function(error, bulkResponse) {
      if (error) return promise.reject(error);
      promise.fulfill(bulkResponse);
    });
    return promise;
  };

  /**
   * Perform a bulk update operation.
   * 
   * @private
   * @param items Items to be bulk inserted. The items must be pre-validated for its existance
   * @returns Returns a Promise
   */
  var bulkUpdate = function bulkUpdate(items) {
    var promise = new Promise();

    if (items.length === 0) {
      promise.fulfill({});
      return promise;
    }

    var bulk = model.collection.initializeUnorderedBulkOp();
    var id = idField();

    // prepare the bulk upload request
    _.each(items, function(item) {
      bulk.find({
        _id: item[id]
      }).updateOne({
        $set: item
      });
    });

    // execute the query
    bulk.execute(function(error, result) {
      if (error) return promise.reject(error);
      promise.fulfill(result);
    });

    return promise;
  }

  /**
   * Return any projection from request or from options
   * 
   * @private
   * @param request Http request. Looks for request.query.fields
   * @returns Returns projection as string
   */
  var projection = function projection(request) {
    // set projection
    if (request.query.fields) {
      return request.query.fields.replace(/,/g, " ")
    } else if (options.projection) {
      return options.projection.replace(/,/g, " ");
    }

    return undefined;
  };

  /**
   * Create query from http request
   * 
   * @private
   * @param request Http request
   * @param multi True for muliselect query
   * @returns Returns an instance of query
   */
  var createQuery = function createQuery(request, multi) {
    var query;

    // create query
    if (multi) {
      query = model.find(request.body);
    } else {
      query = model.findOne(request.body);
    }

    // set limit
    if (request.query.limit && !isNaN(request.query.limit) && parseInt(request.query.limit) > 0) {
      query.limit(request.query.limit);
    }

    // set skip
    if (request.query.skip && !isNaN(request.query.skip) && parseInt(request.query.skip) > 0) {
      query.skip(request.query.skip);
    }

    // limit fields
    query.select(projection(request));

    // set sort
    if (request.query.sort) {
      query.sort(request.query.sort);
    }

    // attach user query
    if (options.userField) {
      query.where(options.userField).equals(request.user.id || '___**___');
    }

    return query;
  }

  /**
   * List all items from the model as defined by http request
   * 
   * @param request  Http request as object
   * @param response Http response as object
   * @param next Next hook as function
   */
  this.list = function list(request, response, next) {
    createQuery(request, true).exec(function(error, items) {
      if (error) return next(error);
      response.json(items);
    });
  }

  /**
   * Query and return items from the model as defined by http request
   * 
   * @param request  Http request as object
   * @param response Http response as object
   * @param next Next hook as function
   */
  this.query = function query(request, response, next) {
    createQuery(request, true).exec(function(error, items) {
      if (error) return next(error);
      response.json(items);
    });
  };

  /**
   * Return an item from the model as defined by http request
   * 
   * @param request  Http request as object
   * @param response Http response as object
   * @param next Next hook as function
   */
  this.getById = function getById(request, response, next) {
    request.body = {
      _id: request.params.id
    };
    createQuery(request, true).exec(function(error, item) {
      if (error) return next(error);
      send(response, item, undefined, request.params.id);
    });
  }

  /**
   * Save one or more items. The existing items will be updated and the new
   * items will be created.
   * 
   * @param request  Http request as object
   * @param response Http response as object
   * @param next Next hook as function
   */
  this.save = function save(request, response, next) {
    var multi = request.body instanceof Array;
    var items = multi ? request.body : [request.body];

    // attach user
    if (options.userField) {
      items = items.map(function(item) {
        item[options.userField] = request.user.id;
        return item;
      });
    }

    segregateExisting(items).then(function(segregateItems) {
      var promises = [];
      promises.push(bulkCreate(segregateItems.new));
      promises.push(bulkUpdate(segregateItems.existing));

      Promise.when.apply(Promise, promises).then(function(result) {
        sendBulkResult(response, result, multi);
      }, function(error) {
        next(error);
      });

    }, function(error) {
      next(error);
    });

  };

  /**
   * Select and delete items from the model as defined by http request
   * 
   * @param request  Http request as object
   * @param response Http response as object
   * @param next Next hook as function
   */
  this.deleteAll = function deleteAll(request, response, next) {
    model.remove(request.query, function(error, item) {
      if (error) return next(error);
      send(response, {
        status: "deleted",
        deleted: item
      }, undefined, request.params.id);
    });
  };

  /**
   * Select and update an item as defined by http request
   * 
   * @param request  Http request as object
   * @param response Http response as object
   * @param next Next hook as function
   */
  this.updateById = function updateById(request, response, next) {
    model.findByIdAndUpdate(request.params.id, request.body, {
      runValidators: true
    }, function(error, item) {
      if (error) return next(error);
      send(response, item, "updated", request.params.id);
    });
  };

  /**
   * Delete an item identified by the given id
   * 
   * @param request  Http request as object
   * @param response Http response as object
   * @param next Next hook as function
   */
  this.deleteById = function deleteById(request, response, next) {
    model.findByIdAndRemove(request.params.id, request.body, function(error, item) {
      if (error) return next(error);
      send(response, item, "deleted", request.params.id);
    });
  };

  this.bind = function bind() {

    /* PUT / */
    this.router.put('/', this.save);

    /* GET / */
    this.router.get('/', this.list);

    /* POST / */
    this.router.post('/', this.query);

    /* DELETE / */
    this.router.delete('/', this.deleteAll);

    /* GET /:id */
    this.router.get('/:id', this.getById);

    /* PUT /:id */
    this.router.put('/:id', this.updateById);

    /* DELETE /:id */
    this.router.delete('/:id', this.deleteById);

    // enable method chaining
    return this;
  }

  this.send = send;
  this.respond = respond;
}