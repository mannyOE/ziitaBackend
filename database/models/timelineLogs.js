
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var timelineLogs = new Schema({
    project_Id: {type: String, required: true},
    module_Id: {type: String, required: true},
    sprint: {type: Number, required: true, default: 1},
    date: {type: Date, default: Date.now},
    user_Id: {type: String, default: 0},
    type: {type: String, default: 0},
    issue: String,
    updated_time: Date
});


module.exports = mongoose.model('timelineLogs', timelineLogs);