var uuid = require('uuid');
var Promise = require('es6-promise').Promise;

module.exports = function (model, historyModel, options) {

    options = options || {};
    if (model === undefined) {
        throw 'The model cannot be undefined';
    }
    if (historyModel === undefined) {
        throw 'The history model cannot be undefined';
    }

    this.mapItem = function (item) {
        if (item == undefined) return;
        let history = {};
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
        return this.list(id).then(function (items) {
            return items.slice(-1)[0];
        });
    };

    this.findVersion = function findVersion(id, version) {
        var self = this;
        return new Promise(function (resolve, reject) {
            historyModel.findOne({
                _originalId: id,
                __v: version
            }).exec(function (error, item) {
                if (error) return reject(error);
                if (item == undefined) {
                    model.findOne({
                        _id: id,
                        __v: version
                    }).exec(function (error, item) {
                        if (error) return reject(error);
                        resolve(self.mapItem(item));
                    });
                } else {
                    resolve(self.mapItem(item));
                }
            });
        });
    };

    this.list = function list(id) {
        var self = this;
        let history = new Promise(function (resolve, reject) {
            historyModel.find({
                _originalId: id
            }).sort('version').exec(function (error, items) {
                if (error) return reject(error);
                resolve(items);
            });
        });
        let current = new Promise(function (resolve, reject) {
            model.findById({
                _id: id
            }).exec(function (error, item) {
                if (error) return reject(error);
                resolve(item);
            });
        });
        return Promise.all([history, current]).then(function (result) {
            result[0].push(result[1]);
            return result[0].map(self.mapItem);
        });
    };

    this.createHistory = function (ids) {
        return new Promise(function (resolve, reject) {
            if (ids === undefined) {
                resolve();
            }
            model.find().where("_id").in(ids).exec(function (error, results) {
                if (error) return reject(error);
                if (results.length === 0) {
                    return resolve([]);
                }

                var bulk = historyModel.collection.initializeUnorderedBulkOp();
                var items = results.map(function (item) {
                    return item._doc;
                }).map(function (item) {
                    item._originalId = item._id;
                    item._id = uuid();
                    item[options.idField] = item._id;

                    bulk.insert(item);
                });

                // execute the query
                bulk.execute(function (error, result) {
                    if (error) return reject(error);
                    resolve(result);
                });

            });
        });

    }

}