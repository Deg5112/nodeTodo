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
