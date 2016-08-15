app.controller('todoController', function($scope, $http, $location){
    var socket = io.connect();
    console.log(socket);
    var self = this;
    self.userId = null;
    self.todos = [];
    self.todoItem = {
        title: null
    };
    self.listId = null;

    // self.getUserId = function(){
    //     $http.get('/userId').then(function(response){
    //         self.userId = response.data;
    //         self.getTodos();
    //     });
    // };
    // self.getUserId();

    self.createTodo = function(listId){
        socket.emit('createTodo', {listId:listId, title:self.todoItem.title});
        self.todoItem = {};
    };


    self.getTodos = function(){
        var absUrl = $location.absUrl();
        var urlArray = absUrl.split('/');
        var listId = urlArray[4];
        console.log(urlArray);
        console.log('listId', listId);

        socket.emit('getTodos', {listId:listId});
    };
    self.getTodos();

    self.deleteTodo = function(itemId, index){
        
        socket.emit('deleteTodo', {itemId: itemId, index: index});
    };

    socket.on('deleteTodoResponse', function(data){
        console.log('delete response', data);
        self.todos.splice(data.index, 1);
        $scope.$digest();
    });

    socket.on('getTodosResponse', function(data){
        console.log('data', data);
        console.log('length', data.length);
        
        // if(data.length === 0){
        //     return;
        // }
        var parsed = angular.fromJson(data);
        self.todos = parsed;
        console.log(self.todos);
        console.log('typeof', typeof self.todos);
        $scope.$digest();
    });

    socket.on('createTodoResponse', function(data){
        console.log('created!', data);
        console.log('selftodos', self.todos);
        self.todos.unshift(data);
        $scope.$digest();
    });


});