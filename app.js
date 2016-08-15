var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
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
//include listmodel and task model, you'll split this w/ io listeners up later with module.exports/require
var List = require('./models/list.js');
var Todo = require('./models/todo.js');


app.set('views', path.join(__dirname, 'views'));  //__dirname is root directory.. saying views is set to views directory
app.engine('handlebars', exphbs({defaultLayout:'layout'}));  //defining express templating engine to handlebars.. 2nd param is what the default layout is from the views folders
app.set('view engine', 'handlebars');

app.use(bodyParser.json());   //including bodyParser dependency method
app.use(bodyParser.urlencoded({extended: false}));  //parses out ?name=
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));  //defining telling the app to include/use public folder
//express session
// app.use(session({               //using express session dependency to start sessions when users hit the app
//     secret: 'secret',
//     saveUnitialized: true,
//     resave: true
// }));

//express session
app.use(session({               //using express session dependency to start sessions when users hit the app
    secret: 'secret',
    saveUnitialized: true,
    resave: true,
    store: new MongoStore({mongooseConnection: mongoose.connection})
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
// process.on('uncaughtException', function (err) {
//     console.log(err);
//
// });

app.use(function(req, res, next){
    res.status(404);

    // respond with html page
    if (req.accepts('html')) {
        res.render('404', { url: req.url });
        return;
    }

    // respond with json
    if (req.accepts('json')) {
        res.send({ error: 'Not found' });
        return;
    }

    // default to plain-text. send()
    res.type('txt').send('Not found');
});

server.listen(app.get('port'), function(){
    console.log('Server started on port '+ app.get('port'));
});

io.sockets.on('connection', function(socket){
    
    socket.on('createListItem', function(data){
        var listItem = new List({
            user_id: data.userId,
            listTitle: data.listItem.listTitle,
            active: true
        });
        
        listItem.save(function(err, object){
            data.listItem._id = object._id;
            console.log(data);  
            io.sockets.emit('listCreationSuccess', data); //ideally you'll want to emit this to only to the room the socket is in for that list
        });

    });

    socket.on('getList', function(data){
        var returnObj = {};
       List.getList(data.userId, function(err, response){
           var stringify = JSON.stringify(response);
           io.sockets.emit('getListResponse',stringify);
       });
        
    });

    socket.on('deleteList', function(data){
        List.deleteList(data, function(){
            io.sockets.emit('deleteListResponse', data);    
        });
    });
    
    socket.on('getTodos', function(data){
        console.log(data);
        Todo.getTodos(data.listId, function(err, data){
            console.log(data);
            var stringify = JSON.stringify(data);
            io.sockets.emit('getTodosResponse',stringify);
        });
       
    });
    
    socket.on('createTodo', function(data){
        var TodoItem = new Todo({
            list_id: data.listId,
            title: data.title,
            active: true
        });
        TodoItem.save(function(err, data){
            if(err){
                throw err
            }
           io.sockets.emit('createTodoResponse', data);
        });
    });

    socket.on('deleteTodo', function(data){
        console.log(data);
        Todo.deleteTodo(data.itemId, function(err, response){
            console.log(data);
            var stringify = JSON.stringify(data);
            io.sockets.emit('deleteTodoResponse',stringify);
        });
        
        

    });
    
    
});

