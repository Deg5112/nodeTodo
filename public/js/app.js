var app = angular.module('todo', []);

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
      //
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
})

app.service('navClass', function(){
    var self = this;
    self.class = null;
});

app.controller('mainController', function($scope, $log, navClass){
    var self = this;

    self.returnNavClass = function(string){
        console.log('navClass from main', navClass.class);
        return navClass.class == string;
    };

    self.checkMessage = function(){

        if(document.getElementById('successMsg')){

            var successEl = angular.element(document.getElementById('successMsg'));
            $log.info(successEl.val(), 1);
            Materialize.toast(successEl.val(), 4000)
        }
        if(document.getElementById('errorMsg')){
            var errorMsgEl = angular.element(document.getElementById('errorMsg'));
            $log.info(errorMsgEl.val(), 2);
            Materialize.toast(errorMsgEl.val(), 4000)
        }
        if(document.getElementById('msg-error')){
            var errorEl = angular.element(document.getElementById('msg-error'));
            $log.info(errorEl.val(), 3);
            Materialize.toast(errorEl.val(), 4000)
        }

        // $log.info(self.successEl.val(), self.errorMsgEl.val(), self.errorEl.val());
    };
    self.checkMessage();
});

app.controller('registerController', function(navClass){
    navClass.class = 'register';
});

app.controller('signInController', function(navClass){
    navClass.class = 'login';
    
});


