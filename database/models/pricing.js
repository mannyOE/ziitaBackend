
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var pricesSchema = new Schema({

    range_min                : {type:Number, default: 0},
    range_max                : {type:Number, default: 0},
    naira_per_month                : {type:Number, default: 0},
    dollar_per_month                : {type:Number, default: 0},
    naira_per_hour                : {type:Number, default: 0},
    dollar_per_hour                : {type:Number, default: 0}
});



module.exports = mongoose.model('Prices', pricesSchema);

