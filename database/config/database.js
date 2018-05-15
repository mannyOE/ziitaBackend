var database = process.env.DATABASE || "ZEEDAS";
// var database = "ZEEDAS";
console.log("Using DATABASE:: "+ database);
module.exports = {
    //'staging' : 'mongodb://138.68.145.93:27017/ZEEDAS'
    'staging' : 'mongodb://localhost/'+database
};
