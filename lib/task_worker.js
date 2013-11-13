var cp = require('child_process');
var events = require('events');
var util = require('util');

var MAX_CONCURRENT_COUNT = 10000;

var TaskWorker = function(){
    events.EventEmitter.call(this);
    this.setMaxListeners(MAX_CONCURRENT_COUNT);
    this.workers = [];
    this.args = undefined;
    this.opts = undefined;
    this.seq = 0;
    this.callback = {};
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
TaskWorker.prototype.select = function(){
//    var idx = Math.random() * this.workers.length | 0;
    var idx = this.seq++ % this.workers.length;
    return idx;
}
TaskWorker.prototype.send = function(type, param, callback){
    var seq = this.seq++;
    var idx = seq % this.workers.length;
    this.workers[ idx ].send({
        _seq : seq,
        type : type,
        param : param
    });
    if(callback){
        this.callback[seq] = callback;
    }
}
TaskWorker.prototype.dispatcher = function(msg){
    if(this.callback[msg._seq]){
        this.callback[msg._seq](msg.param);
        delete this.callback[msg._seq];
    }
    this.emit(msg.type, msg.param);
}

var pm = module.exports = new TaskWorker();
