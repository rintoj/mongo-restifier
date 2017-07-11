var uuid = require('uuid');
var Promise = require('es6-promise').Promise;

module.exports = function(model, historyModel, options) {

  options = options || {};
  if (model === undefined) {
    throw 'The model cannot be undefined';
  }
  if (historyModel === undefined) {
    throw 'The history model cannot be undefined';
  }

  this.mapItem = function mapItem(item) {
    if (item == undefined) return;
    var history = {};
    item = Object.assign({}, item._doc);
    item[options.idField] = item._originalId ? item._originalId : item._id;
    history.id = item._id;
    history.version = item.__v;
    item.history = history;
    delete item.historyId;
    delete item._originalId;
    delete item.__v;
    delete item._id;
    return item;
  };

  this.findLatest = function findLatest(id) {
    return this.list(id).then(function(items) {
      return items[0];
    });
  };

  this.findVersion = function findVersion(id, version) {
    var self = this;
    return new Promise(function(resolve, reject) {
      historyModel.findOne({
        _originalId: id,
        __v: version
      }).exec(function(error, item) {
        if (error) return reject(error);
        if (item == undefined) {
          model.findOne({
            _id: id,
            __v: version
          }).exec(function(error, item) {
            if (error) return reject(error);
            resolve(self.mapItem(item));
          });
        } else {
          resolve(self.mapItem(item));
        }
      });
    });
  };

  this.findByIdAndVersion = function findByIdAndVersion(id, version) {
    return new Promise(function(resolve, reject) {
      historyModel.findOne({
        _originalId: id,
        __v: version
      }).exec(function(error, item) {
        if (error) return reject(error);
        resolve(item);
      });
    });
  }

  this.resolveVersion = function resolveVersion(id, version) {
    var self = this;
    return new Promise(function(resolve, reject) {
      version != undefined ? resolve(version) : self.findLatest(id).then(function(item) {
        resolve(item != undefined ? item.history.version : 0);
      }, reject);
    });
  }

  this.copyEntryToMain = function copyEntryToMain(entry) {
    return new Promise(function(resolve, reject) {
      model.create(entry, function(error, item) {
        if (error) return reject(error);
        var bulk = model.collection.initializeUnorderedBulkOp();
        bulk.find({
          _id: entry._id
        }).updateOne({
          $set: {
            __v: entry.__v
          }
        });
        bulk.execute(function(error, item) {
          if (error) return reject(error);
          resolve({
            done: true
          });
        })
      });
    });
  };

  this.deleteHistoryEntry = function deleteHistoryEntry(originalId, version) {
    return new Promise(function(resolve, reject) {
      historyModel.remove({
        _originalId: originalId,
        __v: {
          $gte: version
        }
      }, function(error, item) {
        if (error) return reject(error || 'Invalid id');
        resolve({
          done: true
        });
      });
    });
  };

  this.deleteMainEntry = function deleteMainEntry(id, version) {
    return new Promise(function(resolve, reject) {
      model.remove({
        _id: id,
        __v: {
          $gte: version
        }
      }).exec(function(error, item) {
        if (error) return reject(error);
        resolve(item);
      });
    });
  };

  this.rollback = function rollback(id, version) {
    var self = this;
    return new Promise(function(resolve, reject) {
      self.resolveVersion(id, version)
        .then(function(version) {
          return self.findByIdAndVersion(id, version);
        })
        .then(function(item) {
          if (item == undefined) return;
          return self.deleteHistoryEntry(item._originalId, item.__v).then(function() {
            return item;
          });
        })
        .then(function(item) {
          if (item == undefined) return;
          return self.deleteMainEntry(item._originalId, item.__v).then(function() {
            return item;
          });
        })
        .then(function(item) {
          if (item == undefined) return;
          item = item._doc;
          item._id = item._originalId;
          if (options.idField != undefined) {
            item[options.idField] = item._id;
          }
          delete item._originalId;
          return item;
        })
        .then(function(entry) {
          if (entry == undefined) return;
          return self.copyEntryToMain(entry);
        })
        .then(resolve, reject);
    });
  };

  this.deleteVersion = function deleteVersion(id, version) {
    var self = this;
    return new Promise(function(resolve, reject) {
      historyModel.remove({
        _originalId: id,
        __v: version
      }).exec(function(error, item) {
        if (error) return reject(error);
        if (item.result.n !== 0) {
          return resolve({
            deleted: true
          });
        }
        model.remove({
          _id: id,
          __v: version
        }).exec(function(error, item) {
          if (error) return reject(error);
          if (item.result.n === 0) return resolve();
          self.rollback(id).then(function() {
            resolve({
              deleted: true
            });
          }, reject);
        });
      });
    });
  };

  this.deleteAllVersions = function deleteAllVersions(id) {
    var self = this;
    return new Promise(function(resolve, reject) {
      historyModel.remove({
        _originalId: id
      }).exec(function(error, item) {
        if (error) return reject(error);
        model.remove({
          _id: id
        }).exec(function(error, mainItem) {
          if (error) return reject(error);
          self.rollback(id).then(function() {
            resolve({
              deleted: mainItem.result.n + (item.result.n || 0)
            });
          }, reject);
        });
      });
    });
  };

  this.list = function list(id) {
    var self = this;
    var history = new Promise(function(resolve, reject) {
      historyModel.find({
        _originalId: id
      }).sort('-__v').exec(function(error, items) {
        if (error) return reject(error);
        resolve(items);
      });
    });
    var current = new Promise(function(resolve, reject) {
      model.findById({
        _id: id
      }).exec(function(error, item) {
        if (error) return reject(error);
        resolve(item);
      });
    });
    return Promise.all([history, current]).then(function(result) {
      if (result[1] != undefined) {
        result[0] = [result[1]].concat(result[0]);
      }
      return result[0].map(self.mapItem);
    });
  };

  this.createHistory = function createHistory(ids) {
    return new Promise(function(resolve, reject) {
      if (ids === undefined) {
        resolve();
      }
      model.find().where("_id").in(ids).exec(function(error, results) {
        if (error) return reject(error);
        if (results.length === 0) {
          return resolve([]);
        }

        var bulk = historyModel.collection.initializeUnorderedBulkOp();
        var items = results.map(function(item) {
          return item._doc;
        }).map(function(item) {
          item._originalId = item._id;
          item._id = uuid();
          item[options.idField] = item._id;
          item.createdAt = new Date();
          bulk.insert(item);
        });

        // execute the query
        bulk.execute(function(error, result) {
          if (error) return reject(error);
          resolve(result);
        });

      });
    });

  };

}