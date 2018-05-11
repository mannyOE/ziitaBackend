
var cors      = require('cors');
var express   = require('express');
var app       = express();
var async     = require('async');
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
var Skills     = require('../../database/models/skills.js');
var Docker     = require('../../database/models/docker.js');
var jwt            = require('jsonwebtoken');
var shortid        = require('shortid');
var isLoggedIn = functions.adminLoggedIn;
var login = functions._login
module.exports  =function(app){
app.post('/clients/login',(req,res)=>{

	if(req.body.username===login.username && req.body.password==login.password){
		 var token = jwt.sign(login, app.get('superSecret'), {
                           expiresIn: 86400 * 364
                         });
		 res.send({status:true,message:"Login successful",token:token})
	}
	else{
		res.send({status:false,message:"Incorrect login credentials"})
	}

});
app.post('/clients/transactions/:id',isLoggedIn,(req,res)=>{
	transaction_array = [];
	if(!req.params.id){
		res.send({status:false,message:"Error retrieving transactions"})
		return;
	}
	if(!req.body.id){
		console.log(req.params.id)
		Transaction.find({Id:req.params.id},(err,transactions)=>{
			// console.log(transactions)
		transactions.forEach(transaction=>{
			transaction_array.push(transaction);
		})
		res.send({status:true,message:"Transaction history fetched!",transactions:transaction_array});

	}).sort({"created_time":1}).limit(5)
		return;
	}
	Transaction.find({Id:req.params.id,_id:{$gt:req.body.id}},(err,transactions)=>{
		transactions.forEach(transaction=>{
			transaction_array.push(transaction);
		})
		res.send({status:true,message:"Transaction history fetched!",transactions:transaction_array});

	}).sort({"created_time":1}).limit(5)
})
app.get('/clients/delete/:id',isLoggedIn,(req,res)=>{
	if(!req.params.id)
	{
		res.send({ status: false, message: "could not remove company" });
		return;
	}
	var team_Id = req.params.id;
	//delete from user table
	project_array=[];
	User.remove({team_Id:team_Id},function(err,user){
		if(err){
				res.send({ status: false, message: "could not remove company" });
			return;
			}
	developers.remove({team_Id:team_Id},function(err,user){
			if(err){
				res.send({ status: false, message: "could not remove company" });
			return;
			}
	managers.remove({team_Id:team_Id},function(err,user){
			if(err){
				res.send({ status: false, message: "could not remove company" });
			return;
			}
	Projects.find({team_Id:team_Id},function(err,projects){
				if(err){
				res.send({ status: false, message: "could not remove company" });
			return;
			}
			projects.forEach(project=>{
				project_array.push(project.Id);
				// console.log(project_array)
			})
	Projects.remove({Id:{$in:project_array}},function(err,removed){
				if(err){
				res.send({ status: false, message: "could not remove company" });
			return;
		}
	Modules.remove({project_Id:{$in:project_array}},function(err,module){
						if(err){
				res.send({ status: false, message: "could not remove company" });
			return;
		}
					res.send({ status: true, message: "company removed!" });
				})
			})
		})
	})
	})
	})
})
app.post('/clients',isLoggedIn,(req,res)=>{
	     clients_array = [];
	     team_array = [];
	     returnClients = [];
	     var i = 0;
	     var team = { team:'',client:''};
	  		   if(!req.body.id || req.body.id==null){
	     	   User.find({type:"1"},function(err,clients){
	     	   	 // res.send({ status: true, clients:clients});
	     	   	 var search = [];
	     	   	 for(var x = 0; x<clients.length;x++){
	     	   	 	team_array.push(clients[x])
	     	   	 	search.push(clients[x]['team_Id']);
	     	   	 }
              				User.find({team_Id:{$in:search}},function(err,team){
               				Wallet.find({Id:{$in:search}},function(err,wallet){

               				 Bill.find({Id:{$in:search}},function(err,bill){

               				 	 clients.forEach(function(c){
                                  		var members = [];
                                  		var wallet = [];
                                  		var bill = [];
					     	   	 		team.forEach(function(t){
					     	   	 			if(c.Id == t.team_Id){
					     	   	 				members.push(t);
					     	   	 			}
					     	   	 		});
					     	   	 		wallet.forEach(function(w){
					     	   	 			if(c.Id == w.Id){
					     	   	 				wallet.push(w);
					     	   	 			}
					     	   	 		});
					     	   	 		bill.forEach(function(b){
					     	   	 			if(c.Id == b.Id){
					     	   	 				bill.push(b);
					     	   	 			}
					     	   	 		});


					     returnClients.push({"client":c,"team":members,"wallet":wallet,"bill":bill});
					     	   	 })

                         res.send({ status: true, clients:returnClients});

               				 })



               				})



            })

	     }).limit(5).sort({"created_time": 1})
	        return;
	 	}
          	   User.find({type:"1",_id:{$gt:req.body.id}},function(err,clients){
	     	   	 // res.send({ status: true, clients:clients});
	     	   	 var search = [];
	     	   	 for(var x = 0; x<clients.length;x++){
	     	   	 	team_array.push(clients[x])
	     	   	 	search.push(clients[x]['team_Id']);
	     	   	 }
         					User.find({team_Id:{$in:search}},function(err,team){
               				Wallet.find({Id:{$in:search}},function(err,wallet){

               				 Bill.find({Id:{$in:search}},function(err,bill){

               				 	 clients.forEach(function(c){
                                  		var members = [];
                                  		var wallet = [];
                                  		var bill = [];
					     	   	 		team.forEach(function(t){
					     	   	 			if(c.Id == t.team_Id){
					     	   	 				members.push(t);
					     	   	 			}
					     	   	 		});
					     	   	 		wallet.forEach(function(w){
					     	   	 			if(c.Id == w.Id){
					     	   	 				wallet.push(w);
					     	   	 			}
					     	   	 		});
					     	   	 		bill.forEach(function(b){
					     	   	 			if(c.Id == b.Id){
					     	   	 				bill.push(b);
					     	   	 			}
					     	   	 		});


					     returnClients.push({"client":c,"team":members,"wallet":wallet,"bill":bill});
					     	   	 })

                         res.send({ status: true, clients:returnClients});

               				 })



               				})



            })

	     }).limit(5).sort({"created_time": 1})
	  	// })
})
  app.get('/clients/skills',isLoggedIn, function (req, res) {
    Skills.find({}, function (err, skills) {
      if (err) {
        res.send({
          status: false,
          message: "error getting skills",
          error: err
        });
      } else {
        res.send({
          status: true,
          data: skills
        });
      }

    });

  });

  app.post('/clients/skills',isLoggedIn, function (req, res) {
    /** Add a new skill */

    // sug1 = ['vb.net', 'javascript', 'jquery', 'android' , 'php',
    //   'c++', 'python', 'ios', 'django', 'linux','html5', 'r',
    //   'node.js', 'asp.net', 'linq', 'perl','c#', 'java','iphone',
    //   'html', 'css', 'objective-c','ruby-on-rails', 'c','ruby', 'regex',
    //   'neo4j','angularJS','scala','Erlang','wordpress', 'delphi', 'vue'];

    // sug1.forEach(function(data){

      Skills.create({name:req.body.skill}, function (err, skill) {

          if (err) {
        res.send({
          status: false,
          error: err
        });
      } else {
        res.send({
          status: true,
          message: skill
        });
      }

      });

    // });

  });
  app.get('/clients/skills/:skill',isLoggedIn, function (req, res) {
    /** Add a new skill */

    // sug1 = ['vb.net', 'javascript', 'jquery', 'android' , 'php',
    //   'c++', 'python', 'ios', 'django', 'linux','html5', 'r',
    //   'node.js', 'asp.net', 'linq', 'perl','c#', 'java','iphone',
    //   'html', 'css', 'objective-c','ruby-on-rails', 'c','ruby', 'regex',
    //   'neo4j','angularJS','scala','Erlang','wordpress', 'delphi', 'vue'];

    // sug1.forEach(function(data){

    Skills.findOneAndRemove({_id: req.params.skill}, function(err, skill){
            // console.log({docker})
            if(err){
                res.send({status: false, message: err})
            } else{
                res.send({status: true, message: 'successfully deleted skill'})
            }
        } )

    // });

  });

    //find docker by team id
    app.get('/clients/docker_list/:team_Id',isLoggedIn, (req, res)=>{
        console.log({'id': req.params.team_Id})

        Docker.find({ $or : [
            {team_Id: req.params.team_Id},
            {team_Id: '0'}
        ]}, (err, docker)=>{
            console.log({'docker': docker});

            if(err){
                res.send({status: false, message:'error retrieving docker files'})
            }
            res.send({status: true, message: docker})
        })
    })

    // app.post('/update_docker_project/:id', (req, res)=>{
    //     dockerId = req.params.id;

    // })

    //delete a docker file
    app.post('/clients/remove_docker',isLoggedIn, (req, res)=>{
        Docker.findOneAndRemove({Id: req.body.Id}, function(err, docker){
            console.log({docker})
            if(err){
                res.send({status: false, message: err})
            } else{
                res.send({status: true, message: 'successfully deleted docker'})
            }
        } )
        dockerId = req.params.id;

    })

    //create a docker
    app.post('/clients/create_docker',isLoggedIn,(req, res)=>{
        console.log('')
        Docker.findOne({Id:req.body.Id}, (err, doc)=>{
            if(!req.body.team_Id){
                console.log(true)
                req.body.team_Id = 0;
            }
            if(!doc){
                req.body.Id = shortid.generate();
                Docker.create(req.body, (err, docker)=>{

                    if (err) {
                        res.send({status:false, message:"error creating docker"})
                    }else{

                   res.send({status:true, message:" succesfully created docker", "docker":docker});

                    }
                })
            } else {
                Docker.update({Id:req.body.Id}, {$set:{name: req.body.name, content: req.body.content}}, (err, docker)=>{
                    res.send({status: true, message: "successfully updated docker"})
                })
            }

        })



    })
}
