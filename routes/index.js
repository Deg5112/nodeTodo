var express = require('express'); //require express again, just to instantiate the router below
var router = express.Router(); //require the express router, comes prepackages with express
var List = require('../models/list.js');
//GET homepage
router.get('/', ensureAuthenticated, function(req, res){
   res.render('index', {auth: req.session.passport.user});
});

router.get('/userId', function(req, res){
   var userId = req.session.passport.user;
   res.send(userId);
});
//list routes
router.get('/updateList/:listId', function(req, res){
   var listId = req.params.listId;
   //mongo query to get current list object to template out the next page
   List.getListItem(listId, function(err, listItem){
      if(err){
         throw err;
      }
      res.render('list-update', {auth: req.session.passport.user, listItem: listItem[0]});
   });
});

router.post('/saveList/:listId', function(req, res){
   var listId = req.params.listId;
   var title = req.body.title
   //in the future you can just add more props to this if they are defined or something like that
   List.updateList(listId, title, function(err, mongoResponse){
      if(err){
         throw err;
      }
      if(mongoResponse){
         if((mongoResponse.nModified == 1 && mongoResponse.n == 1)||(mongoResponse.nModified == 0 && mongoResponse.n == 1)){
            req.flash('success_msg', 'List Updated Successfully');
            res.redirect('/');
         }
         if(mongoResponse.nModified == 0 && mongoResponse.n == 0){
            console.log('update failed');
         }
      }
   });
});
//update todo
router.get('/updateTodo/:todoId', function(req, res){
   var todoId = req.params.todoId;
   console.log(todoId);

   List.getTodoItem(todoId, function(err, listItem){
      if(err){
         throw err;
      }
      res.render('todo-update', {auth: req.session.passport.user, todoItem: todoItem[0]});
   });
   //mongo query to get current list object to template out the next page

});

//save todo
router.post('/saveTodo/:todo', function(req, res){
   var listId = req.params.listId;
   var title = req.body.title
   //in the future you can just add more props to this if they are defined or something like that
   Todo.updateTodo(todoId, title, function(err, mongoResponse){
      if(err){
         throw err;
      }
      if(mongoResponse){
         if((mongoResponse.nModified == 1 && mongoResponse.n == 1)||(mongoResponse.nModified == 0 && mongoResponse.n == 1)){
            req.flash('success_msg', 'List Updated Successfully');
            res.redirect('/');
         }
         if(mongoResponse.nModified == 0 && mongoResponse.n == 0){
            console.log('update failed');
         }
      }
   });
});

//todoItem routes
router.get('/todo-items/:listId/:listTitle', ensureAuthenticated, function(req, res){
   var listId = req.params.listId;
   var listTitle = req.params.listTitle;
   //why don't you get all of the items here, and pass it back to view
   
   res.render('todos', {listId: listId, listTitle:listTitle});
});



function ensureAuthenticated(req, res, next){
   if(req.isAuthenticated()){ //if true.. continue to the dashboard.. next().. else.. direct to login page, is logged in??
      return next();
   }else{
      req.flash('error_msg', 'You are not logged in');
      res.redirect('/users/login');
   }
}




module.exports = router;