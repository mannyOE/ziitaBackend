var cors = require('cors');
var express = require('express');
var app = express();
var functions = require('../../util/functions');
var Filter = require('../../util/Filter');
var User = require('../../database/models/user.js');
var Developers = require('../../database/models/developers.js');
var Projects = require('../../database/models/projects.js');
var Modules = require('../../database/models/module.js');
var Category = require('../../database/models/category.js');
var Managers = require('../../database/models/manager.js');
var Duration    = require('../../database/models/duration.js');

var shortid = require('shortid');
var isLoggedIn = functions.isLoggedIn;


module.exports = function (app) {

    app.post('/category', function (req, res) {

        if (!req.body.Id) {
            req.body.Id = shortid.generate();


            Category.create(req.body, function (err, category) {

                if (err) {

                } else {

                    res.send({status: true, message: "Category Created Successfully", data: req.body});

                }

            });
        } else {
            Category.update({Id: req.body.Id}, {$set: req.body}, function (err, category) {

                if (err) {

                } else {

                    res.send({status: true, message: "Category Created Successfully", data: req.body});

                }

            });
        }

    });


    app.get('/category/:Id', function (req, res) {

        Category.find({team_Id: req.params.Id}, function (err, category) {

            res.send({status: true, count: category.length, data: category});

        });

    });


    app.post('/update_category', function (req, res) {


        Category.update({Id: req.body.Id}, {$addToSet: {skills: req.body.skill}}, function (err, num) {


            res.send({status: true, message: "updated succesfully"});

        });

    });


    app.get('/delete_category/:Id', function (req, res) {
        Category.remove({Id: req.params.Id}, function (err, num) {
            res.send({status: true, message: "Category Deleted Successfully"});
        });
    });

    function getCompletedModules(modules) {
        return modules.filter((module, index) => {
            return module.status === 3;
        });
    }

    function getRejectedModules(modules) {
        return modules.filter((module, index) => {
            return module.status === 4 && module.rejected > 0;
        });
    }

    app.get('/developers/:id', isLoggedIn, function (req, res) {
        /**
         * Get analysis of developer in a team
         */
        const devId = req.params.id;
        console.log(devId, typeof(devId))

        Developers.findOne({Id: devId}, (deverror, dev) => {
            // find projects with dev in team
            if(dev){
                Projects.find({company_Id: dev.team_Id}, (proError, projects) => {
                    //console.log("mmmm",dev, devId, projects);
                    const projectIds = projects.map((project) => {
                        return project.Id
                    });
                    console.log("projectids",projectIds);
                    // find modules assigned for each project
                    Modules.find({
                        project_Id: {$in: projectIds},
                        developer_Id: devId,
                    }, (modError, modules) => {
    
                        if (deverror || proError || modError) {
                            res.send({
                                status: false,
                                message: deverror || proError || modError
                            });
                        } else {
    //console.log("modules", modules);
                            const developer = {};// dev
    
                            const stats = {};
    
                            var devStats = Filter.calculateDevSpeed(modules);
    
                            // get stats
                            // Modules assigned from project
                            stats.modulesAssigned = modules.length;
    
                            // Modules completed from project
                            stats.modulesCompleted = devStats.completed;
    
                            // Modules missed from project
                            stats.deadlinesMissed = devStats.deadlinesMissed;
    
                            // Total speed over total expected speed
                            // AVerage of 10/(Total time taken / Expected time) for each module 0-10
                            stats.averageSpeed = devStats.started == 0 && devStats.completed == 0?"--":devStats.averageSpeed;
    
                            //DEVELOPER SPEED
                            stats.developerSpeed = devStats.started == 0 && devStats.completed == 0?"--":devStats.developerSpeed;
    
    
                            //Accuracy
                            stats.accuracy = devStats.started == 0 && devStats.completed == 0?"--":devStats.accuracy;
    
                            // Percentage missed deadines from project (accuracy)
    
                            developer.statistics = stats;

                            console.log(developer);
                            var date = new Date().toDateString();

                            Duration.find({date: date, developer_Id: devId}, function(err, duration){
                                var time = 0;
                                duration.forEach(function(row){
                                      time += row.duration;
                                });

                                developer.statistics.timeSpent.today = time;
                                Duration.find({developer_Id: devId}).sort({updated_time: -1}).limit(1).exec(function(err,row){
                                    developer.statistics.lastActivity = "";
                                    if(row.length > 0){
                                        var x = row[0].updated_time;
                                        developer.statistics.lastActivity = new Date(x);
                                    }
                                    Developers.findOne({Id: devId}, function(err, dev){
                                        console.log(developer, date);
                                        developer.statistics.skills = dev?dev.skills:[];

                                        res.send({
                                            status: true, 
                                            message: "Developer Fetched Successfully",
                                            data: developer
                                        });
                                    });
                                })
                            })

                        }
    
                    });
                });
            }
        });
    });


    app.get('/projects/:projectId/developers/:id', function (req, res) {
        /**
         * Get analysis of developer in a project
         */

        const projectId = req.params.projectId;
        const devId = req.params.id;

            // find projects with dev in team
            Projects.find({Id: projectId}, (proError, project) => {
                // find all modules for each project
                Modules.find({
                    project_Id: projectId,
                }, (totalmodError, totalModules) => {

                    // find modules assigned for each project
                    Modules.find({
                        project_Id: projectId,
                        developer_Id: devId,
                    }, (modError, modules) => {

                        if (proError || modError || totalmodError) {
                            res.send({
                                status: false,
                                message: proError || modError || totalmodError
                            });
                        } else {

                            //let completedModules = getCompletedModules(modules);

                            //let rejectedModules = getRejectedModules(modules);
                            let devStats = Filter.calculateDevSpeed(modules);
                            let developer = {};// dev
                            let stats = {};

                            // get stats
                            // Modules assigned from project
                            stats.modulesAssigned = modules.length;

                            // Modules completed from project
                            stats.modulesCompleted = devStats.completed;

                            // Modules missed from project
                            // need number of times each module was rejected
                            stats.deadlinesMissed = devStats.deadlinesMissed;

                            // speed of module delivery from project
                            // AVerage of 10/(Total time taken / Expected time) for each module 0-10
                            stats.averageSpeed = devStats.started == 0 && devStats.completed == 0?"--":devStats.averageSpeed;

                            //DEVELOPER SPEED
                            stats.developerSpeed = devStats.started == 0 && devStats.completed == 0?"--":devStats.developerSpeed;


                            //Accuracy
                            stats.accuracy = devStats.started == 0 && devStats.completed == 0?"--":devStats.accuracy;

                            // Percentage missed deadines from project (accuracy)

                            // Percentage contribution to project
                            stats.contribution = Math.round(((devStats.completed/ totalModules.length) || 0) * 100);

                            developer.statistics = stats;

                            // TimeSpent
                            stats.timeSpent = devStats.timeSpent;


                            var date = new Date().toDateString();

                            Duration.find({date: date, developer_Id: devId}, function(err, duration){
                                var time = 0;
                                console.log(duration);
                                duration.forEach(function(row){
                                    time += row.duration;
                                });
                                developer.statistics.timeSpent.today = time;
                                Duration.find({developer_Id: devId}).sort({updated_time: -1}).limit(1).exec(function(err,row){
                                    developer.statistics.lastActivity = "";
                                    if(row.length > 0){
                                        var x = row[0].updated_time;
                                        developer.statistics.lastActivity = new Date(x);
                                    }
                                    Developers.findOne({Id: devId}, function(err, dev){
                                        console.log(developer, date);
                                        developer.statistics.skills = dev?dev.skills:[];
                                        res.send({
                                            status: true,
                                            message: "Developer Fetched Successfully",
                                            data: developer
                                        });
                                    });

                                })
                            })
                        }
                    });
                });
            });
    });


    // app.get('/people_details/:id', (req, res)=>{
    //     devId = req.params.id;
    //     Developers.findOne({Id: devId}, (err, dev)=>{
    //         devTeamId = dev.team_Id;
    //         Developers.find({team_Id : devTeamId}, (err, devs)=>{
    //             if(err){
    //                 res.send(err);
    //             }
    //             res.send({status:true, message: devs})
    //         })
    //     })
    // } )

    //details of all people by team_id
    app.get('/people_details/:id', isLoggedIn, (req, res)=> {
        devId = req.params.id;
        Developers.findOne({Id: devId}, (err, dev)=> {

            if (err) {
                var search = {Id: devId};
            } else {
                var search = {term_Id: dev.team_Id};
            }
            Managers.find(search, (err, teamM)=> {
                if (err) {
                    res.send(err);
                }
                Developers.find({team_Id: devTeamId}, (err, teamD)=> {
                    if (err) {
                        res.send(err);
                    }
                    var Team = teamM.concat(teamD)
                    res.send({
                        status: true,
                        count: Team.length,
                        message: Team,
                    })
                })
            })
        })
    })


};
