var jsonData = $.ajax({
    url: "/plans/" + window.localStorage.getItem("user"),
    dataType: "json",
    async: false
}).responseText;

var result = $.parseJSON(jsonData);
console.log(result.data);

var chart = document.getElementById("lineChart");
console.log(chart);



function strTochart(input) {
    var output = [];
    var saved  =0;
    var amount =0;
    for (var i = 0; i < input.length; ++i){

          saved  += input[i].saved;
         amount += parseInt(input[i].target_amount);
    }
       
     output.push(saved);
     output.push(amount);

    return output;
}




var amount = strTochart(result.data);
console.log(amount);




new Chart(document.getElementById("chart"), {
    type: 'doughnut',
    data: {
       
      //  labels: planName,
        datasets: [{
            label: ['Total Savings', 'Target Amount'],
            backgroundColor: ["#1a936f","#3e4b5b"],
            data: amount
        }]
    },
   
});