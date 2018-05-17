var express         = require('express');
var app             = express();
var functions       = require('../util/functions');
var timelineLogModel = require('../database/models/timelineLogs');
var timelineTempModel = require('../database/models/timelineTemp');
var projectModel    = require('../database/models/projects.js');
var moduleModel      = require('../database/models/module.js');
var userModel      = require('../database/models/user');
var categoryModel      = require('../database/models/category');
var durationModel      = require('../database/models/duration');
var settingModel      = require('../database/models/settings');
var lessdep         = [];
var lessdep_ids     = [];
var all_modules     = [];
var all_modules_ids = [];
var fs = require("fs");
var moment = require("moment");
var Promise = require("bluebird");

var extract_firstlevel = function(payload) {
    payload.forEach(function(data){
        if (data.dependency.length < 1) {
            lessdep.push(data);
            lessdep_ids.push(data.Id);
        }else{
            all_modules.push(data);
            all_modules.dependency.forEach(function(data2){
                all_modules_ids.push(data2.module_id);
            });
        }
    });
};

var search_module_old = function(array, el){
    el.dependency.forEach(function(data){
        array.forEach(function(module){
            if (data.module_Id == module.Id) {
                return true;
            }
        });
    });
    return false;
};



var filter_all = function(payload){

    var all_set         = {};
    var i               = 0;

    payload.forEach(function(new_payload){

        i++;

        if (all_modules.length > 0) {

            all_set[i] = {
                day:functions.Day(i),
                task:[],
            };

            all_modules.forEach(function(data){
                if (search_module(all_modules, data) != true) {
                    all_set[i].task.push(data);
                    all_set.count = i;
                    all_modules.splice(data, 1);
                };
            });

        }else{

            return;
        }

    });

    return all_set;

};

var by_dependency = function(data){

    //var all_data = data;
    //var next_data = [];
    //var level = -1;

    var found = true;

    var found_ids = [];
    while(found) {
        found = false;

        for (var i = 0; i < data.length; i++) {
            var module = data[i];
            for (var j = 0; j < module.dependency.length; j++) {
                var dep = module.dependency[j];
                for (var x = 0; x < data.length; x++) {
                    if (dep.module_Id == data[x].Id) {
                        var module2 = data[x];
                        var unique = i+"-"+x;
                        if (x > i && found_ids.indexOf(unique) == -1) {
                            data[i] = module2;
                            data[x] = module;
                            found_ids.push(unique);
                            found = true;
                            break;
                        }
                    }
                }
                if(found)
                    break;
            };
            //if(row.module_Id == b.Id){
            //    return 1;
            //}
        }
        ;
    }
    return data;

};

var search_module = function(all_module,module_Id,level){
    all_module.forEach(function(data){
       data.dependency.forEach(function(row){
            if(row.module_Id == module_Id){
                return search_module(all_module, row.Id, level++);
            }
       });
    });
    return level;
}


/*
  Data is the content of the modules that just got filtered by denppendencies
  number is the number of developer on this project
*/
//GET DEVELOPER TIME
function developerTime(){

    this.vDay = 0; this.devId = 0; this.actualDevTime = 0;
    this.spentHour = {};
    this.init = function(){
        if (!this.spentHour[this.vDay]) {
            this.spentHour[this.vDay] = {};
        }
        if(!this.spentHour[this.vDay][this.devId]){
            this.spentHour[this.vDay][this.devId] = {max: this.actualDevTime, timeLeft: this.actualDevTime};
        }
    };

    this.getTimeLeft = function(){
        this.init();
        return this.spentHour[this.vDay][this.devId]['timeLeft'];
    };

    this.maxTime = function(){
        this.init();
        return this.spentHour[this.vDay][this.devId]['max'];
    }

    this.setTimeLeft = function(timeLeft){
        this.init();
        this.spentHour[this.vDay][this.devId]['timeLeft'] = timeLeft;
        return timeLeft;
    }


}

var spentHour = {};

var by_developers = function(pushedData, project, developers, categories, includeAll, start_day){
    var sData = [];
    var doneModules = [];
    let notMatchModules = [];
    var sDataLoop = [];
    var skills = {};
    var maxHour = 2;
    var devCount = developers.length || 1;
    var moduleById = {};
    var developersById = {};

    console.log("DATE: ", new Date());

//return sData;
    for(let i in categories){
        skills[categories[i].Id] = categories[i];
    }

    for(let i in pushedData){
        let me = pushedData[i].toJSON();
        me.skills = skills[pushedData.category] || [];
        me.time = me.dev_time;
        moduleById[me.Id] = me;

        if(me.status == 3){
            doneModules.push(me);
        }else{
            sData.push(me);
        }
        //sDataLoop.push(me);
    };

    for(let i in developers){
        developersById[developers[i].Id] = developers[i];
    }

    var events = [];
    var newData = {};
    var day = 0;
    var data = {};

    spentHour = {};

debugger;
    var dTime = new developerTime();

    while(sData.length > 0){
        day++;
        data[day] = data[day] || {};

        var devRoundCount = 0;
        do {
            devRoundCount++;

            var matchFound = false;
            developers.forEach(function (dev) {
                // if(dev.Id == "000052")
                //     return true;

                var breakLoop = false;

                var actualDevTime = 10;
                var vDay = day;
                var devId = dev.Id;

                dTime.vDay = vDay;
                dTime.actualDevTime = actualDevTime;
                dTime.devId = devId;

                var devTime = dTime.getTimeLeft();

                if(devTime == 0){
                    return true;
                }


                //LOOP THROUGH THE MODULES (LP3)
                for (var j in sData) {
                    if(sData[j].developer_Id && developersById[sData[j].developer_Id] && sData[j].developer_Id != devId){
                        continue;
                    }else{
                        matchFound = true;
                    }
                    devTime = dTime.getTimeLeft();
                    sData[j].time = sData[j].time || 10;


                    //CONTINUE LOOP TILL THE MODULE TIME IS EXHAUSTED
                    while (sData[j].time > 0) {
                        devTime = dTime.getTimeLeft();

                        var moduleTime = sData[j].time;
                        data[vDay] = data[vDay] || {};
                        //LOOP THROUGH THE MAXIMUM HOUR (LP2)
                        var found = false;
                        var max = dTime.maxTime();
                        for (var i = (max - dTime.getTimeLeft()) + 1; i <= max; i++) {
                            //if(sData[j].time == sData[j].dev_time)
                            //Break when dev time is zero
                            if (dTime.getTimeLeft() == 0) {
                                break;
                            }
                            var list = data[vDay][i] || [];
                            found = false;
                            list.forEach(function (myList) {
                                if (myList.developerId == devId) {
                                    found = true;
                                }
                            });
                            if (!found) {
                                devTime--;
                                dTime.setTimeLeft(devTime);
                                // console.log("TimeLeft", devTime, devId);
                                let save = {developerId: devId, moduleId: sData[j].Id, last_day: moduleTime==0?true:false};
                                if(includeAll){
                                    save = Object.assign({},sData[j], save);
                                }

                                list.push(save);
                                data[vDay][i] = list;
                                moduleTime = moduleTime - 1;

                                sData[j].time = moduleTime;

                                if (moduleTime == 0) {
                                    sData.splice(j, 1);
                                    breakLoop = true;
                                    break;
                                }

                            }else{
                                // console.log("found----", devRoundCount);
                                if(devRoundCount == 1){
                                    breakLoop = true;
                                }
                            }

                            if (max == i && moduleTime > 0) {
                                vDay++;
                                dTime.vDay = vDay;
                                break;
                            }


                        }//end of loop (LP2)

                        if (moduleTime == 0) {
                            break;
                        }

                        if(breakLoop){
                            break;
                        }

                    }
                    ;//End OF WHILE LOOP sData.length > 0 && devTime > 0

                    if (moduleTime <= 0) {
                        break;
                    }
                    if(breakLoop){
                        break;
                    }

                    if (devTime == 0 && moduleTime > 0) {
                        vDay++;
                        dTime.vDay = vDay;
                    }
                }//End of foreach sData loop (lp3);

            }); //End of foreach loop for DEVELOPERS

            var timeStillLeft = false;
            //CHECK WHETHER DEVELOPER STILL HAVE TIME LEFT
            for(var id in dTime.spentHour[day]){
                var dev = dTime.spentHour[day][id];
                if(dev.timeLeft && dev.timeLeft > 0){
                    timeStillLeft = true;
                    break;
                }
            }

            // console.log("TIME", dTime.spentHour, sData.length);

            //Continue Loop Through Developer Loop (Nested Loop) till no time left for the day or no module left
            devRoundCount++;
        }while(matchFound && timeStillLeft && sData.length > 0);

    }

    // console.log("end", day);

    // return data;

    var updatedData = [];
    let today = start_day?new Date(start_day):new Date();
    let date = new Date();

    for(var i in data){
        var value = {};
        for(var h in data[i]){
            var dt = data[i][h];
            for(var m in dt){
                if(!value[dt[m].moduleId]){
                    var devName = developersById[dt[m].developerId]?(developersById[dt[m].developerId]['first_name']+" "+developersById[dt[m].developerId]['last_name']):"No Developer Found";
                    var module = moduleById[dt[m].moduleId]?moduleById[dt[m].moduleId]:{};
                    var moduleName = module['module_name'];
                    var actual_time = module['actual_time'] || 0;

                    let save = {developerId: dt[m].developerId, developer: devName, hours: 1, module_name: moduleName, time_spent: round(actual_time/ (60 * 60)), completed: false, last_day: dt[m].last_day};
                    if(includeAll){
                        save = Object.assign({},module, save);
                    }
                    value[dt[m].moduleId] = save;
                }else{
                    var hours = value[dt[m].moduleId]['hours'];
                    value[dt[m].moduleId]['hours'] = hours + 1;
                }
            }
        }

        date.setDate(today.getDate() + parseInt(i) - 1);

        var add = {date: date.toDateString(), modules: value};
        updatedData.push(add);
    }

    let sent_module = function(module){
        let devName = developersById[module.developer_Id]?(developersById[module.developer_Id]['first_name']+" "+developersById[module.developer_Id]['last_name']):"No Developer Found";
         let save = {developerId: module.developer_Id, developer: devName, hours: module.dev_time, module_name: module.module_name, time_spent: round((module.actual_time || 0)/(60 * 60)), completed: module.status == 3?true:false, last_day: true};
        if(includeAll){
            save = Object.assign({}, module, save);
        }

        return save;

    };

    for(var i in doneModules){
        let module = doneModules[i];
        let date = new Date(module.date_completed).toDateString();
        let found = false;
        for(let j in updatedData){
            if(updatedData[j].date == date){
                let value = updatedData[j]['modules'];
                value[module.Id] = sent_module(module);
                found = true;
                updatedData[j]['modules'] = value;
                break;
            }
        }
        if(!found){
            let value = {};
            value[module.Id] = sent_module(module);
            let task = {date: date, modules: value};
            updatedData.unshift(task);
        }
    }


    console.log("sorting DATE: ", new Date());
    var dData = updatedData.sort(function(a, b){
        let aDate = new Date(a.date).getTime();
        let bDate = new Date(b.date).getTime();
        if(aDate > bDate){
            return 1;
        }
        return -1;
    });
    console.log("END DATE: ", new Date());
    return dData;
};

var round = function(value, decimals) {
    decimals = decimals?decimals:0;
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}
var by_category = function(data){

};

var by_duration = function(data){

};

var getTimeLine = function(docs){
    var prom = new Promise.defer(),
        depListObj = {},
        depListObj2 = [],
        nodes = {},
        resolved = [],
        numOfHoursInADay = 10;
        //start_date = new Date().getTime(); //moment().format("DD-MM-YYY");

    function createNode(name)
    {
        return {
            name: name,
            edges: [],
            module: {}
        };
    }

    function resolveNode(node, resolved)
    {
        for(var edge in node.edges)
        {
            if(!resolved.includes(node.edges[edge]))
            {
                resolveNode(node.edges[edge], resolved);
            }
        }
        resolved.push(node);
    }

    if(!docs && docs.length <= 0)
    {
        prom.reject("Invalid projects parsed");
    }
    else
    {
        docs.forEach(function(item){
            if(!nodes[item.module_name])
            {
                nodes[item.module_name] = createNode(item.module_name);
                nodes[item.module_name].module = item;
            }


            if(item.dependency && item.dependency.length > 0)
            {
                item.dependency.forEach(function(depitem){
                    var a = docs.find(function(i){
                        return i.module_name === depitem.module_name;
                    });

                    if(!nodes[a.module_name])
                    {
                        nodes[a.module_name] = createNode(a.module_name);
                        nodes[item.module_name].module = a;
                    }

                    nodes[item.module_name].edges.push(nodes[a.module_name]);
                });
            }
        });

        for(var me in nodes)
        {
            resolveNode(nodes[me], resolved);
        }

        for(var node in resolved)
        {
            //console.log(resolved[node].name, resolved[node]);
            var current_start_time = new Date().getTime();
            var hour_left_in_day = 10;

            if((hour_left_in_day - parseInt(resolved[node].module.dev_time)) < 0)
            {
                hour_left_in_day = 10;
                current_start_time = moment(current_start_time).endOf("day").add(1, "minute").format("YYYY-MM-DD HH:mm:ss");
            }

            depListObj[resolved[node].name] = {};
            depListObj[resolved[node].name]["stop_time"] = moment(current_start_time).add(parseInt(resolved[node].module.dev_time), "hour").format("YYYY-MM-DD HH:mm:ss");
            depListObj[resolved[node].name]["module"] = resolved[node].module;

            hour_left_in_day -= parseInt(resolved[node].module.dev_time);
        }

        prom.resolve(depListObj);


        /*
        for(var i = 0; i < docs.length; i++)
        {
            var current_start_time = new Date().getTime();
            var hour_left_in_day = 10;

            if(!depListObj[docs[i]["module_name"]])
            {
                depListObj[docs[i]["module_name"]] = {
                    module: docs[i],
                    start_time: moment(current_start_time).format("YYYY-MM-DD HH:mm:ss"),
                    end_time: moment(current_start_time).add(parseInt(docs[i].dev_time), "hour").format("YYYY-MM-DD HH:mm:ss"),
                    complete: false
                };

                hour_left_in_day -= parseInt(docs[i].dev_time);
            }

            if(docs[i]["dependency"].length <= 0)
            {
                (depListObj[docs[i]["module_name"]]).complete = true;
                continue;
            }

            var deps = docs[i]["dependency"];

            deps.forEach(function(item){
                var mod = docs.find(function(docsitem){
                    return docsitem.module_name === item.module_name;
                });

                if(mod)
                {
                    depListObj[docs[i]["module_name"]] = {
                        modules: [],
                        start_time: moment(current_start_time).format("YYYY-MM-DD HH:mm:ss"),
                        end_time: moment(current_start_time).add(parseInt(docs[i].dev_time), "hour").format("YYYY-MM-DD HH:mm:ss"),
                        complete: false
                    };

                    (depListObj[docs[i]["module_name"]]).modules.push(mod);
                    (depListObj[docs[i]["module_name"]]).dev_time += parseInt(mod.dev_time);
                }
            });
        }
        */

        //prom.resolve(docs);
    }

    return prom.promise;
};

var calculateDevSpeed = function(modules) {
    var deliverySpeed = 0;
    var workingSpeed = 0;
    var accuracy = 0;

    var completed = 0;
    var rejected = 0;
    var started = 0;
    var deadline_missed = 0;

    var timeSpent = {total: 0};

    modules.forEach(function (module) {

        //CALCULATE DELIVERY SPEED
        if (module.date_completed > 0) {
            const timeTaken = parseInt(module.date_completed) - parseInt(module.start_time);
            const expectedTime = parseInt(module.end_date) - parseInt(module.start_time);
            var speed = 10 - ((timeTaken / expectedTime) * 10);

            if (speed > 10) {
                deliverySpeed += 10;
            } else if (speed > 0) {
                deliverySpeed += speed;
            }
            completed++;

            if(module.date_completed > module.end_date){
                deadline_missed++;
            }
        }

        //CALCULATE WORKING SPEED SPEED
        if (module.actual_time > 0 && module.date_completed > 0) {
            var dev_time = module.dev_time;
            if (module.extended_time > 0) {
                dev_time += module.extended_time;
            }
            speed = 10 - ((module.actual_time / (dev_time * 3600)) * 10);
            if (speed > 10) {
                workingSpeed += 10;
            } else if (speed > 0) {
                workingSpeed += speed;
            }
            started++;
        }

        //CALCULATE ACCURACY
        if (module.rejected > 0) {
            rejected++;
            speed = 10 - ((module.rejected / 5) * 10);
            if (speed > 10) {
                accuracy += 10;
            } else if (speed > 0) {
                accuracy += speed;
            }
        }


        var total = timeSpent["total"] || 0;
        timeSpent['total'] = total + module.actual_time;


    });
    var count = module.length;

    var result = {};
    var dspeed = completed==0?10:(Math.round(deliverySpeed / completed) || 0);
    var wspeed = started==0?10:(Math.round(workingSpeed / started) || 0);
    var acc = rejected == 0?10:(Math.round(accuracy / rejected) || 0);

    result.completed = completed;
    result.rejected = rejected;
    result.started = started;

    result.developerSpeed = Math.round((dspeed + wspeed) / 2);
    result.averageSpeed = Math.round((dspeed + wspeed + acc) / 3);

    result.deliverySpeed = dspeed;
    result.workingSpeed = wspeed;
    result.accuracy = acc;
    result.deadlinesMissed = deadline_missed;
    result.timeSpent = timeSpent;



    return result;
}

//GET ALL SETTINGS FOR A TEAM. SET isTeamId to true if userId is a team_Id
var settings_get = async function(teamId, isUserId){
    if(isUserId){
        var user = await userModel.findOne({Id: teamId}).exec();
        if(!user){
            return {};
        }
        teamId = user.team_Id;
    }

    let setting = await settingModel.findOne({team_Id: teamId}).exec();

    return setting || {};
};

//SAVE SETTINGS USING USER ID. SET isTeamId to true if userId is a team_Id
var settings_save = async function(team_Id, key, value, isUserId){
    if(isUserId){
        let user = await userModel.findOne({Id: userId}).exec();
        if(!user){
            return false;
        }
        team_Id = user.team_Id;
    }

    let setting = await settingModel.findOne({team_Id: team_Id}).exec();

    let save = null;

    if(setting){
        setting = {};
        setting[key] = value;
        save = await settingModel.create({team_Id: team_Id, settings: setting}).exec();
    }else{
        setting[key] = value;
        save = await settingModel.update({team_Id: team_Id},{$set:{settings: setting}}).exec();
    }

    return save;
};

//SAVE TIMELINE TEMPORARY FOR COMPARISON
var timelime_temp_update = async function(project_id, data){

    let temp = await timelineTempModel.findOne({project_Id: project_id}).exec();

    let save = null;

    if(temp){
        save = await settingModel.create({project_Id: project_id, timeline: data}).exec();
    }else{
        save = await settingModel.update({project_Id: project_id},{$set:{timeline: data}}).exec();
    }

    return save;
};

var timelime_temp_get = async function(project_id){

    let temp = await timelineTempModel.findOne({project_Id: project_id}).exec();

    return temp?temp.timeline:[];
}

var recordTimelineLog = async function(){
    let today = new Date().toDateString();
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday = yesterday.toDateString();

    let projects = await projectModel.find({}).exec();

    var todayModules = function(modules){
        for(let i in modules){
            if(modules[i].date == today){
                return modules[i].modules;
            }
        };
        return null;
    };

    for(var i in projects){
        let project = projects[i];

        // console.log(project.company_Id);

        let sprint = 1;
        //Fetch all sprints for the project
        let my_sprints = await moduleModel.aggregate({$group:{_id: '$sprint'}}).exec();

        let sprints = my_sprints || [];
        //Rearrange the sprints in ascending order
        sprints = sprints.sort(function(a, b){
            if(a._id > b._id){
                return 1;
            }
            return -1;
        });

        let start_date = new Date().getTime();
        for(let i in sprints) {
            let sprint = sprints[i]._id;
            let timelineLog = await timelineLogModel.findOne({project_Id: project.Id, date: today, sprint: sprint}).exec();


            let modules = await moduleModel.find({project_Id: project.Id}).exec();
            let developers = await userModel.find({Id: {$in: project.team}, type: 3}).exec();
            let categories = await categoryModel.find({team_Id: project.company_Id}).exec();

            let data = by_dependency(modules);
            data = by_developers(data, project, developers, categories, true);


            if (timelineLog) {
                let update = await timelime_temp_update(project.Id, data);
                continue;
            }

            let previous_timeline = await timelime_temp_get(project.Id);

            let p_modules = todayModules(previous_timeline);

            let n_modules = todayModules(data);

            if (p_modules && n_modules) {
                for (let p in p_modules) {
                    let p_m = p_modules[p];
                    for (let n in n_modules) {
                        let n_m = n_modules[n];
                        if (p == n && p_m.last_day && !p_m.completed) {
                            let record = {
                                project_Id: project.Id,
                                sprint: sprint,
                                date: today,
                                updated_time: new Date().getTime(),
                                module_Id: p
                            };
                            let issue = "";
                            if (n_m.status == 0) {
                                issue = "Module Not been assigned to a developer";
                            }

                            if (n_m.status == 1) {
                                issue = "Module has not been accepted by the developer";
                            }

                            if (n_m.status == 4) {
                                issue = "Module is still in progress";
                            }

                            if (n_m.status == 4) {
                                let duration = durationModel.findOne({module_Id: n, date: yesterday}).exec();
                                let timeSpentYesterday = duration ? 0 : Math.floor(duration.duration / 3600);

                                if (p_m.status == 2) {

                                }
                            }

                            let save = await timelineLog.create(record).exec();

                            break;
                        }
                    }
                }
            }

            let update = await timelime_temp_update(project.Id, data);

        }


    };
};

var arrange_by_id = function(data, id){
    let returnedData = {};
    for(let i in data){
        returnedData[data[i][id]] = data[i].toJSON();
    }
    return returnedData;
};

// setInterval(recordTimelineLog, 60 * 60 * 1000);

module.exports = {
    by_dependency:by_dependency,
    by_developers :by_developers,
    by_category   :by_category,
    getTimeLine   : getTimeLine,
    calculateDevSpeed: calculateDevSpeed,
    recordTimelineLog

};
