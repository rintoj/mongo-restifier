# mongo-restifier

Easy to use [RESTful API](http://www.restapitutorial.com/lessons/whatisrest.html#) for [MongoDB](https://www.mongodb.org/)  with build-in [OAuth2](http://oauth.net/2/) provider. 

### Features:
  * Easy to use apification using **[Mongoose](http://mongoosejs.com/)** and **[Express](https://www.npmjs.com/package/express)**
  * Build in **[OAuth2](http://oauth.net/2/)** implementation
  * Strict implementation of **[RESTful API](http://www.restapitutorial.com/lessons/whatisrest.html#)**
  * Bulk upload and updates supported
  * Schema based collections
  * Angular2 client-side library will be available soon (Come back later)

## Installation
This module is installed via npm:

```bash
$ npm install mongo-restifier --save
```

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

4. Create file **app.js** and copy the following code
  ```js
  // import
  var mongoRestifier = require('mongo-restifier');

  // configure the api
  mongoRestifier('./api.conf.json')

  // define "Todo" model
  .register(mongoRestifier.defineModel("Todo", {

      // api end point
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

  }))
  
  // ... more models can be added here

  // and finally startup the server
  .startup();
  ```

5. Create configruation file **api.conf.json**
  ```json
  {
      "database": {
          "url": "mongodb://localhost/dbname"
      }
  }
  ```

6. And finally run
  ```bash
  $ node app.js
  ``` 

REST API
========

### ** Query ** 
```
GET /todo                         
GET /todo/{id}                    
GET /todo?{field}={value}         
GET /todo?fields=posts,comments   
GET /todo?sort={field1},-{field2} 
GET /todo?limit=10&skip=100
GET /todo?count=true       
```
Querying takes in the following parameters:

| Parameter | Purpose
| --------- | :--------------------------------
| `field`   | Replace `field` with any field in your Mongoose model, and it will check for equality. 
| `fields`  | Comma-delimited list of fields to populate.
| `sort`    | Sorts by the given fields in the given order, comma delimited. A `-` sign will sort descending. 
| `limit`   | Limits the number of returned results. All results are limited to `100` by default.
| `skip`    | Skips a number of results. Useful for pagination when combined with `limit`.
| `count`   | Set count = true to get the count of matching items instead of items themselves. 

### ** Advanced Query ** 
```
POST /todo      
{title: "Your title", "status": "new" }

POST /todo
{ "status": { "$in": ["new", "hold"] }}

POST /todo
{"index": { "$gte": 1, "$lte": 100 }}

POST /todo
{ "$or" : [{ "index": 100 }, { "index": 101 }] }

POST /todo
{ "$and": [{ "index": { "$ne": 100 }}, { "index": { "$lt": 120 }}] }

POST /todo
{ "title": { "$regex": "^S.mple.*"} }

POST /todo
{ "index": { "$exists": true }}
```

Use `POST` to perform advanced queries. Query parameters remains same as of `GET`. Additionally the `BODY` of the request we can contain:

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

### ** Create or Update **
```
PUT /todo 
{ "title": "Your title", "status": "new" }

PUT /todo/{id}            
{ "title": "Your title", "status": "new" }

PUT /todo 
{ "id": "abc", "title": "Your title" }   

PUT /todo?createOnly=true 
{ "id": "abc", "title": "Your title" }
   
PUT /todo?updateOnly=true 
{ "id": "abc", "title": "Your title" }   
```
| Parameter       | Purpose                 
| --------------- |:---------------------
| `createOnly`    | Create an item if it doesn't exist, ignore updates
| `updateOnly`    | Update an item if it exists, ignore creates


### ** Bulk Create or Update ** 
```
PUT /todo 
[{ "title": "Your title"}, { "title": "Your title"}]
               
PUT /todo 
[{ "id": "2sd233", "title": "Sample"}, { "id": "2sd234", "title": "Sample"}]

PUT /todo?createOnly=true 
[{ "id": "2sd233", "title": "Your title"}]         

PUT /todo?updateOnly=true 
[{ "id": "2sd233", "title": "Your title"}]                         
```
*NOTE: `createOnly` and `updateOnly` are applicable for bulk updates as well. For all create and update operations, existance of an item is determinded through it's `id`*

### ** Delete ** 
```
DELETE /todo/{id}

DELETE /todo
{ "status": "new" }

DELETE /todo
```
*NOTE: `DELETE /todo` deletes *everything*. `USE WITH CATION`

Model Configuration
======

## Configuration

`*` - are mandatory

| Option           | Type       | Purpose           
| ---------------- | :--------- | :------------------------------------------------
| url          `*` | Definition | Serving endpoint. The final url will be `http://{app}:{port}/{baseUrl}/{url}` 
| schema       `*` | Definition | Define the schema as defined by mongoose. See [Schema Definition](#schema-definition)   for details.
| userSpace        | Behaviour  | Keep track of the user for each record and restrict access to the corresponding users.<br> Usage: `userSpace: true` </br> Usage: `userSpace: {`<br>&nbsp;&nbsp;&nbsp;&nbsp;`field: "_user"`<br>`}`
| configure        | Function   | Use this function to register [middleware](http://mongoosejs.com/docs/middleware.html) or [plugins](http://mongoosejs.com/docs/plugins.html). Context of this function will contain the second parameter of 'defineModel' (this object itself) <li> `this.schema` - Schema defined by `schema`</li><li> `this.model` - reference to [mongoose.Model](http://mongoosejs.com/docs/models.html) </li><li> `this.modelSchema` - reference to [mongoose.Schema](http://mongoosejs.com/docs/guide.html) 

```js
// define "Todo" model
.register(mongoRestifier.defineModel("Todo", {
  
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
       minlength: number,                   // only if type = String
       maxlength: number,                   // only if type = String
       min: number,                         // only if type = Number
       max: number,                         // only if type = Number

       /** custom validation **/
       
       validate: {
          validator: function(v) {
            return /\d{3}-\d{3}-\d{4}/.test(v);
          },
          message: '{VALUE} is not a valid phone number!'
       },
        
       /** other options **/
       
       idField: boolean,           // replaces _id with field1. one and only one field can be id
       autoIncrement: boolean,     // only if type = Number
       startAt: number,            // only if type = Number and autoIncrement = true
       incrementBy: number         // only if type = Number and autoIncrement = true  
     }
   },
   
   url: String,                   // service endpoint eg: /todo
   userSpace: Boolean,            // true | { field: "{your field name}" }
   
   configure: function() {
     // write your code here to customize this model further
     
     // this.schema         - The second parameter of 'defineModel' (this object itself)
     // this.model          - reference to mongoose.Model
     // this.modelSchema    - reference to mongoose.Schema 
   }
   
}));
    
```

## Schema Definition
`*` - are mandatory<br>
`**` - additional feature than the ones supported by [mongoose](http://mongoosejs.com/docs/guide.html)

| Option                    | Type       | Purpose           
| ------------------------- |:---------- | :------------------------------------------------
| {field}.type          `*` | Definition | Valid values are `String`, `Number` and `Date` 
| {field}.idField       `**`| Behaviour  | If set to `true`, system replaces _id with the given field. One and only one field can be set as id field. <div> Usage: `idField: true`</div> 
| {field}.autoIncrement `**`| Behaviour  | If set to `true`, system increments value of the given field for every insertion. This validation can be applied only on `Number` fields <div> Usage: `autoIncrement: true`</div> 
| {field}.startAt       `**`| Behaviour  | Start autoIcrement at the given value. This configuration takes effect only if `autoIcrement` is set to `true`<div> Usage: `startAt: 1`</div> 
| {field}.incrementBy   `**`| Behaviour  | Start autoIcrement with the given steps. This configuration takes effect only if `autoIcrement` is set to `true`<div> Usage: `incrementBy: 1`</div> 
| {field}.default           | Behaviour  | Sets the given value as the default value of the field if not specified in the request. <div> Usage: `default: Date.now` </div> 
| {field}.required          | Validation | If set to `true` adds a required validator. If a value is not specified while creating an entity, operation will be rejected with an error, unless 'default' value is configured. Required can be configured as: <div>Usage: `required: true` </div> <div>Usage: `required: [true, 'User phone number required']` <br>This format is applicable to all validators except `validate` </div>
| {field}.enum              | Validation | Validates the value of a field against predefined enum values; This validation can be applied only on `String` fields. <div>Usage: `enum: ['Coffee', 'Tea']` </div>
| {field}.minlength         | Validation | Validates the length of the value to be minimum of given value; This validation can be applied only on `String` fields. <div>Usage: `minlength: 5` </div>
| {field}.maxlength         | Validation | Validates the length of the value to be maximum of given value; This validation can be applied only on `String` fields. <div>Usage: `maxlength: 5` </div>
| {field}.min               | Validation | Validates the value to be minimum of given value; This validation can be applied only on `Number` fields. <div>Usage: `min: 5` </div>
| {field}.max               | Validation | Validates the value to be maximum of given value; This validation can be applied only on `Number` fields. <div>Usage: `max: 5` </div>
| {field}.validate          | Validation | Helps in defining custom validation. <br><br>`validate: { `<br>&nbsp;&nbsp;&nbsp;&nbsp;` validator: function(v) { `<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`   return /\d{3}-\d{3}-\d{4}/.test(v); `<br>&nbsp;&nbsp;&nbsp;&nbsp;` }, `<br>&nbsp;&nbsp;&nbsp;&nbsp;`message: '{VALUE} is not a valid phone number!' `<br>`}`

Any other additional option supported by [mongoose schema](http://mongoosejs.com/docs/guide.html)


API Configuration
======

## Options
All values except `database.url` are predefined. Specify any value in `app.conf.json` or `app.conf.properties` only if you need to override them.

| Option                    | Purpose           
| --------------------------|:-------------------------------------------------------
| database.url              | Mongo DB url. Format:  `mongodb://localhost/{dbname}`
| api.port                  | Port your server should start at; default: `3000`  
| api.baseUrl               | Port and baseUrl defines your api url: `http://{host}:{port}/{baseUrl}/`  
| api.cors.enabled          | `true` if you want to make [cross-origin HTTP request](https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS) 
| api.cors.allowed          | <li>`origin` - coma separated domain names; `*` - for any domain</li><li>`methods` - coma separated values of: `GET`, `POST`, `HEAD`, `POST`, `PUT` , `DELETE`</li><li>`headers` - all possible headers added by user or user agent 
| api.oauth2.enabled        | `true` to enable OAuth2 based authentication and authorization
| api.oauth2.default.user   | To create a default user at startup, provide user attributes: <li>`name` - Full name of the user; default: `Superuser`</li><li> `userId` - Required for login; default: `superuser@system.com`</li><li> `password` - Password must be base64 encode; default: `sysadmin` (TODO: use encryption) </li><li> `roles` -  the roles must be an array of string; default: [`ADMIN`]</li>
| api.oauth2.default.client | To create a default client at startup, provide client attributes: <li>`name`</li><li>`description`</li><li>`id`</li><li>`secret`</li><li> `grantTypes` - valid values are `password` and `refresh_token`</li> 
| api.oauth2.rules          | Array of tab separated values in the order: <li> `AuthType` - valid values are `None`, `Basic` and `Bearer`</li><li>`Roles` - coma separated values without space. eg: `ADMIN,USER`</li><li>`Methods` - coma separated values without space. eg: `GET,POST,PUT`</li><li> `Url Pattern` - eg: `/api/user/**/*`</li>
| api.environment           | `development` or `production`  
| logger.level              | Valid values are `OFF`, `FATAL`, `ERROR`, `WARN`, `LOG`, `INFO`, `DEBUG`, `TRACE` and `ALL`
| logger.log4js             | [Log4j configuration](https://www.npmjs.com/package/log4js#configuration) 

## Configuration File

You may setup configuration in either of the two formats:
  <li> `json` - The file must have an extension `.json` </li>
  <li> `ini` - The file must have an extension `.properties` </li>
### JSON Format:

```json
{
    "database": {
        "url": "mongodb://localhost/{dbname}"
    },
    "api": {
        "port": 3000,
        "baseUrl": "/api",
        "environment": "development",
        "cors": {
            "enabled": true,
            "allowed": {
                "origin": "*",
                "methods": "GET,PUT,POST,DELETE,OPTIONS",
                "headers": "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control"
            }
        },
        "oauth2": {
            "enabled": true,
            "default": {
                "user": {
                    "name": "Superuser",
                    "userId": "superuser@system.com",
                    "password": "c3lzYWRtaW4=",
                    "roles": [
                        "admin"
                    ]
                },
                "client": {
                    "name": "Master",
                    "description": "This is a default client setup by the system",
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
    "logger": {
        "level": "DEBUG",
        "log4j": {
            "appenders": [
                {
                    "type": "console",
                    "makers": {}
                }
            ]
        }
    }
}
```

### INI Format:

```ini

[database]
url = mongodb://localhost/{dbname}

[api]
port = 3000
baseUrl = /api
environment = development

[api.cors]
enabled = true
allowed.origin = *
allowed.methods = GET,PUT,POST,DELETE,OPTIONS
allowed.headers = Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control

[api.oauth2]
enabled = true

[api.oauth2.default.user]
name = Superuser
userId = superuser@system.com
password = c3lzYWRtaW4=
roles.0 = admin

[api.oauth2.default.client]
name = Master
id = 7d65d9b6-5cae-4db7-b19d-56cbdd25eaab
secret = a0c7b741-b18b-47eb-b6df-48a0bd3cde2e
grantTypes.0 = password
grantTypes.1 = refresh_token

[api.oauth2.rules]
# ----- - ----------- --------------- ------------------- ------------------------
# index - AuthType    Roles           Methods             Url Pattern
# ----- - ----------- --------------- ------------------- ------------------------
      0 = None        *               OPTIONS             /api/oauth2/register
      1 = None        *               OPTIONS             /api/oauth2/client
      2 = None        *               OPTIONS             /api/oauth2/user
      3 = Basic       *               GET                 /api/oauth2/user
      4 = Bearer      ADMIN           *                   /api/oauth2/user
      5 = Bearer      ADMIN           *                   /api/oauth2/client
# ----- - ----------- --------------- ------------------- ------------------------

[logger] 
level = DEBUG
log4j.appenders.0.type = console

# For logging into a file comment the line above and uncomment two lines after this line
# log4j.appenders.0.type = file
# log4j.appenders.0.filename = logs/api.log
```

ABOUT
===

## Angular2 Integration
This software was built with [Angular 2](https://angular.io/) in mind. Client-side library is being build. Come back later.

## Sample Apps
Come back later for sample apps

## Running the Tests
Do `npm install` to install all of the dependencies, ensure that [MongoDB](http://mongodb.org) is installed, then to run the unit tests run:

```
$ npm test
```

## Contributing
Contributions are very welcome! Just send a pull request. Feel free to contact me or checkout my [Github](https://github.com/rintoj) page.

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