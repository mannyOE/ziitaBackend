
var functions   = require('../../util/functions');
var Filter      = require('../../util/Filter');
var User        = require('../../database/models/user.js');
var Projects    = require('../../database/models/projects.js');
var Module      = require('../../database/models/module.js');
var isLoggedIn  = functions.isLoggedIn;



module.exports = function(app){
    var alert_team = function(data, template){


        data.forEach(function(user){

            User.find({Id:user.developer_Id}, function(err, single){

                mail.template       = template;
                mail.subject        = "Natterbase Notifications";
                mail.first_name     = single.first_name ;
                mail.module_name    = user.module_name;
                mail.email          = single.Email;

                functions.Email(mail);

            });

        });

    };

    app.get('/messages/:recipientId',  function(req, res){
        /**
         * Get all messages for between a user and reciepient
         */

        req.body.Id           = shortid.generate();
        req.body.updated_time = new Date().getTime();
        req.body.created_time = new Date().getTime();
        Module.create(req.body, function (err, module) {

            if (err) {

                res.send({
                    status: false,
                    message: "error creating module"
                });
            } else {

                alert_team([{developer_Id:req.body.developer_Id}], "module_assigned_alert");

                res.send({
                    status: true,
                    message: "success",
                    Id: req.body.Id
                })
            }


        });



    });

    app.post('/messages', function(req, res){
        /**
         * Send a message
         */

        Module.update({Id:req.params.Id}, {$set:{developer_Id:req.body.Id}}, function(err, module){

            Module.find({Id:req.params.Id}, function(err, module){

                alert_team(module, "module_assigned_alert"); 

                res.send({status:true, message:"module assigned"});

            });

        });

    });

    app.get('/messages/markread/:id', function(req, res){
        /**
         * Mark a conversation as read by user id and recipient id
         */


        Module.update({Id:req.params.Id}, {$set:{developer_Id:req.body.Id}}, function(err, module){

            Module.find({Id:req.params.Id}, function(err, module){

                alert_team(module, "module_assigned_alert");

                res.send({status:true, message:"module assigned"});

            });

        });

    });

    app.delete('/messages/:id', function(req, res){
        /**
         * Delete a message by id
         */

        Module.find({Id:req.params.Id}, function(err, module){

            if (!module) {

                res.send({status:false, message:"Module not found"});
                return;
            }

            Module.remove({Id:req.params.Id}, function(err, num){

                alert_team(module, "module_delete_alert");

                res.send({status:true, message:"module removed"});

            });
        });
    });
};




            
  