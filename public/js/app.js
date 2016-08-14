var app = angular.module('todo', []);



app.service('navClass', function(){
    var self = this;
    self.class = null;
});


app.controller('registerController', function(navClass){
    navClass.class = 'register';
});

app.controller('signInController', function(navClass){
    navClass.class = 'login';
    
});


