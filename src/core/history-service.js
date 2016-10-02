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

    this.versions = function versions(id) {
        model.find({
            _id: id
        })
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
                
                // historyModel.create(items, function (error, bulkResponse) {
                //     if (error) return reject(error);
                //     resolve(bulkResponse);
                // });
            });
        });

    }

}