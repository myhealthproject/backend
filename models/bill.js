/**
 * Created by hartger on 28/09/16.
 */
var restful = require('node-restful');
var mongoose = restful.mongoose;
var Schema       = mongoose.Schema;
var User = require('./user');

var BillSchema   = new Schema({
    userid: { type: Schema.Types.ObjectId, ref: 'User', required: true},
    status: {type: 'String', enum:['paid','unpaid'], required: true},
    lines: [{
        description: {type: 'String', required: true},
        code: {type: 'String', required: true},
        price: {type: 'Number', required: true}
    }]
});

var Bill = new restful.model("Bill",BillSchema).methods(['get', 'post', 'put', 'delete']);
Bill.shouldUseAtomicUpdate = false;

module.exports = Bill;