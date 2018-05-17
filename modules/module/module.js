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
var Duration    = require('../../database/models/duration.js');
var Category    = require('../../database/models/category.js');
var execSh      = require("exec-sh");
var fs          = require('fs');

module.exports = function(app, io){



    function assign_module(data, res){
        Module.update({Id:data.moduleId}, {$set:{developer_Id: data.devId}}, function(err, module){

            Module.findOne({Id:data.moduleId}, function(err, module){

                Projects.findOne({Id: module.project_Id}, (err, project)=>{
                    module.project_name = project.project_name;

                        data = {
                            Id: module.develper_Id,
                            message: `You have been assigned to ${module.module_name.toUpperCase()} on ${project.project_name.toUpperCase()}`
                        }
                        dataProject = {
                            Id: project.manager_Id,
                            message: `You assigned ${module.module_name.toUpperCase()} to developers on ${project.project_name.toUpperCase()}`
                        }
                        functions.Notify(data, io)
                        functions.Notify(dataProject, io)
                    functions.send_mail(module, "module_assigned_alert");


                    if(res)
                        res.send({status:true, message:"Module Assigned"});

                })
            });
        });
    }
    app.post('/modules/methods/:Id', (req, res)=>{
      // console.log(req.body.test);
      var obj;
      if(req.body.finish){
        obj={method:req.body.methods,stage:0}
      }
      else{
        obj = {method:req.body.methods};
      }
      Module.update({Id:req.params.Id}, {$set:obj}, function(err, num){
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
    app.post('/create_module',function(req, res, next){
  isLoggedIn(req, res, next, 'manageModules');
},  function(req, res){

        var finished = req.body.finished;
        let is_ea = req.body.is_ea?true:false;
        delete req.body.is_ea;

        var saveModule = function(module){
            //CHECK WHETHER THE USER ACTUALLY CLICKED ON FINISHED
            if(finished){
                if(module.ea){
                    if(is_ea){
                        module.on_ea = 0;
                    }else{
                        module.on_ea = 1;
                    }

                }
                else{
                    module.on_ea = 0;
                }
            }

            delete module.finished;
            delete module._id;

            var time = new Date().getTime();
            req.body.updated_time = time;

            if(!module.Id){
                module.created_time = time;
                module.Id = shortid.generate();

                Module.create(module, function (err, module) {

                    if (err) {
                        res.send({
                            status: false,
                            message: "Error creating module"
                        });
                    } else {
                        alertDeveloper(module);
                        res.send({
                            status: true,
                            message: "success",
                            Id: req.body.Id
                        })
                    }

                });

            }else{
                Module.update({Id:module.Id}, {$set:module}, function(err, num){
                if (err) {
                    console.log("Error Updating Module", err);
                    res.send({
                        status: false,
                        message: "Error Updating module"
                    });
                }else{
                    alertDeveloper(module);
                    res.send({
                        status: true,
                        message: "success",
                        Id: req.body.Id
                    })
                }
                });
            }
        }

        var alertDeveloper = function(module){
            if(!finished){
                return;
            }
            if(module.developer_Id){
                module.user_Id = module.developer_Id;
                functions.send_mail(module, "module_assigned_alert");
            }
        }

        saveModule(req.body, req.body.finished);


    });

    // app.post('/')

    app.post('/edit_module/:Id', function(req, res, next){
  isLoggedIn(req, res, next, 'manageModules');
}, function(req, res){

        req.body.updated_time = new Date().getTime();

        Module.update({Id:req.params.Id}, {$set:req.body}, function(err, num){

          if(err){
            res.send({status:false, message:"Error Editing Module"});
            console.log(err)
            return;
          }
           res.send({status:true, message:"Module Edited Successfully", data:req.body});

            });
    });


    app.post('/assign/:Id',function(req, res, next){
  isLoggedIn(req, res, next, 'manageModules');
},  function(req, res){

        var data = {};

        data.moduleId = req.params.Id;
        data.devId = req.body.Id;

        assign_module(data, res);

    });

    app.get('/delete/m/:Id',function(req, res, next){
  isLoggedIn(req, res, next, 'manageModules');
}, function(req, res){

        Module.findOne({Id:req.params.Id}, function(err, module){

            if (!module) {
                res.send({status:false, message:"Module not found"});
                return;
            }
             Projects.findOne({Id: module.project_Id}, (err, project)=>{

                 Module.remove({Id:req.params.Id}, function(err, num){

                module.project_name = project.project_name;

                // data = {
                //     Id: module.developer_Id,
                //     message:   `You rejected Module ${module.module_name.toUpperCase()} on ${project.project_name.toUpperCase()}`
                // };
                dataProject={
                    Id: project.manager_Id,
                    message: `You deleted Module ${module.module_name.toUpperCase()} on Project ${project.project_name.toUpperCase()}`
                }
                // functions.Notify(data, io)
                functions.Notify(dataProject, io)

                functions.send_mail(module,"module_delete_alert");

                res.send({status:true, message:"module removed"});

            });
                })


        });
    });

    app.get('/module/submit/:Id', function(req, res, next){
  isLoggedIn(req, res, next);
}, function(req, res){

        Module.findOne({Id:req.params.Id}, function(err, module){

        Module.update({Id:req.params.Id}, {$set:{status:2,on_ea: 0, date_completed: new Date().getTime()}}, function(err, mod){


            Module.findOne({Id:req.params.Id}, function(err, module){

                //Create testing module file for QA or EA
                functions.createDocker(module, "module", function(response){
                    if(response.status){
                        module.link = response.link;
                        module.save();
                    }
                    // res.send(response);
                });

                Projects.findOne({Id: module.project_Id}, (err, project)=>{

                    module.project_name = project.project_name;

                    res.send({status:true, message:"Module Submitted Successfully"});

                    data = {
                        Id: module.developer_Id,
                        message:   `You submitted Module ${module.module_name.toUpperCase()} on Project ${project.project_name.toUpperCase()}`
                    }
                    dataProject = {
                        Id: project.manager_Id,
                        message:   `Module ${module.module_name.toUpperCase()} was submitted on ${project.project_name.toUpperCase()}`
                    }
                functions.Notify(data, io)
                functions.Notify(dataProject, io)

                    functions.send_mail(module, "module_submitted_alert");

                })



            });

        });
    });

    });

    app.post('/module/accept/:Id',function(req, res){

            Module.findOne({Id:req.params.Id}, function(err, module){
                     Projects.findOne({Id: module.project_Id}, (err, project)=>{
                         module.project_name = project.project_name;
                         module.user_Id = module.developer_Id;

                         var update = {};
                         if(module.ea) {
                             if (req.body.is_ea) {
                                 update = {status: 3, done_date: new Date().getTime()};
                             }else{
                                 update = {on_ea: 1};
                             }
                         }else{
                             update = {status: 3, done_date: new Date().getTime()};
                         }

                         Module.update({Id:req.params.Id}, {$set:update}, function(err, mod){

                            data = {
                                Id: module.developer_Id,
                                message:   `You accepted ${module.module_name.toUpperCase()} on Project ${project.project_name.toUpperCase()}`
                            }
                            dataProject = {
                                Id: project.manager_Id,
                                message:   `Module ${module.module_name.toUpperCase()} was accepted on ${project.project_name.toUpperCase()}`
                            }


                        functions.Notify(data, io)
                        functions.Notify(dataProject, io)


                             if(update.status != 3){
                                 return;
                             }

                             functions.send_mail(module, "module_accepted_alert");
                             res.send({status:true, message:"Module Accepted Successfully"});

                             // perform repository merging
                             functions.mergeRepo(project, module);


                        });



            })
            });
    });


        app.get('/module/start/:Id', function(req, res, next){
      isLoggedIn(req, res, next);
    }, function(req, res){


        Module.update({Id:req.params.Id}, {$set:{status:4, rejected_reason: ""}}, function(err, module){
            res.send({status: true, message: "Module accepted successfully"});
        });

    });

    app.get('/module_start/:Id', function(req, res){


        Module.update({Id:req.params.Id}, {$set:{start_time: new Date().getTime()}}, function(err, module){
            res.send({status: true, message: "Module started successfully"});
        });

    });

    var timeAuth = {};

    app.post('/module/time_spent/:Id', function(req, res) {


        if(timeAuth[req.body.key] && timeAuth[req.body.key] == req.body.time_Id){
            res.send({status: true, message: "Time updated" , time_Id:req.body.time_Id});
            return;
        }

        timeAuth[req.body.key] = req.body.time_Id;

        Module.findOne({Id: req.params.Id}, (err, modul)=> {
            var current_time = modul.actual_time;
            var new_time = req.body.new_time;
              if(!req.body.path){
                res.send({status: false, message: "Invalid file path"});
                return;
            }
            if(!new_time || new_time < 1){
                res.send({status: false, message: "Invalid New Time"});
                return;
            }

            if (modul && modul.developer_Id) {
                var date = new Date().toDateString();
                // if(module.recent_files)
                var recent_files = modul.recent_files || [];
                if(req.body.path.indexOf("undefined")==-1){
                    var exist = recent_files.filter(r=>r.path==req.body.path);
                if(exist.length>0){
                    recent_files.find(r=>r.path==req.body.path).time=new Date().getTime();
                }else{
                    recent_files.push({time:new Date().getTime(),path:req.body.path});
                }
                }
                console.log(recent_files.length ,":",recent_files);
                Duration.findOne({developer_Id: modul.developer_Id, date: date, module_Id: req.params.Id }, function(err, duration){

                    // if(duration){
                    //     var ct = new Date().getTime();
                    //     var ut = new Date(duration.updated_time).getTime();
                    //     var df = (ct - ut)/1000;
                    //     if(new_time > df){
                    //           res.send({status: false, message: "Invalid Time Differences"});
                    //           return;
                    //     }
                    // }

                    Module.update({Id: req.params.Id}, {$set: {actual_time: current_time + new_time,recent_files:recent_files}}, function (err, module) {});
                    if(duration) {
                        Duration.update({_id: duration._id}, {$set: {duration: duration.duration + new_time, updated_time: new Date().getTime() }}, function (err, module) {
                            if (!err){

                                res.send({status: true, message: "Time updated" , time_Id:req.body.time_Id});
                            }
                            else
                                res.send({status: false, message: "Unable to update time"})
                        })
                    }else{
                        Duration.create({duration: new_time, date: date, updated_time: new Date().getTime(), developer_Id: modul.developer_Id, module_Id: req.params.Id}, function (err, module) {
                            if (!err){

                                 res.send({status: true, message: "Time updated" , time_Id:req.body.time_Id});
                            }
                            else
                                res.send({status: false, message: "Unable to update time"})
                        })
                    }
                });

            }
        })
    });

    app.post('/module/decline/:Id', function(req, res){
        Module.find({Id:req.params.Id}, function(err, mymodule){
            if(err) throw err;

        Projects.findOne({Id: module.project_Id}, (err, project)=>{
             Module.update({Id:req.params.Id},
                    {$set:{status:1, developer_Id: "",
                    rejected_reason: req.body.reason}}, function(err, module){

                    module.project_name = project.project_name;
                    module.user_Id = mymodule.developer_Id;

                    data = {
                        Id: mymodule.developer_Id,
                        message:   `You declined Module ${mymodule.module_name} on ${project.project_name}`
                    }
                    dataProject = {
                        Id: mymodule.developer_Id,
                        message:   `Module ${mymodule.module_name} was declined on ${project.project_name}`
                    }
                    console.log('my', mymodule.developer_Id)
                functions.Notify(data, io)
                functions.send_mail(module, "module_rejected_alert");

                res.send({status:true, message:"Module rejected successfully"});

            });
        });

        });

    });

    //PROJECT MANAGER REJECT
    app.post('/module/reject/:Id', function(req, res){

        Module.findOne({Id:req.params.Id}, function(err, module){
            console.log("module",module);
            // console.log("module Id",req.params.Id);
            // rejected_reason: req.body.reason
            Projects.findOne({Id: module.project_Id}, (err, project)=>{
                var rej = module.rejected || 0;
                rej = rej + 1;
                // console.log('project', project)
                var issues = module.issues || [];

                // issues.push({user_Id: req.body.Id, issue: req.body.reason, date: new Date().getTime()});

                Module.update({Id:req.params.Id}, {$set: {status:4, rejected: rej}}, function(err, mod){

                    res.send({status:true, message:"Module rejected successfully"});

                    // data = {
                    //     Id : module.developer_Id,
                    //     message:   `Module ${module.module_name} was rejected on Project ${project.project.name}`
                    // }
                    dataProject = {
                        Id : project.manager_Id,
                        message:   `You rejected Module ${module.module_name} was rejected on Project ${project.project_name}`
                    }
                    functions.Notify(dataProject, io)

                    functions.send_mail(module, "module_rejected_alert");

                });
            })

        });

    });


  app.get('/modules/developer/:project/:Id', function(req, res){
      Module.find({project_Id:req.params.project, developer_Id:req.params.Id,on_ea:{$ne: 1}}, function(err, module){
            res.send({status:true, data:module});
        });
    });

    app.get('/modules/pm/:type/:Id',function(req, res, next){
  isLoggedIn(req, res, next);
},  function(req, res){
        Module.find({status:parseInt(req.params.type), project_Id:req.params.Id}, function(err, module){
            res.send({status:true, data:module});
        });

    });

    app.get('/modules/:Id', function(req, res, next){ 
        isLoggedIn(req, res, next);
        }, function(req, res){
            Module.find({project_Id:req.params.Id}, function(err, module){
                res.send({status:true, data:module});
            });
        });


    app.get('/modules/:Id/:team', function(req, res, next){ 
        isLoggedIn(req, res, next);
        }, function(req, res){
            Module.find({project_Id:req.params.Id}, function(err, module){

                User.find({
                    team_Id: req.params.team,
                    type: {$ne: 1}
                }, function (err, user) {

                    var users = {};
                    for(var x in user){
                        users[user[x].Id] = user[x]
                    }
                    var data = [];
                    for(var i in module){
                        data[i] = module[i].toJSON();
                        if(data[i].developer_Id ){
                            let module_detail = users[data[i].developer_Id]
                            if(!module_detail){
                                continue;
                            }
                            data[i].developer_name = module_detail.first_name + ' ' + module_detail.last_name;
                            data[i].profile_thumbnail = module_detail.profile_thumbnail;
                        }
                    }
                    res.send({status:true, data:data});
                });
            });
        });


    app.get('/timeline/:Id', function(req, res, next){
  isLoggedIn(req, res, next);
}, function(req, res){

        var fetchTimeline = async function(){
            let project = await Projects.findOne({Id: req.params.Id}).exec();
            if(!project){
                req.send({status:false, message: "Invalid project id"});
                return;
            }

            project.team = project.team || [];

            let developers = await User.find({Id: {$in: project.team}, type: 3}).exec();
            let category = await Category.find({team_Id: project.company_Id}).exec();



            let my_sprints = await Module.aggregate({$group:{_id: '$sprint'}}).exec();
            // console.log(my_sprints);
            let sprints = my_sprints || [];
            sprints = sprints.sort(function(a, b){
                if(a._id > b._id){
                    return 1;
                }
                return -1;
            });

            let sendSprints = {};
            let start_date = new Date().getTime();
            for(let i in sprints) {
                let sprint = sprints[i]._id;
                let modules = await Module.find({project_Id: req.params.Id, sprint: sprint}, {
                    module_name: 1,
                    Id: 1,
                    dependency: 1,
                    category: 1,
                    dev_time: 1,
                    date_completed: 1,
                    created_time: 1,
                    status: 1,
                    developer_Id: 1,
                    actual_time: 1,
                    start_time: 1
                }).sort({_id: 1}).exec();

                let data = Filter.by_dependency(modules);
                let mydata = Filter.by_developers(data, project, developers, category, true, start_date);
                if(mydata.length > 0){
                    start_date = new Date(mydata[mydata.length - 1].date);
                    start_date = start_date.setDate(start_date.getDate() + 1);
                }
                sendSprints[sprint] = mydata;
            }

            res.send({status:true, timeline: sendSprints, timelog: []});

        };
        fetchTimeline();

    });


   app.get('/all_modules', function(req, res){

         Module.find({}, function(err, data){

                res.send(data);

         });
   });
   var sendToDeveloper = (req)=>{
     req.body.user_Id = req.body.developer_Id;
     functions.send_mail(req.body, "module_assigned_alert");
   }

     //app.get('/timeline/:projectId', function(req, res){
     //    Module
     //        .find({project_Id: req.params.projectId})
     //        .then(function(docs){
     //            //return res.json(docs);
     //            Filter.getTimeLine(docs).then(function(timeline){
     //                res.json({status: true, data: timeline});
     //            }).catch(function(error){
     //                res.json({status: false, message: "Could not process time line data", error: error});
     //            });
     //        })
     //        .catch(function(error){
     //            console.log(error);
     //            res.json({status: false, message: "An unexpected error occurred", error: error});
     //        });
     //});
};
