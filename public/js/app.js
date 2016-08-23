var app = angular.module('todo', ['ui.materialize']);



app.service('navClass', function(){
    var self = this;
    self.class = null;
});


app.controller('registerController', function(navClass){
    navClass.class = 'register';
});

app.controller('signInController', function($http, $log, navClass){
    navClass.class = 'login';

    var self = this;
    self.emailResetSuccess = false;
    self.emailResetBool = false;
    self.passwordResetEmail = null;
    self.emailNotExist = false;
    
    self.resetPassword = function(email){
        if(typeof email == 'undefined'){
            self.emailResetBool = true;
            return;
        }else{
            self.emailResetBool = false;
        }
        
        
        $http.post('http://davidgoodman-node.club/users/resetPassword', {email: email})
            .then(function(response){
                console.log(response);
               if(response.data.success){
                   self.emailResetSuccess = true;
                   self.emailNotExist = false;
               }else{
                   self.emailNotExist = true;
                   self.emailResetSuccess = false;
               }
            });
    };
    
});


