
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var Skills = new Schema({
    name        : {
        type: String,
        required: true,
        unique:true
    }});



module.exports = mongoose.model('Skills', Skills);
