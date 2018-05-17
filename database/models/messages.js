
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var Messages = new Schema({
    Id:{
        type: String,
        required: true
    },
    recipient    : {
        type: String,
        required: true
    },
    sender        : {
        type: String,
        required: true
    },
    status         : {
        type: Number,
        default: 1
    },
    read         : {
        type: Number,
        default: 0
    },
    message        : {
        type: String,
        required: true
    },
    time_stamp     : {
          type: Number,
          required: true
      },
    updated_stamp     : {
            type: Number,
            required: true
        }
});



module.exports = mongoose.model('Messages', Messages);
