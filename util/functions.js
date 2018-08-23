var nodemailer      = require('nodemailer');
var smtpTransport   = require('nodemailer-smtp-transport');
var express         = require('express');
var hbs             = require('nodemailer-express-handlebars');
var User            = require('../database/models/user.js');
var walvar            = require('../database/models/Wallet.js');
var Projects            = require('../database/models/projects');
var roles            = require('../database/models/roles.js');
var Perm     = require('../database/models/Permissions.js');
var Invited         = require('../database/models/Invited.js');
var counter        = require('../database/models/counter.js');
var Notification = require('../database/models/notification.js');
var recordTimelineLog = require('../database/models/timelineLogs');
var terms = require('./term');
var request         = require('request');
var jwt             = require('jsonwebtoken');
var permUtil = require('./permissions');
var app             = express();
var date = require('node-datetime');
var dt = date.create();
var fs = require("fs");
var execSh      = require("exec-sh");





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
var isLoggedIn = function (req, res, next) {
  var token = req.body.token || req.params.token || req.headers['x-access-token'];
  if(req.body.user){
    console.log(req.body.user);
  }

  if (token) {  

    jwt.verify(token, 'I Love Ziita', function(err, decoded) {
      if (err) {
        return res.json({ success: false, message: 'Failed to authenticate token.' });
      } else {
        req.decoded = decoded;
        // check if account is Blocked
              // check permission
              next()
         
      }
    });
  } else {

    return res.status(403).send({
      success: false,
      message: 'No token provided.'
    });

  }

};

var confirmPermissions = function(perm, decoded, next){

  roles.findOne({Id: decoded, Permission: perm}, (err, queryResult)=>{
    if(queryResult){
      next();
    }else{
      // console.log(queryResult);
      return false;
    }
  });
}

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

  roles.findOne({Id: req.params.Id, Permission: perm}, (err, queryResult)=>{
    if(queryResult){
      next();
    }else{
      res.send({
        status: false,
        message: "Access Denied"
      });
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
  var state = 0;

  if(type === '1'){
    search_permission_array(1).forEach((perm)=>{
      create_rules(perm, id);
    })
  }else if(type === '2'){
    search_permission_array(2).forEach((perm)=>{
      create_rules(perm, id);
    })
  }else if(type === '3'){
    search_permission_array(3).forEach((perm)=>{
      create_rules(perm, id);
    })
  }


}

function search_permission_array(field){
  var rays = permUtil.permissionsArray;
  var jays = [];
  if(field === 1){
    jays = rays.filter(e=>e.default_client === true);
    // console.log(jays);
    // for (var i=0; i < rays.length; i++) {
    //   if (rays[i].default_client === true) {
    //     jays.push(rays[i]);
    //   }
    // }
  }
  if(field === 2){
    // for (var i=0; i < rays.length; i++) {
    //   if (rays[i].default_pm === true) {
    //     jays.push(rays[i]);
    //   }
    // }
    jays = rays.filter(e=>e.default_pm === true);
  }
  if(field === 3){
    // for (var i=0; i < rays.length; i++) {
    //   if (rays[i].default_dev === true) {
    //     jays.push(rays[i]);
    //   }
    // }
    jays = rays.filter(e=>e.default_dev === true);
  }
  return jays;

}

function create_rules(permission, id){

  var save = {'Id': id, 'Permission': permission.Permission, 'roads': permission.roads, 'State': true}
  roles.create(save, (err, rules)=>{
    if(!err){
      // console.log("Done");
      return;
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

var createDocker = function(module, purpose, callback_ ){

    Projects.findOne({Id: module.project_Id}, function(err, project) {

        //get repo url
        var server = terms.get_ssh_git(project);
        var host = server.host;
        var repo = server.git_url;

        //return if repo has not been set
        if(!server.host.host){
            callback_({status: false, message: "No server setup yet"});
            return;
        }

        //return if docker file has not been set
        if(!project.docker){
            callback_({status: false, message: "No Docker File Setup"});
            return;
        }

        var developer_id = module.developer_Id;
        var project_id = module.project_Id;
        var project_port = project.project_port;

        if(!project_port || !repo){
            callback_({status: false, message: "Server not fully setup"});
            return;
        }


        project_id = project_id.toLowerCase();

        // console.log("Connecting to ", host);
        // tag: is the docker name
        var base_url = "zeedas";
        var tag = "";
        var location = "";
        var branch = "";
        var more_task = [];
        if(purpose == "developer"){
            tag = developer_id + "" + project_id;
            location = 'developer_'+developer_id;
            branch = location;
        }else if(purpose == "module"){
            tag = module.Id;
            location = "module_"+module.Id;
            branch = developer_id+"_"+module.Id;
            more_task.push("cd "+base_url);
            more_task.push("git pull "+repo+ " "+branch);
        }else{
            tag = project_id;
            location = "main_project";
            branch = "master";
            more_task.push("cd "+base_url);
            more_task.push("git pull "+repo+ " "+branch);
        }
        tag = tag.toLowerCase();

        var data = 'mkdir -p '+base_url+'/project_'+project_id+'/'+location+'; cd $_; next\
    pwd; next\
    if test -d '+base_url+'; \
    then echo "Already Cloned"; next\
    docker ps | grep '+ tag+'; else next\
    docker ps -a; next\
    wget '+hosturl+'/docker_file/'+module.project_Id+' -O Dockerfile --no-check-certificate; \
    git clone -b '+branch+' '+repo+' '+base_url+'; \
    docker build -t "'+project_id+'" . next\
    docker run -d --name "'+tag+'" -p $port:'+project_port+' -v $(pwd)/'+base_url+':/usr/src/app '+project_id+' next\
    fi;';
        var send = data.split("next");

        var round = 0;
        var path = "";
        var sent = false;
        var port = "";
        var socket_port = 10000;

        send = send.concat(more_task);
        terms.ssh(host, send, function (command, response, sshObj) {

                console.log("Executed => ", command);
                console.log("Response => ", response);

                if (command.indexOf("docker ps -a") > -1) {
                    var ports = response.match(/\b\d{4}\b/g);
                    if(ports){
                        ports.push(10000);
                    }
                    port = terms.generatePort(ports);
                    sshObj.commands.unshift("ufw allow $port;");
                    //console.log(command + " => " + response + "[ENDED]");
                    sshObj.commands.unshift("port=" + port + ";");
                }

                if (command.indexOf("pwd;") > -1) {
                    var p  = response.split("\n");
                    path = p[1];
                    path = path.trim()+"/"+base_url;
                }

                if(command.indexOf("docker ps | grep") > -1){
                    round++;
                    port = response.match(/\b\d{4}\b/g);
                    if(port){
                        var link = "http://"+host.host+":"+port[0];
                        var soc = host.host+":"+socket_port;
                        //console.log("socket", soc, socket_port);
                        callback_({status: true, link: link, path: path, mysocket: soc});
                        sent = true;
                    }else{
                        if(round == 1) {
                            sshObj.commands.push("docker start "+tag);
                            sshObj.commands.push("docker ps | grep "+tag);

                        }else{
                            callback_({status: false, link: "Link can not be found"});
                            sent = true;
                        }
                    }
                }
            },
            function (sessionText, sshObj) {
                console.log("..........ended = >" + sessionText);
                if(!sent) {
                    var link = "http://"+host.host+":"+port;
                    var soc = host.host+":"+socket_port;
                    callback_({status: true, link: link, path: path, mysocket: soc});
                }
                //sent = true;
            },
            function(error){
                console.log("..........error = >" + error);
                if(!sent) {
                    callback_({status: false, error: error});
                }
            }
        );


    });
}

var destroyDocker = function(module, purpose, callback_){
    Projects.findOne({Id: module.project_Id}, function(err, project) {
        if(!project){
          callback_({status: false, message: "Project not found"});
          return;
        }

        var server = terms.get_ssh_git(project);
        var host = server.host;

        if (!server.host.host) {
            callback_({status: false, message: "No server setup yet"});
            return;
        }

        var developer_id = module.developer_Id;
        var project_id = module.project_Id;


        project_id = project_id.toLowerCase();


        var base_url = "zeedas";
        var tag = "";
        var location = "";

        if(purpose == "developer"){
            tag = developer_id + "" + project_id;
            location = 'developer_'+developer_id;
        }else if(purpose == "module"){
            tag = module.Id;
            location = "module_"+module.Id;
        }else{
            tag = project_id;
            location = "main_project";
        }

        tag = tag.toLowerCase();

        var data = 'docker stop ' + tag + '; next\
        docker rm ' + tag + '; next\
        cd ' + base_url + '/project_' + project_id + '; next\
        rm -R ' + location + ';';
        var send = data.split("next");

        terms.ssh(host, send, function (command, response, sshObj) {

            }
            ,
            function (sessionText, sshObj) {
                //console.log("..........ended = >" + sessionText);
                callback_({status: true, message: "Successfully Deleted"});
            }
        );
    });
}

var mergeRepo = function(project, module){
   //construct repository url
    var url = "https://"+project.repository_username+":"+project.repository_password+"@"+project.repository_url.replace("https://",'').replace("http://",'');

    //get directory name
    var x = __dirname;
    var y = x.replace("util","")
    var dir  = y+"public/temp_modules/";

    // create directory if not already exist;
    if (!fs.existsSync(dir+module.Id)) {
        fs.mkdirSync(dir + module.Id);
    }

    //make directory git enabled
    execSh('git init', { cwd:dir+module.Id}, function(err){
        //add remote path as origin
        execSh('git remote add origin '+url, { cwd: dir+module.Id }, function(err){
            execSh('git pull origin master', { cwd: dir+module.Id}, function(err){
                execSh('git pull origin '+module.developer_Id+'_'+module.Id.toLowerCase(), { cwd: dir+module.Id}, function(err){
                    execSh('git checkout master', { cwd: dir+module.Id}, function(err){
                        execSh('git pull origin master', { cwd: dir+module.Id}, function(err){
                            execSh('git merge '+module.developer_Id+'_'+module.Id.toLowerCase()+' master', { cwd: dir+module.Id}, function(err){
                                execSh('git push origin master', { cwd: dir+module.Id}, function(err){
                                    execSh('git push origin --delete '+module.developer_Id+'_'+module.Id.toLowerCase(), { cwd: dir+module.Id}, function(err){
                                        execSh('rm -R '+module.Id, { cwd: dir}, function(err) {
                                            createDocker(module, "project", function (response) {
                                                destroyDocker(module, "module", function () {
                                                    module.link = "";
                                                    module.save();
                                                });
                                            });
                                        });
                                    });

                                });

                            });




                        });

                    });

                });

            });

        });
    });
};


//Arrange data using the provided id. use column to filter the data if provided
var arrangeById = function(table, id, column){
    var filteredTable = {};
    for(var i in table){
        filteredTable[table[i][id]] = column?table[i][column]:table[i];
    }
    return filteredTable;
}
module.exports = {
  Notify           :Notify,
  Email            :Email,
  genId            :zeropad,
  Day              :Day,
  remove_Invited   :remove_Invited,
  update_team      :update_team,
  update_developer :update_developer,
  update_manager   :update_manager,
  isLoggedIn       :isLoggedIn,
  roleCheck        :roleCheck,
  Create           :Create,
  send_mail        : send_mail,
  getNextSequenceValue,
    permUtil,
    checks,
    adminLoggedIn,
    _login,
    createDocker,
    destroyDocker,
    mergeRepo,
    arrangeById,
};
