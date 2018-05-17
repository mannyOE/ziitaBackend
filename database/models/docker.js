var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var dockerSchema = new Schema({

    Id                      : {type:String,  required:true},
    name                    : String,
    content                 : String,
    image                   : String,
    team_Id                 : String,

});



module.exports = mongoose.model('Docker', dockerSchema);
