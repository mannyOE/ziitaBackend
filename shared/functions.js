var User = require('../models/users.js');
const nodemailer = require('nodemailer'),
    creds = require('./creds'),
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: creds.user,
            pass: creds.pass
        },
    }),
    Email = require('email-templates'),
    path = require('path'),
    Promiise = require('bluebird');

var userData = [{
    firstname: 'Emmanuel',
    lastname: 'Ahman',
    email: 'ahman.emmanuel@natternase.com'
}];
 
const email = new Email();
 
email
  .render('accountConfirm/html'), {
    name: 'Elon'
  })
  .then(console.log)
  .catch(console.error);

