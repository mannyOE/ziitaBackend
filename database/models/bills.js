
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var billsSchema = new Schema({

    tag                   : {type: String},
    Id                    : {type:String},
    amount                : {type:Number},
    created_time          : {type:String},
    last_bill             : {type:String},
    status                : {type:String},
    paid_time             : {type:String}  
});



module.exports = mongoose.model('Bills', billsSchema);