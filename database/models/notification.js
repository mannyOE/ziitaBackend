var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var notificationSchema = new Schema({
    Id:{
        type: String
    },
    message: {
        type: String,
    },
    time: {
        type: String,
    },
    status: {
        type   :Number,
        default:1
    },
    type: {
        type: Number,
        default: 1
    }


})

module.exports = mongoose.model('Notification', notificationSchema)
