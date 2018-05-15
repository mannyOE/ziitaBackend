
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var timelineTemp = new Schema({
    project_Id: {type: String, required:true},
    timeline: Array,
    updated_time: Date
});


module.exports = mongoose.model('timelineTemp', timelineTemp);