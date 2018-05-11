var cors       = require('cors');
var express    = require('express');
var app        = express();
var functions  = require('../../util/functions');
var Filter     = require('../../util/Filter');
var Skills     = require('../../database/models/skills.js');
var isLoggedIn = functions.isLoggedIn;
var shortid    = require('shortid');



module.exports = function (app) {
  app.get('/skills', function (req, res) {
    Skills.find({}, function (err, skills) {
      if (err) {
        res.send({
          status: false,
          message: "error getting skills",
          error: err
        });
      } else {
        res.send({
          status: true,
          data: skills
        });
      }

    });

  });

  app.post('/skills', function (req, res) {
    /** Add a new skill */

    // sug1 = ['vb.net', 'javascript', 'jquery', 'android' , 'php',
    //   'c++', 'python', 'ios', 'django', 'linux','html5', 'r',
    //   'node.js', 'asp.net', 'linq', 'perl','c#', 'java','iphone',
    //   'html', 'css', 'objective-c','ruby-on-rails', 'c','ruby', 'regex',
    //   'neo4j','angularJS','scala','Erlang','wordpress', 'delphi', 'vue'];

    // sug1.forEach(function(data){

      Skills.create({name:req.body.skill}, function (err, skill) {

          if (err) {
        res.send({
          status: false,
          error: err
        });
      } else {
        res.send({
          status: true,
          message: skill
        });
      }

      });

    // });

  });
  app.get('/skills/:skill', function (req, res) {
    /** Add a new skill */

    // sug1 = ['vb.net', 'javascript', 'jquery', 'android' , 'php',
    //   'c++', 'python', 'ios', 'django', 'linux','html5', 'r',
    //   'node.js', 'asp.net', 'linq', 'perl','c#', 'java','iphone',
    //   'html', 'css', 'objective-c','ruby-on-rails', 'c','ruby', 'regex',
    //   'neo4j','angularJS','scala','Erlang','wordpress', 'delphi', 'vue'];

    // sug1.forEach(function(data){

    Skills.findOneAndRemove({_id: req.params.skill}, function(err, skill){
            // console.log({docker})
            if(err){
                res.send({status: false, message: err})
            } else{
                res.send({status: true, message: 'successfully deleted skill'})
            }
        } )

    // });

  });

};
