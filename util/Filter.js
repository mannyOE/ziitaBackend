var express         = require('express');
var app             = express();
var functions       = require('../util/functions');
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

var by_developers = function(pushedData, project, developers, categories){
    var sData = [];
    var sDataLoop = [];
    var skills = {};
    var maxHour = 2;
    var devCount = developers.length || 1;

//return sData;
    for(var i in categories){
        skills[categories[i].Id] = categories[i];
    }


    for(var i in pushedData){
        var me = pushedData[i].toJSON();
        me.skills = skills[pushedData.category] || [];
        me.time = me.dev_time;
        sData.push(me);
        //sDataLoop.push(me);
    };

    var events = [];

    var newData = {};

    var day = 1;
    var data = {};

    var spentHour = {};
debugger;
    while(sData.length > 0){

        data[day] = data[day] || {};
        for(var i = 1; i <= maxHour; i++){
            data[day][i] = [];
        }

        var devRoundCount = 1;
        do {


            developers.forEach(function (dev) {
                if(dev.Id == "000052")
                    return true;

                var breakLoop = false;

                var actualDevTime = 10;
                var vDay = day;
                if (!spentHour[vDay]) {
                    spentHour[vDay] = {};
                }
                var devId = dev.Id;

                var devTime = spentHour[vDay][devId] || actualDevTime;
                spentHour[vDay][devId] = devTime;

                //LOOP THROUGH THE MODULES (LP3)
                for (var j in sData) {
                    if (!spentHour[vDay]) {
                        spentHour[vDay] = {};
                    }
                    devTime = spentHour[vDay][devId] || actualDevTime;
                    spentHour[vDay][devId] = devTime;

                    //CONTINUE LOOP TILL THE MODULE TIME IS EXHAUSTED
                    while (sData[j].time > 0) {
                        if (!spentHour[vDay]) {
                            spentHour[vDay] = {};
                        }
                        devTime = spentHour[vDay][devId] || actualDevTime;
                        spentHour[vDay][devId] = devTime;

                        var moduleTime = sData[j].time;
                        data[vDay] = data[vDay] || {};
                        //LOOP THROUGH THE MAXIMUM HOUR (LP2)
                        var found = false;
                        for (var i = 1; i <= maxHour; i++) {

                            //Break when dev time is zero
                            if (spentHour[vDay][devId] == 0) {
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
                                spentHour[vDay][devId] = devTime;
                                list.push({developerId: devId, moduleId: sData[j].Id});
                                data[vDay][i] = list;
                                moduleTime = moduleTime - 1;

                                sData[j].time = moduleTime;

                                if (moduleTime == 0) {
                                    sData.splice(j, 1);
                                    breakLoop = true;
                                    break;
                                }

                            }else{
                                console.log("found----", devRoundCount);
                                if(devRoundCount == 1){
                                    breakLoop = true;
                                }
                            }

                            if (maxHour == i && moduleTime > 0) {
                                vDay++;
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
                    }
                }//End of foreach sData loop (lp3);

            }); //End of foreach loop for DEVELOPERS

            var timeStillLeft = false;
            //CHECK WHETHER DEVELOPER STILL HAVE TIME LEFT
            for(var id in spentHour[day]){
                var devTimeLeft = spentHour[day][id];
                if(devTimeLeft > 0){
                    timeStillLeft = true;
                    break;
                }
            }

            //Continue Loop Through Developer Loop (Nested Loop) till no time left for the day or no module left
            devRoundCount++;
        }while(timeStillLeft > 0 && sData.length > 0);

    }
    console.log("end", day);

    return data;

    var updatedData = [];
    for(var i in data){
        var value = {};
        for(var h in data[i]){
            var dt = data[i][h];
            for(var m in dt){
                if(!value[dt[m].moduleId]){
                    value[dt[m].moduleId] = {developerId: dt[m].developerId, hours: 1};
                }else{
                    var hours = value[dt[m].moduleId]['hours'];
                    value[dt[m].moduleId]['hours'] = hours + 1;
                }
            }
        }
        var date = new Date();
        date.setDate(date.getDate() + parseInt(i) - 1);

        var add = {date: date.toDateString(), modules: value};
        updatedData.push(add);
    }

    return updatedData;

    var found_ids = [];
return sData;
    var found = true;
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
                            found = true;
                            found_ids.push(unique);
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


    console.log("current date",new Date());
    return result;
}

module.exports = {
    by_dependency:by_dependency,
    by_developers :by_developers,
    by_category   :by_category,
    getTimeLine   : getTimeLine,
    calculateDevSpeed: calculateDevSpeed

};

