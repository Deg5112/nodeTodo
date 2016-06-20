//MODELS!!
var mongoose = require('mongoose');// require mongoose
var ObjectId = require('mongodb').ObjectID;


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
    active:{
        type: Boolean
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

//if you say module.exports = --->   and assign the model to a variable.. you can use user in other pages

//                                       modelname , tableSchema

var List = module.exports = mongoose.model('List', ListSchema);

//get all list for user
module.exports.getList = function(UserId, callback){
    List.find({
        user_id: UserId,
        active: 1
    }, callback);
};

module.exports.getListItem = function(listId, callback){
  List.find({
      _id: ObjectId(listId)
  }, callback);
};

module.exports.updateList = function(listId, title, callback){
  List.update({
          _id: ObjectId(listId)
      }, {
      $set: {
          listTitle: title
      }
  }, callback);
};

module.exports.createList= function(UserId, taskTitle, taskNotes){

};

//edit task
module.exports.editList = function(UserId, taskTitle, taskNotes){

};

//delete task  //might want to soft delete in case you want to look at recently deleted
module.exports.deleteList = function(list, callback){
    List.update({
        _id: ObjectId(list.itemId)
    }, {
        $set: {
            active: 0
        }
    }, callback);
};