var settings = require('./settings');
var mongoose = require('mongoose');




// connect to mongoose

mongoose.connect('mongodb://localhost/application');

var db = mongoose.connection;