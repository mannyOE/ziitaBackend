var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var moduleSchema = new Schema({

    Id: {
        type: String,
        required: true // Id of this module, comes from the server side
    },
    module_name: {
        type: String, // Name of module
        required: true
    },
    module_description: {
        type: String, // Name of description
        required: true
    },
    ea:{
        type:Boolean,
    default:false
    },
    recent_files:[{
        time:String,
        path:String
    }],
    on_ea:{
        type:Number,
        default:0
    },
    method: [{
        user_Id: String,
        method_name: String,
        method_action:String,
        input_params: {
            type:Array
        }, //  methods that would be built into this module or Methods built into this module
        input_value: String,
        output_params: {
            type:Array
        },
        output_value: String,
        method_test: [{
            user_Id: String,
            case: String,
            acceptance: String,
            status:{
                type:Number,
                default: 0,
            }
        }],
        completed: {
            type: Number,
            default: 0
        },
    }],

       test: [
            {
              case: String,
              acceptance: String,
              status:{
                  type:Number,
                  default: 2,
              },
              issue: {
                type: Boolean,
                default: false
              }
        }
       ],
    tag:String,
    issues: [
            {
                user_Id: String,
                type:Number,
                issue: String,
                date: Number
            }
    ],
    dependency: [{
        module_Id: String
    }],
    category: String,
    project_Id: {
        type: String,
        required: true // the project the module belongs to
    },
    files:{
      type: Array
    },
    access_files: [String],
    developer_Id: {
        type: String // the developer assigned to this module
    },
    end_date: {
        type: Number //  Module Deadline
    },
    dev_time: {
        type: Number //  Time in hours, developer should spend on module.. It starts counting from the start time
    },
    actual_time: {
        type: Number,
        default: 0        //  Time in seconds, developer has spent on a module..
    },
    extended_time: {
        type: Number,
         default: 0     //  Time extended in hours
    },
    rejected: {
        type: Number,
         default: 0     //  Time extended in hours
    },
    date_completed: {
        type: Number //  Server side,   the date developer completes module
    },
    done_date: {
        type: Number //  Server side,   the date developer completes module
    },
    rejected_reason: String,
    start_time: {
        type: Number //  Server side, immediately developer starts coding
    },
    created_time: {
        type: Number //  Server side
    },
    updated_time: {
        type: Number //  Server side
    },
    status: {
        type: Number, //  Server side 1=New, 2=Submitted, 3=Done, 4=Progress
        default: 1
    },
    link: String,
    access_files: [String],
    sprint: {type: Number, required: true, default: 1},
});

module.exports = mongoose.model('Module', moduleSchema);
