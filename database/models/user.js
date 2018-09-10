
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
    profile_photo : {type:String},
    profile_thumbnail : String,
    created_time  : String,
    type          : {type:String},
    status        : {type:Number, default: 1},
    confirm       : {type:Boolean, default: false},
    ssn: String,
    affiliate: String,
    cms_password: String,
    cms_username: String,
    cms_type: String,
    mail_addr: String,
    
});



module.exports = mongoose.model('User', userSchema);
