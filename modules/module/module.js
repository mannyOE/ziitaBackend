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

    app.post('/create_module', function(req, res){

        if(req.body.Id != undefined && req.body.Id != ""){
            delete req.body._id;
            Module.update({Id:req.body.Id}, {$set:req.body}, function(err, num){

                if (err) {
                    console.log("Error Updating Module", err);
                    res.send({
                        status: false,
                        message: "Error Updating module"
                    });
                }else{
                    res.send({
                        status: true,
                        message: "success",
                        Id: req.body.Id
                    })
                }
            });
            return;
        }
        var time = new Date().getTime();
        req.body.Id           = shortid.generate();
        req.body.updated_time = time;
        req.body.created_time = time;
        Module.create(req.body, function (err, module) {

            if (err) {
console.log(err);
                res.send({
                    status: false,
                    message: "Error creating module"
                });
            } else {
                req.body.user_Id = req.body.developer_Id;
                functions.send_mail(req.body, "module_assigned_alert");
                var data = {};
                data.moduleId = req.body.Id;
                data.devId = req.body.developer_Id;
                assign_module(data);
                res.send({
                    status: true,
                    message: "success",
                    Id: req.body.Id
                })
            }

        });

    });

    // app.post('/')

    app.post('/edit_module/:Id', function(req, res){

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


    app.post('/assign/:Id', function(req, res){

        var data = {};

        data.moduleId = req.params.Id;
        data.devId = req.body.Id;

        assign_module(data, res);

    });

    app.get('/delete/m/:Id',isLoggedIn, function(req, res, next){
  role(req, res, next, 'delete_modules');
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

    app.get('/module/submit/:Id', function(req, res){


        Module.update({Id:req.params.Id}, {$set:{status:2, date_completed: new Date().getTime()}}, function(err, mod){


            Module.findOne({Id:req.params.Id}, function(err, module){

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

    app.post('/module/accept/:Id', function(req, res){

            Module.findOne({Id:req.params.Id}, function(err, module){
                     Projects.findOne({Id: module.project_Id}, (err, project)=>{
                         module.project_name = project.project_name;
                         module.user_Id = module.developer_Id;

                         Module.update({Id:req.params.Id}, {$set:{status:3, done_date: new Date().getTime(), method: req.body.method}}, function(err, mod){

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
                             functions.send_mail(module, "module_accepted_alert");
                             res.send({status:true, message:"Module Accepted Successfully"});
                        });


            })
            });
    });


        app.get('/module/start/:Id', function(req, res){


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

            if(!new_time || new_time < 1){
                res.send({status: false, message: "Invalid New Time"});
                return;
            }

            if (modul && modul.developer_Id) {
                var date = new Date().toDateString();

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

                    Module.update({Id: req.params.Id}, {$set: {actual_time: current_time + new_time}}, function (err, module) {});
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
                console.log('project', project)
                var issues = module.issues || [];

                issues.push({user_Id: req.body.Id, issue: req.body.reason, date: new Date().getTime()});

                Module.update({Id:req.params.Id}, {$set: {status:4, rejected: rej, method: req.body.method, issues: issues }}, function(err, mod){
                    console.log('got here also', project.manager_Id)
                    console.log('got here also', project.project_name)
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
      Module.find({project_Id:req.params.project, developer_Id:req.params.Id}, function(err, module){
            res.send({status:true, data:module});
        });
    });

    app.get('/modules/pm/:type/:Id', function(req, res){
        Module.find({status:parseInt(req.params.type), project_Id:req.params.Id}, function(err, module){
            res.send({status:true, data:module});
        });

    });

    app.get('/modules/:Id', isLoggedIn, function(req, res){
        Module.find({project_Id:req.params.Id}, function(err, module){
            res.send({status:true, data:module});
        });
    });

    app.get('/timeline/:Id', function(req, res){
        Module.find({project_Id:req.params.Id}, {module_name:1, Id:1, dependency:1, category: 1, dev_time: 1}, function(err, modules){
            console.log("filtering by dependency", modules.length);
            var data = Filter.by_dependency(modules);

            console.log("done filtering by dependency");

            Projects.findOne({Id: req.params.Id}, function(err, project){
                project.team = project.team || [];
                Developers.find({Id: {$in: project.team}}, function(err, developers){
                    //team_Id: project.company_Id
                    Category.find({}, function(err, category){
                        var mydata = Filter.by_developers(data, project, developers, category);
                        res.send({status:true, data: mydata});
                    })
                });

            });


return;
            //var data = Filter.by_speed(data);


            var array = [];

            array.push(data[data.count]);

            for (var i = 1; i < data.count; i++) {
                array.push(data[i]);
            }

            // data = Filter.by_developers(data, 2);


        });
    });


   app.get('/all_modules', function(req, res){

         Module.find({}, function(err, data){

                res.send(data);

         });
   });

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
