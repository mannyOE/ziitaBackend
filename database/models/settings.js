
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var settings = new Schema({
    team_Id: {type: String, required:true, unique: true},
    settings: {type: Object, default: {}},
});


module.exports = mongoose.model('settings', settings);