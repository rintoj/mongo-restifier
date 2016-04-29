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

// import
var mongoRestifier = require('./index');

// configure your api
mongoRestifier('./src/api.conf.json')

// define "Story" model
.register(mongoRestifier.defineModel("Story", {

  // api end point
  url: '/story',

  // schema definition
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

  userSpace: {
    field: "_user"
  },

  timestamps: true,

}))


// and finally startup your server
.startup();