var cors      = require('cors');
var express   = require('express');
var app       = express();
var async     = require('async');
var Module = require('../../database/models/module.js');
var functions = require('../../util/functions');
var constants = require('../../util/constants');
var User      = require('../../database/models/user.js');
var Teams     = require('../../database/models/Team.js');
var roles     = require('../../database/models/roles.js');
var Invited   = require('../../database/models/Invited.js');
var developers= require('../../database/models/developers.js');
var managers  = require('../../database/models/manager.js');
var Projects  = require('../../database/models/projects.js');
var Wallet 	  = require('../../database/models/Wallet.js');
var Bill 	  = require('../../database/models/bills.js');
var Transaction = require('../../database/models/Transactions.js')

var Card           = require('../../database/models/Card.js');

var Modules  = require('../../database/models/module.js');

var isLoggedIn= functions.isLoggedIn;
var role = functions.roleCheck;
var csvjson   = require('csvjson');
var baseUrl   = "http://localhost:8080";
var Url = "zeedas.com"
var shortid   = require('shortid');
var cmd       = require('node-cmd');




module.exports = function(app, io){

app.get('/invite/:Id', (req, res,next)=>{
	isLoggedIn(req, res, next)
}, function (req, res) {


			Invited.find({
				team_Id : req.params.Id
			}, function (err, invited) {

				res.send({
					status: true,
					count: invited.length,
					data: invited
				});

			})

		});



		app.get('/singleInvite/:id', (req, res,next)=>{
			isLoggedIn(req, res, next)
		},  function (req, res) {


				  Invited.find({
					  Id : req.params.id
				  }, function (err, invited) {

					  res.send({
						  status: true,
						  data: invited
					  });

				  })

			  });


		app.post('/Invite',  (req, res,next)=>{
      isLoggedIn(req, res, next)
    }, function (req, res) {

				req.body.created_time = functions.Create();
				req.body.Id           = shortid.generate();

				console.log(req.body);

			User.findOne({Email: req.body.Email}, (err, user)=>{
				if(!user){
					Teams.findOne({Id:req.body.team_Id}, function(err, team){

				if (!team) {

              res.send({
						  status: false,
						  message: 'Team not found'
					    });

              return;
				}

				Invited.findOne({Email:req.body.Email}, function(err, user){

          var send_mail = function(){

              var mail            = {};
                mail.template       = "invite";
                mail.subject        = "Account Invitation";
                mail.first_name     = req.body.first_name;
                mail.team_name      = team.team_name;
                mail.email          = req.body.Email;
                mail.link           = 'https://'+hostname+'/signup/'+req.body.team_Id+'/'+req.body.type+'/'+req.body.Id;

                functions.Email(mail);
			}


                 if (user) {

                  send_mail();

            res.send({
						status: true,
						message: 'Invite sent again'
					 });
                 }else{



			Invited.create(req.body, function (err, email) {

				if (err) {

					res.send({
						  status: false,
						  message: 'Error Inviting User'
					    });
				}else{

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
				}else{
					res.send({status:false, message:'user with this email already exists'})
				}
			})


		});


		app.get('/getTeamByUserId/:Id', (req, res,next)=>{
      isLoggedIn(req, res, next)
    },  function (req, res) {
		// console.log("1");
				developers.findOne({
					Id: req.decoded.user
				}, function (err, user) {
					if(user){
						// console.log(user);
						res.send({
							team_Id: user.team_Id || 0,
							status: true

						});
						return;
					}

                	managers.findOne({
					Id: req.params.Id
						}, function (err, pms) {
					if(pms){
						// console.log(pms)
						res.send({
							status: true,
							team_Id: pms.team_Id
						});
						return;
					}
					Teams.findOne({
						Id: req.params.Id
						}, function (err, pms) {
						if(pms){
							res.send({
								status: true,
								team_Id: pms.Id
							});
							return;
						}
						res.send({status: false, team_Id: ""});

				});

			});
		});
	})





		app.get('/Team/:Id',
		(req, res,next)=>{
			isLoggedIn(req, res, next)
		}, function (req, res) {

			developers.find({
				team_Id: req.params.Id
			}, function (err, user) {
				managers.find({
				team_Id: req.params.Id
			}, function (err, pms) {
			 var Team = user.concat(pms);

				res.send({
					status: true,
					count: Team.length,
					data: Team
				});

				});

			});

		});



      app.get('/general/:Id', (req, res, next)=>{
				isLoggedIn(req, res, next);
			}, function (req, res) {

        var data = {};
		User.findOne({Id: req.decoded.user}, function(err, userDetail) {
			if(err)
				throw err;
				console.log(userDetail);

			developers.find({team_Id: userDetail.team_Id}, function (err, user) {
				managers.find({team_Id: userDetail.team_Id}, function (err, pm) {

					var Team = user.concat(pm);
					data.people = Team.length;
					data.active = 0;
					data.completed = 0;
					var search = {company_Id: userDetail.team_Id};
					if(userDetail.type == 2){
						search.manager_Id = userDetail.Id;
					}
					Projects.find(search, function (err, projects) {

						//err, projects);
						projects.forEach(function (project) {

							if (project.status == 1) {
								data.active++;``
							} else {
								data.completed++;
							}
						});

						res.send({status: true, data: data});
					});

				});

			});
		});
      });


      app.get('/hireables/',  function (req, res) {
		  /**
		   * Get all pms and developers without a team
		   * on the platform
		   */

		  var query = {
			  team_Id: null,
		  }

        developers.find(query, function (err, developers) {
          managers.find(query, function (merr, pms) {

        	var people = developers.concat(pms);
        	var data = people;

			if (err || merr) {
				res.send({
					status: false,
					message: 'failed to get people',
					error: err || merr,
				});
			} else {
				res.send({
					status: true,
					data: data
				});
			}

          });

        });

      });

		app.post('/hireables/request/:id', (req, res,next)=>{
      isLoggedIn(req, res, next)
    }, function (req, res) {
			/**
			 * Email a pm or dev from platform to to confirm hire
			 * id: user id
			 * team_id: team id
			 */

				var params = req.params;
				var args = req.body;
				var teamId = args.team_id;
				var userId = req.decoded.id;

			// Get team hiring the user
			Teams.findOne({Id: teamId}, function(err, team){

				if (!team) {
					res.send({
						status: false,
						message: 'Team not found'
					});

					return;
				}

				// Get user to be hired
				User.findOne({Id: userId}, function(uerr, user){

					// if no user with that id was found
					if (!user) {
						res.send({
							status: false,
							message: 'User not found'
						});

						return;
					}

					var userType = user.type;

					// Send request to user
					var confirm_link = constants.hire_confirmation_page + teamId + '&userId=' + userId;

					// Send email
					functions.Email({
						template: 'request_hire',
						subject: 'Invitation',
						first_name: user.first_name,
						team_name: team.team_name,
						email: user.Email,
						link: confirm_link,
					});

					res.send({
						status: true,
						message: 'Requested to hire'
					});

			   });

		   });

		});

		app.get('/hireables/confirm/:user_id/:team_id',function (req, res) {
			/**
			 * Confirm request to hire dev
			 */

			var params = req.params;
			var userId = params.user_id;
			var teamId = params.team_id;
			var query = {
				Id: userId,
				team_Id: null,
			};

			// Get pm
			managers.findOne(query, function(perr, pm){

				var user = pm;
				var addToTeam = function () {
					// add team id to either the pm or dev
					user.team_Id = teamId;
					user.save();

					res.send({
						status: true,
						message: 'User hired'
					});
				};

				// if user id is not for a pm
				if (!pm) {
					// try a dev
					developers.findOne(query, function(derr, dev){

						user = dev;

						// if user isn't available
						if (!user) {
							res.send({
								status: false,
								message: 'User not found'
							});
							// return;
						} else {
							addToTeam();
						}
					});
				} else {
					addToTeam();
				}
			});

		});




			app.get('/project/Team/:Id', (req, res,next)=>{
	      isLoggedIn(req, res, next)
	    },  function (req, res) {

		Projects.findOne({Id: req.params.Id}, function (err, project) {

			console.log('project team found');

			var	Team = project ? project.team : [];

			// console.log(Team);
					res.send({
					status: true,
					count: Team.length,
					data: Team
				});

					});

				});


			app.get('/remove/:Id/:developer_Id', (req, res,next)=>{
	      isLoggedIn(req, res, next)
	    },  function (req, res) {
				User.findOne({Id:req.params.developer_Id}, function(err, user){

					Projects.findOne({Id: req.params.Id}, (err, project)=>{
						console.log('wow three here')
					Projects.update({
						Id: req.params.Id
					  }, {
						$pull: {
						  team: req.params.developer_Id
						}
					  }, function (err, num) {
						// console.log('me is here')
						// dataProject = {
						// 	Id: user.Id,
						// 	message: `You have been removed from Project ${project.project_name}`
						// }
						// console.log('am here')
						// data = {
						// 	Id: project.manager_Id,
						// 	message: `You removed ${user.last_name} ${user.first_name} from Project ${project.project_name}`
						// }
						// console.log('you too')
						// functions.Notify(data, io),
						// functions.Notify(dataProject, io)
						if(!err){
							res.send({
								status: true,
								message: "success"
							});
						}
						else{
							res.send({
								status:false,
								message:"Developer could not be removed"
							});
						}



					  });
					})

				})



				return;
				//ALUSED CODE. PLEASE IGNORE
				User.findOne({Id:req.params.Id}, function(err, data){

               	      if (parseInt(data.type) == 2) {

               	      	console.log("user pm");

               	    managers.update({Id:req.params.Id}, {$set:{company_Id:"000000", status:4}}, function(err, num){


                 res.send({
                         	status:true,
                         	message:"success"
                         });

               });

               	      }else if(parseInt(data.type) == 3){

               	 developers.update({Id:req.params.Id}, {$set:{company_Id:"000000", status:4}}, function(err, num){


                 res.send({
                         	status:true,
                         	message:"success"
                         });

               });


               	      }else{

               	      	res.send({
                         	status:false,
                         	message:"Client Cannot be deleted"
                         });
               	      }

               });




		   });


	app.get('/suspend/:Id', function (req, res) {


      	User.findOne({Id:req.params.Id}, function(err, data){

               	      if (parseInt(data.type) == 2) {

               	    managers.update({Id:req.params.Id}, {$set:{status:0}}, function(err, num){
						User.update({Id:req.params.Id}, {$set:{status:0}},function(){});
						 res.send({
									status:true,
									message:"Success"
								 });
						});
               	      }else if(parseInt(data.type) == 3){

						 developers.update({Id:req.params.Id}, {$set:{status:0}}, function(err, num){
							 User.update({Id:req.params.Id}, {$set:{status:0}},function(){});
						 	res.send({
									status:true,
									message:"Success"
								 });
					   });
               	     }else{
               	      	res.send({
                         	status:false,
                         	message:"Client Cannot be suspended"
                         });
               	      }

               });

		   });

	app.get('/delete_user/:Id',(req, res,next)=>{
		isLoggedIn(req, res, next)
	}, (req, res) => {
		User.find({Id: req.params.Id}, (err, user) => {
			var user_Id = req.params.Id;
			if(user.type == 1){
				res.send({ status: false, message: "Cant delete a team"});
				return;
			}

			if(user.type == 2){
				managers.remove({Id: req.params.Id}, function(err, status){
					Projects.update({team: {$in:[user_Id]}},{$pull: {team: user_Id}}, function (err, num) {
						res.send({ status: true, message: "Deleted Successfully"});
					});
				});
			}else{
				developers.remove({Id: req.params.Id}, function(err, status){
					Projects.update({team: {$in:[user_Id]}},{$pull: {team: user_Id}}, function (err, num) {
						res.send({ status: true, message: "Deleted Successfully"});
					});
				});
			}
			Modules.update({developer_Id: user_Id}, {developer_Id: ""}, function(err, num){

			});
		})
	})

		app.get('/activate/:Id', function (req, res) {


          	User.findOne({Id:req.params.Id}, function(err, data){

               	      if (parseInt(data.type) == 2) {

               	    managers.update({Id:req.params.Id}, {$set:{status:2}}, function(err, num){

						User.update({Id:req.params.Id}, {$set:{status:2}},function(){});
                 res.send({
                         	status:true,
                         	message:"success"
                         });

               });

               	      }else if(parseInt(data.type) == 3){

               	 developers.update({Id:req.params.Id}, {$set:{status:2}}, function(err, num){
					 User.update({Id:req.params.Id}, {$set:{status:2}},function(){});

                 res.send({
                         	status:true,
                         	message:"success"
                         });

               });


               	     }else{

               	      	res.send({
                         	status:false,
                         	message:"Client Cannot be Activated"
                         });
               	      }

               });

		   });


			 //  Set default permissions
 			 app.get('/default_permissions', (req, res)=>{
 					User.find({type: 1}, (err, user_array)=> {
 						if(err){
 							throw err;
 						}else{
 							// console.log(user_array);
 							user_array.forEach((user)=>{
 								functions.checks(user.Id, user.type);
 							});
 							res.send({
 								status: true,
 								message: "Done"
 							});
 						}
 					});

 			 });





 			//change permissions
 			 app.post('/administrator/setPermission',(req, res,next)=>{
	       isLoggedIn(req, res, next)
	     }, (req, res)=>{
 				 	var data = req.body;


 						// console.log(doc);
 						if(data.State === false){
 							roles.remove({ Id: data.Id, Permission: data.Permission}, (err)=>{});
 						}else{
 							roles.create({ Id: data.Id, Permission: data.Permission, State: true}, (err)=>{});
 						}
 						roles.find({Id: data.Id}, (err, docs)=>{
 							res.send({
 								status: true,
 								message: 'Success',
 								more: docs
 							});
 						});
 			 });


 			//  Get Permissions

 			app.get('/administrator/permission/:Id', (req, res,next)=>{
	      isLoggedIn(req, res, next)
	    }, (req, res)=>{

 				 roles.find({ Id: req.params.Id}, (err, result)=>{
 					 if(err){
 						 res.send({
 							 status: false,
 							 message: 'Failed'
 						 });
 					 }else{
 						 var enton = [];
 						 result.forEach((ret)=>{
 							 enton.push(ret.Permission);
 						 });
 							 var fg = [];
 							 functions.permUtil.permissionsArray.forEach((perm)=>{
 								 fg.push(perm.Permission);
 							 })
 							 var force = fg.filter(f => !enton.includes(f));
 							  res.send({
 	 							 status: true,
 	 							 message: 'Success',
 	 							 data: result,
 	 							 more: force,
 	 						 });

 					 }
 				 });
 			});







		   //debugging database

			 app.get('/finders', (req, res)=>{
				 let rays = functions.permUtil.permissionsArray;
				 let jays = [];
			    for (var i=0; i < rays.length; i++) {
			        if (rays[i].default_client === true) {
			            jays.push(rays[i].Permission);
			        }
			    }
					res.send({
						data: jays
					})

			 })

	//find user
	app.get('/userFind', (req, res) => {
		User.find({}, (err, user) => {
			res.send({ user })
		})
	})
	//find a user by id
	app.get('/user/:Id', (req, res) => {
		User.findOne({ Id: req.params.Id }, function (err, user) {
			res.send(user)
		})
	})

	//delete a particular user
	app.get('/deleteUser/:Id', function (req, res) {

		User.remove({ Id: req.params.Id }, function (err, num) {

			res.send({ status: true, message: "user deleted succesfully" });

		});

	});

	//change a particular password for a user
	app.post('/userPassword/:Id', (req, res) => {
		User.update({ Id: req.params.Id }, { Password: '' }, function (err, user) {
			res.send({ user })
		})
	})
	//find all invites
	app.get('/inviteFind', (req, res) => {
		Invited.find({}, (err, invite) => {
			if (err) throw err;
			res.send({ invite })
		})
	})
	//delete a particular invite
	app.get('/deleteInvite/:Id', function (req, res) {

		Invited.remove({ Id: req.params.Id }, function (err, num) {

			res.send({ status: true, message: "category deleted succesfully" });

		});

	});

	//find all users in a particular team
	app.get('/teamFind/:Id', function (req, res) {

		developers.find({
			team_Id: req.params.Id
		}, function (err, user) {
			// console.log(user)
			managers.find({
				team_Id: req.params.Id
			}, function (err, pms) {

				var Team = user.concat(pms);
				//  console.log(user, pms, Team)

				res.send({
					status: true,
					count: Team.length,
					data: Team
				});

			});

		});

	});
	//find all developers
	app.get('/developerFind', (req, res) => {
		developers.find({}, (err, user) => {
			res.send({ user })
		})
	})
	//delete a developer
	app.get('/deleteDeveloper/:Id', function (req, res) {

		developers.remove({ Id: req.params.Id }, function (err, num) {

			res.send({ status: true, message: "user deleted succesfully" });

		});

	});
	// find all managers
	app.get('/managerFind', (req, res) => {
		managers.find({}, (err, user) => {
			res.send({ user })
		})
	})
	//delete a manager
	app.get('/deleteManager/:Id', function (req, res) {

		managers.remove({ Id: req.params.Id }, function (err, num) {

			res.send({ status: true, message: "user deleted succesfully" });

		});

	});


		//find all projects
	app.get('/projectFind', function(req, res){
		Projects.find({}, (err, project)=>{
			res.send(project)
		})
	})
	app.get('/deleteProject/:Id', (req, res)=>{
		Projects.remove({Id: req.params.Id}, (err, project)=>{
			res.send('project successfully deleted')
		})
	})




};
