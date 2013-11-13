var child = require('../..').child;
child.on('req', function(param){
    param.text = 'hello ' + param.uri;
    child.send('req', param);
});
child.on('ping', function(param){
    child.send('pong', param);
});
