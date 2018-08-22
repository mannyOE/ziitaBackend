
var is_ssl = false;
var express       = require('express');
var fs       = require('fs');
var app           = express();
var auth          = express();
var passport      = require('passport');
var mongoose      = require('mongoose');
var configDB      = require('./database/config/database.js');
var autoIncrement = require('mongoose-auto-increment');
var jwt           = require('jsonwebtoken');
var port          = process.env.PORT || 2300;
global.hostname   = process.env.HOSTNAME || "18.221.93.144";
hostname = global.hostname.toLowerCase();
global.hostport   = port;
global.hosturl    = "https://"+hostname+":"+hostport;
console.log("URL: ", hosturl);

var http          = require('http').Server(app);
    var io = require('socket.io')(http);

//  DB Connection =============================================================
var connection = mongoose.connect(configDB.staging, {useMongoClient: true}, function(err) {
    if (err) {
        console.log('database connection error', err);
    } else {
        console.log('database connection successful');
    }
});

autoIncrement.initialize(connection);



// Config  =====================================================================
require('./config')(app,auth);

// Auth   ======================================================================
require('./routes/Auths')(app);

//  Profile ====================================================================
require('./routes/Users')(app);

//  Wallet   ====================================================================
require('./routes/Wallet')(app);


//Messagin =======================================================================
require('./routes/Messaging')(app, io);


//  Notifications   ====================================================================
require('./routes/Notifications')(app, io);



// launch ======================================================================
if(is_ssl) {
    https.listen(port);
}else{
    http.listen(port);
}

console.log('listening on localhost:' + port+ (is_ssl?" (SSL)":""));
