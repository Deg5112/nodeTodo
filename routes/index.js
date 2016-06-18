var express = require('express'); //require express again, just to instantiate the router below
var router = express.Router(); //require the express router, comes prepackages with express
var List = require('../models/list.js');
//GET homepage
router.get('/', ensureAuthenticated, function(req, res){
   res.render('index', {auth: req.session.passport.user});
});

router.get('/userId', function(req, res){
   var userId = req.session.passport.user;
   console.log('userId', userId);
   res.send(userId);
});

router.get('/updateTask/:listId', function(req, res){
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
   console.log('listId', listId);
   console.log('req body', req.body);
   //in the future you can just add more props to this if they are defined or something like that
   List.updateList(listId, title, function(err, mongoResponse){
      if(err){
         throw err;
      }
      console.log(mongoResponse);
      if(mongoResponse){
         if((mongoResponse.nModified == 1 && mongoResponse.n == 1)||(mongoResponse.nModified == 0 && mongoResponse.n == 1)){
            req.flash('success_msg', 'List Updated Successfully');
            console.log('successs!');
            res.redirect('/');
         }
         if(mongoResponse.nModified == 0 && mongoResponse.n == 0){
            console.log('update failed');
         }
      }
   });


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