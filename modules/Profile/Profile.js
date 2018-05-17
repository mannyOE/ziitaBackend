var cors      = require('cors');
var express   = require('express');
var app       = express();
var functions = require('../../util/functions');
var Filter    = require('../../util/Filter');
var User      = require('../../database/models/user.js');
var Invited   = require('../../database/models/Invited.js');
var Projects  = require('../../database/models/projects.js');
var Modules   = require('../../database/models/module.js');
var Duration  = require('../../database/models/duration.js');
var bcrypt    = require('bcrypt-nodejs');
var path      = require('path');
var fs        = require('fs');
var csvjson   = require('csvjson');
var done      = false;
var multer    = require('multer');
var Thumbnail = require('thumbnail');
var isLoggedIn= functions.isLoggedIn;


"Boiler/HyxzJ65BM/me/your".split("/").splice("Boiler/HyxzJ65BM/me/your".split("/").length-1,1).join("/")


module.exports = function(app){


app.get('/test_route', function(req, res){

  console.log("sending global");

  io.emit('bro', "this is a bro");
  console.log(io);
  res.send("sent");

});



app.get('/session', (req, res, next)=>{
  isLoggedIn(req, res, next);
}, function(req, res){

     User.find({Id:req.decoded.user},{Password:0}, function(err, user){

     	res.send(user);
     });

});


app.post('/update_profile',(req, res, next)=>{
  isLoggedIn(req, res, next);
}, function(req, res){

   User.findOne({Id:req.decoded.user}, function(err, user){

    console.log(req.body);

  User.update({Id:req.decoded.user}, {$set:req.body}, function(err, num){

               if (parseInt(user.type) == 1) {
                 functions.update_team(req.decoded.user,req.body);
               }else if(parseInt(user.type) == 2){
                  functions.update_manager(req.decoded.user,req.body);
               }else if(parseInt(user.type) == 3){
                 functions.update_developer(req.decoded.user,req.body);
               }


     res.send({status:true, message:"profile updated successfully", profile:req.body});

      });

  });

});

app.get('/user_profile/:Id', (req, res, next)=>{
  isLoggedIn(req, res, next);
},  function(req, res){

   User.findOne({Id:req.params.Id}, function(err, user){

     res.send({status:true, profile:user});

  });
  });



app.post('/update_password', (req, res, next)=>{
  isLoggedIn(req, res, next);
}, function(req, res){

       User.findOne({Id:req.decoded.user}, function(err, user){

          bcrypt.compare(req.body.password, user.Password, function (err, crypt) {

        if (crypt != true) {

            res.send({
              status: false,
              messasge: 'Incorrect Password'
            });

          }else{

               var password = bcrypt.hashSync(req.body.new_password);
                console.log(password);

              User.update({Id:req.decoded.user},{$set:{Password:password}}, function(err, num){

               res.send({
              status:   true,
              messasge: 'Password changed successfully'
            });

              });

          }

          });

       });

});



      var mult = multer({
        dest: './public/img/',
        rename: function(fieldname, filename) {

            return filename+Date.now();

        },
        onFileUploadStart: function(file) {



        },
        onFileUploadComplete: function(file) {
          console.log(file.fieldname + ' uploaded to  ' + file.path)
            uploaded = file.name;
            done = true;

        }
    });


    app.post('/image_upload', (req, res, next)=>{
      isLoggedIn(req, res, next);
    }, mult, function(req, res) {

        if (done == true) {

            var upload = req.files;
            console.log(req.decoded.user);
            console.log(upload);

            var fs = require("fs");
            if(!fs.existsSync("./public/img/thumbnails/")){
                fs.mkdir("./public/img/thumbnails/");
            }
            var thumbnail = new Thumbnail('./public/img/', './public/img/thumbnails');

            thumbnail.ensureThumbnail(upload.image.name, 100, 100, function (err, filename) {
                console.log("error", err, filename);
                User.update({Id:req.decoded.user}, {$set:{profile_photo:upload.image.name, profile_thumbnail: filename}}, function(err, num){
                    console.log(num);
                    User.findOne({Id:req.decoded.user}, function(err, data){
console.log("Type", data.type);
                        if (parseInt(data.type) == 2) {

                            User.update({Id:req.decoded.user}, {$set:{profile_photo:upload.image.name, profile_thumbnail: filename}}, function(err, num){

                                res.send({
                                    status:true,
                                    message:"success"
                                });

                            });

                        }else if(parseInt(data.type) == 3){

                            User.update({Id:req.decoded.user}, {$set:{profile_photo:upload.image.name, profile_thumbnail: filename}}, function(err, num){


                                res.send({
                                    status:true,
                                    message:"success"
                                });

                            });


                        }else{

                            User.update({Id:req.decoded.user}, {$set:{profile_photo:upload.image.name, profile_thumbnail: filename}}, function(err, num){


                                res.send({
                                    status:true,
                                    message:"success"
                                });

                            });
                        }

                    });


                });
             });

        } else {
            res.send("failed");
        }

    });




app.get('/Team',  function(req, res){

  User.findOne({team_Id:req.params.Id}).populate('user').exec(function(err, data){
    res.send(data)
});

});


app.get('/user/delete/:Id',  function(req, res){


     User.remove({Id:req.params.Id}, function(err, num){


        res.send(num);
     })

});



app.post('/Team', function(req, res){


     User.update({}, {$set:{team_name:req.body.name}}, function(err, user){

     	res.send(user);

     })

});




// this is a partial script that should be taking out of here during refractoring



//
//  app.post('/upload_csv', mult, function (req, res) {
//
//
//
//     if (done == true) {
//
//        console.log(req.files.image);
//
//         var data = fs.readFileSync((__dirname, "./public/img/"+req.files.image.name), {
//             encoding: 'utf8'
//         });
//
//         var options = {
//             delimiter: ',', // optional
//             quote: '"' // optional
//         };
//
//         json = csvjson.toSchemaObject(data, options);
//
//         console.log(json);
//
//                res.send({
//             status: true,
//             message: "successfully uploaded"
//         });
//         json.forEach(function (obj) {
//
//           console.log(obj);
//
//             obj.created_time = functions.Create;
//
//             User.findOne({
//                 Id: obj.team_Id
//             }, function (err, team) {
//
//                 Invited.create(obj, function (err, email) {
//
//                     var mail = {};
//                     mail.template = "invite";
//                     mail.subject = "Invitation";
//                     mail.first_name = obj.first_name;
//                     mail.team_name = User.team_name;
//                     mail.email = obj.Email;
//
//                     functions.Ema32il(mail);
//
//                 });
//
//             });
//
//         });
//
//
//
// fs.unlink("./public/img/"+req.files.image.name, (err) => {
//       if (err) throw err;
//       console.log('successfully deleted /tmp/hello');
//
//       return true;
//     });
//
//
//     } else {
//         res.send("failed");
//     }
// });





  app.get('/profile/skills', (req, res, next)=>{
    isLoggedIn(req, res, next);
  }, function(req, res){
      User.findOne({Id:req.decoded.user}, function(deverror, dev){
        var devId = req.decoded.user;
           if(deverror) throw deverror;
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

                            // console.log(developer);
                            var date = new Date().toDateString();

                            Duration.find({date: date, developer_Id: devId}, function(err, duration){
                                var time = 0;
                                duration.forEach(function(row){
                                      time += row.duration;
                                });
                                developer.statistics.timeSpent = {
                                  'today': time
                                }
                                console.log(developer.statistics);
                                Duration.find({developer_Id: devId}).sort({updated_time: -1}).limit(1).exec(function(err,row){
                                    developer.statistics.lastActivity = "";
                                    if(row.length > 0){
                                        var x = row[0].updated_time;
                                        developer.statistics.lastActivity = new Date(x);
                                    }
                                    User.findOne({Id: devId}, function(err, dev){
                                        console.log(developer, date);
                                        developer.statistics.skills = dev?dev.skills:[];

                                        res.send({
                                            status: true,
                                            message: "Developer Fetched Successfully",
                                            dev_details: developer,
                                            data:dev
                                        });
                                    });
                                })
                            })

                        }

                    });
                });
            }
      });
  })



  app.post('/profile/skills', (req, res, next)=>{
    isLoggedIn(req, res, next);
  }, function (req, res) {
    var skill = req.body;

    User.update({Id:req.decoded.user},{$addToSet:{skills:skill.name}}, function(err, user){
      if (err) {
        res.send({
          status: false,
          message: "error adding skill",
          error: err
        });
      } else {
        res.send({
          status: true,
          message: "success",
        })
      }
    });

  });

  app.post('/profile/skills/delete/:id', function (req, res) {
    var userId = req.params.id;
    var skill  = req.body.name;

    User.update({Id:userId },{$pull:{skills:skill}}, function(err, user){

      if (err) {
        res.send({
          status: false,
          message: "error removing skill",
          error: err
        });
      } else {
        res.send({
          status: true,
          message: "success",
        })
      }
    });

  });

};
