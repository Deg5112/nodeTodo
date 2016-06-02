var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var localStrategy = require('mongoose');
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/loginapp');
var db = mongoose.connection;
var nev = require('email-verification')(mongoose);  //node email verification.. requires mongoose as a dependency
//configure nev
var configEmailVerification = require('../config/gmailAuth');
nev.configure({
    verificationURL: 'http://myawesomewebsite.com/email-verification/${URL}',
    persistentUserModel: User,
    tempUserCollection: 'myawesomewebsite_tempusers',

    transportOptions: {
        service: 'Gmail',
        auth: {
            user: 'deg5112@gmail.com',
            pass: 'mysupersecretpassword'
        }
    },
    verifyMailOptions: {
        from: 'Do Not Reply <myawesomeemail_do_not_reply@gmail.com>',
        subject: 'Please confirm account',
        html: 'Click the following link to confirm your account:</p><p>${URL}</p>',
        text: 'Please confirm your account by clicking the following link: ${URL}'
    }
});


//init app
var app = express();
//view engine
app.set('views', path.join(__dirname, 'views'));  //__dirname is root directory.. saying views is set to views directory
app.engine('handlebars', exphbs({defaultLayout:'layout'}));  //defining express templating engine to handlebars.. 2nd param is what the default layout is from the views folders
app.set('view engine', 'handlebars');

app.use(bodyParser.json());   //including bodyParser dependency method
app.use(bodyParser.urlencoded({extended: false}));  //parses out ?name=
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));  //defining telling the app to include/use public folder
//express session
app.use(session({               //using express session dependency to start sessions when users hit the app
    secret: 'secret',
    saveUnitialized: true,
    resave: true
}));

app.use(passport.initialize());     //to use passport, user authentication .. need to initialize it.
app.use(passport.session()); //use passport session when user is logged in.. so there's sessions from the app as well as passport

//express val middleware
app.use(expressValidator({      //include/use the epxress validator for form validation
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
            , root    = namespace.shift()
            , formParam = root;

        while(namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param : formParam,
            msg   : msg,
            value : value
        };
    }
}));
//connect flash
app.use(flash());   //for flash messages on the res globals below

//global variables
app.use(function(req, res, next){
   // in layouts,, on the templating enginge, success_msg would be below
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    //next basically tells the middleware to be done and continue with the request
    next();
});

var routes = require('./routes/index');
var users = require('./routes/users');

app.use('/', routes);  //routes defined for '/', will be directed to routes directory/index
app.use('/users', users); //routes defined for users will be directed to routes directory/users directory

app.set('port', (process.env.PORT || 3000));
app.listen(app.get('port'), function(){
   console.log('Server started on port '+ app.get('port'));
});