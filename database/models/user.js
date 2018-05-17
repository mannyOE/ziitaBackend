
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var userSchema = new Schema({
    Id            : {type:String, unique:true, required:true},
    first_name    : {type: String},
    last_name     : {type: String},
    Email         : {type:String, unique:true, required:true},
    Password      : {type: String, required:true},
    phone         : String,
    token         : String,
    confirmation_token         : String,
    token_expires : Number,
    profile_photo : {type:String},
    profile_thumbnail : String,
    team_name     : String,
    team_Id       : String,
    created_time  : String,
    skills        : {type:Array, default: []},
    type          : {type:String},
    bio           : {type:String},
    status        : {type:Number, default: 1},
    availability  : {type:Number, default: 1},
    isOnline        : {type:Number, default: 0},
    confirm       : {type:Boolean, default: false},
});



module.exports = mongoose.model('User', userSchema);
