
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var duration = new Schema({
    developer_Id: {type: String, required:true},
    module_Id: {type: String},
    date: {type: Date, default: Date.now},
    duration: Number,
    updated_time: Date
});


module.exports = mongoose.model('duration', duration);