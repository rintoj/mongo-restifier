# mongo-restifier - CHANGE LOG

## 2.4.0

* Feature: Enable configuration based static content serve
* Fix: Bypass auth for `OPTIONS /api/**`
* Breaking Change: `.properties` (ini format) configuration is no longer supported.

## 2.3.8
* Bug Fix: user is not getting attached to records

## 2.3.7

* Bug fix: Make user model not strict

## 2.3.6

* Fix: Make `password` non mandator field for creating a user

## 2.3.5

* Feature: Add option to make a schema not strict.
* Feature: Set `strict: false` on user schema

## 2.3.4

* Feature: Implement `userField.ignore` to `save` function as well

## 2.3.3

* Feature: Add `picture` field to user model
* Feature: Add `ignore` field to user space

```js
{ userSpace: {field: "_user", ignore: ["role1"]} }
```

## 2.3.2

* Fix: Can't use string pipes as parseInt is used on port.

## 2.3.1

* Upgrade: Express package

## 2.3.0
* Feature: Add callback function to startup

```js
mongoRestifier(...)

  .registerModel(...)
  ...

  .startup(function (app, properties, mongoose) {
    // your code
  })
```

## 2.2.0
* Feature: Add property transformation function

```js
mongoRestifier('./api.conf.json', function (properties) {
  properties.api.port = process.env.port || 3000
  return properties
})
```

## 2.1.2

* Bug Fix: Replace `let` with `var` to support older versions of node

## 2.1.1

* Bug Fix: Replace back quote with single quote to support older versions of node

## 2.1.0

* Locked down versions of all dependencies

## 2.0.4

* Exposing history service through generic service end point.

```
    var mongoRestifier = require('mongo-restifier');
    var instance = mongoRestifier('./config.json');
    var todoService = instance.models.todo.service;
    var todoHistoryService = todoService.historyService;
```

## 2.0.3

* Bug fix: DELETE /<name>/<id> wasn't deleting the history for collections with history set to true

## 2.0.2

* Bug fix: timestamps were not properly being generated

## 2.0.1

* `fields` filter is applied to history results
* Bug fix: Sorting logic in history service

## 2.0.0

* Added **auto generated id field** if type is `String`. No more hassle of using mongoDB's default ObjectId. (sample id: `c09f8698-5191-494d-a6e0-219f891a687d`)
* Changed **default port** to `5858`
* `userSpace` can not be enabled on schema if `api.oauth2.enabled` is not set to `true`
* Need not specify `model.url` explicitly. Value will be derived from `model.name`.
* Added **history** feature. A schema can store history if `history` flag is set to `true`. New apis are added to manage versions.

### BREAKING CHANGES:
* Renamed configuration `api.cors.enabled` to `api.cors.enable`
* Renamed configuration `api.oauth2.enabled` to `api.oauth2.enable`
* Removed `defineModel` and `register` functions in favor of `registerModel`.

So change your code from:
```js
var mongoRestifier = require('./index');
mongoRestifier('./src/api.conf.json')

.register(mongoRestifier.defineModel('Todo', {

    // api end point
    url: '/todo',

    // schema definition - supports everything that mongoose schema supports
    schema: {
        ...
    },
    ...
}))

.startup();
```

To:
```js
var mongoRestifier = require('./index');
mongoRestifier('./src/api.conf.json')

.registerModel({

    // name (mandatory)
    name: 'Todo',

    // api end point
    url: '/todo',

    // schema definition - supports everything that mongoose schema supports
    schema: {
        ...
    },
    ...
})

.startup();
```

## 1.0.0

* Initial version