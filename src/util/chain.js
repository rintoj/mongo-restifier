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
 **/

var Chain = function Chain() {

    var operations = [];

    var chain = function chain(index, callback, response) {
        if (index < operations.length) {
            return operations[index].call(this, function(err, res) {
                response.push({
                    error: err,
                    response: res
                });
                console.log(err, res && res.body ? res.body : res);
                chain(index + 1, callback, response);
            })
        }

        operations = [];
        callback(response);
    };

    this.add = function add(callback) {
        operations.push(callback);
        return this;
    };

    this.addAll = function addAll(callbacks) {
        var self = this;
        (callbacks || []).map(function(callback) {
            self.add.call(self, callback);
        });
        return this;
    }

    this.exec = function exec(callback) {
        chain(0, callback, []);
    };
};

/**
 * Create chain
 */
Chain.start = function start() {
    return new Chain();
};

module.exports = Chain;