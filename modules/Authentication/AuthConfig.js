var LocalStrategy = require('passport-local').Strategy;
var cors          = require('cors');
var bcrypt        = require('bcrypt-nodejs');
var passport      = require('passport');
var functions     = require('../../util/functions');
var User          = require('../../database/models/user.js');
var jwt           = require('jsonwebtoken');


module.exports = function (passport) {


  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user);
  });


  //============================================= SIGNUP =========================================//

  passport.use('local-signup', new LocalStrategy({

      usernameField: 'Email',
      passwordField: 'Password',
      passReqToCallback: true
    },
    function (req, email, password, done) {

      User.findOne({
        'Email': req.body.Email
      }, function (err, user) {

        if (err)
          return done(err);

        if (user == null) {

          User.findOne().sort({
            $natural: -1
          }).limit(1).exec(function (err, data) {

            req.body.Password = bcrypt.hashSync(req.body.Password);

            if (data) {

              current_last_id = parseInt(data.Id);
              new_Id_digit = current_last_id + 1;
              req.body.Id = functions.genId(new_Id_digit, 6);
              req.body.created_time = new Date().getTime();

            } else {

              req.body.Id = '000001';
              req.body.created_time = new Date().getTime();

            }

            User.create(req.body, function (err, user) {
              if (err) {

                return done(null, false, req.flash('info', 'Account Already Exist'));

              } else {

                  if(req.body.type == "1"){

                  functions.create_team(req.body);
                  functions.univ_perm(req.body);

                  }



                var mail            = {};
                mail.template       = "mail";
                mail.subject        = "Comfirmation";
                mail.first_name     = req.body.first_name;
                mail.email          = req.body.Email;

                functions.Email(mail);

                return done(null, req.body);

              }
            });


          });

        } else {

          return done(null, false, req.flash('info', 'Email Already Exist'));

        }

      });

    }));


  //============================================= LOGIN =========================================//

  passport.use('local-login', new LocalStrategy({

      usernameField: 'Email',
      passwordField: 'Password',
      passReqToCallback: true
    },
    function (req, email, password, done) {



      User.findOne({
        'Email': req.body.Email
      }, function (err, user) {



        if (err)
          return done(err);

          console.log(req.body);

        if (!user){

          return done(null, false, req.flash('info', 'Email or password incorrect'));
        }else{


         bcrypt.compare(req.body.Password, user.Password, function(err, res) {

           if (res != true ) {

            return done(null, false, req.flash('info', 'Email or password incorrect'));

          } else {
            return done(null, user, req.flash('user', user.type));
          }


          });





        }




      });
    }

  ));




//   var LOGIN_FUNCTION = function(data){

//       User.findOne({
//         'Email': data.Email
//       }, function (err, user) {

//         if (err)
//           return 'error';

//           console.log(req.body);

//         if (!user){

//           return {status:false, messasge:'Email or password incorrect'};
//         }else{


//          bcrypt.compare(req.body.Password, user.Password, function(err, res) {

//            if (res != true ) {

//             return {status:false, messasge:'Email or password incorrect'};

//           } else {

//             return {status:true, messasge:"Login Succesful"} ;
//           }


//           });

//   }

// });
// }


// var SIGNUP_FUNCTION = function(data){

//     User.findOne({
//         'Email': req.body.Email
//       }, function (err, user) {

//         if (err)
//           return done(err);

//         if (user == null) {

//           User.findOne().sort({
//             $natural: -1
//           }).limit(1).exec(function (err, data) {

//             req.body.Password = bcrypt.hashSync(req.body.Password);

//             if (data) {

//               current_last_id = parseInt(data.Id);
//               new_Id_digit = current_last_id + 1;
//               req.body.Id = functions.genId(new_Id_digit, 6);
//               req.body.created_time = new Date().getTime();

//             } else {

//               req.body.Id = '000001';
//               req.body.created_time = new Date().getTime();

//             }

//             User.create(req.body, function (err, user) {
//               if (err) {

//                 return {status:false, messasge:"Account Already Exist"} ;

//               } else {

//                   if(req.body.type == "1"){

//                   functions.create_team(req.body);

//                   }



//                 var mail            = {};
//                 mail.template       = "mail";
//                 mail.subject        = "Comfirmation";
//                 mail.first_name     = req.body.first_name;
//                 mail.email          = req.body.Email;

//                 functions.Email(mail);

//                 return {status:true, messasge:"Signup Succesful", type:data.type} ;

//               }
//             });


//           });

//         } else {

//           return {status:false, messasge:"Email Already Exist"} ;

//         }

//       });
// }

};
