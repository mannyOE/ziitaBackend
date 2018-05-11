
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var projectsSchema = new Schema({
    Id                      : String,
    project_name            : {type: String, required:true},
    project_description     : {type: String},
    company_Id              : {type: String},
    manager_Id              : {type:String},
    platform                : {type:Number, default:1},
    team                    : {type:Array},
    platform_name           : {type:String},
    created_time            : String,
    repository_url          : {type: String, default: ""},
    repository_username     : String,
    repository_password     : String,
    ssh_address             : String,
    ssh_username            : String,
    ssh_password            : String,
    ssh_port                : String,
    ssh_passphrase          : String,
    ssh_privatekey          : String,
    project_port            : String,
    docker                  : String,
    bash                    : Array,
    status                  : {type:Number, default: 1}
});



module.exports = mongoose.model('Projects', projectsSchema);