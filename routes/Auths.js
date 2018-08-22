 var cors           = require('cors');
var express        = require('express');
var app            = express();
var functions      = require('../util/functions')
var isLoggedIn     = functions.isLoggedIn;

var authenticate = require('../controllers/authenticate');


module.exports = function (app) {
	// authentication routes
	app.post('/login', authenticate.login);
	app.post('/signup', authenticate.signup);
	app.get('/session',isLoggedIn, authenticate.session);
	app.get('/general/:Id',isLoggedIn, authenticate.get_general);

	app.post('/resend_confirmation', authenticate.resend_confirmation);
	app.post('/recover_password', authenticate.recover_password);
	app.post('/confirm_email', authenticate.confirm_email);

	
	
}