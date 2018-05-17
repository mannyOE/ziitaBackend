
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

if(is_ssl) {
    if(hostname == "test.zeedas.com"){
        console.log("hostname tested = ", hostname);
        var privateKey = fs.readFileSync('/etc/letsencrypt/live/test.zeedas.com-0001/privkey.pem', 'utf8');
        var certificate = fs.readFileSync('/etc/letsencrypt/live/test.zeedas.com-0001/cert.pem', 'utf8');
    }else if(hostname == "demo.zeedas.com"){
        console.log("hostname demo = ", hostname);
        var privateKey = fs.readFileSync('/etc/letsencrypt/live/demo.zeedas.com/privkey.pem', 'utf8');
        var certificate = fs.readFileSync('/etc/letsencrypt/live/demo.zeedas.com/cert.pem', 'utf8');
    }else{
        console.log("hostname others = ", hostname);
        var privateKey = fs.readFileSync('/etc/letsencrypt/live/zeedas.com-0001/privkey.pem', 'utf8');
        var certificate = fs.readFileSync('/etc/letsencrypt/live/zeedas.com-0001/cert.pem', 'utf8');
    }
    var credentials = {key: privateKey, cert: certificate};
    var https       = require('https').Server(credentials, app);
    var io          = require('socket.io')(https)
}else{
    var io = require('socket.io')(http);
}

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
require('./modules/Authentication/Auth')(app);

//  Profile ====================================================================
require('./modules/Profile/Profile')(app);
require('./modules/users/user_management')(app, io);

//  Devs   ====================================================================
require('./modules/Developers/developers')(app);

//  Wallet   ====================================================================
require('./modules/wallet/Wallet')(app);

//  Projects   ====================================================================
require('./modules/Projects/projects')(app, io);
require('./modules/module/module')(app, io);

//Messagin =======================================================================
require('./modules/socket/messaging')(app, io);

//Terminal =======================================================================
require('./modules/socket/term')(app, io);

//  Skills   ====================================================================
require('./modules/skills/skills')(app);

//  Notifications   ====================================================================
require('./modules/notification/notification')(app, io);

//  Docker   ====================================================================
require('./modules/docker/docker')(app);
//  admin   ====================================================================
require('./modules/admin/admin')(app);
//  QA   ====================================================================
require('./modules/QA/qa')(app);
//EA ===============================================================================
require('./modules/Ea/ea')(app);
//  Subscriptions   ====================================================================
// require('./modules/subs/subscriptions');

//  Bash   ====================================================================
//require('./modules/bash/bash')(app);


// require('./database/seeders/index.js');
// launch ======================================================================
if(is_ssl) {
    https.listen(port);
}else{
    http.listen(port);
}

console.log('listening on localhost:' + port+ (is_ssl?" (SSL)":""));
