 var cors           = require('cors');
var express        = require('express');
var app            = express();
var functions      = require('../util/functions')
var isLoggedIn     = functions.isLoggedIn;

var UserMgt = require('../controllers/User_mgt');

module.exports = function (app) {

	// shouldnt be here
	app.post('/Invite', UserMgt.invite_user);
	app.get('/get_clients', isLoggedIn,UserMgt.get_clients);
	// save client
	app.post('/save-clients', isLoggedIn,UserMgt.save_clients);
	
}