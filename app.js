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
//init app
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
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
var users = require('./routes/users');  //everything in this file gets hit once we require it
var tasks = require('./routes/tasks');
app.use('/', routes);  //routes defined for '/', will be directed to routes directory/index
app.use('/users', users); //routes defined for users will be directed to routes directory/users directory
app.use('/tasks', tasks);

app.set('port', (process.env.PORT || 3000));
server.listen(app.get('port'), function(){
    console.log('Server started on port '+ app.get('port'));
});

io.on('connection', function(socket){
    console.log('sockets on backend connected');
    socket.on('createTask', function(data){
        //add task to db
        console.log(data);
       socket.emit('taskCreationSuccess', data) ;
    });
});

// app.listen(app.get('port'), function(){
//    console.log('Server started on port '+ app.get('port'));
// });