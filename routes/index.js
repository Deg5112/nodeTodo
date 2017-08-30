var express = require('express');
var router = express.Router();
var List = require('../models/list.js');
var Todo = require('../models/todo.js');
var User = require('../models/user.js');
var ObjectId = require('mongodb').ObjectID;
var configAuth = require('../config/auth');
var api_key = configAuth.mailgun.key;
var domain = 'davidgoodman.club';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});
var os = require("os");
var hostname = os.hostname();
var Cryptr = require('cryptr');
var cryptr = new Cryptr(configAuth.cryptr.key);

//GET homepage
router.get('/', ensureAuthenticated, function(req, res){
 res.render('index', {auth: req.session.passport.user});
});

router.get('/userId', function(req, res){
 res.send(req.session.passport.user);
});

//list routes
router.get('/updateList/:listId', function(req, res){
	List.getListItem(req.params.listId, function(err, listItem){
		if(err){
		   throw err;
		}
		res.render('list-update', {auth: req.session.passport.user, listItem: listItem[0]});
	});
});

router.post('/saveList/:listId', function(req, res){
	//in the future you can just add more props to this if they are defined, or write a method to populate the models
	List.updateList(req.params.listId, req.body.title, function(err, mongoResponse){
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
	        //TODO make error message for failed update.. try/catch
	     }
	  }
	});
});

router.get('/updateTodo/:todoId', function(req, res){
	Todo.getTodoItem(req.params.todoI, function(err, todoItem){
	  if(err){
	  	throw err;
	  }
	  res.render('todo-update', {auth: req.session.passport.user, todo: todoItem[0]});
	});
});

router.post('/saveTodo/:todoId/:listId', function(req, res){
   Todo.updateTodo(req.params.todoId, req.body['todo-title'], function(err, mongoResponse){
      if(err){
         throw err;
      }
      
      if(mongoResponse){
         if((mongoResponse.nModified == 1 && mongoResponse.n == 1)||(mongoResponse.nModified == 0 && mongoResponse.n == 1)){
            req.flash('success_msg', 'List Updated Successfully');
            //get list id of current todoItem
            var listId = req.params.listId;
            List.find({_id: ObjectId(listId)}, function(err, listItem){
               if(err) throw err;
               
               if(listItem){
                  res.redirect('/todo-items/'+listId+'/'+listItem[0].listTitle);
               }
            });
         }
         if(mongoResponse.nModified == 0 && mongoResponse.n == 0){
            console.log('update failed');
         }
      }
   });
});

router.get('/getChatMessages/:listId', function(req,res){
	List.getListItem(req.params.listId, function(err, listItem){
	  if(err) throw err;
	  res.send(JSON.stringify(listItem[0].messages));
	});
});

router.get('/todo-items/:listId/:listTitle', ensureAuthenticated, function(req, res){
	res.render('todos', {listId: req.params.listId, listTitle:req.params.listTitle});
});

router.post('/list-share', function(req,res){
	res.setHeader('Content-Type', 'application/json');
	var email = req.body.email;
	
	User.getUserById(req.session.passport.user, function(err, user){
	  if(err) throw err; //if error
	  //if no user and emails are not same as session email
	  if(
	    !user ||
		  (user && user.local.email != email)
	  ) {
			var listId = req.body.listId;
			
			req.checkBody('email', 'Email is required').notEmpty();
			req.checkBody('email', 'Email is not valid').isEmail();
			
			var errors = req.validationErrors();
			if (errors) {
			  res.send(JSON.stringify({success: false, message: 'Please enter a valid email'}));
			}
			else {
				var encryptedEmailString = cryptr.encrypt(email);
				
			  if (hostname == 'node') {
			    var url = 'http://davidgoodman-node.club/list-share/' + encryptedEmailString + '/' + listId;
			  } else {
			    var url = 'http://localhost:3000/list-share/' + encryptedEmailString + '/' + listId;
			  }
				
			  var data = {
			     from: 'Todo <noreply@dgoody.mailgun.org>',
			     to: email,
			     subject: 'A friend has invited you to view a list on Todo',
			     html: '<p>You\'ve been invited to view this list on Todo</p>'
			     + '<p>Click this link to accept the invitation</p>'
			     + '<br>'
			     + '<a href=' + url + '>Accept Invite</a>'
			  };
			  
			  mailgun.messages().send(data, function (error, body) {
			     console.log(body);
			     console.log('sent!');
			     res.send(JSON.stringify({success: true, message: 'Invite has been shared with '}));
			  });
			}
	  }
	  else{
	     if(user && user.local.email == email){
	        res.send(JSON.stringify({success: false, message: 'Can not share a list with yourself '}));
	     }
	  }
	});
});

router.get('/list-share/:encryptedEmail/:listId', function(req,res){
	var listId = req.params.listId;
	
	User.getUserByEmail(cryptr.decrypt(req.params.encryptedEmail), function(err, user){
	  if(err) throw err; //if error
	
	  if(!user || user.length == 0){  //if no user
	     req.flash('error_msg', 'You must create an account to view the shared list');
	     res.render('register', {listId:req.params.listId});
	     
	  }else{
	  	var userId = user[0]._id;
	     
			List.addUserToList(listId, userId, function(err, mongoResponse){
				if(mongoResponse.nModified == 1 && mongoResponse.n == 1){
				 //user added to list
				 //get list title
				List.getListItem(listId, function(err, listItem){
			    if(err) throw err;
			    res.redirect('/todo-items/'+listId+'/'+listItem[0].listTitle);
				 });
				}
				
				if(mongoResponse.nModified == 0 && mongoResponse.n == 1){
				 console.log('User already in list'); //TODO show flashbag message
				}
				
				if(mongoResponse.nModified == 0 && mongoResponse.n == 0){
				 req.flash('error', 'List has been deleted');
				 res.redirect('/');
				}
			});
	  };
	});
});

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){ //if true.. continue to the dashboard.. next().. else.. direct to login page, is logged in??
	  User.getUserById(req.session.passport.user, function(err, user){
	    if(err) throw err;
	    
	    if(user) {
	      if (user.local.active || user.facebook) {
	         return next();
	      } else {
	         req.flash('error_msg', 'User not active');
	         res.redirect('/users/login');
	        }
	     }
	  });
	} else {
	  req.flash('error_msg', 'You are not logged in');
	  res.redirect('/users/login');
	}
}

module.exports = router;