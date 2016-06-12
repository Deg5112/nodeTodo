//MODELS!!
var mongoose = require('mongoose');// require mongoose


//User Schema

var TodoSchema = mongoose.Schema({   //define data collection schema
        user_id: {
            type: String,
            index:true
        },
        taskTitle: {
            type: String,
            index:true
        },
        taskNotes: {
            type: String,
            index:true
        },
        updated_at: {
            type: Date,
            default: Date.now
        }
});

//if you say module.exports = --->   and assign the model to a variable.. you can use user in other pages

//                                       modelname , tableSchema

var Todo = module.exports = mongoose.model('Todo', TodoSchema);


module.exports.createTask = function(UserId, taskTitle, taskNotes){

};

//edit task
module.exports.editTask = function(UserId, taskTitle, taskNotes){

};

//delete task  //might want to soft delete in case you want to look at recently deleted
module.exports.deleteTask = function(mongoTaskId){

};