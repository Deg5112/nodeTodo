app.controller('listController', function($scope, $http, $location){
    var socket = io.connect();
    console.log(socket);
    var self = this;
    self.userId = null;
    self.list = [];
    self.listItem = {
        listTitle: null
    };
    self.shareIndex = null;
    self.emailValidError = false;
    self.emailShareSuccess = false;
    self.emailToShare = null;
    self.inviteMessage = null;
    self.showSharedImage = false;

    self.listShare = function(email, index){
        console.log(self.list[index]._id);
        console.log(self.list);
        console.log(email);
        $http.post('/list-share', {email: email, listId:self.list[index]._id})
            .then(function(response){
                console.log(response);
                if(response.data.success){
                    self.inviteMessage = response.data.message;

                    self.emailShareSuccess = true;
                    self.emailValidError = false;
                }else{
                    //email not valid
                    self.inviteMessage = response.data.message;
                    
                    self.emailValidError = true;
                    self.emailShareSuccess = false;
                }
            });
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
        console.log('lists', data);
        
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