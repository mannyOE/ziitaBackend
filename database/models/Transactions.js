
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;
var mongoosePaginate = require('mongoose-paginate');

var transactionsSchema = new Schema({

    tag                   : {type: String},
    Id                    : {type:String},
    type                  : {type:String},
    amount                : {type:String},
    created_time          : {type:String},
    updated				  : { type: String, default: Date.now },
});
transactionsSchema.plugin(mongoosePaginate);



module.exports = mongoose.model('Transactions', transactionsSchema);