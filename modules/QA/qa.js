var cors        = require('cors');
var express     = require('express');
var app         = express();
var functions   = require('../../util/functions');
var Filter      = require('../../util/Filter');
var User        = require('../../database/models/user.js');
var Projects    = require('../../database/models/projects.js');
var Module      = require('../../database/models/module.js');
var isLoggedIn  = functions.isLoggedIn;
var role = functions.roleCheck;
var shortid     = require('shortid');
var terms       = require('../../util/term');
var Developers  = require('../../database/models/developers.js');
var Duration    = require('../../database/models/duration.js');
var Category    = require('../../database/models/category.js');


module.exports = function(app, io){
  app.post('/modules/qa/update/:Id',(req,res,next)=>{
  isLoggedIn(req,res,next)
},function(req,res){
              console.log(req.body)
              Module.update({Id:req.params.Id}, {$set:{test:req.body.test}}, function(err, num){
                if (err) {
                    console.log("Error Updating Module", err);
                    res.send({
                        status: false,
                        message: "Error Updating Test Case"
                    });
                }else{
                    res.send({
                        status: true,
                        message: "success"
                    })
                }
            });
  })
  //modify modules for Q.A
  app.get('/modules/qa/:project/:Id',(req,res,next)=>{
  isLoggedIn(req,res,next)
}, function(req, res){
      Module.find({project_Id:req.params.project, quaAssId:req.params.Id}, function(err, module){
            res.send({status:true, data:module});
        });
    });


  
};
