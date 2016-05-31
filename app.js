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


var routes = require('./routes/index');
var users = require('./routes/users');
//init app
var app = express();
//view engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
//express session
app.use(session({
    secret: 'secret',
    saveUnitialized: true,
    resave: true
}));

app.use(passport.initialize());
app.use(passport.session());

//express val middleware
app.use(expressValidator({
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
app.use(flash());

app.use(function(req, res, next){
   // in layouts,, on the templating enginge, success_msg would be below
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    //next basically tells the middleware to be done and continue with the request
    next();
});

app.use('/', routes);  //routes is a variable defined as the folder  different routes for folders
app.use('/users', users);

app.set('port', (process.env.PORT || 3000));
app.listen(app.get('port'), function(){
   console.log('Server started on port '+ app.get('port'));
});