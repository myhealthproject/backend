// app/models/challenge.js


var restful = require('node-restful');
var mongoose = restful.mongoose;
var Schema       = mongoose.Schema;

var UserSchema   = new Schema({
    uname: {type: 'String', required: true},
    fname: {type: 'String', required: true},
    lname: {type: 'String', required: true},
    password: {type: 'String', required: true}
});

var User = new restful.model("User",UserSchema).methods(['get', 'post', 'put', 'delete']);
User.shouldUseAtomicUpdate = false;

module.exports = User;