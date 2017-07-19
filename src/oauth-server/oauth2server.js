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

var uuid = require('uuid');
var Token = require('./token');
var Base64 = require('../util/Base64');
var logger = require('../util/logger');
var express = require('express');
var oauthserver = require('oauth2-server');
var serviceModel = require('../core/service-model');

// define user schema
var userSm = serviceModel({

  // users model
  name: 'User',

  // api end point
  url: '/user',

  // schema definition - supports everything that mongoose schema supports
  schema: {
    name: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true,
      idField: true
    },
    password: String,
    picture: String,
    roles: [],
    active: {
      type: Boolean,
      required: true,
      default: true
    }
  },

  projection: '-password,-__v,-_id',
  timestamps: true,
  strict: false

});
var User = userSm.context.model;

// define client schema
var clientSm = serviceModel({

  // service model
  name: 'Client',

  // api end point
  url: '/client',

  // schema definition - supports everything that mongoose schema supports
  schema: {
    clientId: {
      type: String,
      required: true,
      default: uuid.v4(),
      idField: true
    },
    clientSecret: {
      type: String,
      required: true,
      default: uuid.v4()
    },
    name: {
      type: String,
      required: true
    },
    description: String,
    active: {
      type: Boolean,
      required: true,
      default: false
    },
    grantType: {
      type: Array,
      required: true,
      default: ["password", "refresh_token"]
    },
    expires: {
      type: Date,
      default: new Date(+new Date() + 365 * 24 * 60 * 60 * 1000)
    }
  },

  projection: '-clientSecret,-__v,-_id',
  timestamps: true

});

var Client = clientSm.context.model;

/**
 * OAuth2Server enables oAuth 2 security to the given path. This implementation is based on 'npm-oauth2-server' module
 *
 * @param app express.js application refrerence
 * @param baseUrl The base url for the api
 */
var OAuth2Server = function OAuth2Server(app, baseUrl, properties, apiUrl) {

  var client, user;
  var model = {};
  var rules = [];

  baseUrl = baseUrl || '';

  // process rules
  if (properties.rules) {
    for (var index in properties.rules) {
      var key = properties.rules[index];
      if (key === null) {
        throw 'Invalid rule at index "' + index + '"!';
      }
      var rule = key.replace(/(\t|\s)+/g, '|').split('|');
      rules.push({
        type: rule[0],
        roles: rule[1].toUpperCase().split(','),
        methods: rule[2].toUpperCase().split(','),
        patternDef: rule[3],
        pattern: new RegExp('^' + rule[3]
          .replace(/\*\*/g, '([^/]+(/[^/]+)~~~)')
          .replace(/\*/g, '([^/]+)')
          .replace(/~~~/g, '*')
          .replace(/\?/g, '[^/]?') + '/?$')
      });
    }

    logger.debug("RULES: ", JSON.stringify(rules, null, 4));
  }

  // setup default user if specified
  if (properties.default && properties.default.user) {
    User.remove({
      userId: properties.default.user.userId
    }, function(error, item) {
      User.create({
        name: properties.default.user.name,
        userId: properties.default.user.userId,
        password: properties.default.user.password,
        roles: properties.default.user.roles,
        active: true
      }, function(error, item) {
        if (error) return logger.debug('oauth2server:ERROR', error);
        logger.info('Created default user: "' + properties.default.user.userId + '"');
      });
    });
  }

  // setup default client if specified
  if (properties.default && properties.default.client) {
    Client.remove({
      clientId: properties.default.client.id
    }, function(error, item) {
      Client.create({
          clientId: properties.default.client.id,
          clientSecret: properties.default.client.secret,
          name: properties.default.client.name,
          description: properties.default.client.description,
          grantType: properties.default.client.grantTypes,
          active: true,
        },
        function(error, item) {
          if (error) return logger.debug('oauth2server:ERROR', error);
          logger.info('Created default client: "' + properties.default.client.name + '"');
        });
    });
  }

  /*
   * Create the model for performing authentication. The current implementation is using
   * database models 'users', 'clients' and 'tokens'
   */
  var model = {

    /**
     * Checks if access token is valid entry in 'tokens' collection
     *
     * @param token The token to be validated
     * @param callback function(error, callback)
     */
    getAccessToken: function getAccessToken(token, callback) {
      this.getToken(token, 'access', function(error, item) {
        if (error) return callback(error);
        if (!item) return callback(new Error('Invalid access token!'));
        var accessToken = {
          accessToken: item.token,
          clientId: item.clientId,
          user: {
            userId: item.userId,
            roles: item.roles
          },
          expires: item.expires
        };
        callback(null, accessToken);
      });
    },

    /**
     * Checks if refresh token is valid entry in 'tokens' collection, if so return clientId, userId and expires details
     *
     * @param token The token to be validated
     * @param callback function(error, callback)
     */
    getRefreshToken: function getRefreshToken(token, callback) {
      this.getToken(token, 'refresh', function(error, item) {
        if (error) return callback(error);
        if (!item) return callback(new Error('Invalid refresh token!'));
        var refreshToken = {
          refreshToken: item.token,
          clientId: item.clientId,
          user: {
            userId: item.userId,
            roles: item.roles
          },
          expires: item.expires
        };
        callback(null, refreshToken);
      });
    },

    /**
     * Generic implementation to fetch 'access' or 'refresh' token from 'tokens' collection
     *
     * @param token The token to be fetched
     * @param type The type of token, valid values are 'access' and 'refresh'
     * @param callback function(error, callback)
     */
    getToken: function getAccessToken(token, type, callback) {
      Token.findOne({
        token: token,
        type: type
      }, function(error, item) {
        if (error) return callback(error);
        callback(null, item);
      });
    },

    /**
     * Given an id and secret, retrive the client. This implementation mandates clientSecret
     *
     * @param clientId id of the client
     * @param clientSecret Client's secret
     * @param callback function(error, client)
     */
    getClient: function(clientId, clientSecret, callback) {
      Client.findOne({
        clientId: clientId,
        clientSecret: clientSecret,
        active: true
      }, function(error, item) {
        if (error) return callback(error);
        if (!item) return callback(new Error('Invalid client!'));
        callback(null, item);
      });
    },

    /**
     * Check if grant type is allowed for the given client
     *
     * @param clientId The id of the client
     * @param grantType Type of grant requested ('password' or 'refres_token')
     * @param callback function(error, valid: boolean);
     */
    grantTypeAllowed: function grantTypeAllowed(clientId, grantType, callback) {
      Client.find({
        clientId: clientId,
        active: true,
        grantType: {
          "$in": [grantType]
        }
      }, function(error, item) {
        if (error) return callback(error);
        if (!item) return callback(new Error('Invalid client!'));
        callback(null, true);
      });
    },

    /**
     * Get user given the id and password
     *
     * @param userId The id of the user to be matched
     * @param password Base64 encoded password
     * @param callback function(error, user: Object)
     */
    getUser: function getUser(userId, password, callback) {
      User.findOne({
        userId: userId,
        password: password,
        active: true
      }, function(error, item) {
        if (error) return callback(error);
        if (!item) return callback(new Error('Invalid user!'));

        callback(null, {
          name: item.name,
          userId: item.userId,
          date: item.date,
          active: item.active,
          roles: item.roles
        });
      });
    },

    /**
     * Save the access token into 'tokens' collection
     *
     * @param accessToken The access token to be saved
     * @param clientId client id as string
     * @param expires Expiry date
     * @param user User as object with a mandatory property 'id'
     * @param callback function(error, status)
     */
    saveAccessToken: function saveAccessToken(accessToken, clientId, expires, user, callback) {
      this.saveToken(accessToken, clientId, expires, user, 'access', callback);
    },

    /**
     * Save the refresh token into 'tokens' collection
     *
     * @param refreshToken The refresh token to be saved
     * @param clientId client id as string
     * @param expires Expiry date
     * @param user User object with a mandatory property 'id'
     * @param callback function(error, status)
     */
    saveRefreshToken: function saveRefreshToken(refreshToken, clientId, expires, user, callback) {
      this.saveToken(refreshToken, clientId, expires, user, 'refresh', callback);
    },

    /**
     * Generic implementation to save 'access' or 'refresh' token
     *
     * @param token 'access' or 'refresh' token to be saved
     * @param clientId client id as string
     * @param expires Expiry date as date
     * @param userId The id of the user as string
     * @param type 'access' or 'refresh'
     * @param callback function(error, status)
     */
    saveToken: function saveToken(token, clientId, expires, user, type, callback) {
      logger.debug('Save Token => ', 'token: ', token, 'clientId: ', clientId, 'expires: ', expires, 'user: ', user, 'type: ', type);
      Token.remove({
        userId: user && user.userId,
        clientId: clientId,
        type: type
      }, function(error, item) {
        if (error) return callback(error);
        Token.create({
          token: token,
          clientId: clientId,
          expires: expires,
          userId: user && user.userId,
          roles: user && user.roles,
          type: type
        }, callback);
      });
    },

    /**
     * Revoke access token
     *
     * @param token (description)
     * @param callback (description)
     */
    revokeAccessToken: function revokeAccessToken(token, callback) {
      Token.findOneAndRemove({
        token: token,
        type: 'access'
      }, null, function(error, item) {
        if (!item) {
          return callback({
            status: 'failed',
            message: 'Invalid access token!'
          });
        }
        Token.findOneAndRemove({
          userId: item.userId,
          type: 'refresh'
        }, null, function(error, item) {
          callback(null, {
            status: 'revoked',
            type: 'access',
            message: token
          });
        });
      });
    },

    /**
     * Delete refresh token
     *
     * @param token The refresh token to be deleted
     * @param callback function(error, status)
     */
    revokeRefreshToken: function revokeRefreshToken(token, callback) {
      this.revokeToken(token, 'refresh', callback);
    },

    /**
     * Generic implementation to delete 'access' or 'refresh' token
     *
     * @param token 'access' or 'refresh' token to be removed
     * @param type 'access' or 'refresh' as string
     * @param callback function(error, status)
     */
    revokeToken: function revokeToken(token, type, callback) {
      logger.debug('revokeToken: ', type, token);
      Token.remove({
        token: token,
        type: type
      }, callback);
    }
  };

  // oauth server
  app.oauth = oauthserver({
    grants: ['password', 'refresh_token'],
    debug: true,
    model: model
  });

  // authorization handler
  app.authorize = app.oauth.authorise();

  // defining /token end point
  var tokenRouter = express.Router();
  tokenRouter.post('/token', app.oauth.grant());
  tokenRouter.post('/revoke', function(request, response, next) {
    return app.authorize(request, response, function(error) {
      if (error) {
        response.status(400);
        return response.json({
          error: 400,
          message: 'Invalid access token'
        });
      }
      var accessToken = request.headers.authorization.replace('Bearer ', '');
      model.revokeAccessToken(accessToken, function(error, item) {
        if (error) {
          response.status(400);
          return response.json(error);
        }

        response.status(200);
        return response.json(item);
      });
    });
  });

  app.use(baseUrl, tokenRouter);

  // register user
  var userRegRouter = express.Router();
  userRegRouter.put('/', function(request, response, next) {

    if (request.body instanceof Array) {
      return next();
    }

    if (!request.headers.authorization) {
      response.status(401);
      return response.json({
        status: 401,
        message: 'You are not authorized!'
      });
    }

    var authorizationHeaders = Base64.decode(request.headers.authorization.replace('Basic ', '')).split(':');
    return Client.findOne({
      clientId: authorizationHeaders[0],
      clientSecret: authorizationHeaders[1],
      active: true
    }, function(error, item) {
      if (error || !item) {
        response.status(401);
        return response.json({
          status: 401,
          message: 'You are not authorized!'
        });
      }

      if (!request.body.userId || !request.body.name) {
        response.status(422);
        return response.json({
          status: 422,
          message: 'Missing one of the attributes: userId or name!'
        });
      }

      // check if user exists
      User.findOne({
        userId: request.body.userId
      }, function(error, item) {
        if (error || item) {
          response.status(409);
          return response.json({
            status: 409,
            message: 'User is already registered!'
          });
        }

        request.query.createOnly = true;
        userSm.context.service.save(request, response, next);
      });

    });

  });
  app.use(baseUrl + '/user', userRegRouter);

  // apply auth rules and authorization
  app.use(function(request, response, next) {

    if (!new RegExp('^' + apiUrl).test(request.url)) return next()

    var headerType = 'None';
    if (request.headers.authorization && request.headers.authorization.indexOf('Basic ') === 0) {
      headerType = 'Basic';
    } else if (request.headers.authorization && request.headers.authorization.indexOf('Bearer ') === 0) {
      headerType = 'Bearer';
    }

    for (var index in rules) {
      var rule = rules[index];
      if (
        // test url
        rule.pattern.test(request.path) &&

        // match methods
        (rule.methods.indexOf(request.method) >= 0 || rule.methods.indexOf('*') >= 0)

      ) {
        logger.debug('Applying rule: ', rule.type, rule.methods, rule.patternDef, "for", headerType, request.method, request.path)

        if (rule.type !== 'None' && headerType !== rule.type) {
          response.status(401);
          return response.json({
            status: 401,
            message: 'Invalid auth type. ' + rule.type + ' is expected!'
          });
        }

        switch (rule.type) {
          case 'Bearer':
            return app.authorize(request, response, function() {

              if (!request.user || !request.user.roles) {
                response.status(401);
                return response.json({
                  status: 401,
                  message: 'Could not authenticate user!'
                });
              }

              if (rule.roles.filter(function(item) {
                  return item === '*' || request.user.roles.map(function(item) {
                    return item.toUpperCase();
                  }).indexOf(item) >= 0;
                }).length <= 0) {
                response.status(401);
                return response.json({
                  status: 401,
                  message: 'Your role is not sufficient to access this resource!'
                });
              }

              next();
            });

          case 'Basic':
            var authorizationHeaders = Base64.decode(request.headers.authorization.replace('Basic ', '')).split(':');
            return Client.findOne({
              clientId: authorizationHeaders[0],
              clientSecret: authorizationHeaders[1],
              active: true
            }, function(error, item) {
              if (error || !item) {
                return response.json({
                  status: 401,
                  message: 'Invalid auth header!'
                });
              }

              next();
            });

          case 'None':
            return next();
        }
      }
    }

    app.authorize(request, response, next);
  });

  userSm.register(app, baseUrl, true);
  clientSm.register(app, baseUrl, true);

  // Overrides default error handler
  app.use(function(error, req, res, next) {

    if (error && (error.code === 400 || error.message == 'Invalid access token!' || error.message == 'Invalid refresh token!')) {
      res.status(401);
      return res.json({
        code: 401,
        error: error.message || "You are not authorized to access this resource!"
      });
    }

    if (error) {
      logger.debug('oauth2server:ERROR', error);
      res.status(error.code === 200 ? 400 : error.code);
      return res.json({
        error: error.message || 'Unexcepted error occured!'
      });
    }
    next();
  });

  // auth own error handler
  app.use(app.oauth.errorHandler());

}

module.exports = OAuth2Server;