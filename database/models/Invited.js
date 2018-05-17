
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var invitedSchema = new Schema({
	Id            : String,
    first_name    : {type: String},
    last_name     : {type: String},
    Email         : {type:String, unique:true, required:true},
    team_Id       : {type: String},
    created_time  : String,
    type          : {type:Number},
    status        : {type:Number, default: 1}
});



module.exports = mongoose.model('Invited', invitedSchema);