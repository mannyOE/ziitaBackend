
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var roles = new Schema({
    Id: String,
    Permission: [],
});



module.exports = mongoose.model('roles', roles);
