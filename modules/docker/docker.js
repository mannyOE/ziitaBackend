// var cors           = require('cors');
var express        = require('express');
var app            = express();
var functions      = require('../../util/functions');
var Docker           = require('../../database/models/docker.js');
var shortid        = require('shortid');
var isLoggedIn    = functions.isLoggedIn;


module.exports = function (app) {

    // app.get('/doc', (req, res)=>{
    //     var obj = {};
    //     obj.Id = shortid.generate();
    //     obj.name = 'NodeJs Docker';
    //     obj.content= '';
    //     obj.image = '';

    //     let docker = new Docker(obj);
    //     docker.save((err, doc)=>{
    //         if(err) throw err;
    //         res.send('successfully saved docker');
    //     })
    // })





    //create new docker file


    // app.post('/create_dock', (req, res)=>{
    //     req.body.Id = shortid.generate();
    //     if(!req.body.team_Id){
    //         req.body.team_Id = 0;
    //     }
    //     Docker.create(req.body, (err, docker)=>{
    //         if (err) {
    //             res.send({status:false, message:"error creating docker"})
    //         }else{

    //        res.send({status:true, message:" succesfully created docker"});

    //         }
    //     })
    // })

    //find docker by Id
    app.get('/docker_listing/:Id', (req, res)=>{
        Docker.find({team_Id: req.body.team_Id}, (err, docker)=>{
            res.send(docker)
        })
    })

    //list of all docker
    app.get('/dockerFind', (req, res) => {
        Docker.find({}, (err, docker)=>{
            res.send(docker)
        })
    })

    //find docker by team id
    app.get('/docker_list/:team_Id', (req, res)=>{
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
    app.post('/remove_docker', (req, res)=>{
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
    app.post('/create_docker', (req, res)=>{
        console.log('')
        Docker.findOne({Id:req.body.Id}, (err, doc)=>{
            console.log({'1':doc})
            if(!req.body.team_Id){
                console.log(true)
                req.body.team_Id = 0;
            }
            if(!doc){
                req.body.Id = shortid.generate();
                console.log('3')
                Docker.create(req.body, (err, docker)=>{

                    if (err) {
                        res.send({status:false, message:"error creating docker"})
                    }else{
        
                   res.send({status:true, message:" succesfully created docker", "docker":docker});
        
                    }
                })
            } else {
                console.log('4')
                Docker.update({Id:req.body.Id}, {$set:{name: req.body.name, content: req.body.content}}, (err, docker)=>{
                    res.send({status: true, message: "successfully updated docker"})
                })
            }
            
        })
        
        
       
    })
    

}