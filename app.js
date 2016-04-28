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

// imports
var _ = require('lodash');
var path = require('path');
var logger = require('morgan');
var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var OAuth2Server = require('./oauth-server/oauth2server');
var propertiesReader = require('./util/propertiesReader');

// read properties.
var properties = propertiesReader('app.dev.properties');

// and print configurations
console.log('********* CONFIGURATION *********');
console.log('=================================');
console.log(JSON.stringify(properties, null, 2));
console.log('=================================');

// connect to the databse, throw error and come out if db is not available
mongoose.connect(properties.database.url, function(error) {
  if (error) {
    throw ('Connect to mongodb: ' + error);
  }
  console.log('Connect to mongodb: successful [' + properties.database.url + ']');
});

// setup nodejs api server using express.js
var app = express();

// server static content; comment this line if this application is only api
app.use(require('serve-static')(__dirname + '/../build'));
app.use(logger('common'));

// basic api configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());

// enable Cross-Orgin-Resource-Sharing - CORS
if (properties.api.cors.enabled === true) {
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', properties.api.cors.allowed.origin);
    res.header('Access-Control-Allow-Methods', properties.api.cors.allowed.methods);
    res.header('Access-Control-Allow-Headers', properties.api.cors.allowed.headers);
    next();
  });
  console.log('CORS is enabled for', [properties.api.cors.allowed.origin,
    properties.api.cors.allowed.methods, properties.api.cors.allowed.headers
  ].join(' / '));
}

// enable authentication module
if (properties.api.auth && properties.api.auth.enabled === true) {
  // create auth server
  app.oauth = new OAuth2Server(app, properties.api.baseUrl + '/oauth2', properties.api.auth);
}

// register apis
properties.api.services.forEach(function(service) {
  require(service).register(app, properties.api.baseUrl);
});

app.use(function(req, res, next) {
  // return '404' error if a requested url is not found
  res.status(404);
  res.json({
    status: 404,
    message: 'Requested URL is invalid!'
  });
});

// return '500' error any other error that couldn't be sloved to this point
// development error handler and this will print stacktrace
if (properties.api.environment === 'development') {
  app.use(function(error, req, res, next) {
    res.status(error.status || 500);
    res.json({
      message: error.message,
      error: error
    });
  });
}

// production error handler and this will not leake stacktraces to user
if (properties.api.environment === 'production') {
  app.use(function(error, req, res, next) {
    res.status(error.status || 500);
    res.json({
      message: error.message
    });
  });
}

// set application port
app.set('port', parseInt(properties.api.port));

// start the application
var server = app.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + server.address().port);
});

// export module
module.exports = app;