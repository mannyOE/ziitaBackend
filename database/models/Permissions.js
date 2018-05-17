
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var Permissions = new Schema({
    Permission: String,
    default_client: Boolean,
    default_pm: Boolean,
    default_dev: Boolean

});



module.exports = mongoose.model('Permissions', Permissions);
