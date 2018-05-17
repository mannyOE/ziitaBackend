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
  app.post('/modules/qa/update/:Id',(req,res,next)=>{
  isLoggedIn(req,res,next,'manageQa')
},function(req,res){
             var id = req.params.Id || 0;
             // var test = req.body.test || [];
             if(id===0 ){
               console.log('no test found');
                   res.send({
                        status: false,
                        message: "Error Updating Test Case"
                    });
                return;
             }
              Module.update({Id:req.params.Id}, {$set:{test:req.body.test}}, function(err, num){
                if (err) {
                    console.log("Error Updating Module", err);
                    res.send({
                        status: false,
                        message: "Error Updating Test Case"
                    });
                }else{
                  console.log(num);
                    res.send({
                        status: true,
                        message: "success"
                    })
                }
            });
  })



  //modify modules for Q.A
  app.get('/modules/qa/:project/',(req,res,next)=>{
  isLoggedIn(req,res,next, 'manageQa')
}, function(req, res){
    var id = req.params.project || -1;
    if(id===-1){
        res.send({status:false, data:[]});
        return;
    }
      Module.find({project_Id:id}, function(err, module){
            res.send({status:true, data:module});
        });
    });
  app.get('/modules/qa/stage/:Id',(req,res,next)=>{
  isLoggedIn(req,res,next, 'manageQa')
}, function(req, res){
    var id = req.params.Id || -1;
    if(id===-1){
        res.send({status:false, data:[]});
        return;
    }
      Module.find({Id:id}, function(err, module){

            if(module){
             if(req.body.reject==1)
             {
                module.stage = 0;
                module.status = 4;
              }
              else{
              module.status = 3;
              module.stage  = 2;
            }
            }
            module.save();
        });
    });

    app.post('/tests/:Id', (req, res)=>{
      // console.log(req.body.test);
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
    });

    app.get('/modules/qa/allMods/:Id',(req, res, next)=>{
      isLoggedIn(req, res, next,'manageQa')
    }, (req, res)=>{
      // console.log(req.body.test);
      Module.find({project_Id:req.params.Id}, function(err, data_modules){
        if (err) {
          // console.log("Error Updating Module", err);
          res.send({
            status: false,
            message: "No Modules Found"
          });
        }else{
          functions.getUserById().then(function(users) {
              let modules = [];
              for (let i in data_modules) {
                  modules[i] = data_modules[i].toJSON();
                  if(!modules[i].developer_Id || !users[modules[i].developer_Id]){
                      continue;
                  }
                  modules[i].developer = users[modules[i].developer_Id].first_name + " " +users[modules[i].developer_Id].last_name;
                  modules[i].developer_image = users[modules[i].developer_Id].profile_thumbnail;
              }

              res.send({
                  status: true,
                  message: "success",
                  data: modules.filter(m =>{
                      if((m.status === 2 && m.on_ea == 0) || m.status === 3){
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

    app.post('/modules/qa/complete',(req, res, next)=>{
      isLoggedIn(req, res, next,'manageQa')
    }, (req, res)=>{
      // console.log(req.body.test);
      var query;
      if(req.body.goto === 0){
        query  = {$set: {status: 2}};
      }
      if(req.body.goto === 1){
        query  = {$set: {status: 3}};
      }
      Module.update({Id: req.body.Id}, query, (err, result)=>{
        if(!err){
          res.send({
            status: true,
            message: "Module Completed",
          });
        }
      });


    });

    app.get('/user_permissions',(req, res, next)=>{
      isLoggedIn(req, res, next)
    }, (req, res)=>{
      // console.log(req.body.test);
      roles.find({Id: req.decoded.user}, (err, perms)=>{
        // if no permissions, set default permissions

          res.send({
            status: true,
            message: "Retrieval Complete",
            dis_user: perms,
          });

      });
    });

    function calculateStatistics(modules){
      var projectStat = {
        passed: 0,
        failed: 0,
        untested: 0,
        retest: 0,
        pending: 0
      };
      var pro = [];
      var modulesStat = [];
      async.each(modules, (mod, callback)=>{
        projectStat.passed = projectStat.passed + mod.test.filter(e => e.status === 0).length;
        projectStat.failed = projectStat.failed + mod.test.filter(e => e.status === 1).length;
        projectStat.untested = projectStat.untested + mod.test.filter(e => e.status === 2).length;
        projectStat.retest = projectStat.retest + mod.test.filter(e => e.status === 3).length;
        projectStat.pending = projectStat.pending + mod.test.filter(e => e.status === 4).length;

        modulesStat.push({
          module: mod.Id,
          passed: mod.test.filter(e => e.status === 0).length,
          failed: mod.test.filter(e => e.status === 1).length,
          untested: mod.test.filter(e => e.status === 2).length,
          retest: mod.test.filter(e => e.status === 3).length,
          pending: mod.test.filter(e => e.status === 4).length,
          completed: mod.status === 3
        });
        callback();
      }, (err)=>{
        if(err){console.log("Failed");}
      });
      pro = [
        projectStat.passed,
        projectStat.failed,
        projectStat.untested,
        projectStat.retest,
        projectStat.pending,
      ];
      return {
        project: pro,
        modules: modulesStat
      };
    }


};
