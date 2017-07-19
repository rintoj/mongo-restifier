
# mongo-restifier

Easy to use [RESTful API](http://www.restapitutorial.com/lessons/whatisrest.html#) for [MongoDB](https://www.mongodb.org/) with build-in [OAuth2](http://oauth.net/2/) implementation.

## Features

* Easy to use **apification using json based models**
* Strict implementation of **[RESTful API](http://www.restapitutorial.com/lessons/whatisrest.html#)**
* Schema based collections and **[advanced querying](#advanced-query)** options
* **[Bulk create and updates](#bulk-create-or-update)** supported
* **[History](#manage-history)** can be enabled through a simple flag
* **[Cross domain resource sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS)** is enabled by default
* Build-in **[OAuth2](#oauth2-api)** API implementation
* Build on **[Mongoose](http://mongoosejs.com/)** and **[Express](https://www.npmjs.com/package/express)**

## Installation

This module is installed via npm:

```bash
$ npm install mongo-restifier --save
```

## Versions

Check [change log](https://github.com/rintoj/mongo-restifier/blob/master/CHANGELOG.md#mongo-restifier---change-log) to know more about versions.

## Get Started
The following example serves the `Todo` model on a RESTful API.

1. Install [MongoDB](https://www.mongodb.org/) and [startup](https://docs.mongodb.org/manual/tutorial/manage-mongodb-processes)
  ```bash
  $ mongod --syslog --fork
  ```

2. Create [npm](https://docs.npmjs.com/cli/init) project
  ```bash
  $ mkdir server
  $ cd server
  $ npm init
  ```

3. Install mongo-restifier
  ```bash
  $ npm install mongo-restifier --save
  ```

4. Create file **api.js** and copy the following code
  ```js
  // import
  var mongoRestifier = require('mongo-restifier');

  // configure the api
  mongoRestifier('./api.conf.json')

  // define "Todo" model
  .registerModel({

      // mandatory
      name: 'Todo',

      // api end point (optional)
      url: '/todo',

      // schema definition - supports everything that mongoose schema supports
      schema: {
        index: {
          type: Number,         // type of this attribute
          autoIncrement: true,  // auto increment this attribute
          idField: true         // serves as id attribute replacing _id
        },
        title: {
          type: String,
          required: true
        },
        description: String,    // attribute definition can be as simple as this
        status: String,
      }

  })

  // ... more models can be added here

  // and finally startup the server
  .startup();
  ```

5. Create configuration file **api.conf.json**
  ```json
  {
      "database": {
          "url": "mongodb://localhost/dbname"
      }
  }
  ```

6. And finally run
  ```bash
  $ node api.js
  ```

# REST API

## Query
```
GET /todo HTTP/1.1
```
```
GET /todo/{id} HTTP/1.1
```
```
GET /todo?{field}={value} HTTP/1.1
```
```
GET /todo?fields={field1},-{field2} HTTP/1.1
```
```
GET /todo?sort={field1},-{field2} HTTP/1.1
```
```
GET /todo?count=true HTTP/1.1
```
```
GET /todo?limit=10&skip=10 HTTP/1.1
```

Querying takes in the following parameters:

| Parameter | Purpose
| --------- | :--------------------------------
| `field`   | Replace `field` with any field in your Mongoose model, and it will check for equality.
| `fields`  | Comma-delimited list of fields to populate or field names with `-` sign at the beginning, to omit.
| `sort`    | Sorts by the given fields in the given order, comma delimited. A `-` sign will sort descending.
| `limit`   | Limits the number of returned results. All results are limited to `100` by default.
| `skip`    | Skips a number of results. Useful for pagination when combined with `limit`.
| `count`   | Set count = true to get the count of matching items instead of items themselves.

## Advanced Query
```
POST /todo HTTP/1.1

{title: "Your title", "status": "new" }
```
```
POST /todo HTTP/1.1

{ "status": { "$in": ["new", "hold"] }}
```
```
POST /todo HTTP/1.1

{"index": { "$gte": 1, "$lte": 100 }}
```
```
POST /todo HTTP/1.1

{ "$or" : [{ "index": 100 }, { "index": 101 }] }
```
```
POST /todo HTTP/1.1

{ "$and": [{ "index": { "$ne": 100 }}, { "index": { "$lt": 120 }}] }
```
```
POST /todo HTTP/1.1

{ "title": { "$regex": "^S.mple.*"} }
```
```
POST /todo HTTP/1.1

{ "index": { "$exists": true }}
```

Use `POST` to perform advanced queries. Query parameters remain same as of `GET`. Additionally the `BODY` of the request we can contain:

**Comparison Operators**

| Operator  | Purpose                    | Example
| --------- |:---------------------------| ---------------------------------
| `$gt`     | Greater than               | `{ "age": { "$gt": 10 } }`
| `$gte`    | Greater than or equal      | `{ "age": { "$gte": 10 } }`
| `$lt`     | Less than                  | `{ "age": { "$lt": 10 } }`
| `$lte`    | Less than or equal         | `{ "age": { "$lte": 10 } }`
| `$ne`     | Not equal                  | `{ "status": { "$ne": "new" } }`
| `$in`     | In operator                | `{ "status": { "$in": ["new", "hold"] } }`
| `$nin`    | Not In operator            | `{ "status": { "$nin": ["new", "hold"] } }`
| `$all`    | All in an array match      | `{ "status": { "$all": ["new", "hold"] } }`
| `$regex`  | Regular expression match   | `{ "title": { "$regex": "^S.mple.*"} }`
| `$exists` | Check if a field exists    | `{ "index": { "$exists": true }}`

**Logical Operators**

| Operator  | Purpose              | Example
| --------- |:---------------------| ---------------------------------
| `$and`    | Logical AND          | `{ "$and": [{ "index": 100 }, { "status": "new" }] }`
| `$or`     | Logical OR           | `{ "$or": [{ "index": 100 }, { "index": 101 }] }`

## Create or Update
```
PUT /todo HTTP/1.1

{ "title": "Your title", "status": "new" }
```
```
PUT /todo/{id} HTTP/1.1

{ "title": "Your title", "status": "new" }
```
```
PUT /todo HTTP/1.1

{ "id": "abc", "title": "Your title" }
```
```
PUT /todo?createOnly=true HTTP/1.1

{ "id": "abc", "title": "Your title" }
```
```
PUT /todo?updateOnly=true HTTP/1.1

{ "id": "abc", "title": "Your title" }
```

| Parameter       | Purpose
| --------------- |:---------------------
| `createOnly`    | Create an item if it doesn't exist, ignore updates
| `updateOnly`    | Update an item if it exists, ignore creates

## Bulk Create or Update
```
PUT /todo HTTP/1.1

[{ "title": "Your title"}, { "title": "Your title"}]
```
```
PUT /todo HTTP/1.1

[{ "id": "2sd233", "title": "Sample"}, { "id": "2sd234", "title": "Sample"}]
```
```
PUT /todo?createOnly=true HTTP/1.1

[{ "id": "2sd233", "title": "Your title"}]
```
```
PUT /todo?updateOnly=true HTTP/1.1

[{ "id": "2sd233", "title": "Your title"}]
```

*NOTE: `createOnly` and `updateOnly` are applicable for bulk updates as well. For all create and update operations, existance of an item is determinded through it's `id`*

## Delete
```
DELETE /todo/{id} HTTP/1.1
```
```
DELETE /todo HTTP/1.1

{ "status": "new" }
```
```
DELETE /todo HTTP/1.1
```
*NOTE: `DELETE /todo` deletes everything. `USE WITH CATION`*

## Manage History

If you set `history: true` for a schema each change will be logged into `_history` table. The following apis can be used to manage versions. Please note version starts with `0`. The highest version will always be the current version.

List all versions:
```
GET /todo/{id}/version HTTP/1.1
```

Get a specific version:
```
GET /todo/{id}/version/{version_number} HTTP/1.1
```

Delete a specific version:
```
DELETE /todo/{id}/version/{version_number} HTTP/1.1
```

Rollback to a specific version:
```
POST /todo/{id}/rollback/{version} HTTP/1.1
```
Rollback will delete all greater versions. Eg: if you give rollback to version `1`, api will delete all entries with version greater than `1`.

# Model Configuration

## Configuration

`*` - are mandatory

| Option           | Type       | Purpose
| ---------------- | :--------- | :------------------------------------------------
| name         `*` | Definition | Name of the model which will also be used as collection's name. Therefor no special characters (including space) other than `_` is allowed.
| schema       `*` | Definition | Define the schema as defined by mongoose. See [Schema Definition](#schema-definition)   for details.
| url              | Definition | Serving endpoint. If not defined, this will be derived from name. Eg: name `Todo` will result in url `/todo`. The final url will be `http://{app}:{port}/{baseUrl}/{url}`
| projection       | Behavior   | Coma separated list of fields that needs to be projected. Use `-` at the beginning of the fieldname to hide it. Usage: `projection: 'userId,name,roles,-password'`
| history          | Behavior   | If set to `true` history of records will be kept in a separate collection with name `<name>_history`. `/version` apis can be used to manage versions.
| userSpace        | Behavior   | Keep track of the user for each record and restrict access to the corresponding users. `api.oauth2.enable` must be `true` to use this option, otherwise the startup will fail with an error message. Usage: `userSpace: true` or `userSpace: {field: "_user", ignore: ["role1"]}`
| timestamps       | Behavior   | If set to `true`, two fields `createdAt` and `updatedAt` are added to the schema and maintained by the api.
| strict           | Behavior   | Set `false` to add any arbitral field. By default this is set to `true`.
| configure        | Function   | Use this function to register [middleware](http://mongoosejs.com/docs/middleware.html) or [plugins](http://mongoosejs.com/docs/plugins.html). Context of this function will contain the second parameter of 'defineModel' (this object itself) *this.schema* - Schema defined by `schema, *this.model* - reference to [mongoose.Model](http://mongoosejs.com/docs/models.html), *this.modelSchema* - reference to [mongoose.Schema](http://mongoosejs.com/docs/guide.html)

```js
...
// define "Todo" model
.registerModel({

    // mandatory
    name: 'Todo',

    /** schema definition (mandatory) **/
    schema: {

        /** field definition **/
        field1: {

            /** type of the field **/
            type: String | Number | Date,

            /** validations **/
            required: true,                      // check for null values
            required: [true, 'phone# required'], // custom message
            enum: ['Coffee', 'Tea'],             // only if type = String
            minlength: Number,                   // only if type = String
            maxlength: Number,                   // only if type = String
            min: Number,                         // only if type = Number
            max: Number,                         // only if type = Number

            /** custom validation **/
            validate: {
                validator: function(v) {
                    return /\d{3}-\d{3}-\d{4}/.test(v);
                },
                message: '{VALUE} is not a valid phone number!'
            },

            /** other options **/
            idField: Boolean,           // replaces _id with field1. one and only one field can be id
            autoIncrement: Boolean,     // only if type = Number
            startAt: Number,            // only if type = Number and autoIncrement = true
            incrementBy: Number         // only if type = Number and autoIncrement = true
        }
    },

    url: String,                   // service endpoint eg: /todo
    userSpace: Boolean,            // true | { field: "{your field name}", ignore: ["role1"] } only if api.oauth2.enable = true
    strict: Boolean,               // true (default value). Set false to add any arbitral field

    configure: function() {
        // write your code here to customize this model further

        // this.schema         - The second parameter of 'defineModel' (this object itself)
        // this.model          - reference to mongoose.Model
        // this.modelSchema    - reference to mongoose.Schema
    }

})
...
```
## Schema Definition
`*` - are mandatory
`**` - additional feature than the ones supported by [mongoose](http://mongoosejs.com/docs/guide.html)

| Option                    | Type       | Purpose
| ------------------------- |:---------- | :------------------------------------------------
| {field}.type          `*` | Definition | Valid values are `String`, `Number` and `Date`
| {field}.idField       `**`| Behaviour  | If set to `true`, system replaces _id with the given field. One and only one field can be set as id field. Usage: `idField: true`
| {field}.autoIncrement `**`| Behaviour  | If set to `true`, system increments value of the given field for every insertion. This validation can be applied only on `Number` fields . Usage: `autoIncrement: true`
| {field}.startAt       `**`| Behaviour  | Start autoIcrement at the given value. This configuration takes effect only if `autoIcrement` is set to `true`. Usage: `startAt: 1`
| {field}.incrementBy   `**`| Behaviour  | Start autoIcrement with the given steps. This configuration takes effect only if `autoIcrement` is set to `true`. Usage: `incrementBy: 1`
| {field}.default           | Behaviour  | Sets the given value as the default value of the field if not specified in the request. Usage: `default: Date.now`
| {field}.required          | Validation | If set to `true` adds a required validator. If a value is not specified while creating an entity, operation will be rejected with an error, unless 'default' value is configured. Required can be configured as:. Usage: `required: true` or `required: [true, 'User phone number required']` This format is applicable to all validators except `validate`
| {field}.enum              | Validation | Validates the value of a field against predefined enum values; This validation can be applied only on `String` fields. Usage: `enum: ['Coffee', 'Tea']`
| {field}.minlength         | Validation | Validates the length of the value to be minimum of given value; This validation can be applied only on `String` fields. Usage: `minlength: 5`
| {field}.maxlength         | Validation | Validates the length of the value to be maximum of given value; This validation can be applied only on `String` fields. Usage: `maxlength: 5`
| {field}.min               | Validation | Validates the value to be minimum of given value; This validation can be applied only on `Number` fields. Usage: `min: 5`
| {field}.max               | Validation | Validates the value to be maximum of given value; This validation can be applied only on `Number` fields. Usage: `max: 5`
| {field}.validate          | Validation | Helps in defining custom validation. `validate: { validator: function(v) { return /\d{3}-\d{3}-\d{4}/.test(v); }, message: '{VALUE} is not a valid phone number!'}`

Any other additional option supported by [mongoose schema](http://mongoosejs.com/docs/guide.html)

# OAuth2 API

This module contains **[OAuth2](http://oauth.net/2/)** services configured out-of-box for `password` and `refresh_token` grant types. In this section we will discuss how to use them.

Add the following code in configuration json to enable oauth:
```
{
    "api": {
        "oauth2": {
            "enable": true
        }
    }
}
```

To know more about how to configure see [API Configuration](#api-configuration) section.

## Using the password grant type
First you must create a client and a user. A default client and user are configured at startup (see [API Configuration](#api-configuration) for details). Additionally users and clients can be created using build in apis `/oauth2/user` and `/oauth2/client`.

To obtain a token you should POST to /oauth2/token. You should include your client credentials in the `Authorization` header (`"Basic " + client_id:client_secret base64'd`), and then `grant_type` (`password`), `username` and `password` in the request body, for example:
```
POST /oauth/token HTTP/1.1
Authorization: Basic czZCaGRSa3F0MzpnWDFmQmF0M2JW
Content-Type: application/x-www-form-urlencoded

grant_type=password&username=johndoe&password=A3ddj3w
```

Provided there weren't any errors, this will return the following (excluding the refresh_token if you've not enabled the refresh_token grant type):

```
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8

{
  "access_token":"2YotnFZFEjr1zCsicMWpAA",
  "token_type":"bearer",
  "expires_in":3600,
  "refresh_token":"tGzv3JOkF0XG5Qx2TlKWIA"
}
```

## Using the refresh_token grant type

Send a request with previously obtained `refresh_token` to extend grant and expect the same output as the previous call.

```
POST /oauth/token HTTP/1.1
Authorization: Basic {access_token}
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token&refresh_token=tGzv3JOkF0XG5Qx2TlKWIA
```

## Managing Users

### Get
```
GET /oauth2/user/{userId} HTTP/1.1
Authorization: Basic base64{clientId:clientSecret}
```

### Create User
```
PUT /oauth2/user HTTP/1.1
Authorization: Basic base64{clientId:clientSecret}

{ "userId": "emailid", "password": "base64(plaintext)", "name": "Full name" }
```

### Bulk Create Or Update
```
PUT /oauth2/user HTTP/1.1
Authorization: Bearer {access_token}

[{ "userId": "user1@system.com", "password": "base64(plaintext)", "name": "Full name" },
 { "userId": "user2@system.com", "password": "base64(plaintext)", "name": "Full name" }]
```

### Delete
```
DELETE /oauth2/user/{userId} HTTP/1.1
Authorization: Bearer {access_token}
```

Delete every user in the system. *NOTE: USE WITH CATION*
```
DELETE /oauth2/user HTTP/1.1
Authorization: Bearer {access_token}
```

## Managing Clients

### Get
```
GET /oauth2/client/{clientId} HTTP/1.1
Authorization: Basic base64{clientId:clientSecret}
```

### Create Client
```
PUT /oauth2/client HTTP/1.1
Authorization: Basic base64{clientId:clientSecret}

{ "clientId": "24x43f-sd23dde-sda23", "clientSecret": "a0c7b741-b18b-47eb", "name": "Full name" }
```

### Bulk Create Or Update
```
PUT /oauth2/client HTTP/1.1
Authorization: Bearer {access_token}

[{ "clientId": "4x33-23cs34d-3ss12", "clientSecret": "a0c7b741-b18b-47eb", "name": "Full name" },
 { "clientId": "243f-sd23dde-sda23", "clientSecret": "a0c7b741-b18b-47eb", "name": "Full name" }]
```

### Delete
```
DELETE /oauth2/client/{clientId} HTTP/1.1
Authorization: Bearer {access_token}
```

Delete every client in the system. *NOTE: USE WITH CATION*
```
DELETE /oauth2/client HTTP/1.1
Authorization: Bearer {access_token}
```

# API Configuration

## Options

All values except `database.url` are predefined. Specify any value in `app.conf.json` or `app.conf.properties` only if you need to override them.

| Option                    | Purpose
| --------------------------|:-------------------------------------------------------
| database.url              | Mongo DB url. Format:  `mongodb://localhost/{dbname}`
| api.port                  | Port your server should start at; default: `5858`
| api.baseUrl               | Port and baseUrl defines your api url: `http://{host}:{port}/{baseUrl}/`
| api.cors.enable           | `true` if you want to make [cross-origin HTTP request](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS). CORS is enabled by default.
| api.cors.allowed          | *origin* - coma separated domain names; `*` - for any domain, *methods* - coma separated values of: `GET`, `POST`, `HEAD`, `POST`, `PUT` , `DELETE`, *headers* - all possible headers added by user or user agent
| api.oauth2.enable         | `true` to enable OAuth2 based authentication and authorization. (`false` by default)
| api.oauth2.default.user   | To create a default user at startup, provide user attributes: *name* - Full name of the user; default: `Superuser`,  *userId* - Required for login; default: `superuser@system.com`,  *password* - Password must be base64 encode; default: `sysadmin` (TODO: use encryption) ,  *roles* -  the roles must be an array of string; default: [`ADMIN`]
| api.oauth2.default.client | To create a default client at startup, provide client attributes: *name*, *description*, *id*, *secret*, *grantTypes* - valid values are `password` and `refresh_token`
| api.oauth2.rules          | Array of tab separated values in the order:  *AuthType* - valid values are `None`, `Basic` and `Bearer`, *Roles* - coma separated values without space. eg: `ADMIN,USER`, *Methods* - coma separated values without space. eg: `GET,POST,PUT`,  *Url* - eg: `/api/user/**/*`
| api.environment           | `development` or `production`
| static.root               | Provide a folder from the root of the project to be served as static content. By default this is set to `public`
| static.fallback           | The given file will be served if a static content is not found. Default value is `index.html`. Set to `false` to disable this feature.
| logger.level              | Valid values are `OFF`, `FATAL`, `ERROR`, `WARN`, `LOG`, `INFO`, `DEBUG`, `TRACE` and `ALL`
| logger.log4js             | [Log4j configuration](https://www.npmjs.com/package/log4js#configuration)

## Update properties at startup

You can optionally pass a function as second argument to `mongoRestifier` function inorder to modify the properties at run time.

```js
mongoRestifier('./api.conf.json', function (properties) {
  properties.api.port = process.env.port || 3000
  return properties
})
```

## Do more with `app`

Optionally you can pass on a callback function to `startup` function in order to use `app` and `properties` do things on your own.

```js
mongoRestifier(...)

  .registerModel(...)
  ...

  .startup(function (app, properties, mongoose) {
    // your code
  })
```

## Configuration File

```json
{
  "database": {
    "url": "mongodb://localhost/{{DBNAME}}"
  },
  "api": {
    "port": 5858,
    "baseUrl": "/api",
    "environment": "production",
    "cors": {
      "enable": true,
      "allowed": {
        "origin": "*",
        "methods": "GET,PUT,POST,DELETE,OPTIONS",
        "headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
      }
    },
    "oauth2": {
      "enable": true,
      "default": {
        "user": {
          "name": "System Admin",
          "userId": "admin",
          "password": "admin",
          "roles": [
            "admin"
          ]
        },
        "client": {
          "name": "Master",
          "description": "Master Client",
          "id": "7d65d9b6-5cae-4db7-b19d-56cbdd25eaab",
          "secret": "a0c7b741-b18b-47eb-b6df-48a0bd3cde2e",
          "grantTypes": [
            "password",
            "refresh_token"
          ]
        }
      },
      "rules": [
        "None        *               OPTIONS             /api/oauth2/register",
        "None        *               OPTIONS             /api/oauth2/client",
        "None        *               OPTIONS             /api/oauth2/user",
        "Basic       *               GET                 /api/oauth2/user",
        "Bearer      ADMIN           *                   /api/oauth2/user",
        "Bearer      ADMIN           *                   /api/oauth2/client"
      ]
    }
  },
  "static": {
    "root": "public",
    "fallback": "index.html"
  },
  "logger": {
    "level": "INFO",
    "log4j": {
      "appenders": [{
        "type": "console"
      }]
    }
  }
}
```

ABOUT
===

## Angular2 Integration
This software was built with [Angular 2](https://angular.io/) in mind. Client-side library is being build. Come back later.

## Sample Code

Check `demo/api.js` and `demo/api.conf.json` to understand the usage. `npm start` on this repository will run the api.

## Running the Tests
Do `npm install` to install all of the dependencies, ensure that [MongoDB](http://mongodb.org) is installed and running, then to run unit tests use:

```
$ npm test
```

## Contributing
Contributions are very welcome! Just send a pull request. Feel free to [contact me](mailto:rintoj@gmail.com) or checkout my [Github](https://github.com/rintoj) page.

## Author

**Rinto Jose** (rintoj)

Follow me:
  [Github](https://github.com/rintoj)
| [Facebook](https://www.facebook.com/rinto.jose)
| [Twitter](https://twitter.com/rintoj)
| [Google+](https://plus.google.com/+RintoJoseMankudy)
| [Youtube](https://youtube.com/+RintoJoseMankudy)

## License
```
The MIT License (MIT)

Copyright (c) 2016 Rinto Jose (rintoj)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```