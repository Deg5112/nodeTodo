var express = require('express'); //require express again, just to instantiate the router below
var router = express.Router(); //require the express router, comes prepackages with express
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
   console.log(req.session.passport.user);
   //check if ^^ exists.. if it doesn't.. also check if active
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
   var title = req.body.title;
   //in the future you can just add more props to this if they are defined or something like that
   List.updateList(listId, title, function(err, mongoResponse){
      if(err){
         throw err;
      }
      if(mongoResponse){
         console.log(mongoResponse);
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
   
   Todo.getTodoItem(todoId, function(err, todoItem){
      if(err){
         throw err;
      }
      res.render('todo-update', {auth: req.session.passport.user, todo: todoItem[0]});
   });
   //mongo query to get current list object to template out the next page

});

//save todo
router.post('/saveTodo/:todoId/:listId', function(req, res){
   var todoId = req.params.todoId;
   var title = req.body['todo-title'];
  
  
   //in the future you can just add more props to this if they are defined or something like that
   Todo.updateTodo(todoId, title, function(err, mongoResponse){
      if(err){
         throw err;
      }
      console.log('mongoose response', mongoResponse);
      if(mongoResponse){
         if((mongoResponse.nModified == 1 && mongoResponse.n == 1)||(mongoResponse.nModified == 0 && mongoResponse.n == 1)){
            req.flash('success_msg', 'List Updated Successfully');
            //get list id of current todoItem
            var listId = req.params.listId;
            List.find({_id: ObjectId(listId)}, function(err, listItem){
               if(err) throw err;
               
               if(listItem){
                  console.log('listItem', listItem);
                  console.log('0', listItem[0]);
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

router.get('/getChatMessages', function(req,res){
   // List.getMessages(, function(err, messages){
   //    if(err) throw err;
   //    console.log(messages);
   // });
   // res.send(JSON.stringify());
});

//todoItem routes
router.get('/todo-items/:listId/:listTitle', ensureAuthenticated, function(req, res){
   var listId = req.params.listId;
   var listTitle = req.params.listTitle;
   console.log(listId);
   console.log(listTitle);
   //why don't you get all of the items here, and pass it back to view
   
   res.render('todos', {listId: listId, listTitle:listTitle});
});

router.post('/list-share', function(req,res){
   res.setHeader('Content-Type', 'application/json');
   var objectId = req.session.passport.user;
   var email = req.body.email;
   
   User.getUserById(objectId, function(err, user){
      console.log('USER', user);
      if(err) throw err; //if error
      //if no user and emails are not same as session email
      if(!user || (user && user.local.email != email)) {
         var listId = req.body.listId;
         console.log(email, listId);

         req.checkBody('email', 'Email is required').notEmpty();
         req.checkBody('email', 'Email is not valid').isEmail();

         var errors = req.validationErrors();

         if (errors) {
            res.send(JSON.stringify({success: false, message: 'Please enter a valid email'}));
         } else {
            var encryptedEmailString = cryptr.encrypt(email);
            if (hostname == 'node') {
               var url = 'http://davidgoodman-node.club/list-share/' + encryptedEmailString + '/' + listId;
            } else {
               var url = 'http://localhost:3000/list-share/' + encryptedEmailString + '/' + listId;
            }

            // //send send encrypted email to the email address in a string.
            var data = {
               from: 'Todo <noreply@dgoody.mailgun.org>',
               to: email,
               subject: 'A friend has invited you to view a list on Todo',
               html: '<p>You\'ve been invited to view this list on Todo</p>'
               + '<p>Click this link to accept the invitation</p>'
               + '<br>'
               + '<a href=' + url + '>Accept Invite</a>'
            };
            //
            mailgun.messages().send(data, function (error, body) {
               console.log(body);
               console.log('sent!');
               res.send(JSON.stringify({success: true, message: 'Invite has been shared with '}));
            });

         }
      }else{
         if(user && user.local.email == email){
            res.send(JSON.stringify({success: false, message: 'Can not share a list with yourself '}));
         }
      }
   });
});

router.get('/list-share/:encryptedEmail/:listId', function(req,res){
  

   var email = cryptr.decrypt(req.params.encryptedEmail);
   var listId = req.params.listId;

   console.log('decrypted', email);
   
   User.getUserByEmail(email, function(err, user){
      console.log('USER',user);
      if(err) throw err; //if error

      if(!user || user.length == 0){  //if no user
         req.flash('error_msg', 'You must create an account to view the shared list');
         res.render('register', {listId:req.params.listId});
         
      }else{
         //add the listId to the users lists
         var userId = user[0]._id;
         
         List.addUserToList(listId, userId, function(err, mongoResponse){
            
            if(mongoResponse.nModified == 1 && mongoResponse.n == 1){
               //user added to list
               //get list title
               List.getListItem(listId, function(err, listItem){
                  if(err) throw err;
                  console.log('LIST ITEM', listItem);
                  res.redirect('/todo-items/'+listId+'/'+listItem[0].listTitle);
               });
                  //render the index page                
            }

            if(mongoResponse.nModified == 0 && mongoResponse.n == 1){
                  //user already added to list
               console.log('User already in list');
            }

            if(mongoResponse.nModified == 0 && mongoResponse.n == 0){
               //no list found
               console.log('list not found');
               req.flash('error', 'List has been deleted');
               res.redirect('/');
            }
         });
      };

   });

   //decrypt the email

   //check if email exist in db

   //if exist, add list_id to the persons list, mark it as shared.

   //if not exist, send to registration page, also pass the list id, upon registering, send activation email, with listId at the end
});





function ensureAuthenticated(req, res, next){
   if(req.isAuthenticated()){ //if true.. continue to the dashboard.. next().. else.. direct to login page, is logged in??
      User.getUserById(req.session.passport.user, function(err, user){
         if(err) throw err;

         if(user) {
            console.log(user);
            if (user.local.active) {
               return next();
            }
            else {
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