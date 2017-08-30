app.controller('listController', function($scope, $http, $location){
	var socket = io.connect();
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
	  $http.post('/list-share', {email: email, listId:self.list[index]._id})
      .then(function(response){
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
	  socket.emit('deleteList', {itemId: itemId, index: index});
	};
	
	socket.on('deleteListResponse', function(data){
	  //if successful, remove item from list array
	  self.list.splice(data.index, 1);
	  $scope.$digest();
	});
	
	self.createList = function(userId){
	  socket.emit('createListItem', {userId: userId, listItem: self.listItem});
	};
	
	socket.on('getListResponse', function(data){
	  self.list = JSON.parse(data);
	  $scope.$digest();
	});
	
	socket.on('listCreationSuccess', function(data){
	  self.list.unshift(data.listItem);
	  self.listItem = {};
	  $scope.$digest();
	});
});