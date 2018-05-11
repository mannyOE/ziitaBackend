var cors          = require('cors');
var express       = require('express');
var request       = require('request');
var app           = express();
var functions     = require('../../util/functions');
 var terms          = require('../../util/term');
var http          = require('http').Server(app)
var isLoggedIn    = functions.isLoggedIn;
//var Messages      = require('../../database/models/messages.js')
global.io         = require('socket.io')(http);
var Projects    = require('../../database/models/projects.js');
var Module      = require('../../database/models/module.js');
var shortid       = require('shortid');
var Dockers      = require('../../database/models/docker.js');


// console.log(terms);
module.exports = function (app) {
    var host = {
        //host: "139.59.185.226",
        //    port: 22,
        //    userName: "root",
        //    password: "zeedas123",
    };


    //UPDATE SERVER CREATE DOCKER IMAGE AND CLONE REPOSITORY IF NOT ALREADY CLONED
    app.get('/terminal/file_updated/:Id', function(req, res){

        return;
        Module.findOne({Id:req.params.Id}, function(err, module) {
            if(err) throw err;

            Projects.findOne({Id:module.project_Id}, function(err, project) {
                if(err) throw err;

                var server = terms.get_ssh_git(project);
                var host = server.host;
                var repo = server.git_url;

                if(!server.host.host){
                    res.send({status: false, message: "No server setup yet"});
                    return;
                }

                if(!project.docker){
                    res.send({status: false, message: "No Docker File Setup"});
                    return;
                }

                var developer_id = module.developer_Id;
                var project_id = module.project_Id;
                var project_port = project.project_port;


                if(!project_port || !repo){
                    res.send({status: false, message: "Server not fully setup"});
                    return;
                }

                project_id = project_id.toLowerCase();

                var base_url = "zeedas";
                var tag = developer_id + "" + project_id;
                tag = tag.toLowerCase();
                var ip = "178.62.51.68";
                ip = "zeedas.com";

                var data = 'mkdir -p '+base_url+'/project_'+project_id+'/developer_'+developer_id+'; cd $_; next\
    if test -d '+base_url+'; \
    then echo "Already Cloned"; else \
    docker ps -a; next\
    wget '+hosturl+'/docker_file/'+module.project_Id+' -O Dockerfile; \
    git clone -b developer_'+developer_id+' '+repo+' '+base_url+'; \
    docker build -t "'+project_id+'" . next\
    docker run -d --name "'+tag+'" -p $port:'+project_port+' -v $(pwd)/'+base_url+':/usr/src/app '+project_id+' next\
    fi; next\
    cd '+base_url+'; next\
    git reset --hard; next\
     git pull '+repo+' developer_'+developer_id+'';
                //http://domain.com

                var send = data.split("next");

                terms.ssh(host, send, function (command, response, sshObj) {
                        console.log(command);
                        console.log(response);
                        if (command.indexOf("docker ps -a") > -1) {
                            var ports = response.match(/\b\d{4}\b/g);

                            var port = terms.generatePort(ports);
                            sshObj.commands.unshift("ufw allow $port;");
                            //console.log(command + " => " + response + "[ENDED]");
                            sshObj.commands.unshift("port=" + port + ";");
                        }
                    },null,
                    function(err, errtype){
                        var error = "Error Connecting to Server";
                        if(typeof err == "string"){
                            error = err;
                        }else if(err){
                            error = "";
                            for(var i in err)
                                error += err[i]+"\n";
                        }
                        res.send({status:false, message: error});
                    },null,
                    function (sessionText){
                        //console.log("..........ended = >" + sessionText);
                        res.send({status: true, message: "Successful"})
                    }
                );

            });

        });
    });


    //get link
    app.get('/terminal/get_link/:Id', function(req, res){

        Module.findOne({Id:req.params.Id}, function(err, module) {
            if(err) throw err;

            Projects.findOne({Id: module.project_Id}, function(err, project) {


                var server = terms.get_ssh_git(project);
                var host = server.host;
                var repo = server.git_url;

                if(!server.host.host){
                    res.send({status: false, message: "No server setup yet"});
                    return;
                }

                if(!project.docker){
                    res.send({status: false, message: "No Docker File Setup"});
                    return;
                }

                var developer_id = module.developer_Id;
                var project_id = module.project_Id;
                var project_port = project.project_port;


                if(!project_port || !repo){
                    res.send({status: false, message: "Server not fully setup"});
                    return;
                }

                project_id = project_id.toLowerCase();

                console.log("Connecting to ", host);

                var base_url = "zeedas";
                var tag = developer_id + "" + project_id;
                tag = tag.toLowerCase();
                var ip = "178.62.51.68";
                ip = "zeedas.com";

                var data = 'mkdir -p '+base_url+'/project_'+project_id+'/developer_'+developer_id+'; cd $_; next\
    pwd; next\
    if test -d '+base_url+'; \
    then echo "Already Cloned"; next\
    docker ps | grep '+ tag+'; else next\
    docker ps -a; next\
    wget '+hosturl+'/docker_file/'+module.project_Id+' -O Dockerfile --no-check-certificate; \
    git clone -b developer_'+developer_id+' '+repo+' '+base_url+'; \
    docker build -t "'+project_id+'" . next\
    docker run -d --name "'+tag+'" -p $port:'+project_port+' -v $(pwd)/'+base_url+':/usr/src/app '+project_id+' next\
    fi;';
                var send = data.split("next");

                var round = 0;
                var path = "";
                var sent = false;
                var port = "";
                var socket_port = 10000;

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
                                res.send({status: true, link: link, path: path, mysocket: soc});
                                sent = true;
                            }else{
                                if(round == 1) {
                                    sshObj.commands.push("docker start "+tag);
                                    sshObj.commands.push("docker ps | grep "+tag);

                                }else{
                                    res.send({status: false, link: "Link can not be found"});
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
                            res.send({status: true, link: link, path: path, mysocket: soc});
                        }
                        //sent = true;
                    },
                    function(error){
                        console.log("..........error = >" + error);
                        if(!sent) {
                            res.send({status: false, error: error});
                        }
                    }
                );


            });

        });
    });


    app.get('/terminal/reset_docker/:Id', function(req, res){

        Module.findOne({Id:req.params.Id}, function(err, module) {
            if(err) throw err;

            Projects.findOne({Id: module.project_Id}, function(err, project) {


                var server = terms.get_ssh_git(project);
                var host = server.host;

                if(!server.host.host){
                    res.send({status: false, message: "No server setup yet"});
                    return;
                }

                var developer_id = module.developer_Id;
                var project_id = module.project_Id;


                project_id = project_id.toLowerCase();

                var base_url = "zeedas";
                var tag = developer_id + "" + project_id;
                tag = tag.toLowerCase();

                var data = 'docker stop '+tag+'; next\
    docker rm '+tag+'; next\
    cd '+base_url+'/project_'+project_id+'; next\
    rm -R developer_'+developer_id+';';
                var send = data.split("next");

                terms.ssh(host, send, function (command, response, sshObj) {

                    }
                    ,
                    function (sessionText, sshObj) {
                        //console.log("..........ended = >" + sessionText);
                        res.send({status: true, message: "Successfully Deleted"});
                    }
                );


            });

        });
    });


//GET DOCKER FILE
   app.get("/docker_file/:Id", function(req, res){
       Projects.findOne({Id: req.params.Id}, function(err, project) {
           Dockers.findOne({Id: project.docker}, function(err, docker)
           {
               var text_ready = docker.content;
               res.writeHead(200, {
                   'Content-Type': 'application/force-download',
                   'Content-disposition': 'attachment; filename=Dockerfile'
               });

               res.end(text_ready);
           });
       });

   }) ;

//get link
    app.get('/terminal/console/:Id/:time', function(req, res){

        Module.findOne({Id:req.params.Id}, function(err, module) {
            if(err) throw err;

            Projects.findOne({Id: module.project_Id}, function(err, project) {


                var server = terms.get_ssh_git(project);
                var host = server.host;
                if(!server.host.host){
                    res.send({status: false, message: "No server setup yet"});
                    return;
                }

                var developer_id = module.developer_Id;
                var project_id = module.project_Id;
                var tag = developer_id + "" + project_id;
                tag = tag.toLowerCase();
                var timestamp = req.params.time+"";

                //console.log("timestamp======"+timestamp);
                var add = timestamp != "0" && timestamp.length > 16?("--since "+timestamp):"";

                var data = 'docker logs ' + tag + ' --timestamps '+add+' | head -n 50';

                var send = data.split("next");

                //console.log("git pulling.... " + send);
                terms.ssh(host, send, function (command, response, sshObj) {

                        if(command.indexOf("docker logs") > -1){
                            var data = response.replace(/\r/g, "").split("\n");
                            //console.log(data);
                            var filtered = [];
                            var time = "";

                            for(var i = 1; i < data.length; i++){
                                var row = data[i];

                                if(i  == data.length - 2) {
                                    //console.log("..................." + row);
                                    time = row.match(/^[^\s]+/g)+"";
                                    //console.log("TIME==", time);
                                    time = time && time.length > 16 ? time : "";
                                    break;
                                }

                                if(i+ 2 > data.length )
                                    continue;


                                filtered.push(row.replace(/^[^\s]+/, "").substring(1));
                            };
                            res.send({status: true, data: filtered, time: time})

                        }
                    },null,
                    function(err, errtyp){
                        var error = "Error Connecting to Server";
                        if(typeof err == "string"){
                            error = err;
                        }else if(err){
                            error = "";
                            for(var i in err)
                                error += err[i]+"\n";
                        }
                        res.send({status:false, message: error});
                    },null,
                    function (sessionText, sshObj) {
                        //console.log("..........ended = >" + sessionText);
                        //sent = true;
                    }
                );


            });

        });
    });

    //TEST MAIL
    app.post('/test_mail', function (req, res) {
        /** Add a new skill */
        console.log("Sending command.............");
        var mail            = {};
        var baseUrl = "zeedas.com";

        mail.template       = req.body.template || "invite";
        mail.subject        = req.body.subject || "Account Invitation";
        mail.first_name     = req.body.first_name || "Mzeee";
        mail.team_name      = req.body.team || "ZEEDAS TEAM";
        mail.email          = req.body.email || "mzndako@gmail.com";
        mail.link           = baseUrl+'/signup/'+mail.email;

        functions.Email(mail);
        res.send("Sent");

    });

     app.post('/term_hook', function (req, res) {
        /** Add a new skill */
        console.log("Sending command.............");
        console.log(req.body);
        var module_id = req.body.module_id || "0009";
        var port = req.body.port || "8082";

        var data = 'module_id='+module_id+'; base_url=zeedas; port='+port+'; repository=https://Princevlad:Prince45@bitbucket.org/Princevlad/natterbase.git; next\
mkdir projects; cd projects next\
ufw allow $port; next\
mkdir module_$module_id;  cd module_$module_id next\
wget http://178.62.51.68:8000/docker_file/ next\
if test -d $base_url; then echo "Already Cloned"; else git clone $repository $base_url; fi next\
git clone -b module_$module_id $repository $base_url next\
docker build -t $module_id/$base_url . next\
docker run  -d --name "$module_id" -p $port:8000 -v $(pwd)/$base_url:/usr/src/app $module_id/$base_url';
        var sent = false;
        var send = data.split("next");
        console.log("sent"+send);
        terms.ssh(host, send, function(command, response, sshObj){
                console.log(command+" => "+response+"[ENDED]");
            },
            function (sessionText, sshObj){
                console.log("..........ended = >" + sessionText);
                if(!sent)
                    res.send(sessionText);
                sent = true;
            }
        );

    });

    app.post('/terminal/test_git_url', function (req, res) {
        console.log("hosturl", hosturl);


        var url = req.body.url || "";
        var username = req.body.username || "";
        var password = req.body.password || "";

        var credential = terms.base64.encode(username+":"+password);

        if(url.toLowerCase().indexOf("bitbucket.org") > -1 || url.toLowerCase().indexOf("bitbucket.com") > -1) {
            url = url.replace(/(https|http):\/\//,"");
            var ab = url.split("/");
            var options = {
                url: 'https://api.bitbucket.org/2.0/repositories/'+ab[1]+'/'+ab[2]+'',
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + credential
                },
                body: ''
            };
            request(options, function (error, response, body) {
                if (error) {
                    res.send({status: true, message: "Error: "+error});
                }else{
                    var code = response.statusCode || 400;
                    var message = "";
                    switch(code){
                        case 400: message = "Invalid Username or Password"; break;
                        case 401: message = "Invalid Username or Password"; break;
                        case 404: message = "Repository Not Found"; break;
                        case 200: message = "Successful"; break;
                        default: message = "Invalid Repository Url";
                    }
                    console.log(response.statusCode, ab);
                    res.send({status: code==200?true:false, message: message})
                }
            });
        }else if(url.toLowerCase().indexOf("github.com") > -1) {
            url = url.replace(/(https|http):\/\//,"");
            var ab = url.split("/");
            var agent = ":Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36"
            var options = {
                url: 'https://api.github.com/repos/'+ab[1]+'/'+ab[2]+'',
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + credential,
                    'User-Agent':agent,
                    UserAgent: agent
                },
                body: ''
            };
            //console.log(options);
            request(options, function (error, response, body) {
                if (error) {
                    res.send({status: true, message: "Error: "+error});
                }else{
                    var code = response.statusCode || 400;
                    var message = "";
                    switch(code){
                        case 400: message = "Invalid Username or Password"; break;
                        case 401: message = "Invalid Username or Password"; break;
                        case 404: message = "Repository Not Found"; break;
                        case 200: message = "Successful"; break;
                        default: message = "Invalid Repository Url";
                    }
                    //console.log(response.statusCode, ab);
                    res.send({status: code==200?true:false, message: message})
                }
            });
        }else{
            res.send({status:false, message: "Only Bitbucket or GitHub Url is currently accepted"})
        }
    });

    //TEST SSH
    app.post('/terminal/test_ssh', function (req, res) {
        var host = {
            host: req.body.ssh_address,
            port: req.body.ssh_port || 22,
            userName: req.body.ssh_username
        };

        if(req.body.ssh_password){
            host.password = req.body.ssh_password;
        }else{
            host.passPhrase =   req.body.ssh_passphrase;
            host.privateKey = req.body.ssh_privatekey;
        }

        var cmd = ["mkdir -p zeedas/socket; cd $_;",
            "wget "+hosturl+"/serversocket_json -O package.json --no-check-certificate" ,
        "wget "+hosturl+"/serversocket -O index.js --no-check-certificate",
        "cat /etc/*-release" ];
        //console.log(cmd);
        terms.ssh(host, cmd,
            function(command, response, sshObj){
                //console.log("Executed => "+ command);
                //console.log("Response => "+ response);
                if(command.indexOf("cat /etc/*-release") > -1){
                    //console.log("server..........................................");
                    var server = type_of_server(response);
                    console.log("Server", server);
                    sshObj.commands.unshift("pm2 start index.js --name zeedas_socket --watch");
                    sshObj.commands.unshift("ufw allow 10000");
                    sshObj.commands.unshift("npm install -g pm2");
                    sshObj.commands.unshift("npm install");
                    sshObj.commands.unshift(ssh_command("install", server, "ufw"));
                    sshObj.commands.unshift(ssh_command("install", server, "docker"));
                    sshObj.commands.unshift(ssh_command("install", server, "npm"));
                    sshObj.commands.unshift(ssh_command("update", server));
                }
            },null,
            function(err, errtype){
                console.log("ERROR.................",err);
                var error = "Error Connecting to Server";
                if(typeof err == "string"){
                    error = err;
                }else if(err){
                    error = "";
                    for(var i in err)
                        error += err[i]+"\n";
                }
                res.send({status:false, message: error});
            },null,
            function (sessionText){
                console.log(sessionText);
                var x = "Installing needed softwares.\nServer Setup Successful";
                res.send({status: true, message: x});
            }
        );

    });

    function ssh_command(command, server, mypackage){
        if(server){
            server = server.toLowerCase();
        }
        switch(command){
            case "install":
                switch (server){
                     case "centos": return "sudo yum install -y "+mypackage+"";
                     case "fedora": return "sudo dnf install -y "+mypackage+"";
                     case "freebsd": return "sudo pkg install "+mypackage+"";
                     default: return "sudo apt-get install -y "+mypackage+"";
                };
            case "update":
                switch (server){
                     case "centos": return "sudo yum update";
                     case "fedora": return "sudo dnf update";
                     case "freebsd": return "sudo pkg update";
                     default: return "sudo apt-get update";
                };
                return;


        }
    }

    function type_of_server(response){
        response = response.toLowerCase();
        if(response.indexOf("ubuntu") > -1){
            return "ubuntu";
        }
        if(response.indexOf("debian") > -1){
            return "debian";
        }
        if(response.indexOf("centos") > -1){
            return "centos";
        }
        if(response.indexOf("fedora") > -1){
            return "fedora";
        }
        if(response.indexOf("freebds") > -1){
            return "freebds";
        }
        return "ubuntu";
    }


    //Debian	.deb	apt, apt-cache, apt-get, dpkg
    //Ubuntu	.deb	apt, apt-cache, apt-get, dpkg
    //CentOS	.rpm	yum
    //Fedora	.rpm	dnf
    //FreeBSD
};

