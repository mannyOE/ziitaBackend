var nodemailer      = require('nodemailer');
var smtpTransport   = require('nodemailer-smtp-transport');
var express         = require('express');
var hbs             = require('nodemailer-express-handlebars');
var User            = require('../database/models/user.js');
var Team            = require('../database/models/Team.js');
var roles            = require('../database/models/roles.js');
var Developers      = require('../database/models/developers.js');
var Managers        = require('../database/models/manager.js');
var Invited         = require('../database/models/Invited.js');
var counter        = require('../database/models/counter.js');
var permUtil				= require('./permissions.js');
var Notification = require('../database/models/notification.js');
var request         = require('request');
var jwt             = require('jsonwebtoken');
var permUtil = require('./permissions');
var app             = express();
var fs = require('fs');






const sendmail      = require('sendmail')({
	logger: {
		debug: console.log,
		info
		:
		console.info,
		warn
		:
		console.warn,
		error
		:
		console.error
	}
	,
	silent: false,

	devPort      : 587, // Default: False
	devHost: 'localhost' // Default: localhost
});

var options = {
	viewEngine: {
		extname: '.hbs',
		layoutsDir: 'view/email/',
		defaultLayout : 'main',
		partialsDir : 'view/template/'
	},
	viewPath: 'view/template/',
	extName: '.hbs'
};
var _login = {
        username:"admin@natterbase.com",
        password:"paswword"
    }
		var isLoggedIn = function (req, res, next, perm) {
			debugger;
			var token = req.body.token || req.params.token || req.headers['x-access-token'];
			if(req.body.user){
				console.log(req.body.user);
			}

			if (token) {

				jwt.verify(token, "IloveZeedas", function(err, decoded) {
					if (err) {
						return res.json({ success: false, message: 'Failed to authenticate token.' });
					} else {
						req.decoded = decoded;
						// console.log(perm, req.route.path);
							next();
						// check if user has permission for the current task
						// roles.find({Id: decoded.user}, (err, queryResult)=>{
						// 	var access = false;
						// 	// check through the entire result array with forEach
						// 		if(queryResult.roads !== undefined){
						// 			queryResult.roads.forEach((road)=>{
						// 				if(road === req.route.path){
						// 					access = true;
						// 				}
						// 			});
						// 		}
						// 		if(access){
						// 			next();
						// 		}else{
						// 			res.send({
						// 				status: false,
						// 				message: 'permission denied'
						// 			});
						// 		}
						// });
					}
				});
			} else {

				return res.status(403).send({
					success: false,
					message: 'No token provided.'
				});

			}

		};

var adminLoggedIn = function (req, res, next) {

	var token = req.body.token || req.params.token || req.headers['x-access-token'];

	if (token) {

		jwt.verify(token, "IloveZeedas", function(err, decoded) {
			if (err) {
				return res.json({ success: false, message: 'Failed to authenticate token.' });
			} else {
				console.log(decoded);
				if(decoded.username==_login.username && decoded.password==_login.password){
					req.decoded = decoded;
					next();
				}
				else{
					return res.json({ success: false, message: 'Failed to authenticate token.' });
				}

			}
		});

	} else {

		return res.status(403).send({
			success: false,
			message: 'No token provided.'
		});

	}

};


var roleCheck = function (req, res, next, perm) {

	roles.findOne({Id: req.decoded.user, Permission: perm}, (err, queryResult)=>{
		if(err){throw err;}
		if(queryResult !== null){
			// next();
			res.send('You have the permission for this action');
		}else{
			res.send('You do not have permission to perform this operation');
		}
	});

};




var Create = function(){

	var day =  new Date().getDate();
	var year = new Date().getFullYear();
	var month = new Date().getMonth();

	var newdate = day+'-'+month+'-'+year;

	return newdate;
};

var Day = function(x){

	var day =  new Date().getDate() + x;

	var year = new Date().getFullYear();
	var month = new Date().getMonth();

	var newdate = month+'-'+day+'-'+year;

	return newdate;
};

var create_developers = function(data){
	console.log('hello dev ')
	Developers.create(data, function (err, devs) { });
	dev_perm(data);

};

var create_team = function(data){


	Team.create(data, function (err, team) { });

};





var create_managers = function(data){

	Managers.create(data, function (err, team) { });
	man_perm(data);

};


var remove_Invited = function(data){

	Invited.remove(data, function(err, num) {});

};

var update_manager = function(Id, data){

	console.log(data);

	User.update({Id:Id}, {$set:data}, function(err, num){ })
};

var update_developer = function(Id,data){

	console.log(data);

	User.update({Id:Id}, {$set:data}, function(err, num){ })
};

var update_team = function(Id,data){

	console.log(data);

	User.update({Id:Id}, {$set:data}, function(err, num){ })
};

var Notify = function(data, io){
	var store = {};
	store.time = new Date().getTime();
	store.Id = data.Id;
	store.message = data.message;

	Notification.create(store, (err, hello)=>{
		if(err) throw err;
		//console.log('created notification', data)
		Notification.find({}, (err, notice)=>{
			if(err) throw err;
			io.emit('newevent', notice)
		});

		// io.on('connection', (socket)=>{

		//     socket.on('newNotification', (data)=>{
		//     data.time = new Date().getTime();
		//     data.status = 1;
		//         Notification.create(data, (err, notice)=>{
		//             console.log({notice})
		//             if(err) throw err;
		//             io.to(data.Id).emit('notification', notice)

		//         })
		//     })
		// })
	})
}



var Email = function(data) {


	const sendmail = require('sendmail')();
	data['site_url'] = "https://"+hostname;

	if(!data.template){
		sendmail({
			from: 'Natterbase <natterbase@zeedas.com>',
			to: data.email,
			subject: data.subject,
			html: data.contents,
		}, function(err, reply) {
			if(!err){
				console.log("Mail sent to "+ data.email);
			}else{
				console.log("Error sending mail to "+ data.email, err);
			}
		});
		return;
	}

	var fs = require('fs');
	fs.readFile(__dirname+'/../view/template/'+data.template+'.hbs', 'utf8', function(err, contents) {

		if(err)
		return;

		for(var i in data){
			var x = "{{"+i+"}}";
			while(contents.indexOf(x) > -1){
				contents = contents.replace(x, data[i]);
			};
		}

		sendmail({
			from: 'Natterbase <natterbase@zeedas.com>',
			to: data.email,
			subject: data.subject,
			html: contents,
		}, function(err, reply) {
			if(!err){
				console.log("Mail sent to "+ data.email);
			}else{
				console.log("Error sending mail to "+ data.email, err);
			}
			// console.dir(reply);
		});

	});

	return;
	//var transporter = nodemailer.createTransport(smtpTransport({
	//    service: "mailgun",
	//    auth: {
	//        user: 'postmaster@zeedas.com',
	//        pass: 'ffd725f321025f2a62de750a77ad0a33'
	//    }
	//}));
	//var transporter = nodemailer.createTransport(smtpTransport({
	//    service: "smtp.sendgrid.net",
	//    auth: {
	//        user: 'zeedas',
	//        pass: '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'
	//    }
	//}));

	var options = {
		auth: {
			//api_user: 'natterbase',
			//api_key: 'Na20ter70'
			//                  user : 'zeedas',
			api_key : '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'

		}
	}

	var sgTransport = require('nodemailer-sendgrid-transport');

	var transporter = nodemailer.createTransport(sgTransport(options));


	//transporter.use('compile', hbs(options));
	var mailOptions = {
		from      : 'Natterbase <natterbase@zeedas.com>',
		to        : data.email,
		subject   : data.subject,
		text: data.template,
		html  : data.template,
		context   : data
	};


	transporter.sendMail(mailOptions, function(error, info){
		if(error){
			console.log("ERROR: "+error);
		}else{
			// console.log('Message sent: ' + info.response);
		}
	});

};

var Email2 = function(data){
	var option = {
		from: 'Natterbase <natterbase@zeedas.com>',
		to: data.email,
		subject: data.subject,
		html: data.template,
	};
	console.log("sending...");
	// console.log(option);
	sendmail(option, function(err, reply) {
		console.log(err && err.stack);
		// console.dir(reply);
	});
};






var zeropad = function (num, places) {
	var zero = places - num.toString().length + 1;
	return Array(+(zero > 0 && zero)).join("0") + num;
};

function getNextSequenceValue(sequenceName){
	var sequenceDocument = "";
	counter.findOne({_id: sequenceName }, function(err, result){
		console.log(result, err);
		if(result) {
			var x = counter.update({_id: sequenceName}, {$inc: {sequence_value: 1}});
			console.log("x", result.sequence_value);
			return result.sequence_value + 1;
		}else{
			counter.create({_id: sequenceName, sequence_value: 20});
			return 20;
		}
	});
	//console.log("First", sequenceDocument, sequenceDocument.sequence_value);
	//    if(sequenceDocument.sequence_value) {
	//        var x = counter.update({_id: sequenceName}, {$inc: {sequence_value: 1}});
	//        console.log("x", x);
	//    }else{
	//        counter.create({_id: sequenceName, sequence_value: 20});
	//        return 20;
	//    }
	//console.log("sequence", sequenceDocument.sequence_value);
	//    return sequenceDocument.sequence_value + 1;

}

function checks(id, type){
	//  console.log(id,type);
	roles.remove({Id: id},(err)=>{});
	switch (type) {
		case '1':
		search_permission_array(1).forEach((perm)=>{
			console.log(perm);
			create_rules(perm, id);
		})
		break;
		case '2':
		search_permission_array(2).forEach((perm)=>{
			create_rules(perm, id);
		})
		break;
		case '3':
		search_permission_array(3).forEach((perm)=>{
			create_rules(perm, id);
		})
		break;
		default:

	}
}

function search_permission_array(field){
	let rays = permUtil.permissionsArray;
	let jays = [];
	if(field === 1){
		for (var i=0; i < rays.length; i++) {
			 if (rays[i].default_client === true) {
					 jays.push(rays[i]);
			 }
	 }
	}
	if(field === 2){
		for (var i=0; i < rays.length; i++) {
			 if (rays[i].default_pm === true) {
					 jays.push(rays[i]);
			 }
	 }
	}
	if(field === 3){
		for (var i=0; i < rays.length; i++) {
			 if (rays[i].default_dev === true) {
					 jays.push(rays[i]);
			 }
	 }
	}
	return jays;

}

function create_rules(permission, id){

	var save = {'Id': id, 'Permission': permission.Permission, 'roads': permission.roads, 'State': true}
	roles.create(save, (err, rules)=>{
		if(!err){
			// console.log("Done");
			return true;
		}
	});

}

var send_mail = function(data, template){
	data.subject = data.subject || "Natterbase Notification";
	data.template = template;

	if(data.developer_Id){
		data.user_Id = data.developer_Id;
	}



	if(data.user_Id){
		User.findOne({Id: data.user_Id}, function(err, user){
			if(err) throw err;
			for(var i in user){
				if(data[i] == undefined){
					data[i] = user[i];
				}
			}
			if(data.email)
			Email(data);
		});
	}else {
		if(data.email)
		Email(data);
	}
};

module.exports = {
	Notify           :Notify,
	Email            :Email,
	genId            :zeropad,
	Day              :Day,
	create_managers  :create_managers,
	create_developers:create_developers,
	remove_Invited   :remove_Invited,
	update_team      :update_team,
	update_developer :update_developer,
	update_manager   :update_manager,
	isLoggedIn       :isLoggedIn,
	roleCheck        :roleCheck,
	create_team      :create_team,
	Create           :Create,
	send_mail        : send_mail,
	getNextSequenceValue: getNextSequenceValue,
	checks					: checks,
	permUtil				: permUtil,
	adminLoggedIn:adminLoggedIn,
	_login:_login
};
