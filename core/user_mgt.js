var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());



module.exports = function(app){

	// login script
	app.post('/login',(req, res)=>{
	    res.send(
	        {
	            name: req.body.username
	        }
	    );
	});


	// signup script
	app.post('/createAccount', (req, res)=>{
		
	});

	app.get('/', (req, res)=>{
		res.send('Hey');
	});

}
