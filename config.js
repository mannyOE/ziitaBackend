  var express      = require('express');
  var app          = express();
  var cors         = require('cors');
  var jwt          = require('jsonwebtoken'); 
  var cookieParser = require('cookie-parser');
  var bodyParser   = require('body-parser');
  var handlebars   = require('express3-handlebars');
  var url = require('url');

//mz


  module.exports   = function(app){



  app.engine('html', handlebars({defaultLayout: 'main', extname: ".html",layoutsDir: __dirname + '/view/main'}));

	app.set('view engine', 'html');

	app.set('views', __dirname + '/view');

  app.set('superSecret', "IloveZeedas");

	app.use(express.static(__dirname + '/public'));
  

  // ---------------------------------------------------------

 
  app.use(cors());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use(bodyParser.json());

};




            
  