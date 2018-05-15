
exports.show200 = function(req, res){
    res.writeHead(200,{'Content-type': 'text/html'});
    res.write('hello');
    res.end();
}