var cp = require('child_process');
var events = require('events');
var util = require('util');

var TaskWorker = function(){
    events.EventEmitter.call(this);
    this.workers = [];
    this.args = undefined;
    this.opts = undefined;
};
util.inherits(TaskWorker, events.EventEmitter);

var remove = function(self, worker){
    var n = self.workers.length;
    for(var i=0; i<n; ++i){
        if(self.workers[i] === worker){
            self.workers.splice(i, 1);
            return;
        }
    }
}

var spawn = function(self, script){
    var worker = cp.fork(script, self.args, self.opts);
    worker
    .on('message', function(msg){
        self.dispatcher(msg);
    })
    .on('error', function(err){
        self.emit('error', worker, err);
    })
    .on('disconnect', function(){
        self.emit('offline', worker);
        remove(self, worker);
        spawn(self, script);
    })
    ;
    self.workers.push(worker);
    self.emit('online', worker);
}

TaskWorker.prototype.run = function(script, num, callback){
    var self = this;
    process.nextTick(function(){
        for(var i = 0; i<num; ++i){
            spawn(self, script);
        }
        callback();
    });
}
TaskWorker.prototype.send = function(type, param, callback){
    var idx = Math.random() * this.workers.length | 0;
    this.workers[ idx ].send({
        type : type,
        param : param
    });
    if(callback){
        this.once(type, callback);
    }
}
TaskWorker.prototype.dispatcher = function(msg){
    this.emit(msg.type, msg.param);
}

var pm = module.exports = new TaskWorker();
