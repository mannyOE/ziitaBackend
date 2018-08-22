var jwt            = require('jsonwebtoken');
var bcrypt         = require('bcrypt-nodejs');
var express        = require('express');
var app            = express();
var counter        = require('../database/models/counter.js');
var Invites         = require('../database/models/Invited.js');
var User           = require('../database/models/user.js');
var Wallet      = require('../database/models/Wallet.js');
var shortid        = require('shortid');
var async     = require('async');
var baseUrl         = "http://localhost:8080";
var functions      = require('../util/functions')
var isLoggedIn     = functions.isLoggedIn;
var Invited = require('../database/models/Invited.js');


var auth = {
	login: function(req, res){
		req.body.Email = req.body.Email?req.body.Email.toLowerCase():"";
    User.findOne({
      'Email': req.body.Email
    }, function (err, user) {

      if (err)
        throw err;

      if (!user) {



        res.send({
          status: false,
          message: 'Email or password incorrectd'
        });

      } else {
         //console.log(req.body.Password);
          // console.log("user", user);

        bcrypt.compare(req.body.Password, user.Password, function (err, crypt) {

          if (crypt != true) {

            res.send({
              status: false,
              message: 'Email or password incorrects'
            });

          } else {

            var payload = {
              user: user.Id
            }
            var token = jwt.sign(payload, 'I Love Ziita', {
              expiresIn: 86400 * 364
            });

            if(user.status == 2){
            	 res.send({
	                status: true,
	                type: user.type,
	                token: token,
	                message: 'Login Successfull',
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
          }


        });

      }

    });
	},
	session: function(req, res){
		 User.find({Id:req.decoded.user},{Password:0}, function(err, user){
	     	res.send(user);
	     });
	},

  signup: function(req, res){
    var  token = bcrypt.hashSync(shortid.generate()).replace(/[^\w]/g, "");;

    Invites.findOne({Id: req.body.invite_Id},(err, inviteDetail)=>{

          var Email = '';
          if(inviteDetail){
            Email = inviteDetail.Email
          }

            let email = Email?Email:req.body.Email;
            email = email.toLowerCase();

            User.findOne({
              Email: email
            }, function (err, user) {

              if (err) {
                  res.send({
                      status: false,
                      message: "Error searching for user"
                  });
                  return;
              }

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
                req.body.Email = email;

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
                    message: "Account Already Existp"+err
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

                         //SET PERMISSION FOR DIFFERENT USER LEVEL
                         if (type == 1) {

                         } else if (type == 2) {
                         } else if (type == 3) {
                         }
                         if(type != 1) {
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

                         var token = jwt.sign(payload, 'I Love Ziita', {
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
  },


  // resend confirmation controller
  resend_confirmation: function(req, res){
    var email = req.body.Email;
        email = email?email.toLowerCase():"";

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
  },
  // end resend confirmation


// recover password

recover_password: function(req, res){
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
},

// end recover password

// confirm email
confirm_email: function(req, res){
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
      },
      // end confirm email

    // get general info

    get_general: function (req, res){
      var data = {};
        var user = req.decoded.user;
        User.findOne({Id: user}, function (err, userDetail) {
            if (err)
                throw err;
            //console.log(userDetail);

            User.find({team_Id: userDetail.team_Id, Id: {$ne: user}}, function (err, user) {

              data.staff = user.filter(e=>e.type==3||e.type=='3').length;
              data.clients = user.filter(e=>e.type==2||e.type=='2').length;
                        res.send({status: true, data: data});


            });
        });
    },






};

module.exports = auth;