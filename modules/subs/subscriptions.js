var CronJob = require('cron').CronJob;
var Bill = require('../../database/models/bills.js');
var User      = require('../../database/models/user.js');
var Wallet      = require('../../database/models/Wallet.js');
var Price      = require('../../database/models/pricing.js');
var Transactions      = require('../../database/models/Transactions.js');
var functions = require('../../util/functions');
var date = require('node-datetime');
var dt = date.create();
var price_naira, price_dollar;
var async     = require('async');

var rate,rate_monthly;
var email;
var naira = process.env.NAIRA;

var started = false;

// Record Bills every hour
 new CronJob('*/10 * * * * *', function() {
     // get all users who are clients
     User.find({type: 1}, (err, userResult)=>{
        if(err){throw err; }
        async.each(userResult, (eachUser, callback)=>{
            var teamId = eachUser.team_Id;
            var email = eachUser.Email;
                User.find({team_Id: teamId,type:{$ne:1}}, (err, managerResult)=>{
                    var teamSize = managerResult.length;
                    Price.findOne({range_max: {$gt: teamSize+1}, range_min: {$lt: teamSize+1}})
                    .lean().exec((err, priceResult)=>{
                        if(err){throw err;}
                        if(priceResult){
                          if(naira) {
                              rate = priceResult.dollar_per_hour;
                              rate_monthly = priceResult.dollar_per_month;
                          }else{
                              rate = priceResult.naira_per_hour;
                              rate_monthly = priceResult.naira_per_month;
                          }
                        }else{
                          rate = 340;
                          rate_monthly = 4000;
                        }

                        Bill.findOne({Id: teamId}, (err, BillResult)=>{
                            if(err){throw err;}
                            if(!BillResult){
                                var bill = {
                                    tag:"Hourly Bill",
                                    amount: teamSize * rate,
                                    created_time: dt.format('Y-m-d H:M:S'),
                                    Id: teamId,
                                    last_bill: dt.now(),
                                    status: "",
                                    paid_time: dt.now()
                                }
                                var biller = new Bill(bill);
                                biller.save(function(er){
                                    if(err) throw er;
                                });
                            }else{
                                var hours1 = Math.floor(Math.abs(dt.now()-BillResult.last_bill)/36e5);
                                var hours2 = Math.abs(dt.now()-BillResult.paid_time)/36e5;
                                // console.log(Math.floor(hours2/200)>0);
                                var i = 0;
                                while(i < hours1){
                                    let currentTotal = teamSize * rate;
                                    BillResult.last_bill = dt.now();
                                    BillResult.amount = BillResult.amount + currentTotal;
                                    BillResult.created_time = dt.format('Y-m-d H:M:S');

                                    BillResult.save((err)=>{
                                        if(err){throw err;}
                                        Wallet.findOne({Id: teamId},(err, walletResult)=>{
                                            if(err)throw err;
                                            if(walletResult){
                                                walletResult.pending = BillResult.amount;
                                                walletResult.save((err)=>{
                                                    if(err)throw err;

                                                });
                                            }
                                        });

                                    });
                                    i++;
                                }

                                if(Math.floor(hours2/240)>0){
                                    Wallet.findOne({Id: teamId}, (err, walletResult)=>{

                                        if(err){throw err;}
                                        // console.log(walletResult);
                                        // if no wallet Found


                                        if(walletResult){
                                          if(walletResult.pending >= walletResult.balance){
                                              walletResult.pending = walletResult.pending - walletResult.balance;
                                              walletResult.balance = 0;
                                              BillResult.amount = walletResult.pending;
                                              BillResult.paid_time = dt.now();
                                              if(walletResult.pending > rate_monthly){
                                                walletResult.blocked = true;
                                                 var mail = {};
                                                  mail.subject = "Account Blocked";
                                                  mail.email = email;
                                                  mail.content = "<p>Good Day,</p><p>We are sad to inform you that your wallet has become too low to continue on our platform and so your team has been blocked from the platform. Please top-up your e-wallet immediately.</p><p>Thank You for Your Patronage.<br>Zeedas Management</p>";
                                                  sendEmail(mail);

                                                  // lock out
                                                  lock_users(teamId);
                                              }else{
                                                  var mail = {};
                                                  mail.subject = "Insufficient Balance Reminder";
                                                  mail.email = email;
                                                  mail.content = "<p>Good Day,</p><p>We are sad to inform you that your wallet is running low of funds. Your team will be locked out of our platform if you don't top-up your e-wallet.</p><p>Thank You for Your Patronage.<br>Zeedas Management</p>";
                                                  sendEmail(mail);
                                              }
                                              var transactions = {};
                                              transactions.tag = "Bill Payment";
                                              transactions.type = "Wallet";
                                              transactions.amount = walletResult.pending;
                                              transactions.Id = teamId;
                                              transactions.created_time=dt.format("d-m-Y");
                                              new Transactions(transactions).save((err)=>{if(err){throw err;}});
                                              walletResult.save((err)=>{if(err){throw err;}});
                                              BillResult.save((err)=>{if(err){throw err;}});
                                          }else{
                                            console.log(walletResult);
                                            var transactions = {};
                                            transactions.tag = "Bill Payment";
                                            transactions.type = "Wallet";
                                            transactions.amount = walletResult.pending;
                                            transactions.Id = teamId;
                                            transactions.created_time=dt.format("d-m-Y");
                                            walletResult.pending = 0;
                                            walletResult.balance = walletResult.balance - walletResult.pending;
                                            BillResult.amount = walletResult.pending;
                                            BillResult.paid_time = dt.now();

                                            if(walletResult.balance > rate*teamSize){
                                                // send email
                                                var mail = {};
                                                mail.subject = "Insufficient Balance Reminder";
                                                mail.email = email;
                                                mail.content = "<p>Good Day,</p><p>We are sad to inform you that your wallet is running low of funds with only ₦"+walletResult.balance+". Your team will be locked out of our platform if you don't top-up your e-wallet.</p><p>Thank You for Your Patronage.<br>Zeedas Management</p>";
                                                sendEmail(mail);
                                              }

                                            new Transactions(transactions).save((err)=>{if(err){throw err;}});
                                            BillResult.save((err)=>{if(err){throw err;}});
                                            walletResult.save((err)=>{if(err){throw err;}});
                                          }
                                        }else{
                                          newwallet = {};
                                          newwallet.created = new Date().getMilliseconds;
                                          newwallet.Id = teamId;
                                          newwallet.blocked = true;

                                          Wallet.create(newwallet, function (err, user) {

                                          });
                                        }

                                    });
                                }
                            }
                        });
                    });
                });

            callback();
        }, (err)=>{
          if(err){console.log("Failed");}
        });
     });

 }, null, true);




function lock_users(teamId) {

    var balance, developer, manager;

    User.find({team_Id: teamId, type: {$ne: 1}},(err, result)=>{
        console.log(result, teamId);

    });


}

function sendEmail(params) {


        var mail            = {};

          mail.subject        = params.subject;
          mail.email          = params.email;
          mail.contents       = params.content

          functions.Email(mail);
}
