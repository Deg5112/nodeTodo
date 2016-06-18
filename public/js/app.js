var app = angular.module('todo', []);

app.controller('listController', function($scope, $http){
    var socket = io.connect();
    console.log(socket);
    var self = this;
    self.userId = null;
    self.list = [];
    self.listItem = {
        listTitle: null
    };
    
    self.getUserId = function(){
        $http.get('/userId').then(function(response){
            self.userId = response.data;
            self.getList();
        });
    };

    self.updateListItem = function(){
        
    };

    self.getList = function(){
        socket.emit('getList', {userId: self.userId});
    };
    
    self.getUserId();
    
    self.createList = function(userId){
        console.log(self.listItem);
        socket.emit('createListItem', {userId: userId, listItem: self.listItem});
    };
    
    socket.on('getListResponse', function(data){
        var data = JSON.parse(data);
        console.log('data from io', data);
        self.list = data;
        $scope.$digest();
    });
    
    socket.on('listCreationSuccess', function(data){
        console.log(data);
        self.list.push(data.listItem);
        self.listItem = {};
        console.log(self.list);
        $scope.$digest();
    });
});