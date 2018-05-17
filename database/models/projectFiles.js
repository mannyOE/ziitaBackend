
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var Files = new Schema({
    file_Id: String,
    file_name: String,
    file_original: String,
    file_ext: String,
    file_url: String,
    file_source: String,
    shared_with: [String],
    file_project: String,
    isGeneral: {type: Boolean, default: false},
    file_uploaded: {type: Date, default: Date.now },

});



module.exports = mongoose.model('Files', Files);
