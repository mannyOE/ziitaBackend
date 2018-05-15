RSA.controller('Wallet', function ($scope, $http, $timeout,$uibModal,toastr) {

  var EndPoint = "/";
  var Phone    = window.localStorage.getItem("user");
  
   $scope.show   = true;



console.log("i jumped");

var Profile = function(){


    $http.get(EndPoint + 'profile/' + Phone)
      .success(function (Data) {

        if (Data.status == true) {

          $scope.profile  = Data.data;

        }
      })
      .error(function (data) {

        $scope.error = "Connection Error";

      });

}



});