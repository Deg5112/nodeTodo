//MODELS!!
var mongoose = require('mongoose');// require mongoose


//User Schema

var ListSchema = mongoose.Schema({   //define data collection schema
    user_id: {
        type: String,
        index:true
    },
    listTitle: {
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

var List = module.exports = mongoose.model('List', ListSchema);


module.exports.getList = function(UserId, callback){
    List.find({
        user_id: UserId
    }, callback);
};

module.exports.createList= function(UserId, taskTitle, taskNotes){

};

//edit task
module.exports.editList = function(UserId, taskTitle, taskNotes){

};

//delete task  //might want to soft delete in case you want to look at recently deleted
module.exports.deleteList = function(mongoTaskId){

};