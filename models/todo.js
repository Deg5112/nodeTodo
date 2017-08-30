var mongoose = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

var TodoSchema = mongoose.Schema({
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
  active:{
      type: Boolean
  },
  updated_at: {
      type: Date,
      default: Date.now
  }
});

var Todo = module.exports = mongoose.model('Todo', TodoSchema);

module.exports.getTodos = function(listId, callback){
	Todo.find(
		{
	    list_id: listId,
	    active: 1
		},
		callback
	);
};

module.exports.getTodoItem = function(todoId, callback){
	Todo.find(
		{
	    _id: ObjectId(todoId)
		},
		callback
	);
};

module.exports.updateTodo = function(todoId, title, callback){
	Todo.update(
		{
	    _id: ObjectId(todoId)
		},
		{
	    $set: {
	        title: title
	    }
		},
		callback
	);
};

module.exports.deleteTodo = function(todoId, callback){
	Todo.update(
		{
      _id: ObjectId(todoId)
		},
		{
	    $set: {
	        active: 0
	    }
		}, callback
	);
};