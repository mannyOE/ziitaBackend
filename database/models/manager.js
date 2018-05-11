
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var managerSchema = new Schema({
    Id            : {type:String, unique:true, required:true},
    first_name    : String,
    last_name     : String,
    profile_photo : String,
    profile_thumbnail : String,
    team_Id       : {type: String},
    created_time  : String,
    bio           : String,
    type          : String,
    availability  : {type:Number, default: 1},
    status        : {type:Number, default: 1}
});



module.exports = mongoose.model('Manager', managerSchema);