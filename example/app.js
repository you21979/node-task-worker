var http = require('http');
var url = require('url');
var task = require('..').task;

var server = http.createServer(function (req, res) {
    var uri = url.parse(req.url).pathname;
    res.writeHead(200, {'Content-Type': 'text/plain'});
    task.send('req', {uri:uri}, function(param){
        res.end(param.text + '\n');
    });
});

task.run('./script/worker.js', 2, function(){
    server.listen(1337, function(){
        task.send('ping', {time:process.uptime()});
    });
});

task.on('online', function(worker){
    console.log('online :%s', worker.pid);
});
task.on('offline', function(worker){
    console.log('offline :%s', worker.pid);
});

task.on('pong', function(param){
    console.log(process.uptime() - param.time);
});


