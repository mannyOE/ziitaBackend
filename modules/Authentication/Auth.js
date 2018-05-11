 var cors           = require('cors');
var express        = require('express');
var app            = express();
var functions      = require('../../util/functions');
var jwt            = require('jsonwebtoken');
var bcrypt         = require('bcrypt-nodejs');
var roles            = require('../../database/models/roles.js');
var counter        = require('../../database/models/counter.js');
var Invites         = require('../../database/models/Invited.js');
var User           = require('../../database/models/user.js');
var Developer      = require('../../database/models/developers.js');
var Manager        = require('../../database/models/manager.js');
var shortid        = require('shortid');
var baseUrl         = "http://localhost:8080";
var isLoggedIn     = functions.isLoggedIn;


module.exports = function (app) {


    app.post('/resend_confirmation', function (req, res) {
        var email = req.body.Email;
        User.findOne({Email: email}, function (err, user) {
            var token = bcrypt.hashSync(shortid.generate()).toString().replace(/[^\w]/g, "");

            if (user) {
                User.update({Email: email}, {
                    $set: {
                        confirmation_token: token,
                        token_expires: new Date().getTime() + (2 * 60 * 60 * 1000)
                    }
                }, function (err, num) {

                    data = {};
                    data.token = token;
                    data.template = "mail";
                    data.first_name = user.first_name;
                    data.email = email;
                    data.subject = "Confirmation Mail";
                    functions.Email(data);
                    res.send({status: true, message: "Confirmation Mail Sent"});

                });

            } else {

                res.send({status: false, message: "User does not exist"})
            }
        });
    });

    app.post('/confirm_email', function (req, res) {
        var token = req.body.token || "";
        if(token.trim().length > 0) {
            User.findOne({confirmation_token: token}, function (err, user) {

                if (user) {
                    if(new Date().getTime() > user.token_expires){
                        res.send({status: false, message: "Invalid Confirmation Token Submitted"})
                        return;
                    }

                    User.update({confirmation_token: token}, {
                        $set: {
                            confirmation_token: "",
                            token_expires: "",
                            status: 2
                        }
                    }, function (err, num) {

                        res.send({status: true, message: "Email Address Confirmed Successfully"});

                    });

                } else {
//00012
//00113

                    res.send({status: false, message: "Invalid Confirmation Token Submitted"})
                }
            });
        }else{
            res.send({status: false, message: "Invalid Confirmation Token Submitted"});
        }
    });


    app.post('/signup', function (req, res) {

  var  token = bcrypt.hashSync(shortid.generate()).replace(/[^\w]/g, "");;

    Invites.findOne({Id: req.body.invite_Id},(err, inviteDetail)=>{

          var Email = '';
          if(req.body.Email.length === 0 && inviteDetail){
            Email = inviteDetail.Email
          }

            User.findOne({
              Email: req.body.Email || Email
            }, function (err, user) {
              console.log("1", user)
              if (err)
                return done(err);

              if (user == null) {
            var sequenceName = "users";
           counter.findOne({_id: sequenceName}, function (err, data) {

               var gen_id = 20;

               if(data) {
                   counter.update({_id: sequenceName}, {$inc: {sequence_value: 1}}, function(err, mod){
                   });
                   gen_id = data.sequence_value + 1;
               }else{
                   counter.create({_id: sequenceName, sequence_value: 20});
               }

               req.body.Password = bcrypt.hashSync(req.body.Password);
               req.body.confirmation_token    = token;
                var new_Id_digit = gen_id;
                req.body.Id = functions.genId(new_Id_digit, 6);
                req.body.created_time = new Date().getTime();

                var type = parseInt(req.body.type);

                //append email of invite since its not provided from signup
                req.body.Email = req.body.Email || Email

                if(type == 1){
                    req.body.team_Id = req.body.Id;
                }

                if(type !== 1){
                  req.body.status = 2;
                }else{
                    req.body.confirmation_token = token;
                    req.body.token_expires = new Date().getTime() + (2 * 60 * 60 * 1000);
                }




              User.create(req.body, function (err, user) {
                if (err) {

                  res.send({
                    status: false,
                    message: "Account Already Exist"
                  });

                } else {
                      // Invites.findOne({Id: req.body.Id}, function(err, invite){
                        Invites.findOne({Id: req.body.invite_Id}, function(err, invite){

                         if(err){
                           req.body.team_Id = "";
                         }

                        if (req.body.invite_Id) {

                            var query = {
                            Id: req.body.invite_Id
                            };

                          };

                         if (type == 1) {
                              functions.create_team(req.body);
                         } else if (type == 2) {
                              functions.create_managers(req.body);
                              functions.remove_Invited(query);
                         } else if (type == 3) {
                              functions.create_developers(req.body);
                              functions.remove_Invited(query);
                         }

                         var mail = {};
                         mail.template   = "mail";
                         mail.subject    = "Confirmation Mail";
                         mail.first_name = req.body.first_name;
                         mail.email      = req.body.Email;
                         mail.Id         = req.body.Id;
                         mail.token      = req.body.confirmation_token;

                        if(type == 1){
                          functions.Email(mail);
                        }

                        var payload = {
                            user: req.body.Id
                          };

                         var token = jwt.sign(payload, app.get('superSecret'), {
                           expiresIn: 86400 * 364
                         });

                          if(type == 2 ){
                              res.send({
                              status: true,
                              message: "Signup Successful",
                              type: req.body.type,
                              token: token,
                              Email: req.body.Email
                            });
                          }
                          if(type == 3){
                            res.send({
                              status: true,
                              type: req.body.type,
                              message: 'Please check your email for procedures to login on the desktop application'
                            })
                          }
                          if(type == 1){
                            res.send({
                              status: true,
                              type: req.body.type,
                              message: 'A confirmation mail has been sent to your account. Please confirm'
                            })
                          }




                      });
                }
          });


        });
      } else {

        res.send({
          status: false,
          message: "Email Already Exist"
        });

      }

    });
    })


  });




  app.post('/login', function (req, res) {

      // console.log(req.path);

    User.findOne({
      'Email': req.body.Email
    }, function (err, user) {

      if (err)
        throw err;

      if (!user) {



        res.send({
          status: false,
          message: 'Email or password incorrect'
        });

      } else {
         //console.log(req.body.Password);
          // console.log("user", user);

        bcrypt.compare(req.body.Password, user.Password, function (err, crypt) {

          if (crypt != true) {

            res.send({
              status: false,
              message: 'Email or password incorrect'
            });

          } else {

            var payload = {
              user: user.Id
            }
            var token = jwt.sign(payload, app.get('superSecret'), {
              expiresIn: 86400 * 364
            });

            if(user.status == 2){

              // get permissions and send along with the payload
              roles.find({Id: user.Id}, (err, perms)=>{
                // if no permissions, set default permissions
                if(!perms){
                  functions.checks(user.Id, user.type);
                }
                res.send({
                status: true,
                message: "Login Successful",
                type: user.type,
                token: token,
                dis_user: perms,
                userStatus: user.status,
              });
              })
            }

            if(user.status == 1) {
              res.send({
                status: false,
                type: user.type,
                message: 'Unconfirmed Account. Please check your mail',
              userStatus: user.status,

              })
            }

            if(user.status == 3){
              res.send({
                status: false,
                type: user.type,
                message: "Please check your email for procedures to login on the desktop application"
              })
            }



          }


        });

      }

    });

  });

  app.post('/recover_password', function(req, res){

    var token = bcrypt.hashSync(shortid.generate());
    token = token.replace(/\/|\./g,"")
    User.findOne({Email:req.body.email}, function(err, user){

      if (user) {

        User.update({Email:req.body.email}, {$set:{token:token}}, function(err, num){

             data          ={};
             data.token    = token;
             data.template = "reset_password";
             data.email    = req.body.email;
             data.subject  = "Password Reset Request";
             data.link      = baseUrl + '/newPassword/'  ;
            functions.Email(data);

            res.send({status:true, message:"Email Sent to"+" "+req.body.email});

         });

      }else{

        res.send({status:false, message:"User does not exist"})
      }

       });
  });


  app.post('/confirm_password', function(req, res){

     User.findOne({token:req.body.token}, function(err, user){

             if (user) {

                   var Password = bcrypt.hashSync(req.body.Password);

                   User.update({token:req.body.token}, {$set:{Password:Password}}, function(err, num){

                         res.send({status:true, message:"Password Updated!!!"});

                   });

             }else{

                res.send({status:false, message:"Wrong Token"});
             }

     });

  });

  app.post('/confirm_account', function(req, res){

     User.findOne({token:req.body.token}, function(err, user){

             if (user) {
               //  set default permissions for user
                  functions.checks(user.Id, user.type);

                   User.update({token:req.body.token}, {$set:{status:2}}, function(err, num){

                         res.send({status:true, message:"Account Activated"});

                   });



             }else{

                res.send({status:false, message:"Wrong Token"});
             }

     });

  });


  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

   app.get("/userFind", function(req, res){
        User.find({}, function(err, user){
           res.send(user);
        });
   });


    app.get("/teamFind", function(req, res){
        User.find({team_name:{$ne:null}}, function(err, user){
            res.send(user);
        });
    });


    app.get("/userDelete/:id", (req, res,next)=>{
      isLoggedIn(req, res, next)
    },function(req, res){
        User.remove({Id: req.params.id}, function(err, mod){
            Developer.remove({Id: req.params.id}, function(err, mod){
                Manager.remove({Id: req.params.id}, function(err, mod){
                    res.send({message: "Deleted"});
                });
            });
        })
    });


}
