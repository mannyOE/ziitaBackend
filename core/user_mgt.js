var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());



module.exports = function(app){

	// login page view
	app.post('/login',(req, res)=>{
	    res.send(
	        {
	            name: req.body.username
	        }
	    );
	});

	app.get('/', (req, res)=>{
		res.send('Hey');
	});

}
