var cors         = require('cors');
var express      = require('express');
var app          = express();
var http         = require('http').Server(app)
var io           = require('socket.io')(http);
var functions    = require('../../util/functions');
var isLoggedIn   = functions.isLoggedIn;
var Notifications = require('../../database/models/notification.js')


module.exports = function(app, io){


    app.get('/notification/:Id', (req, res)=>{
        //load old messages
      Notification.find({Id: req.params.Id}, function(err, docs){
            if (err){
                console.log(err)
            } else {
                res.send({status: true, data:docs})
            }
        })
    })

    io.on('connection', function(socket){
        socket.on('getStarted', function(data){
            console.log('noti', data.Id)
            socket.join(data.Id);
          Notifications.find({Id: data.Id}, (err, notify)=>{
            console.log('notify',notify);
            console.log('id', data.Id)
          io.to(data.Id).emit('allNotification', notify)
          })
        })
        
    
        socket.on('changed', function(data){
          Id = data.Id;
          console.log('id',Id)
          Notifications.updateMany({Id: Id}, {$set: {status: 2}}, (err, done)=>{
            data.status = 2;
            console.log('done', done);
            Notifications.find({}, (err, notice)=>{
                // io.to(data.Id).emit('newevent', notice)
            io.to(data.Id).emit('Done', notice);
            console.log('got this', notice)

            })
          })
        })
    })
    


    // io.on('newNotification', (data)=>{
    //     data.time = new Date().getTime();
    //         data.status = 1;
    //             Notification.create(data, (err, notice)=>{
    //                 console.log({notice})
    //                 if(err) throw err;
    //                 io.to(data.Id).emit('notification', notice)
    //             })
    // })

    // io.on('connection', (socket)=>{
    //         // socket.on('init', function (data) {
    //         //     socket.join(data.user_id);
    //         //     console.log(data)

    //         socket.on('newNotification', (data)=>{
    //         data.time = new Date().getTime();
    //         data.status = 1;
    //             Notification.create(data, (err, notice)=>{
    //                 console.log({notice})
    //                 if(err) throw err;
    //                 io.to(data.Id).emit('notification', notice)

    //             })
    //         })
    //     })
    // })

    // io.to(000021).emit('notification', {user:'gabby', gender: 'male'})







    
    //
    // socket.on('disconnect', function(data){
    //
    // })
    //
    //
    // })


}
