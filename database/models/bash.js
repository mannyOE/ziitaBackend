
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var bashSchema = new Schema({
    Id                      : {type:String,  required:true},
    teamId                  : String,
    general                 : {type: Number, default: 0},
    name                    : String,
    content                 : String,

});



module.exports = mongoose.model('Bash', bashSchema);
