app.controller('todoController', function($scope, $http, $location, $log, $window){
    var socket = io.connect();
    console.log(socket);
    var self = this;
    self.userId = null;
    self.todos = [];
    self.sharedName = null;
    self.listIsShared = false;
    self.chatExpandMobile = false;
    self.listId = null;
    self.chatExpandDesktop = false;
    self.listId = $location.absUrl().split('/')[4];
    self.chatGroup = false;


    self.todoItem = {
        title: null
    };

    self.getChatMessages = function(){
        //get chat messages
        $http.get('/getChatMessages').then(function(){
            
        });
    };

    self.getUserId = function(){
        $http.get('/userId').then(function(response){
            self.userId = response.data;
            self.checkIfSharedList();
        });
    };

    self.getUserId();
    
    self.checkIfSharedList = function(){
      //is list shared?
        socket.emit('isListShared', {listId: self.listId, userId: self.userId});
    };
    
    socket.on('isListSharedResponse', function(data){
        console.log('socket response',data);
        self.listIsShared = data.shared;
        self.sharedName = data.sharedName;
        
        if(self.sharedName == 'Group'){
            self.chatGroup = true;
        }else{
            self.chatGroup = false;
        }

        if(self.listIsShared){
                self.getChatMessages();
        }

        $log.info('shared name after update',self.sharedName);
        $scope.$digest();
    });
    
    
    self.chatExpand = function(){
        if($window.innerWidth < 768){
            self.chatExpandMobile = !(self.chatExpandMobile);
            self.chatExpandDesktop = false;
        }else{
            self.chatExpandDesktop = !(self.chatExpandDesktop);
            self.chatExpandMobile = false
        }
    };
    
    self.messages = [
        // {userId:'57bbd8af66ebe7ce16187dde',time: '', message:'hello governor hello governor hello governor hello governor'},
        // {userId:'57bbd8af66ebe7ce16187dde',message:'hello governor hello governor'},
        // {userId:2,message:'hello governor hello governor hello governor hello governor'},
        // {userId:2,message:'hello governor'}
    ];

    self.createTodo = function(listId){
        socket.emit('createTodo', {listId:listId, title:self.todoItem.title});
        self.todoItem = {};
    };

    self.getTodos = function(){
        socket.emit('getTodos', {listId:self.listId});
    };
    self.getTodos();

    self.deleteTodo = function(itemId, index){
        socket.emit('deleteTodo', {itemId: itemId, index: index});
    };

    socket.on('deleteTodoResponse', function(data){
        self.todos.splice(data.index, 1);
        $scope.$digest();
    });

    socket.on('getTodosResponse', function(data){
        var parsed = angular.fromJson(data);
        console.log('Parsed!!',parsed);
        self.todos = parsed.todos;
        self.messages = parsed.messages;
        $scope.$digest();
    });

    socket.on('createTodoResponse', function(data){
        self.todos.unshift(data);
        $scope.$digest();
    });

    //send chat
    self.sendChatMessage = function(message){
        socket.emit('sendChatMessage', {message:message, listId: self.listId, userId: self.userId});
    };

    //send chat response
    socket.on('sendChatResponse', function(data){
        self.messages.push(data);
        self.messageToSend = '';
        $scope.$digest();
    });

    self.checkIfEnterWasHitForChat= function(message, event){
        if(event.charCode == 13){
            self.sendChatMessage(message);
        }
    };
})


.directive('scrollToTop', function($timeout){
    return {
        restrict: 'A',
        scope: {
            trigger: '=scrollToTop'
        },
        //functionality for directive
        link: function doThis(scope, elem) {
            //this directive will watch trigger
            scope.$watch('trigger', function() {
                $timeout(function(){
                    var chatBodyHeight = document.querySelectorAll('.message-container')[0].scrollHeight;
                    $(elem).scrollTop(chatBodyHeight);
                },100);
            });
        }
    };
});