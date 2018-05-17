var database = process.env.DATABASE || "ziita_test";
// var database = "ZEEDAS";
console.log("Using DATABASE:: "+ database);
module.exports = {
    //'staging' : 'mongodb://138.68.145.93:27017/ZEEDAS'
    'staging' : 'mongodb://localhost/'+database
};
