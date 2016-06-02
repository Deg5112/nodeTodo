var express = require('express'); //require express again, just so we can use the router below
var router = express.Router();  //router comes pre packages with express
var passport = require('passport');
//Passport strategies
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
//include user model
var User = require('../models/user.js');
var configAuth = require('../config/auth');
//routes here start at users/
//GET
router.get('/register', function(req,res){  //user/register
    res.render('register');
});

router.get('/login', function(req,res){  //user/login
   res.render('login');
});




//POST
router.post('/register', function(req, res){
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;
//   express validation validation, so express allows us to use the methods below
    //  checkbody is a method that takes 2 arguements, name of field, and error message.. chain method after that to define rules
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

    var errors = req.validationErrors();
    
    if(errors){
        console.log(errors);
        res.render('register', {errors: errors} );
    }else{
        //if no errors, we'll make a new user object with the schema of user created in model
        var newUser = new User({
            local:{
                name: name,
                email: email,
                username: username,
                password: password
            }
        });
        
        User.createUser(newUser, function(err, user){
            if(err){
                //if there's an error it'll throw an error and stop the script
                console.log('error');
                throw err;
            }
            //if no error it'll just console log the user
            console.log(user, 'user entered in db');
        });

        req.flash('success_msg', 'You are registered and can now login');

        res.redirect('/users/login');
    }
});
//this authenticated creds passed in, to creds from the db
//this is the middleware that we pass into, this is the local strategy
passport.use(new LocalStrategy(function(username, password, done) {
        //user model methods have 2 params, what's passed in, and callback, that has 2 params, error, and whatever we want to pass back
     User.getUserByUsername(username, function(err, user){  //we checked the username, and the callback function does several checks
        if(err) throw err; //if error

        if(!user){  //if no user
            return done(null, false, {message:'Unknown User'});
        }
         console.log('currentuser', user);
        User.comparePassword(password, user[0].local.password, function(err, isMatch){ //if there's a username, we'll have another method that compares pass
           
            if(err) throw err;
             if(isMatch){
                 return done(null, user);
             }else{
                 return done(null, false, {message: 'Invalid Password'})
             }
         });
     });
}));



passport.serializeUser(function(user, done) {
    console.log('serial user', user);
    if(user.facebook){
        var userId = user['_id'];
    }else{
        var userId = user[0].id
    }
    done(null, userId);
});

passport.deserializeUser(function(id, done) {
    console.log('got to deserial');
    //passport passes in the facebook id here.. we need to pass in the object id
    
    User.getUserById(id, function(err, user) {
        done(err, user);
    });
});


router.post('/login', passport.authenticate('local', {successRedirect: '/', failureRedirect: '/users/login', failureFlash: true}),
    function(req, res){
        res.redirect('/');
});
//redirect path start with / as routes folder.. then users/login as GET
router.get('/logout', function(req,res,next){
    req.logout();
    req.flash('success_msg', 'You are logged out');
    res.redirect('/users/login');
});


//Facebook login
// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//require facebook authentication creds

//facebook strategy
passport.use(new FacebookStrategy({
        clientID: configAuth.facebookAuth.clientID,
        clientSecret: configAuth.facebookAuth.clientSecret,
        callbackURL: configAuth.facebookAuth.callbackUrl,
        profileFields: ['email', 'first_name', 'last_name']
    },
    function(accessToken, refreshToken, profile, done) {
        process.nextTick(function(){
            User.findOne({'facebook.id': profile.id}, function(err, user){  //user model
               if(err){
                   return done(err);  //if err throw err
               }
                if(user){
                    return done(null, user); //if we have a user in db//so return done, with no error as first param, then user
                }
                else{  //login is good but doesn't match any records in mongodb
                    console.log(profile);
                    var newUser = new User({
                        facebook:{
                            id: profile.id,
                            token: accessToken,
                            email: profile.emails[0].value,
                            name: profile.name.givenName + ' ' + profile.name.familyName
                        }
                    });

                    newUser.save(function(err){
                        if(err){
                            throw err;
                        }
                        return done(null, newUser);
                    }); //they have no password so save as is

                }

            });
        });
    }
));


router.get('/auth/facebook', passport.authenticate('facebook', {scope: ['email']}));

//just two different routes.. ^^ sends to facebook.. facebook sends backk too below with success or failure
// 'callbackUrl': 'http://localhost:3000   /auth/facebook/callback'
router.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect: '/',
        failureRedirect: '/users/login' }));


module.exports = router;



