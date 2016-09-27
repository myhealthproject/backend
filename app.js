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

// GLOBAL VARS
var containers = [];
var port = process.env.PORT || 80; // set our port

// CONNECT DB
mongoose.connect('mongodb://127.0.0.1:27017/myhealth'); // connect to our database

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

router.route('/compile')
    .post(function(req, res) {
        request({
            url: req.body.url,
            json: true,
            method: 'POST',
            maxAttempts: 3,
            retryDelay: 2000,
            body: {
                code: req.body.code.trim()
            }
        }, function(err, httpResponse, body) {
            if (err) {
                console.log(err);
                res.status(500).json({
                    message: err
                });
            } else {
                res.json({
                    message: body.message
                });
            }
        });
    });

var models = [User];
models.forEach(function(model) {
    console.log("[MONGO] Register " + model.modelName);
    model.before('post', authRest).before('put', authRest).before('delete', authRest);
    model.register(app, '/api/' + model.modelName);
});

function authRest(req, res, next) {
    console.log("---------------------------------------");
    console.log(req.body);
    console.log("---------------------------------------");
    //if (req.body.token == "supersecret") {
    //    next();
    //} else {
    //    res.status(403).send({
    //        error: "ACCES DENIED"
    //    });
    //}
    next();//TODO REDO AUTH
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
    return uuid.v4();
}

