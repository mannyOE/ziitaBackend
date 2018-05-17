
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var counter = new Schema({
    _id: {type: String, unique:true, required:true},
    sequence_value: Number
});


module.exports = mongoose.model('counter', counter);