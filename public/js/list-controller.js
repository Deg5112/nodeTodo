app.controller('listController', function($scope, $http, $location){
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
    self.getUserId();


    self.getList = function(){
        socket.emit('getList', {userId: self.userId});
    };

    self.deleteList = function(itemId, index){
        console.log(index);
        socket.emit('deleteList', {itemId: itemId, index: index});
    };

    socket.on('deleteListResponse', function(data){
        //if successful, remove item from list array
        console.log('deleteresponse', data);
        self.list.splice(data.index, 1);
        $scope.$digest();
    });

    self.createList = function(userId){
        socket.emit('createListItem', {userId: userId, listItem: self.listItem});
    };

    self.getTodos = function(){
        // //
    };

    socket.on('getListResponse', function(data){
        var data = JSON.parse(data);
        self.list = data;
        $scope.$digest();
    });

    socket.on('listCreationSuccess', function(data){
        console.log(data);
        self.list.unshift(data.listItem);
        self.listItem = {};
        console.log(self.list);
        $scope.$digest();
    });
});