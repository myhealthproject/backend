// server.js
// BASE SETUP
// =============================================================================
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Avoids DEPTH_ZERO_SELF_SIGNED_CERT error for self-signed certs
// call the packages we need
var express = require('express');
var app = express();
var async = require('async');
var bodyParser = require('body-parser');
var events = require('events');
var request = require('requestretry');
var http = require('http');
var eventEmitter = new events.EventEmitter();
var path = require('path');
var restful = require('node-restful');
var async = require('async');
var mongoose = restful.mongoose;
var User = require('./models/user');
var Bill = require('./models/bill');

// GLOBAL VARS
var containers = [];
var port = process.env.PORT || 80; // set our port
var authTokens = [];

// CONNECT DB
mongoose.connect('mongodb://127.0.0.1:10000/myhealth'); // connect to our database

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); // get an instance of the express Router
app.use('/api', router);
//MiddleWare
router.use(function(req, res, next) {
    // do logging
    console.log('[API] Something is happening:');
    console.log(req.method + req.url);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next(); // make sure we go to the next routes and don't stop here
});

router.route('/login')
    .post(function(req, res) {
        User.findOne({'uname': req.body.uname}, function (err, user) {
            console.log(user);
            console.log(req.body);
            if(user != null) {
                console.log(user.password + "-" + req.body.password);
                if(user.password === req.body.password) {
                    var key = generateKey();
                    authTokens.push(key);
                    res.send({'success':true, 'key':key, 'user':user});
                } else {
                    res.send({'success':false});
                }
            } else {
                res.send({'success':false,'message':"User not found ["+err+"]"});
            }
        });
    });

var models = [User, Bill];
models.forEach(function(model) {
    console.log("[MONGO] Register " + model.modelName);
    model.before('post', authRest).before('put', authRest).before('delete', authRest).before('get',authRest);
    model.register(app, '/api/' + model.modelName);
});

function authRest(req, res, next) {
    if(req.headers['token'] !== null) {
        console.log("---------------------------------------");
        console.log(req.headers['token']);
        console.log("---------------------------------------");
        if (authTokens.indexOf(req.headers['token']) !== null) {
            next();
        } else {
            res.status(403).send({
                error: "ACCES DENIED"
            });
        }
        next();//TODO REDO AUTH
    }
}

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

app.use(express.static(__dirname + '/app'));
// START THE SERVER
// =============================================================================
app.listen(port);
console.log('[SERVER] Listening on port ' + port);

// Misc. Functions
function generateKey() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
    });
    return uuid;
}

