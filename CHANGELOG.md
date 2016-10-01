# mongo-restifier - CHANGE LOG

## 2.0.0

* Added **auto generated id field** if type is `String`. No more hassle of using mongoDB's default ObjectId. (sample id: `c09f8698-5191-494d-a6e0-219f891a687d`)
* Changed **default port** to `5858`
* `userSpace` can not be enabled on schema if `api.oauth2.enabled` is not set to `true`
* Need not specify `model.url` explicitly. Value will be derived from `model.name`.

### BREAKING CHANGES:
* Renamed configuration `api.cors.enabled` to `api.cors.enable`
* Renamed configuration `api.oauth2.enabled` to `api.oauth2.enable`
* Removed `defineModel` and `register` functions in favor of `registerModel`.

So change your code from:
```js
var mongoRestifier = require('./index');
mongoRestifier('./src/api.conf.json')

.registerModel(mongoRestifier.defineModel('Todo', {

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