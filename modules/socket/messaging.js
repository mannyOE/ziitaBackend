var cors          = require('cors');
var express       = require('express');
var app           = express();
var functions     = require('../../util/functions');
var term          = require('../../util/term');
var User      = require('../../database/models/user.js');
var http          = require('http').Server(app)
var isLoggedIn    = functions.isLoggedIn;
var Messages      = require('../../database/models/messages.js')
global.io         = require('socket.io')(http)
var shortid       = require('shortid');
var Notifications= require('../../database/models/notification.js')

// var pty       = require('pty.js');



module.exports = function (app, io){


  var save_message =  function(data){
       // console.log("musa uasasasassa")
    data.time_stamp = new Date().getTime();
    data.updated_stamp = new Date().getTime();
    Messages.create(data, function(err, message){
      console.log("message",message)
    });

  }

  var update_message =  function(data, status){

    Messages.update({Id:data.Id},{$set:{status:status, updated_stamp:Date.now()}}, function(err, message){
      console.log("update error", data, message, "error:", err);
    });

  }

app.get('/messaging', (req,res,next)=>{
  isLoggedIn(req,res,next)
}, (req, res)=>{

     message_array = [];
     Id            = req.decoded.user;
     // console.log("my Idzzzzzzzzzzzzzzzzzzz", Id)
    Messages.find({ $or: [{sender: Id}, {recipient: Id }] } , function(err, message){

           message.forEach(function(data){
            message_array.push(data);
                 //if (data.sender == Id) {
                 //            if (message_array[data.receiver]) {
                //               message_array[data.receiver].push(data);
                //             }else{
                //               message_array[data.receiver] = [];
                //             }
                // }else{
                //     if (true) {
                //       message_array[data.sender].push(data);
                //     }else{
                //       message_array[data.sender] = [];
                //     }
                // }
           });
           res.send({status:true, count:message.length, data:message_array});
    }).sort( { time_stamp: -1 } ).limit(20)

});
//set all to offline
   User.update({},{$set:{isOnline:0}},(err,res)=>{

                    })
app.get('/messaging/all', isLoggedIn, (req, res)=>{

     message_array = [];
     Id            = req.decoded.user;
     //console.log("my Idzzzzzzzzzzzzzzzzzzz", Id)
    Messages.find({ $or: [{sender: Id}, {recipient: Id }] } , function(err, message){

           message.forEach(function(data){
            message_array.push(data);
                 //if (data.sender == Id) {
                 //            if (message_array[data.receiver]) {
                //               message_array[data.receiver].push(data);
                //             }else{
                //               message_array[data.receiver] = [];
                //             }
                // }else{
                //     if (true) {
                //       message_array[data.sender].push(data);
                //     }else{
                //       message_array[data.sender] = [];
                //     }
                // }
           });
           res.send({status:true, count:message.length, data:message_array});
    })

});

    //when the socket connects
    var online = [];
    io.on('connection', function(socket){
         socket.on('disconnect', function(data){
                console.log("a user has disconnected");

                var user = online.find(u=>u.socketId==socket.id);
                console.log("inner Id", socket.id);
                console.log("user id",user);
              if(user){
                User.find({Id:user.user_id},function(err,person){

                  if(person.type=='3'){
                      User.update({Id:user.user_id},{$set:{isOnline:0}},(err,res)=>{
                       console.log("persons",res)
              })
                  }
                  else{
                     User.update({Id:user.user_id},{$set:{isOnline:0}},(err,res)=>{
                       console.log("persons",res)
                    })
                  }
                })

                   //send broadcast
                 io.sockets.emit('userOffline', { user_id: user.user_id});
                 //remove from array
                 var index = online.indexOf(user);
                 online.splice(index,1)

              }
        })
         socket.on('init', function (data) {

                for(var x = 0 ; x< online.length;x ++){
                  if(online[x].user_id==data.user_id)
                    online.splice(x,1)
                }
               online.push({socketId:socket.id,user_id:data.user_id});
               io.sockets.emit('userOnline', { user_id: data.user_id});
               socket.join(data.user_id);
              console.log("oncline users",online)
                 User.find({Id:data.user_id},function(err,person){
                    console.log("persons",person)
                  if(person.type=='3'){
                      User.update({Id:data.user_id},{$set:{isOnline:1}},(err,res)=>{
                       console.log("persons",res)
              })
                  }
                  else{
                     User.update({Id:data.user_id},{$set:{isOnline:1}},(err,res)=>{
                   console.log("persons",res)
                    })
                  }
                })

              //sender
              Messages.find({$or:[
                                  {sender: data.user_id, status: 2},
                                  {sender: data.user_id, status: 4}
                                ]
                              }  , function(err, message){

           message.forEach(function(data){
           if(data.status == 2){
             io.to(data.sender).emit('Delivered', data);
           }
           if(data.status == 4){
             io.to(data.sender).emit('Read', data);
           }
           })
           // res.send({status:true, count:message.length, data:message_array});
           });



           Messages.find({recipient: data.user_id, $or:[{status: 1},{status:0}] } , function(err, message){
             console.log("errr",err);
            console.log("message",message)

           message.forEach(function(msg){
                      msg.status = 1;
                      io.to(data.user_id).emit('message', msg);
                      io.to(data.sender).emit('recieved', msg);

           })
           // res.send({status:true, count:message.length, data:message_array});
    });


        });


            socket.on('message', function(data){
                console.log("my ,message",data)
                  data.time_stamp = new Date().getTime();
                  data.updated_stamp = new Date().getTime();
                   Messages.findOne({Id:data.Id, sender: data.sender} , function(err,msg){
                    if(!msg){
                      data.status = 1
                      Messages.create(data, function(err, message){
                        console.log(err);
                      io.to(data.recipient).emit('message', message);
                      message.status = 1;
                      io.to(data.sender).emit('recieved', message);
                      // io.to(data.recipient).emit('recieved', message);

                      } );
                    }
                    else{
                       io.to(data.recipient).emit('message', msg);
                        msg.status = 1;
                      io.to(data.sender).emit('recieved', msg);
                    }
                  })
              // save_message(data);
            });

            socket.on('logout',function(data){
               socket.socket(data.user_id).disconnect();
            })
            socket.on('Typing', function(data){
              io.to(data.recipient).emit('Typing', data);
            });

            socket.on('TypingStop', function(data){
              io.to(data.recipient).emit('TypingStop', data);
            });

            socket.on('more',function(data){
              message_array = [];
              Messages.find({time_stamp: { $lt: data.time_stamp },$or:[{sender: data.sender},{recipient:data.sender}] },function(err,messages){

                messages.forEach(function(data){
                message_array.push(data);

                 });
              io.to(data.sender).emit('more',message_array)
            }).sort( { time_stamp: -1 } ).limit(20)
            })

            socket.on('Delivered', function(data){

              Messages.findOneAndUpdate({Id:data.Id},{status:2, updated_stamp:new Date().getTime()},{new:true},function(err, message){
                data.status = 2;
                console.log("Delivered",message)
                io.to(data.sender).emit('Delivered', message);

              });
            });
            socket.on('Read', function(data){
              Messages.findOneAndUpdate({Id:data.Id},{status:4,read:1, updated_stamp:new Date().getTime()},{new:true},function(err, message){
                data.status = 4;
                console.log("read",message)
              io.to(data.sender).emit('Read', message);
              io.to(data.recipient).emit('Read', message);


              });
              // update_message(data,3)
            });
             socket.on('Seen', function(data){

              Messages.findOneAndUpdate({Id:data.Id},{status:3, updated_stamp:new Date().getTime()},{new:true},function(err, message){
                data.status = 3;
                console.log("Seen",message)
                // io.to(data.sender).emit('Seen', message);

              });
            });
             socket.on('Acknowledged', function(data){
                Messages.findOneAndUpdate({Id:data.Id},{status:5, updated_stamp:new Date().getTime()},{new:true},function(err, message){
                data.status = 5;
                console.log("read",message)
              // io.to(data.sender).emit('Read', message);


              });
              // update_message(data,3)
            });



        //var term = pty.spawn("ssh", ["root@139.59.185.226"]);
        // Terminal commands

        //socket.on('Input', function(data){
        //  term.Input(data, io);
        //});
        var login = false;

//        term.on('data', function(data){
//            console.log("Recieving....");
//            console.log(data);
//
//// If Auth needed
//            if(!login){
//                console.log("Authenticating");
//                term.write("zeedas123\r");
//                login     = true;
//            }else{
//                io.emit('ssh-output', data);
//                //io.emit('ssh-output', data);
//            }
//
//
//
//        });

        //console.log("listening on ssh-input");

        socket.on('ssh-input', function(data){
            console.log("Gotten");
            console.log(data);
        });



    });





}
