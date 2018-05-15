var cors = require('cors');
var express = require('express');
var app = express();
var terms          = require('../../util/term');
var request       = require('request');
var functions = require('../../util/functions');
var Filter = require('../../util/Filter');
var User = require('../../database/models/user.js');
var Projects = require('../../database/models/projects.js');
var Module = require('../../database/models/module.js');
var isLoggedIn = functions.isLoggedIn;
var role = functions.roleCheck;
var shortid = require('shortid');
var Notification = require('../../database/models/notification.js');
var DirectoryStructureJSON = require('directory-structure-json');
var basepath = '/root/Boiler';
var fs = require('fs');
var FileSys = require('../../database/models/projectFiles');
var done      = false;
var multer    = require('multer');
var rs = require('randomstring');
var fse = require('fs-extra');
var async = require('async');
module.exports = function (app, io) {


    var alert_team = function (data, template) {

        data.forEach(function (user) {

            console.log(user.Id);

            User.findOne({
                Id: user.Id,

            }, function (err, single) {
                if(err) throw err;

                console.log(single)
                var mail = user;
                mail.template = template;
            mail.subject = "Natterbase Notifications";
                mail.name = single.first_name +' ' +  single.last_name;
                mail.email = single.Email;
                mail.project_name = user.project_name.toUpperCase(),


                functions.Email(mail);
                // console.log('Id', single.Id)
                // console.log('message', user.message)
                data = {
                    Id: single.Id, message: user.message
                }
                console.log('got', data)
                functions.Notify(data, io)

            });

        });

    };


    app.post('/create_project', (req, res,next)=>{
      isLoggedIn(req, res, next, 'manageProject')
    },function (req, res) {

        req.body.Id = shortid.generate();
        req.body.created_time = new Date().getTime();

        Projects.create(req.body, function (err, project) {

            if(req.body.manager_Id){
                req.body.user_Id = req.body.manager_Id;
                functions.send_mail(req.body, "project_assigned_alert");
            }

            if (err) {

                res.send({
                    status: false,
                    message: "Error Creating Project"
                });
            } else {

                res.send({
                    status: true,
                    message: "success",
                    Id: req.body.Id
                })
            }


        });

    });


    app.get('/send_email', function (req, res) {

        var mail = {};
        mail.template = "<b>Please come over here</b>";
    mail.subject = "Natterbase Notifications";
        mail.email = "mzndako@gmail.com";


        console.log("send mail to " + mail.email);
        functions.Email(mail);
        res.send({
            status: true,
            data: "sent"
        });

    });

    // app.get('/projects/cm/:Id', function (req, res) {

    //   var query = {};

    //   if (req.params.Id) {

    //     query.company_Id = req.params.Id;

    //     Projects.find(query, function (err, project) {

    //       res.send({
    //         status: true,
    //         count: project.length,
    //         data: project
    //       });

    //     });

    //   }

    // });


    app.get('/projects/:Id', (req, res, next)=>{
      isLoggedIn(req, res, next, 'manageProject')
    }, function (req, res) {

        User.findOne({Id: req.decoded.user}, {Password: 0}, function (err, user) {

            if (user) {

                var query = {};
                // console.log(user);
                if (parseInt(user.type) == 1) {
                    query.company_Id = req.params.Id;
                    // console.log(query);
                } else {
                    query.manager_Id = req.params.Id;
                    // console.log(query);
                }


                Projects.find(query, function (err, project) {

                    res.send({
                        status: true,
                        count: project.length,
                        data: project
                    });

                });

            } else {

                res.send({
                    status: false,
                    message: "No user found"
                });

            }

        });


    });


    app.get('/project/dev/:Id',(req, res, next)=>{
  isLoggedIn(req, res, next)
}, function (req, res) {

        User.findOne({Id: req.params.Id}, function (err, manager) {

            console.log("manager",manager.Id)
            p_overview = [];
            overview = {};
            Projects.find({team: {$in:[manager.Id]}}, function (err, project) {
            User.find({team_Id: manager.team_Id},function(err,team){
                async.each(project,(p,next)=>{

        Module.find({project_Id: p.Id}, function (err, modules) {
           
            if (modules) {
                overview.completed = 0;
                overview.all_task = 0;
                overview.submited = 0;
                overview.done = 0;
                overview.in_progress = 0;


                modules.forEach(function (data) {

                    if (data.status == 3) {

                        //overview.completed += parseInt(data.dev_time);
                        overview.completed++;
                        overview.done++;

                    } else if (data.status == 5 || data.status == 4) {

                        overview.in_progress++;

                    } else if (data.status == 2) {

                        overview.submited++;
                    }
                    //overview.all_task+= parseInt(data.dev_time);
                    overview.all_task++;
                });

                modules.sort(function (a, b) {
                    console.log({a, b})

                    var aa = a.updated_time || 0;
                    var bb = b.updated_time || 0;
                    return aa < bb ? -1 : (aa > bb ? 1 : 0);

                });

                overview.last_action = modules[0]?modules[0].updated_time:"";
                overview.progress = (overview.completed/overview.all_task) * 100;
                overview.Id = p.Id;
                // console.log(overview);

                // res.send({status: true, data: overview});
                p_overview.push(overview);
                overview = {};
                next();

            } else {
                overview = {};
                next()
            }

        });

                },err=>{
                res.send({status: true, count: project.length, project: project,team:team,overview:p_overview});

                })



            })

            });

        });

    });


    app.get('/project_details/:Id', (req, res,next)=>{
      isLoggedIn(req, res, next)
    }, function (req, res) {


        Projects.find({Id: req.params.Id}, function (err, project) {

            res.send({
                status: true,
                data: project
            });

        });


    });


    app.post('/Assign/p/:Id',(req, res,next)=>{
      isLoggedIn(req, res, next, 'manageProject')
    }, function (req, res) {


        User.findOne({Id: req.body.Id}, function (err, userDetail) {
            Projects.findOne({
                Id: req.params.Id
            }, function (err, project) {
                if(err) throw err;
                Projects.update({Id: req.params.Id}, {
                    $set: {manager_Id: req.body.Id},
                    $addToSet: {team: userDetail.Id}
                }, function (err, num) {
                //PULL OUT THE PREVIOUS MANAGER
                if(project.manager_Id && project.manager_Id != userDetail.Id) {
                    Projects.update({Id: req.params.Id}, {
                        $pull: {team: project.manager_Id}
                    }, function (err, num) {
                    });
                }
                    data = {
                        Id: userDetail.Id,
                        message: `You have been assigned to a Project on ${project.project_name}`
                    }
                    console.log(data)
                    // project.user_Id = userDetail.Id;
                    functions.Notify(data, io)
                    functions.send_mail(project,"project_assigned_alert");

                    res.send({
                        status: true,
                        message: "Project Assigned Successfully"
                    });

                });

            });

        });

    })

    app.post('/update_docker_project',(req, res, next)=>{
  isLoggedIn(req, res, next)
}, (req, res)=> {


        Projects.update({Id: req.body.projectId}, {
            $set: {
                docker: req.body.id
            },
        }, function (err, num) {
            if (err) throw err;
            res.send({
                status: true,
                message: "Successfully updated server configuration"
            });
        });

    })

    app.post('/update_ssh_project/:Id', (req, res)=> {
        Projects.findOne({Id: req.params.Id}, (err, projects)=> {
            if (projects) {
                Projects.update({Id: req.params.Id}, {
                    $set: {
                        ssh_username: req.body.ssh_username,
                        ssh_password: req.body.ssh_password,
                        ssh_port: req.body.ssh_port,
                        ssh_address: req.body.ssh_address,
                        ssh_passphrase: req.body.ssh_passphrase,
                        ssh_privatekey: req.body.ssh_privatekey,
                        project_port: req.body.project_port,
                    },
                }, function (err, num) {
                    if (err) throw err;
                    console.log(projects)
                    res.send({
                        status: true,
                        message: "Successfully Updated"
                    });
                })
            } else {
                res.send({'status': false, 'message': 'Error updating ssh'})
            }
        })
    })


    app.post('/update_project/:id',(req, res,next)=>{
      isLoggedIn(req, res, next, 'manageProject')
    }, (req, res)=> {
        User.findOne({Id: req.decoded.user}, (err, users)=> {
            if (users) {
                Projects.findOne({Id: req.params.id}, (err, projects)=> {
                    if (projects) {
                        Projects.update({Id: req.params.id}, {
                            $set: {
                                project_name: req.body.name,
                                repository_url: req.body.url,
                                repository_username: req.body.username,
                                repository_password: req.body.password,
                                // docker: req.body.id,

                            },
                        }, function (err, num) {
                            if (err) throw err;
                            res.send({
                                status: true,
                                message: "project succesfully updated"
                            });
                        })
                    } else {
                        res.send({'status': false, 'message': 'project not found'})
                    }
                })

            } else {
                res.send({'status': false, 'message': 'user not found'})
            }
        })
    })

    app.post('/add_to_team/:Id',(req, res,next)=>{
      isLoggedIn(req, res, next, 'manageTeam')
    }, function (req, res) {


            Projects.update({Id: req.params.Id}, {$addToSet: {team: {$each: req.body.Id}}}, function (err, num) {
                Projects.findOne({
                    Id: req.params.Id
                }, function (err, project) {



                    project.message = `You have been added to ${project.project_name} Project`;
                    req.body.Id.forEach(function(id){
                        project.user_Id = id;
                        functions.send_mail(project, "added_to_project");
                        project.Id = id;
                        functions.Notify(project, io);
                    });





                    res.send({
                        status: true,
                        message: "Successfully added"
                    });

                });

            });

        });


    app.get('/delete/p/:Id', (req, res,next)=>{
      isLoggedIn(req, res, next, 'manageProject')
    },function (req, res) {


        Projects.find({
            Id: req.params.Id
        }, function (err, project) {

            if(!project){
                res.send({
                    status: false,
                    message: "Project not found or already deleted"
                });
                return;
            }
            //alert_team({
            //    project_name: project.project_name,
            //    message:`You have been deleted from ${project.project_name} Project`
            //    }, "project_delete_alert");
            project.user_Id = project.company_Id;
            project.message = `You have been deleted from ${project.project_name} Project`;
            functions.send_mail(project,"project_delete_alert")

            Projects.remove({
                Id: req.params.Id
            }, function (err, num) {
                Module.remove({
                    project_Id: req.params.Id
                }, function (err, num) {
                    //console.log(req.params.Id);

                    res.send({
                        status: true,
                        message: "Project Deleted"
                    });

                });

            });

        });

    });


    app.get('/project_overview/:Id',(req, res, next)=>{
  isLoggedIn(req, res, next)
}, function (req, res) {

        var overview = {};

        Module.find({project_Id: req.params.Id}, function (err, modules) {
            if (modules) {
                overview.completed = 0;
                overview.all_task = 0;
                overview.submited = 0;
                overview.done = 0;
                overview.in_progress = 0;


                modules.forEach(function (data) {

                    if (data.status == 3) {

                        //overview.completed += parseInt(data.dev_time);
                        overview.completed++;
                        overview.done++;

                    } else if (data.status == 5 || data.status == 4) {

                        overview.in_progress++;

                    } else if (data.status == 2) {

                        overview.submited++;
                    }
                    //overview.all_task+= parseInt(data.dev_time);
                    overview.all_task++;
                });

                modules.sort(function (a, b) {
                    console.log({a, b})

                    var aa = a.updated_time || 0;
                    var bb = b.updated_time || 0;
                    return aa < bb ? -1 : (aa > bb ? 1 : 0);

                });

                overview.last_action = modules[0]?modules[0].updated_time:"";
                overview.progress = (overview.completed/overview.all_task) * 100;
                // console.log(overview);

                res.send({status: true, data: overview});

            } else {

                res.send({status: false, message: "No module found"});
            }

        });


    });


    app.get('/folder', function (req, res) {


        DirectoryStructureJSON.getStructure(fs, basepath, function (err, structure, total) {
            if (err) console.log(err);

            //console.log('there are a total of: ', total.folders, ' folders and ', total.files, ' files');
            console.log('the structure looks like: ', JSON.stringify(structure, null, 4));

            res.send(JSON.stringify(structure, null, 4));
        });

    });

    app.post('/project/read_file/:Id/',(req,res)=>{
            var file_path = req.body.file_path || "";

                 if (!req.params.Id) {
                req.send({status: false, message: "Invalid module"});
                return;
               }
                Module.findOne({Id:req.params.Id},(err,module)=>{
                     if (err) {
                req.send({status: false, message: "Can not find module"});
                return;
            }
                    var project_Id = module.project_Id;
                    var developer = module.developer_Id;
            Projects.findOne({Id: project_Id}, function (err, project) {
            if (err) {
                req.send({status: false, message: "Can not find project"});
                return;
            }

            var url = project.repository_url || "";
            var username = project.repository_username || "";
            var password = project.repository_password || "";
            var path = req.body.path || "";
            path = path == "/"?"":path;

            var credential = terms.base64.encode(username + ":" + password);



            if (url.toLowerCase().indexOf("bitbucket.org") > -1 || url.toLowerCase().indexOf("bitbucket.com") > -1) {
                url = url.replace(/(https|http):\/\//, "");
                var ab = url.split("/");

                var options = {
                    url: 'https://api.bitbucket.org/2.0/repositories/' + ab[1] + '/' + ab[2] +'/src/developer_'+developer+'/'+file_path+'/',
                    method: 'GET',
                    headers: {
                        'Authorization': 'Basic ' + credential
                    },
                    body: ''
                };

                request(options, function (error, response, body) {
                    if (error) {
                        res.send({status: false, message: "Error: " + error});
                    } else {
                        var code = response.statusCode || 400;
                        var message = "";
                        switch (code) {
                            case 400:
                                message = "Invalid Username or Password";
                                break;
                            case 401:
                                message = "Invalid Username or Password";
                                break;
                            case 404:
                                message = "Repository Not Found";
                                break;
                            case 200:
                                message = "Successful";
                                break;
                            default:
                                message = "Invalid Repository Url";
                        }
                        if(code == 200){
                             res.send({status: true, content:body});
                        }
                        else {
                            res.send({status: false, message: message});
                        }


                        }
                    }
                );

                //GITHUB
            }else if (url.toLowerCase().indexOf("github.com") > -1) {
                url = url.replace(/(https|http):\/\//, "");
                var ab = url.split("/");
                var agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36";
                var options = {
                    url: 'https://api.github.com/repos/' + ab[1] + '/' + ab[2] + '/contents/'+file_path+'?ref=developer_'+developer,
                    method: 'GET',
                    headers: {
                        'Authorization': 'Basic ' + credential,
                        'User-Agent': agent,
                        UserAgent: agent
                    },
                    body: ''
                };

                if(path != ""){
                    options.url += "/" + path;
                }

                request(options, function (error, response, body) {
                    if (error) {
                        res.send({status: false, message: "Error: " + error});
                    } else {
                        var code = response.statusCode || 400;
                        var message = "";
                        switch (code) {
                            case 400:
                                message = "Invalid Username or Password";
                                break;
                            case 401:
                                message = "Invalid Username or Password";
                                break;
                            case 404:
                                message = "Repository Not Found";
                                break;
                            case 200:
                                message = "Successful";
                                break;
                            default:
                                message = "Invalid Repository Url";
                        }
                        if(code == 200){
                            body = body.content;
                            if(!body){

                                res.send({status: false, message: "empty files"});
                                return;
                            }else{
                                 var _contents = atob(body)
                                res.send({status:true,content:_contents});
                            }
return;

                        }else {
                            res.send({status: false, message: message});
                        }
                    }
                });
            } else {
                res.send({status: false, message: "Only Bitbucket and Github Url is currently accepted"})
            }
        });
                })

    })
    app.post('/project/developer_repository/:Id',(req,res)=>{
                   if (!req.params.Id) {
                req.send({status: false, message: "Invalid module"});
                return;
            }
                Module.findOne({Id:req.params.Id},(err,module)=>{
                      if (err) {
                req.send({status: false, message: "Can not find module"});
                return;
            }
            console.log(module)
            var project_Id = module.project_Id;
            var developer = module.developer_Id;
                            Projects.findOne({Id: project_Id}, function (err, project) {
            if (err) {
                req.send({status: false, message: "Can not find project"});
                return;
            }

            var url = project.repository_url || "";
            var username = project.repository_username || "";
            var password = project.repository_password || "";
            var path = req.body.path || "";
            path = path == "/"?"":path;

            var credential = terms.base64.encode(username + ":" + password);



            if (url.toLowerCase().indexOf("bitbucket.org") > -1 || url.toLowerCase().indexOf("bitbucket.com") > -1) {
                url = url.replace(/(https|http):\/\//, "");
                var ab = url.split("/");
                var _url = 'https://api.bitbucket.org/2.0/repositories/' + ab[1] + '/' + ab[2] +'/src/developer_'+developer+'/'
                console.log(_url);
                console.log(credential)
                var options = {
                    url: _url,
                    method: 'GET',
                    headers: {
                        'Authorization': 'Basic ' + credential
                    },
                    body: ''
                };

                request(options, function (error, response, body) {
                    if (error) {
                        res.send({status: false, message: "Error: " + error});
                    } else {
                        var code = response.statusCode || 400;
                        var message = "";
                        switch (code) {
                            case 400:
                                message = "Invalid Username or Password";
                                break;
                            case 401:
                                message = "Invalid Username or Password";
                                break;
                            case 404:
                                message = "Repository Not Found";
                                break;
                            case 200:
                                message = "Successful";
                                break;
                            default:
                                message = "Invalid Repository Url";
                        }
                        if(code == 200){
                            body = JSON.parse(body);
                            console.log(typeof body);

                            if(!body.values || body.values.length == 0){
                                res.send({status: false, message: "empty files"});
                                return;
                            }

                            var hash = body.values[0].commit.hash;
                            console.log("hash", hash);

                            if(path != ""){
                                options.url += "/"+path;
                            }
                            var files = [];

                            (function loop() {

                                request(options, function (error, response, body) {
                                    body = JSON.parse(body);
                                    if(body.values){
                                        for(var i in body.values){
                                            var file = body.values[i];
                                            var single = {};
                                            single.path = file.path;
                                            single.type = file.type == "commit_directory"?"dir":"file";
                                            files.push(single);
                                        }

                                        if(body.next){
                                            options.url = body.next;
                                            loop();
                                        }else{
                                            res.send({status:true,files:files});
                                        }

                                    }else{
                                        res.send({status:true,files:files});
                                    }
                                });
                            }());
                        }else {
                            res.send({status: false, message: message});
                        }
                    }
                });

                //GITHUB
            }else if (url.toLowerCase().indexOf("github.com") > -1) {
                url = url.replace(/(https|http):\/\//, "");
                var ab = url.split("/");
                var agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36";
                var options = {
                    url: 'https://api.github.com/repos/' + ab[1] + '/' + ab[2] + '/contents?ref=developer_'+developer,
                    method: 'GET',
                    headers: {
                        'Authorization': 'Basic ' + credential,
                        'User-Agent': agent,
                        UserAgent: agent
                    },
                    body: ''
                };

                if(path != ""){
                    options.url += "/" + path;
                }

                request(options, function (error, response, body) {
                    if (error) {
                        res.send({status: false, message: "Error: " + error});
                    } else {
                        var code = response.statusCode || 400;
                        var message = "";
                        switch (code) {
                            case 400:
                                message = "Invalid Username or Password";
                                break;
                            case 401:
                                message = "Invalid Username or Password";
                                break;
                            case 404:
                                message = "Repository Not Found";
                                break;
                            case 200:
                                message = "Successful";
                                break;
                            default:
                                message = "Invalid Repository Url";
                        }
                        if(code == 200){
                            body = JSON.parse(body);
                            if(!body || body.length == 0){
                                res.send({status: false, message: "empty files"});
                                return;
                            }else{
                                var files = [];
                                for(var i in body){
                                    var file = body[i];
                                    var single = {};
                                    single.path = file.path;
                                    single.type = file.type == "dir"?"dir":"file";
                                    files.push(single);
                                }
                                res.send({status:true,files:files});
                            }
return;
                            if(path != ""){
                                options.url += "/"+path;
                            }
                            var files = [];
                            (function loop() {
                                console.log(options);
                                request(options, function (error, response, body) {
                                    body = JSON.parse(body);
                                    if(body){




                                    }else{
                                        res.send({status:true,files:files});
                                    }
                                });
                            }());
                        }else {
                            res.send({status: false, message: message});
                        }
                    }
                });
            } else {
                res.send({status: false, message: "Only Bitbucket and Github Url is currently accepted"})
            }
        });
                })

    })
    app.post('/project/repository_folder/:Id', function (req, res) {
        Projects.findOne({Id: req.params.Id}, function (err, project) {
            if (err) {
                req.send({status: false, message: "Can not find project"});
                return;
            }

            var url = project.repository_url || "";
            var username = project.repository_username || "";
            var password = project.repository_password || "";
            var path = req.body.path || "";
            path = path == "/"?"":path;

            var credential = terms.base64.encode(username + ":" + password);



            if (url.toLowerCase().indexOf("bitbucket.org") > -1 || url.toLowerCase().indexOf("bitbucket.com") > -1) {
                url = url.replace(/(https|http):\/\//, "");
                var ab = url.split("/");

                var options = {
                    url: 'https://api.bitbucket.org/2.0/repositories/' + ab[1] + '/' + ab[2] + '/src',
                    method: 'GET',
                    headers: {
                        'Authorization': 'Basic ' + credential
                    },
                    body: ''
                };

                request(options, function (error, response, body) {
                    if (error) {
                        res.send({status: false, message: "Error: " + error});
                    } else {
                        var code = response.statusCode || 400;
                        var message = "";
                        switch (code) {
                            case 400:
                                message = "Invalid Username or Password";
                                break;
                            case 401:
                                message = "Invalid Username or Password";
                                break;
                            case 404:
                                message = "Repository Not Found";
                                break;
                            case 200:
                                message = "Successful";
                                break;
                            default:
                                message = "Invalid Repository Url";
                        }
                        if(code == 200){
                            body = JSON.parse(body);
                            console.log(typeof body);

                            if(!body.values || body.values.length == 0){
                                res.send({status: false, message: "empty files"});
                                return;
                            }

                            var hash = body.values[0].commit.hash;
                            console.log("hash", hash);

                            if(path != ""){
                                options.url += "/"+hash+"/"+path;
                            }
                            var files = [];

                            (function loop() {

                                request(options, function (error, response, body) {
                                    body = JSON.parse(body);
                                    if(body.values){
                                        for(var i in body.values){
                                            var file = body.values[i];
                                            var single = {};
                                            single.path = file.path;
                                            single.type = file.type == "commit_directory"?"dir":"file";
                                            files.push(single);
                                        }

                                        if(body.next){
                                            options.url = body.next;
                                            loop();
                                        }else{
                                            res.send({status:true,files:files});
                                        }

                                    }else{
                                        res.send({status:true,files:files});
                                    }
                                });
                            }());
                        }else {
                            res.send({status: false, message: message});
                        }
                    }
                });

                //GITHUB
            }else if (url.toLowerCase().indexOf("github.com") > -1) {
                url = url.replace(/(https|http):\/\//, "");
                var ab = url.split("/");
                var agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36";
                var options = {
                    url: 'https://api.github.com/repos/' + ab[1] + '/' + ab[2] + '/contents',
                    method: 'GET',
                    headers: {
                        'Authorization': 'Basic ' + credential,
                        'User-Agent': agent,
                        UserAgent: agent
                    },
                    body: ''
                };

                if(path != ""){
                    options.url += "/" + path;
                }

                request(options, function (error, response, body) {
                    if (error) {
                        res.send({status: false, message: "Error: " + error});
                    } else {
                        var code = response.statusCode || 400;
                        var message = "";
                        switch (code) {
                            case 400:
                                message = "Invalid Username or Password";
                                break;
                            case 401:
                                message = "Invalid Username or Password";
                                break;
                            case 404:
                                message = "Repository Not Found";
                                break;
                            case 200:
                                message = "Successful";
                                break;
                            default:
                                message = "Invalid Repository Url";
                        }
                        if(code == 200){
                            body = JSON.parse(body);
                            if(!body || body.length == 0){
                                res.send({status: false, message: "empty files"});
                                return;
                            }else{
                                var files = [];
                                for(var i in body){
                                    var file = body[i];
                                    var single = {};
                                    single.path = file.path;
                                    single.type = file.type == "dir"?"dir":"file";
                                    files.push(single);
                                }
                                res.send({status:true,files:files});
                            }
return;
                            if(path != ""){
                                options.url += "/"+path;
                            }
                            var files = [];
                            (function loop() {
                                console.log(options);
                                request(options, function (error, response, body) {
                                    body = JSON.parse(body);
                                    if(body){




                                    }else{
                                        res.send({status:true,files:files});
                                    }
                                });
                            }());
                        }else {
                            res.send({status: false, message: message});
                        }
                    }
                });
            } else {
                res.send({status: false, message: "Only Bitbucket and Github Url is currently accepted"})
            }
        });
    });


    app.post('/feedback', function (req, res) {
        var send = "";
        console.log("sending", req.body);
        for(var i in req.body){
            send += "<b>"+i+"</b>: "+req.body[i]+"<br><br>";
        }
        var args = {email: "feedback@natterbase.com", subject: "FEED BACK", contents: send};
        console.log("respond", args);
        functions.Email(args);
        res.send({status: true, message: "Sent Successfully", body: req.body, args: args});
    });



    app.get('/files/:user/:project', (req, res,next)=>{
      isLoggedIn(req, res, next, 'manageFiles')
    }, (req, res)=>{
        var user = req.decoded.user;
        var team = req.params.project;
        FileSys.find({file_project: team,  file_source: user}, (err, result)=>{
          if(err){
            throw err;
          }
          res.send({
            status: true,
            message: "Complete",
            data: result
          });
        });
    });

    app.get('/received/:user/:project',(req, res,next)=>{
      isLoggedIn(req, res, next, 'manageFiles')
    }, (req, res)=>{
        var user = req.decoded.user;
        var team = req.params.project;
        FileSys.find({file_project: team,  shared_with: {$in: [user]}}, (err, result)=>{
          if(err){
            throw err;
          }
          res.send({
            status: true,
            message: "Complete",
            data: result
          });
        });


    });

    app.get('/:file/download', function (req, res) {
      FileSys.findOne({file_Id: req.params.file},(err, sult)=>{
        if(err){throw err;}
        var filePath = sult.file_url; // Or format the path using the `id` rest param
        var fileName = sult.file_name; // The default name the browser will use
        res.download(filePath, fileName);
      });


    });

    app.get('/deleteFiles/:user/:file', (req, res, next)=>{
  isLoggedIn(req, res, next,'manageFiles')
},  (req, res)=>{
        var user = req.decoded.user;
        var file = req.params.file;
        var team = req.headers['team'];
        var path = '';

        FileSys.findOne({file_Id: file, file_source: user},(err, qry)=>{
          if(err){throw err;}
          if(qry){
            path = qry.file_url;
            FileSys.remove({file_Id: file}, (err)=>{
              fs.unlinkSync(path);

              Module.find({access_files: {$in: [file]}}, (err, result)=>{

     					 result.forEach((DEA)=>{
     						 var filteredAry = DEA.access_files.filter(e => e !== file)
     						 Module.update({access_files: {$in: [file]}}, {$set: {access_files: filteredAry}}, e=>{
     							 if(e){
     								 throw e;
     							 }
                   FileSys.find({file_team: team,  file_source: user}, (err, result)=>{
                     if(err){
                       throw err;
                     }
                           res.send({
                             status: true,
                             message: "File Deleted Successfully",
                             data: result
                           });
                   });
     						 });
     					 });

     				 });
            });
          }

        });

    });
// fkhewiiuiehqiueiheqhh


    app.post('/files/update/:Id', (req, res, next)=>{
      isLoggedIn(req, res, next,'manageFiles')
    }, (req, res)=>{
      var id = req.params.Id;
      var devId = req.body.devId;
      var status = req.body.status;

      $query = {$pull:{shared_with: devId}};

      if(status == 1){
          $query = {$push:{shared_with: devId}};
      }

      if(status == 2){
          $query = {$set:{isGeneral: true, shared_with: []}};
      }

      if(status == 3){
          $query = {$set:{isGeneral: false}};
      }

      FileSys.update({file_Id: id}, $query, (err, result)=>{
        res.send({
          status: true,
          message: "Update Done"
        });
      });
    });

    var mult = multer({
      dest: './public/files/',
      rename: function(fieldname, filename) {
          return filename+'-'+Date.now();

      },
      onFileUploadStart: function(file) {



      },
      onFileUploadComplete: function(file) {
        // console.log(file.fieldname + ' uploaded to  ' + file.path)
          uploaded = file.name;
          done = true;

      }
  });



    app.post('/fileUpload/',(req, res,next)=>{
      isLoggedIn(req, res, next, 'manageFiles')
    }, mult, (req, res)=>{


      if(done === true){
        var upload = req.files.image;
        var team = req.body.user;
        var file_dets = {};
        project_path = './public/files/'+req.headers['project']+'/';
        if(!fs.existsSync(project_path)){
            fs.mkdir(project_path);
        }
        // console.log(upload);



          if(upload.length !== undefined){
            upload.forEach(file=>{
              fse.move(file.path, project_path+file.name, err=>{
                if(err){throw err;}
              });
              file_dets.file_Id = rs.generate({
                length: 8,
                charset: 'numeric'
              })+'_'+Date.now();
              file_dets.file_ext = file.extension;
              file_dets.file_name = file.name;
              file_dets.file_mime = file.mimetype;
              file_dets.file_original = file.originalname;
              file_dets.file_url = project_path+file.name;
              file_dets.file_project = req.headers['project'];
              file_dets.file_source = req.decoded.user;

              FileSys.create(file_dets, (err)=>{
                if(err){
                  throw err;
                }
              });

            })
          }else if(!upload){
            res.send();
          }else{
            fse.move(upload.path, project_path+upload.name, err=>{
              if(err){throw err;}
            });
            file_dets.file_Id = rs.generate({
              length: 8,
              charset: 'numeric'
            })+'_'+Date.now();
            file_dets.file_ext = upload.extension;
            file_dets.file_name = upload.name;
            file_dets.file_original = upload.originalname;
            file_dets.file_mime = upload.mimetype;
            file_dets.file_url = project_path+upload.name;
            file_dets.file_project = req.headers['project'];
            file_dets.file_source = req.decoded.user;
            console.log(req.decoded.user);
            FileSys.create(file_dets, (err)=>{
              if(err){
                throw err;
              }
            });
          }

          res.send();






      }


    });




};
