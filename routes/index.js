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



function ensureAuthenticated(req, res, next){
   if(req.isAuthenticated()){ //if true.. continue to the dashboard.. next().. else.. direct to login page, is logged in??
      return next();
   }else{
      req.flash('error_msg', 'You are not logged in');
      res.redirect('/users/login');
   }
}




module.exports = router;