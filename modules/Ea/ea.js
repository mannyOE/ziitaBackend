var cors        = require('cors');
var express     = require('express');
var app         = express();
var functions   = require('../../util/functions');
var Filter      = require('../../util/Filter');
var User        = require('../../database/models/user.js');
var Projects    = require('../../database/models/projects.js');
var Module      = require('../../database/models/module.js');
var roles       = require('../../database/models/roles.js');
var isLoggedIn  = functions.isLoggedIn;
var role = functions.roleCheck;
var shortid     = require('shortid');
var terms       = require('../../util/term');
var Duration    = require('../../database/models/duration.js');
var Category    = require('../../database/models/category.js');
var async     = require('async');


module.exports = function(app, io){
  //modify modules for Q.A
    app.post('/method/:Id', (req, res)=>{
      // console.log(req.body.test);
      Module.findOne({Id:req.params.Id}, function(err, num){
        if (err) {
          console.log("Error Updating Module", err);
          res.send({
            status: false,
            message: "Error Updating Test Case"
          });
        }else
          num.method = req.body.test;
          num.save();
          res.send({
            status: true,
            message: "success"
          })
        });
    });

    app.get('/modules/ea/allMods/:Id',(req, res, next)=>{
      isLoggedIn(req, res, next,'manageQa')
    }, (req, res)=>{
      // console.log(req.body.test);
      Module.find({project_Id:req.params.Id}, function(err, modules){
        if (err) {
          // console.log("Error Updating Module", err);
          res.send({
            status: false,
            message: "No Modules Found"
          });
        }else{
            functions.getUserById().then(function(users) {
                for (let i in modules) {
                    if(!modules[i].developer_Id || users[modules[i].developer_Id]){
                        continue;
                    }
                    modules[i].developer = users[modules[i].developer_Id].first_name + " " + users[modules[i].developer_Id].last_name;
                    modules[i].developer_image = users[modules[i].developer_Id].profile_thumbnail;
                }

                res.send({
                    status: true,
                    message: "success",
                    data: modules.filter(m =>{
                        if((m.status == 2 && m.on_ea === 1) || (m.status == 3 && m.ea == 1)){
                            return true;
                        }
                        return false;
                    }),
                    statistics: calculateStatistics(modules.filter(e => e.status !== 1))
                })
            });
        }
      });
    });



    function calculateStatistics(modules){
      var pro = [];
      var modulesStat = [];
      var passed = 0;
      var failed = 0;
      var Untested = 0;
      var total = 0;
      async.each(modules, (modu, callback)=>{

             modu.method.forEach(method=>{
               var mod_stat = {
                 passed: 0,
                 failed: 0,
                 untested: 0,
                 total: 0,
                 module: modu.Id,
               };
            method.method_test.forEach(test=>{
                  total += 1;
                 if(test.status==1){
                    passed+= 1;
                    mod_stat.passed +=1;
                      mod_stat.total +=1;
                  }
                  else if(test.status == 2){
                    failed += 1;
                    mod_stat.failed +=1;
                    mod_stat.total +=1;
                  }
                  else if(test.status == 0){
                    Untested += 1;
                    mod_stat.untested +=1;
                    mod_stat.total +=1;
                  }
            })
            modulesStat.push(mod_stat);

      })
        callback();
      }, (err)=>{
        if(err){console.log("Failed");}
      });
      pro = [
       passed,
       failed,
       Untested,
      ];
      return {
        project: pro,
        modules: modulesStat,
      };
    }


};
