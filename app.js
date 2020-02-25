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
// var options = configAuth.mongo.options;
var os = require("os");
var dateFormat = require('dateformat'); //
var ObjectId = require('mongodb').ObjectID;

mongoose.connect('mongodb://localhost/todo');

var db = mongoose.connection;

//init app
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

//include listmodel and task model, you'll split this w/ io listeners with module.exports/require
var List = require('./models/list.js');
var Todo = require('./models/todo.js');
var User = require('./models/user.js');

app.set('views', path.join(__dirname, 'views'));  //__dirname is root directory.. saying views is set to views directory

//defining express templating engine to handlebars.
app.engine('handlebars', exphbs({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json()); //including bodyParser dependency method
app.use(bodyParser.urlencoded({extended: false}));  //parses out query string
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));  //defining telling the app to include/use public folder

//express session
app.use(session({               //using express session dependency to start sessions when users hit the app
  secret: 'secret',
  saveUnitialized: true,
  resave: true,
  store: new MongoStore({mongooseConnection: mongoose.connection})
}));

app.use(passport.initialize()); //initialize passport for authenciation strategies
app.use(passport.session()); //use passport session when user is logged in.

//express validation middleware
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
   // in layouts, on the templating enginge, success_msg would be below
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    //next basically tells the middleware to be done and continue with the request
    next();
});

var routes = require('./routes/index');
var users = require('./routes/users');  //everything in this file gets hit once we require it
// var todos = require('./routes/todos'); //todo split todo routes up

app.use('/', routes);  //routes defined for '/', will be directed to routes directory/index
app.use('/users', users); //routes defined for users will be directed to routes directory/users directory
// app.use('/todos', todos);

app.set('port', (process.env.PORT || 3000));

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

  res.type('txt').send('Not found');
});

server.listen(app.get('port'), function(){
    console.log('Server started on port '+ app.get('port'));
});

//TODO put this in a separate file and require them
io.sockets.on('connection', function(socket){
  socket.on('createListItem', function(data){
    var listItem = new List({
      // user_ids: [{text: data.userId}],
      listTitle: data.listItem.listTitle,
      active: true,
      shared: false
    });

    listItem.user_ids.push(data.userId);

    listItem.save(function(err, object){
      if(err) throw err;

      data.listItem._id = object._id;
      socket.join(object._id);

      data.listItem.user_ids = object.user_ids;
      io.sockets.to(object._id).emit('listCreationSuccess', data);
    });
  });

  socket.on('getList', function(data){
  	var returnObj = {};
	  List.getList(data.userId, function(err, response){
       var stringify = JSON.stringify(response);
       socket.join(data.userId);

       io.sockets.to(data.userId).emit('getListResponse',stringify);
     });
  });

  socket.on('deleteList', function(data){
    List.deleteList(data, function(){
      socket.join(data.itemId);
      io.sockets.to(data.itemId).emit('deleteListResponse', data);
    });
  });

  socket.on('getTodos', function(data){
    var listId = data.listId;
    Todo.getTodos(listId, function(err, data){
      socket.join(listId);

      List.find({
          _id: ObjectId(listId)
      }, function (err, list) {
        if(err) throw err;

        var messages = list[0].messages;

        var returnObj = {
            todos: data,
            messages:messages
        };
        io.sockets.to(listId).emit('getTodosResponse',JSON.stringify(returnObj));
      });
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
    Todo.deleteTodo(data.itemId, function(err, response){
      var stringify = JSON.stringify(data);
      socket.join(data.itemId);
      io.sockets.to(data.itemId).emit('deleteTodoResponse',stringify);
    });
  });

  socket.on('isListShared', function(data){
      var listId = data.listId;
      List.getListItem(listId, function(err, listItem){
          var sharedBool = listItem[0].user_ids.length > 1;

          if(sharedBool){
            //join room with room name being list id
            socket.join(data.userId);//send just to user

            socket.join(listId); //for emmitting to users in channel

            var userIdsArray = listItem[0].user_ids;
            var userIdsArrayLength = userIdsArray.length;
            //also return name, or group if group

            if(userIdsArrayLength > 2){
                io.sockets.to(data.userId).emit('isListSharedResponse',{shared: sharedBool, sharedName: 'Group'});
            } else {
                for(var x=0;x<userIdsArrayLength;x++){

                    if(userIdsArray[x] != data.userId){

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
						data.date = date;
					  if((mongoResponse.nModified == 1 && mongoResponse.n == 1)||(mongoResponse.nModified == 0 && mongoResponse.n == 1)){
					      io.sockets.to(listId).emit('sendChatResponse',data);
					  }
					  if(mongoResponse.nModified == 0 && mongoResponse.n == 0){
					      console.log('update failed');
					  }
					}
				});
      } else {
          console.log('no user found');
      }
    });
  });
});

