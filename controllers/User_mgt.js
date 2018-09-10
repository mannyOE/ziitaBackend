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


var UserMgt = {  

// send invite

invite_user: function(req, res){
  req.body.created_time = new Date().getTime();
        req.body.Id = shortid.generate();

        req.body.Email = req.body.Email.toLowerCase();
        // console.log(req.body);

            User.findOne({Id: req.body.team_Id}, function (err, team) {

                if (!team) {

                    res.send({
                        status: false,
                        message: 'Team not found'
                    });

                    return;
                }

                Invited.findOne({Email: req.body.Email}, function (err, user) {

                    var send_mail = function () {

                        var mail = {};
                        mail.template = "invite";
                        mail.subject = "Account Invitation";
                        mail.first_name = req.body.first_name;
                        mail.team_name = team.team_name;
                        mail.email = req.body.Email;
                        mail.link = 'https://' + hostname + '/signup/' + req.body.team_Id + '/' + req.body.type + '/' + req.body.Id;

                        functions.Email(mail);
                    }


                    if (user) {

                        send_mail();

                        res.send({
                            status: true,
                            message: 'Invite sent again'
                        });
                    } else {


                        Invited.create(req.body, function (err, email) {

                            if (err) {

                                res.send({
                                    status: false,
                                    message: 'Error Inviting User'
                                });
                            } else {

                                send_mail();

                                res.send({
                                    status: true,
                                    message: 'invite sent succesfully'
                                });

                            }

                        });
                    }


                });

            });
        },

    // end send invite

    // get general info

    get_clients: function (req, res){
      var data = {};
        var user = req.decoded.user;
        User.findOne({Id: user}, function (err, userDetail) {
            if (err)
                throw err;
            //console.log(userDetail);
            Invited.find({team_Id: userDetail.team_Id}, (err, inv)=>{

              User.find({team_Id: userDetail.team_Id, Id: {$ne: user}}, function (err, user) {

                data.staff = {
                  confirmed: user.filter(e=>e.type==3||e.type=='3'),
                  pending: inv
                };
                data.clients = user.filter(e=>e.type==2||e.type=='2');
                          res.send({status: true, data: data});


              });
            })
        });
    },


    save_clients: (req, res, next)=>{
        req.body.created_time = new Date().getTime();
        var password = shortid.generate();
        req.body.Id = shortid.generate();
        req.body.type = 2;
        req.body.status = 2;
        req.body.Password = bcrypt.hashSync(password);
        req.body.Email = req.body.Email.toLowerCase();
        // console.log(req.body);
        User.findOne({Email: req.body.Email}, function (err, user) {                
            if(user){
                 res.send({
                    status: true,
                    message: 'invite sent succesfully'
                });
                 return;
            }
            console.log(password);
             var send_mail = function () {
                var mail = {};
                mail.template = "invite";
                mail.subject = "Portal Account Created"+password;
                mail.first_name = req.body.first_name;
                mail.team_name = "CDMI Online";
                mail.email = req.body.Email;
               
                functions.Email(mail);
            }
            var u_ser = new User(req.body);
            send_mail();
            // u_ser.save();
            res.send({
                status: true,
                message: 'Client Enrollment Complete'
            });
            return;
        });
    }






};

module.exports = UserMgt;