// server.js
// BASE SETUP
// =============================================================================
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Avoids DEPTH_ZERO_SELF_SIGNED_CERT error for self-signed certs
// call the packages we need
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var events = require('events');
var request = require('requestretry');
var http = require('http');
var path = require('path');
var restful = require('node-restful');
var async = require('async');
var mongoose = restful.mongoose;
var User = require('./models/user');
var Bill = require('./models/bill');

// GLOBAL VARS
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
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Content-Type, token');
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

//ENDPOINT FOR RETURNING
router.route('/getbillsbyuserid/:userid')
    .get(function(req, res) {
        Bill.find({'userid': req.params.userid}, function (err, bills) {
            console.log(bills);
            console.log(req.body);
            if(bills != null) {
                res.send({'bills':bills});
            } else {
                res.send({'bills':bills,'message':"No bills found ["+err+"]"});
            }
        });
    });

//REGISTER MODELS FOR REST API
console.log("[MONGO] Register " + Bill.modelName);
Bill.before('post', authRest).before('put', authRest).before('delete', authRest).before('get',authRest);
Bill.register(app, '/api/' + Bill.modelName);
console.log("[MONGO] Register " + User.modelName);
User.before('put', authRest).before('delete', authRest).before('get',authRest);
User.register(app, '/api/' + User.modelName);

//CHECK TO BE RUN BEFORE AUTHENTICATED END POINTS
function authRest(req, res, next) {
    if(req.get('token')) {
        console.log("---------------------------------------");
        console.log("Request token:"+req.get('token'));
        console.log("Index of key:"+authTokens.indexOf(req.get('token')));
        console.log("---------------------------------------");
        if (authTokens.indexOf(req.get('token')) !== -1) {
            next();
        } else {
            res.status(403).send({
                error: "ACCES DENIED"
            });
        }
    } else {
        next();//TODO REDO AUTH
    }

}

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// SET APP DIRECTORY
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

