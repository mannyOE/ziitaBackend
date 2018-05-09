var express = require('express');
var app = express();
var cors         = require('cors');
var fs = require('fs');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

// require('./core/cron_job');


app.use(bodyParser.json());
app.use(cors());
app.options('*', cors());

var connection = mongoose.connect('mongodb://localhost/ziita_test', function(err) {
    if (err) {
        console.log('database connection error', err);
    } else {
        console.log('database connection successful');
        app.listen(3000, function(){
            console.log('Running on Port 3000');
        });
    }
});

// User management routes
require('./core/user_mgt')(app);
