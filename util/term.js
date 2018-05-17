var express   = require('express');
var app       = express();
// var pty       = require('pty.js');
var fs        = require('fs');
var Bash      = require('../database/models/bash.js')
var base_path = '../../public/bash/';
var SSH2Shell = require('ssh2shell');


var options = function(data){
    var commands = {

      create_dir  :"mkdir",
      update_files:"git pull"
    }
};





var loggedin = false;

// var Input = function(data, io){
//
//   term.write(req.body.data+"\n");
//
//
//// If Output
//
// }



let create_bash =  function(data, file_name){

fs.writeFile(base_path+file_name, data, (err) => {
    if (err) throw err;

    done = true;

});


}

let delete_file = function(file_name, done){


  fs.unlink(base_path+file_name, function (err) {
     if (err) throw err;

      done();
 });

}



// Bash.findOne({Id:Id}, function(err, data){
//
//      create_bash(data.conten);
//
// });

var ssh = function(host, commands, onCommandComplete, onEnd, onError, onTimeOut, callback)
{
    var host = {
        //server: {
        //    host: process.env.HOST,
        //    port: process.env.PORT,
        //    userName: process.env.USER_NAME,
        //    password: process.env.PASSWORD,
        //    passPhrase: process.env.PASS_PHRASE,
        //    privateKey: require('fs').readFileSync(process.env.PRIV_KEY_PATH)
        //},
        server: host,
        commands: commands,
        idleTimeOut:         60000,
        verbose: false,
        //debug: true,
        msg:                {
            send: function( message ) {
                console.log(message);
            }
        },

        onCommandComplete: function (command, response, sshObj) {
            if(onCommandComplete != undefined)
                onCommandComplete(command, response, sshObj);
            return;

            //confirm it is the root home dir and change to root's .ssh folder
            if (sshObj.debug) {
                this.emit("msg", this.sshObj.server.host + ": host.onCommandComplete event, command: " + command);
            }
            if (command === "echo $(pwd)" && response.indexOf("/root") != -1) {
                //unshift will add the command as the next command, use push to add command as the last command
                sshObj.commands.unshift("msg:The command and response check worked. Added another cd command.");
                sshObj.commands.unshift("cd .ssh");
            }
            //we are listing the dir so output it to the msg handler
            else if (command === "ls -l") {
                this.emit("msg", response);
            }
        },

        onEnd: function (sessionText, sshObj) {
            //email the session text instead of outputting it to the console
            if(onEnd)
                onEnd(sessionText, sshObj);

            return;
            if (sshObj.debug) {
                this.emit("msg", this.sshObj.server.host + ": host.onEnd event");
            }
            var sessionEmail = new Email({
                from: "me@example.com",
                to: "me@example.com",
                subject: "Automated SSH Session Response",
                body: "\nThis is the full session responses for " + sshObj.server.host + ":\n\n" + sessionText
            });
            this.emit("msg", "Sending session response email");

            // if callback is provided, errors will be passed into it
            // else errors will be thrown
            sessionEmail.send(function (err) {
                sshObj.msg.send('error', err, 'Email');
            });
        },
        onError: function( err, type, close = false, callback){
            if(onError){
                onError(err,type,close,callback);
            }

        },
        onCommandTimeout:    function( command, response, stream, connection ) {
            if(onTimeOut){
                onTimeOut(command, response, stream, connection);
            }
        },
        callback: function(sessionText){
            if(callback)
                callback(sessionText);
        }
    };


//Create a new instance

    var SSH = new SSH2Shell(host);

//Start the process
    SSH.connect();
console.log("Starting SSH server");
    //SSH.connect(callback);

};

var generatePort = function(ports){
    var port = Math.floor((Math.random() * 1000)) + 8000;
    if(!ports)
        return port;

    ports.forEach(function(p){
        if(p == port){
            return generatePort(port);
        }
    });

    return port;
};

var Base64 = {

// private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

// public method for encoding
    encode : function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = Base64._utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },

// public method for decoding
    decode : function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {

            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

        }

        output = Base64._utf8_decode(output);

        return output;

    },

// private method for UTF-8 encoding
    _utf8_encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    },

// private method for UTF-8 decoding
    _utf8_decode : function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;

        while ( i < utftext.length ) {

            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }

        }

        return string;
    }

}

var get_ssh_git = function(project){
    var host = {};

    host.host = project.ssh_address;
    host.userName = project.ssh_username;

    if(project.ssh_password){
        host.password = project.ssh_password;
    }else{
        host.passPhrase =   project.ssh_passphrase;
        host.privateKey = project.ssh_privatekey;
    }

    var url = project.repository_url;
    var username = project.repository_username;
    var password = project.repository_password;

    if(username.indexOf("@") > -1){
        username = username.substring(0, username.indexOf("@"));
    }

    var credential = username+":"+password;

    var protocol = url.trim().toLowerCase().indexOf("https") == 0?"https":"http";

    url = url.replace(/(https|http):\/\//,"");

    var split = url.split("/");

    var url_host = split[0] || "";
    var url_base_name = split[1] || "";
    var url_project_name = split[2] || "";
    url_host = url_host.replace("www.", "", url_host);

    if(url_host.indexOf("@") > -1){
        url_host = url_host.substring(url_host.indexOf("@") + 1);
    }


    var git_url = protocol+"://"+credential+"@"+url_host+"/"+url_base_name+"/"+url_project_name;

    return {host: host, git_url: git_url};

}

module.exports = {
  ssh : ssh,
  generatePort: generatePort,
  base64: Base64,
  get_ssh_git: get_ssh_git
};
