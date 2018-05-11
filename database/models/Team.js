
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var teamSchema = new Schema({
    Id            : {type:String, unique:true, required:true},
    first_name    : {type: String},
    last_name     : {type: String},
    profile_photo : String,
    profile_thumbnail : String,
    team_name     : {type:String},
    Email         : {type:String, unique:true, required:true},
    created_time  : String,
    status        : {type:Number, default: 1}
});



module.exports = mongoose.model('Team', teamSchema);
