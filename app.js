var mongoRestifier = require('./index');
var storySerivce = require('./services/story-service');

mongoRestifier('./conf/mongo-restifier.conf.json')
    .register(storySerivce)
    .startup();