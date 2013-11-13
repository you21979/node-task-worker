var cluster = require('cluster');
var events = require('events');
var util = require('util');

var TaskWorker = function(){
    events.EventEmitter.call(this);
    this.workers = [];
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

var spawn = function(self){
    var worker = cluster.fork();
    worker
    .on('online', function(){
        console.log('online');
    })
    .on('message', function(msg){
        self.dispatcher(msg);
    })
    .on('disconnect', function(){
        console.log('offline');
        remove(self, worker);
        spawn(self);
    })
    ;
    self.workers.push(worker);
}

TaskWorker.prototype.run = function(script, num, callback){
    var self = this;
    if (cluster.isMaster) {
        cluster.setupMaster({
          exec : script,
          args : [],
//          silent : true
        });
        for(var i = 0; i<num; ++i){
            spawn(this);
        }
        callback();
    } else {
    }
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
