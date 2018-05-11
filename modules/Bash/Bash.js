var cors           = require('cors');
var express        = require('express');
var app            = express();
var functions      = require('../../util/functions');
var Bash           = require('../../database/models/bash.js');
var isLoggedIn    = functions.isLoggedIn;


module.exports = function (app) {


  app.get('/getBash/:Id', isLoggedIn, function (req, res) {
    var search = {};
    if(req.params.Id != undefined){
        search.Id = req.params.Id;
    }
    Bash.find(search, function (err, Bash) {
      if (err) {
        res.send({
          status: false,
          message: "Error fetching bash file"
        });
      }

      res.send({
        status: true,
        data: Bash
      });

    });

  });


  app.post('/updateBash', isLoggedIn, function (req, res) {
    var search = {};
    if(req.body.Id != undefined){
        search.Id = req.body.Id;
    }
    Bash.update({Id: req.body.Id},{$set:req.body} ,function (err, Bash) {
      if (err) {
        res.send({
          status: false,
          message: "Error updating bash"
        });
      }

      res.send({
        status: true,
        data: Bash
      });

    });

  });



}
