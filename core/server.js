var express = require('express');
var app = express();
var headers = require('./headers');
var fs = require('fs');
var bodyParser = require('body-parser');
// require('./core/cron_job');


app.use(bodyParser.json());


app.listen(3000, function(){
    console.log('Running on Port 3000');
});

// Home Route
app.get('/', function(req, res){
    res.sendFile({
        name: "Central",
        heading: "Welcome to Central"
    });  
});