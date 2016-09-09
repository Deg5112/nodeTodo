//MODELS!!
var mongoose = require('mongoose');// require mongoose
var ObjectId = require('mongodb').ObjectID;


//User Schema

var ListSchema = mongoose.Schema({   //define data collection schema
    user_ids: [
        {type: String}
    ],
    messages: [
       
    ],
    listTitle: {
        type: String,
        index:true
    },
    shared:{
        type: Boolean
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
    console.log('find list by id ', UserId);
    List.find({
        user_ids:{$in:[UserId]},
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

module.exports.addUserToList = function(listId, userId, callback){
    console.log('listId ',listId);
    console.log('userId ',userId);

    //set it to active

    List.update({
            _id: ObjectId(listId)
        },
        {
            $push: {"user_ids": userId}
        },
        {
            safe: true, upsert: true, new : true
        }, callback)
};

module.exports.saveChatMessage = function(message, listId, userName, date, userId, callback){
    console.log('listId ',listId);
    console.log('message ',message);

    List.update({
            _id: ObjectId(listId)
        },
        {
            $push: {"messages": {userName: userName, message:message, date: date, userId: userId}}
        },
        {
            safe: true, upsert: true, new : true
        }, callback);
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