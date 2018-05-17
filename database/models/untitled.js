var cors          = require('cors');
var express       = require('express');
var app           = express();
var functions     = require('../../util/functions');
var term          = require('../../util/term');
var http          = require('http').Server(app)
var isLoggedIn    = functions.isLoggedIn;
var Messages      = require('../../database/models/messages.js')
global.io         = require('socket.io')(http)
var shortid       = require('shortid');

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

app.get('/messaging', isLoggedIn, (req, res)=>{

     message_array = [];
     Id            = req.decoded.user;
     console.log("my Id", Id)
    Messages.find({ $or: [{sender: Id}, {recipient: Id }] } , function(err, message){

           message.forEach(function(data){
            message_array.push(data);
                // if (data.sender == Id) {
                //             if (message_array[data.receiver]) {
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
           })
           res.send({status:true, count:message.length, data:message_array});
    }).limit(20);;

});
//sender 2,4
//reciever 1,

    //when the socket connects
    io.on('connection', function(socket){
        console.log('socket connected');
        socket.on('init', function (data) {
              socket.join(data.user_id);
              //sender
              Messages.find({$or:[
                                  {sender: data.user_id, status: 2},
                                  {sender: data.user_id, status: 4}
                                ]
                              } , function(err, message){

           message.forEach(function(data){
           if(data.status == 2){
             io.to(data.sender).emit('Delivered', data);
           }
           if(data.status == 4){
             // io.to(data.sender).emit('Delivered', data);
           }
           })
           // res.send({status:true, count:message.length, data:message_array});
           });
           
           Messages.find({recipient: data.user_id, status: 1} , function(err, message){
             console.log("errr",err);
                                console.log("message",message)

           message.forEach(function(msg){
                         
                      //io.to(data.recipient).emit('message', data);
                      io.to(data.user_id).emit('message', msg);
                      
            
           })
           // res.send({status:true, count:message.length, data:message_array});
    });
              
              
        });


            socket.on('message', function(data){
                  data.time_stamp = new Date().getTime();
                  data.updated_stamp = new Date().getTime();
                  Messages.findOne({Id:data.Id, sender: data.sender} , function(err,msg){
                    if(!msg){
                      Messages.create(data, function(err, message){
                      console.log("message",message)
                      io.to(data.recipient).emit('message', message);
                      message.status = 1;
                      io.to(data.sender).emit('recieved', message);
                  // io.to(data.recipient).emit('recieved', message);
                        console.log("messsage",message)
                      } );
                    }
                    else{
                       io.to(data.recipient).emit('message', msg);
                        message.status = 1;
                      io.to(data.sender).emit('recieved', msg);
                    }
                  })
              
              // save_message(data);
            });

            socket.on('Typing', function(data){
              io.to(data.recipient).emit('Typing', data);
            });

            socket.on('TypingStop', function(data){
              io.to(data.recipient).emit('TypingStop', data);
            });

            socket.on('Delivered', function(data){
             
              Messages.update({Id:data.Id},{$set:{status:2, updated_stamp:new Date().getTime()}}, function(err, message){
                data.status = 2;
                console.log("Delivered",data)
                io.to(data.sender).emit('Delivered', data);

              });
            });



            socket.on('Read', function(data){
              io.to(data.sender).emit('Read', data);
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
            //term.write(data+"\n");
            //if(data.command == "create_project"){
            //}
        });

        //socket.on("")



    });





    io.on('disconnect', function(socket){
      console.log("disconnected");
    });


}
