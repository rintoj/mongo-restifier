var mongoRestifier = require("./index");
var storySerivce = require("./services/story-service");

mongoRestifier.register(storySerivce);