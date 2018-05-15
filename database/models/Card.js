
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var cardSchema = new Schema({
    cardNo                : {type:String,  required:true},
    ref                   : String,
    type                  : String,
    Auth                  : String,
    name                  : String,
    Id                    : {type:String,  required:true},
    month                 : String,
    year                  : String,
    created_time          : String,
    status                : {type:Number, default: 1}
 
});



module.exports = mongoose.model('Card', cardSchema); 