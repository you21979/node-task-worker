var http = require('http');
var url = require('url');
var task = require('..').task;

var server = http.createServer(function (req, res) {
    var uri = url.parse(req.url).pathname;
    res.writeHead(200, {'Content-Type': 'text/plain'});
    console.log(uri);
    task.send('req', {uri:uri}, function(param){
        res.end(param.text + '\n');
    });
});

task.run('./script/worker.js', 8, function(){
    server.listen(1337, function(){
        task.send('ping', {time:process.uptime()});
    });
});

task.on('online', function(){
    console.log('online');
});
task.on('offline', function(){
    console.log('offline');
});

task.on('pong', function(param){
    console.log(process.uptime() - param.time);
});


