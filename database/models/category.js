
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var categorySchema = new Schema({
     category_name           : String,
     team_Id                 : String,
     Id                      : String,
     skills                  : Array,
    created_time             : String
 
});



module.exports = mongoose.model('Category', categorySchema);