var task = require('..').task;

var http = require('http');
var url = require('url');
var server = http.createServer(function (req, res) {
    var uri = url.parse(req.url).pathname;
    res.writeHead(200, {'Content-Type': 'text/plain'});
    console.log(uri);
    task.send('req', {uri:uri}, function(param){
        res.end(param.text + '\n');
    });
});

task.run('./script/worker.js', 4, function(){
    server.listen(1337, function(){
        task.send('ping', {time:process.uptime()});
    });
});

task.on('pong', function(param){
    console.log(process.uptime() - param.time);
});


