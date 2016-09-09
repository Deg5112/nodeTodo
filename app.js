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
var configAuth = require('./config/auth');
var options = configAuth.mongo.options;
var os = require("os");
var dateFormat = require('dateformat');
var ObjectId = require('mongodb').ObjectID;

var hostname = os.hostname();
if(hostname == 'node'){
    mongoose.connect('mongodb://localhost/todo', options);
}else{
    mongoose.connect('mongodb://localhost/todo');
}
var db = mongoose.connection;
// console.log('db', db);
//init app
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
//view engine
//include listmodel and task model, you'll split this w/ io listeners up later with module.exports/require
var List = require('./models/list.js');
var Todo = require('./models/todo.js');
var User = require('./models/user.js');


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
var todos = require('./routes/todos');



app.use('/', routes);  //routes defined for '/', will be directed to routes directory/index
app.use('/users', users); //routes defined for users will be directed to routes directory/users directory
app.use('/todos', todos);

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
        console.log('data ',data);
        
        var listItem = new List({
            // user_ids: [{text: data.userId}],
            listTitle: data.listItem.listTitle,
            active: true,
            shared: false
        });
        
        listItem.user_ids.push(data.userId);
        
        listItem.save(function(err, object){
            if(err) throw err;
            
            console.log(object);
            
            data.listItem._id = object._id;
            socket.join(object._id);
            
            data.listItem.user_ids = object.user_ids;
            console.log(data);  
            io.sockets.to(object._id).emit('listCreationSuccess', data); //ideally you'll want to emit this to only to the room the socket is in for that list
        });

    });

    socket.on('getList', function(data){
        var returnObj = {};
       List.getList(data.userId, function(err, response){
           
           console.log('List  !',response);
           
           var stringify = JSON.stringify(response);
           socket.join(data.userId);
           
           io.sockets.to(data.userId).emit('getListResponse',stringify);
       });
        
    });

    socket.on('deleteList', function(data){
        List.deleteList(data, function(){
            console.log('delete data',data);
            socket.join(data.itemId);
            io.sockets.to(data.itemId).emit('deleteListResponse', data);    
        });
    });
    
    socket.on('getTodos', function(data){
        console.log(data);
        Todo.getTodos(data.listId, function(err, data){
            
            // var stringifyTodoArray = JSON.stringify(data);
            
            socket.join(data.listId);
            
            List.find({
                _id: ObjectId('57ce6f481ab74ca1353dc425')
            }, function (err, list) {
                if(err) throw err;
                console.log('LIST ',list);
                var messages = list[0].messages;
                console.log('messages!!', messages);
                
                var returnObj = {
                    todos: data,
                    messages:messages
                };
                io.sockets.to(data.listId).emit('getTodosResponse',JSON.stringify(returnObj));
            });

            // return;
           
       
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

            socket.join(data.listId);
            io.sockets.to(data.listId).emit('createTodoResponse', data);
        });
    });

    socket.on('deleteTodo', function(data){
        console.log(data);
        Todo.deleteTodo(data.itemId, function(err, response){
            console.log(data);
            var stringify = JSON.stringify(data);
            socket.join(data.itemId);
            io.sockets.to(data.itemId).emit('deleteTodoResponse',stringify);
        });
    });

    socket.on('isListShared', function(data){
        console.log('list shared!?');
        
        var listId = data.listId;
        List.getListItem(listId, function(err, listItem){
            console.log('listItem',listItem[0]);
            var sharedBool = listItem[0].user_ids.length > 1;
            console.log('shared ',sharedBool);

            if(sharedBool){
                //join room with room name being list id
                socket.join(data.userId);//send just to user
                
                socket.join(listId); //for emmitting to users in channel
                
                var userIdsArray = listItem[0].user_ids;
                var userIdsArrayLength = userIdsArray.length;
                //also return name, or group if group
                
                if(userIdsArrayLength > 2){
                    io.sockets.to(data.userId).emit('isListSharedResponse',{shared: sharedBool, sharedName: 'Group'});
                }else{

                    for(var x=0;x<userIdsArrayLength;x++){

                        if(userIdsArray[x] != data.userId){
                            console.log('loop user', data.userId);
                            
                            User.getUserById(userIdsArray[x], function(err, user){
                                
                                if(err) throw err;

                                io.sockets.to(data.userId).emit('isListSharedResponse',{shared: sharedBool, sharedName: user.local.name});
                            });
                            break;
                        }else{
                            console.log('Nope!!');
                        }
                    }
                }
            }else{

            }
        });
    });

    socket.on('sendChatMessage', function(data){
       var listId = data.listId;
        
        //get current user by id
        User.getUserById(data.userId, function(err, user){
           var userId = user._id;
           if(err) throw err;
            
            if(user){
                var now = new Date();
                
                var date = dateFormat(now, "dddd, mmmm dS, yyyy, h:MM:ss TT");
                List.saveChatMessage(data.message, listId, user.local.name, date, userId, function(err, mongoResponse){
                    if(err){
                        throw err;
                    }
                    if(mongoResponse){
                        
                        console.log(mongoResponse);
                        data.date = date;
                        
                        if((mongoResponse.nModified == 1 && mongoResponse.n == 1)||(mongoResponse.nModified == 0 && mongoResponse.n == 1)){
                            io.sockets.to(listId).emit('sendChatResponse',data);
                        }
                        if(mongoResponse.nModified == 0 && mongoResponse.n == 0){
                            console.log('update failed');
                        }
                    }
                });
            }else{
                console.log('no user found');
            }
        });
        
        //get current user
        
        //store message in db for the shared List
        
    });

    
    
});

