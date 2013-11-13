var events = require('events');
var util = require('util');

var Worker = function(){
    events.EventEmitter.call(this);

    var self = this;
    process.on('message', function(msg){
        self.dispatcher(msg);
    });
};
util.inherits(Worker, events.EventEmitter);

Worker.prototype.dispatcher = function(msg){
    msg.param._seq = msg._seq;
    this.emit(msg.type, msg.param);
}
Worker.prototype.send = function(type, param){
    process.send({
        _seq : param._seq,
        type : type,
        param : param
    });
}

var worker = module.exports = new Worker();
