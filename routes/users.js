var express = require('express'); //require express again, just so we can use the router below
var router = express.Router();  //router comes pre packages with express
var passport = require('passport');
//Passport strategies
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
//include user model
var User = require('../models/user.js');
var configAuth = require('../config/auth');
var mongoose = require('mongoose');// require mongoose
// var sendgrid  = require('sendgrid')(configAuth.sendGrid.user, configAuth.sendGrid.user); //takes api key as parameter
// console.log(sendgrid);
var api_key = configAuth.mailgun.key; 
var domain = 'davidgoodman.club';
var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});


var Cryptr = require('cryptr');
var cryptr = new Cryptr('myTotalySecretKey');
//this authenticated creds passed in, to creds from the db
//this is the middleware that we pass into, this is the local strategy
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
passport.use(new LocalStrategy(function(username, password, done) {
    //user model methods have 2 params, what's passed in, and callback, that has 2 params, error, and whatever we want to pass back
    
    User.getUserByUsername(username, function(err, user){  //we checked the username, and the callback function does several checks
        if(err) throw err; //if error

        if(!user || user.length == 0){  //if no user
            return done(null, false, {message:'Unknown User'});
        }
        
        User.comparePassword(password, user[0].local.password, function(err, isMatch){ //if there's a username, we'll have another method that compares pass
            if(err) throw err;
            if(isMatch){
                console.log(user);
                user[0].local.newFirstName = capitalizeFirstLetter(user[0].local.name);
                console.log(user[0].local.newFirstName);
                return done(null, user);
            }else{
                return done(null, false, {message: 'Invalid Password'})
            }
        });
    });
}));

passport.serializeUser(function(user, done) {
    if(user.facebook){
        var userId = user['_id'];
    }else{
        var userId = user[0].id
    }
    done(null, userId);
});

passport.deserializeUser(function(id, done) {
    //passport passes in the facebook id here.. we need to pass in the object id

    User.getUserById(id, function(err, user) {
        done(err, user);
    });
});


//routes here start at users/
//GET
router.get('/register', function(req,res){  //user/register
    res.render('register');
});

router.get('/login', function(req,res){  //user/login
   res.render('login');
});

router.get('/verify/:encryptedEmail', function(req, res){
   var encryptedEmail = req.params.encryptedEmail;
    User.verifyUser(encryptedEmail,  function(err, mongoResponse){
        if(err){
            throw err;
        }
        if(mongoResponse){
            if(mongoResponse.nModified == 1 && mongoResponse.n == 1){
                req.flash('success_msg', 'Congratulations, you are verified! Login now to make a new list');
                res.redirect('/users/login');
            }
            if(mongoResponse.nModified == 0 && mongoResponse.n == 1){
                //value already is set to true
                console.log('doc found, but value is same');
                //user is already active, please log in
                req.flash('error', 'User is already active, please log in');
                res.redirect('/users/login');
                
            }
            if(mongoResponse.nModified == 0 && mongoResponse.n == 0){
                console.log('update failed');
                //it expired.. have a resend activation link page.. they enter their email, and send to a new route
                // that encrypts password and sends them a link, back to this route
                req.flash('error', 'Activation link is no longer active, please re-register');
                res.redirect('/users/register');
            }
        }
    });
    
//   find user who encrypted email matches the one passed in

    //when found, change active equal to 1

    //then redirect to login page
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
        var finalErrors = {
            name:{
                bool: false,
                msg:null
            },
            email:{
                bool: false,
                msg:null
            },
            username:{
                bool: false,
                msg:null
            },
            password:{
                bool: false,
                msg:null
            },
            password2:{
                bool: false,
                msg:null
            }
        };
        var length = errors.length;
        for(var x = 0; x<length; x++){
            
            if(errors[x].param == 'name'){
                finalErrors.name.bool = true;
                finalErrors.name.msg = errors[x].msg;
            }
            
            if(errors[x].param == 'email'){
                finalErrors.email.bool = true;
                finalErrors.email.msg = errors[x].msg;
            }
            
            if(errors[x].param == 'username'){
                finalErrors.username.bool = true;
                finalErrors.username.msg = errors[x].msg;
            }
            
            if(errors[x].param == 'password'){
                finalErrors.password.bool = true;
                finalErrors.password.msg = errors[x].msg;
            }
            
            if(errors[x].param == 'password2'){
                finalErrors.password2.bool = true;
                finalErrors.password2.msg = errors[x].msg;
            }
            
        }
        
        console.log(finalErrors);
        res.render('register', {errors: finalErrors, prevEntries: req.body} );
    }else{
        //if no errors, we'll make a new user object with the schema of user created in model

        var encryptedEmailString = cryptr.encrypt(email);
        
        var newUser = new User({
            local:{
                name: name,
                email: email,
                username: username,
                password: password,
                active: 0,
                encryptedEmail:encryptedEmailString
            }
        });

        //email varification TODO
        var verificationHref = 'http://davidgoodman-node.club/users/verify/'+encryptedEmailString;
        var html =
            "<div style='text-align: center;background-color:#ee6e73'></div>"
            +"<h1>Thank you for registering to Todo</h1>"
            +"<a href="+verificationHref+" style='position: absolute; left: 50%; transform: translateX(-50%);'>Please click here to verify your account</a>";
        
        var data = {
            from: 'Todo APP <noreply@dgoody.mailgun.org>',
            to: 'deg5112@gmail.com',
            subject: 'Hello From Todo',
            html: html
        };

        mailgun.messages().send(data, function (error, body) {
            console.log(body);
            console.log('sent!');
        }); 

        // sendgrid.send({
        //     to:       'deg5112@gmail.com',
        //     from:     'no-reply@nodeTodo.com',
        //     subject:  'Hello World',
        //     html:     html
        // }, function(err, json) {
        //     if (err) { return console.error(err); }
        //     console.log('success! ', json);
        //     return;
        // });
       
        //send email above with activation link, then create user with encrypted password that expires
        User.createUser(newUser, function(err, user){
            if(err){
                //if there's an error it'll throw an error and stop the script
                console.log('error');
                throw err;
            }
            //if no error it'll just console log the user
            console.log(user, 'user entered in db');
        });
        req.flash('success_msg', 'Registration successful, please check your email for An activation link');
        res.redirect('/users/login');
    }
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
    },  //callback below
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
// 'callbackUrl': 'http://localhost:3000/auth/facebook/callback'
router.get('/auth/facebook/callback',
    passport.authenticate('facebook', { successRedirect: '/',
        failureRedirect: '/users/login' }));


module.exports = router;



