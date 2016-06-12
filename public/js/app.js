var app = angular.module('todo', []);

app.controller('taskController', function($scope){
    var socket = io.connect();
    console.log(socket);
    var self = this;
    self.list = [];
    self.task = {
        title: null,
        body: null
    };
    self.createTask = function(){
        socket.emit('createTask', self.task);
    };
    socket.on('taskCreationSuccess', function(data){
        self.list.push(self.task);
        self.task = {};
        $scope.$digest();
    });

});