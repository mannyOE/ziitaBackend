
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var walletSchema = new Schema({

    balance                : {type:Number, default: 0},
    earnings                : {type:Number, default: 0},
    payouts                : {type:Number, default: 0},
    pending                : {type:Number, default: 0},
    Id                     : String,
    created_time           : String,
    create_developers       : String,
    blocked                : {type: Boolean, default: false},

});



module.exports = mongoose.model('Wallet', walletSchema);
