var cors           = require('cors');
var express        = require('express');
var app            = express();
var functions      = require('../../util/functions');
var Wallet         = require('../../database/models/Wallet.js');
var Card           = require('../../database/models/Card.js');
var Bill           = require('../../database/models/bills.js');
var isLoggedIn    = functions.isLoggedIn;
var Transactions   = require('../../database/models/Transactions.js');
var Flutterwave    = require('flutterwave');
var flutterwave    = new Flutterwave("tk_SPaIbxFtXvokrmzpR7Ww", 'tk_r7OywtPnvb');


module.exports = function (app) {


  app.get('/wallet/:Id', (req, res,next)=>{
      isLoggedIn(req, res, next, 'manageWallet')
    }, function (req, res) {

    Wallet.findOne({
      Id: req.decoded.user
    }, function (err, wallet) {

      if (wallet) {

        res.send({
          status: true,
          data: wallet
        });

      } else {

        newwallet = {};
        newwallet.created_time = functions.Create();
        newwallet.Id = req.decoded.user;

        Wallet.create(newwallet, function (err, user) {

          if (err) {

            res.send({
              status: false,
              message: "error creating wallet"
            });

          } else {

            Wallet.findOne({
              Id: req.decoded.user
            }, function (err, wallet) {

              res.send({
                status: true,
                data: wallet
              });

            });

          }
        });
      }


    });

  });


  app.post('/fund_wallet',(req, res,next)=>{
      isLoggedIn(req, res, next, 'manageWallet')
    }, function (req, res) {

    Card.findOne({
      cardNo: req.body.card
    }, function (err, card) {

      flutterwave.Card.capture({
        amount: req.body.amount,
        currency: "NGN",
        trxreference: card.ref,
        trxauthorizeid: card.Auth

      }, function (err, data) {

        if (err) {

          res.send({
            status: false,
            message: "error funding wallet"
          });


        } else if (data.body.data.responsecode == "00") {

          Wallet.update({
            Id: req.body.Id
          }, {
            $inc: {
              balance: parseInt(req.body.amount)
            }
          }, function (err, num) {


            var payload = {
              type: "Deposit",
              tag: "Wallet",
              amount: req.body.amount,
              Id: req.body.Id,
              created_time: functions.Create()
            }

            new Transactions(payload).save();

            res.send({
              status: true,
              message: "funding succesful"
            });

          });

        } else {

          res.send({
            status: false,
            message: "card declined"
          });

        }


      });


    });

  });


  app.post('/addCard',(req, res,next)=>{
      isLoggedIn(req, res, next, 'manageWallet')
    }, function (req, res) {

    var card = req.body;
    var Id   = req.decoded.user;
    var transaction = {};

    //Checks if card already exists
    var check  = card.no;
    var length = check.length;
    check      = check.substring((length - 4), length);

    Card.findOne({
      'cardNo': check,
      "Id"    : Id
    }, function (err, card_obj) {
      if (card_obj) {

        res.json({
          status: false,
          message: "Card already exists"
        });

      } else {
         // card.year = '20'+card.year;
         // console.log(card)

        flutterwave.Card.tokenize({
          "validateoption": "SMS",
          "authmodel"     : "NOAUTH",
          "cardno"        : card.no,
          "cvv"           : card.cvv,
          "expirymonth"   : card.month,
          "expiryyear"    : card.year

        }, function (err, response, payload) {

          if (payload.status == "success") {

            if (payload.data.responsecode == "00") {


              flutterwave.Card.preauth({
                chargetoken: payload.data.responsetoken,
                amount: "50",
                currency: "NGN"
              }, function (err, charge) {

                var data = charge.body.data;


                if (data.responsecode == '00') {

                  var number        = card.no;
                  var len           = number.length;
                  card.cardNo       = number.substring((len - 4), len);
                  card.ref          = data.transactionreference;
                  card.Auth         = data.authorizeId;
                  card.Id           = Id;
                  card.created_time = functions.Create();

                  // {"status":true,"data":{"no":"5178 6850 4765 3848","year":"2020","month":"07","cvv":"397","cardNo":"3848","ref":"FLW00918616","Auth":"905758","Id":"000020","created_time":"27-1-2018"},"message":"Card added successfully"}
                  // Push details to Cards collection
                  Card.create(card, function (err, newcard) {

                    if (err) {


                      res.send({
                        status: false,
                        message: "error creating card"
                      });

                    } else {

                      res.send({
                        status: true,
                        data: card,
                        message: "Card added successfully"
                      });

                    }
                  });

                  // Push Data to Transactions collections
                  Transactions.create({
                    amount: "50",
                    type: "Debit",
                    tag: "Wallet Setup",
                    Id: Id,
                    created_time: functions.Create()
                  }, function(err){
                      if ( err ){
                        res.send({
                          status: false,
                          message: "error recording transaction"
                        });
                      }else{
                        res.send({
                          status: true,
                          message: "successfuly recorded transaction"
                        });
                      }
                  });


                } else {

                  res.send({
                    status: false,
                    message: "could not verify card"
                  });

                }

              })


            } else {

              res.send({
                status: false,
                message: payload.data.responsemessage
              });


            }
          } else {

            res.json({
              status: false,
              message: "Error capturing card"
            })
          }
        });
      }
    });
  });



  app.get('/getCard/',(req, res,next)=>{
      isLoggedIn(req, res, next, 'manageWallet')
    }, function (req, res) {


    if (req.decoded.user) {

      Card.find({
        Id: req.decoded.user
      }, function (err, card) {


        res.send({
          status: true,
          data: card
        });
      });

    } else {

      res.send({
        status: false,
        message: "Id required"
      });
    }

  });

  app.get('/payUser/:email/:amount', (req, res,next)=>{
      isLoggedIn(req, res, next, 'manageWallet')
    }, function (req, res) {
    /**
     * Transfer money to a user on the platform
     */


    if (req.decoded.user) {

      Card.find({
        Id: req.decoded.user
      }, function (err, card) {


        res.send({
          status: true,
          data: card
        });
      });

    } else {

      res.send({
        status: false,
        message: "Id required"
      });
    }

  });


  app.get('/deleteCard/:cardNo', (req, res,next)=>{
      isLoggedIn(req, res, next, 'manageWallet')
    }, function (req, res) {


    if (req.params.cardNo && req.decoded.user) {

      Card.findOne({
        cardNo: req.params.cardNo
      }, function (err, bank) {

        Card.remove({
          cardNo: req.params.cardNo
        }, function (err, num) {

          if (bank) {

            res.send({
              status: true,
              message: "Card deleted successfully"
            });
          } else {

            res.send({
              status: false,
              message: "Card not found"
            });

          }

        });

      });


    } else {

      res.send({
        status: false,
        message: "Card number required"
      });
    }

  });


  app.get('/Transactions/',(req, res,next)=>{
      isLoggedIn(req, res, next, 'manageWallet')
    }, function (req, res) {


    Transactions.find({
      Id: req.decoded.user
    }, function (err, history) {

      res.send({
        status: true,
        data: history
      });

    });

  });

  app.get('/Transactions/:Id/:page',isLoggedIn, (req, res)=>{
    Transactions.paginate({}, { page: req.params.page, limit: 10, sort: {created_time: -1} }, function(err, result) {
        res.send({
          status: true,
          data: result.docs,
          pages: result.pages,
        });
    });
  });

}
