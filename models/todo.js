//MODELS!!
var mongoose = require('mongoose');// require mongoose


//User Schema

var TodoSchema = mongoose.Schema({   //define data collection schema
        list_id: {
            type: String,
            index:true
        },
        title: {
            type: String,
            index:true
        },
        notes: {
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
  
//get
module.exports.getTodos = function(listId, callback){
    Todo.find({
        list_id: listId
    }, callback);
};

//delete task  //might want to soft delete in case you want to look at recently deleted
module.exports.deleteTask = function(mongoTaskId){

};