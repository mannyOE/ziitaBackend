
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var roles = new Schema({
    Id: String,
    Permission: String,
    roads: [String],
    State: Boolean,

});



module.exports = mongoose.model('roles', roles);
