const { Observable, interval } = require('rxjs');
var Seq = require('./Seq.js');
var Horse = require('./Horse.js');
var Stock = require('./Stock.js');

let WGX = {
    io: null, // set this to IO socket
    updateTime: 200, // ms
    LB: [{player:'test', val:0}],
    LBN: 3,
    LBV: 0,
    secretId: 0,
    secretUp: true,
    secretDelta: 0,
    secretCount: 0,
    secretTimeout: 0,
    sdata: {socket: null, socketReady: false, secretReady: true}
};

WGX.init = function(io) {
    this.io = io;
    this.s1u = new Seq([-10,20,30,50,20,10], 's1u', 10); // +120
    this.s1d = new Seq([-10,-20,-30,-50,-20], 's1d', 10); // -130
    this.s2u = new Horse([this.s1d,this.s1u], [1,2], 's2u', 1); // +110
    this.s2d = new Horse([this.s1u,this.s1d], [1,2], 's2d', 1); // -140
    this.balance = new Seq([-50], 'balance', 10);
    this.seq = new Horse([this.s2u,this.s2d,this.balance], [3,2,1], 's', 1); // 0
    this.FIB = new Stock("FIB", 1000, 100, 9000);
    // POP seq
    this.sp1u = new Seq([50,70,100,150,200,70], 'sp1u', 0);
    this.sp1d = new Seq([-50,-70,-100,-150,-200,-70], 'sp1d', 0);
    this.seqpop = new Horse([this.sp1u,this.sp1d], [3,3], 'sp', 0);
};

WGX.next = function(i) {
    let earn;
    let price;
    price = this.FIB.nextPrice();
    if (i % 32 == 0) {
	earn = this.FIB.nextEarn();
	this.io.sockets.emit('xdata', {earn:earn, price:price});
	if (WGX.secretCount > 0) {
	    WGX.secretCount--;
	}
	else if (WGX.sdata.secretCount > 0) {
	    WGX.secretCount = WGX.sdata.secretCount;
	    WGX.secretDelta = WGX.secretUp ? 100 : -100;
	    WGX.sdata.secretCount = 0;
	}
	else if (WGX.sdata.secretReady) {
	    WGX.secretDelta = 0;
	    WGX.secretId = 0;
	    //console.log('reset secret delta to zero');
	    if (WGX.sdata.socketReady && (Math.random() < 0.05)) {
		WGX.secretId = 1 + Math.floor(Math.random()*999999);
		WGX.secretUp = (earn < 1000) || (WGX.FIB.earnDeltas[0] < 0);
		WGX.sdata.socket.emit('secret', {id: WGX.secretId, up: WGX.secretUp});
		WGX.sdata.secretReady = false;
		WGX.secretTimeout = 10;
		//console.log('secret ID = ' + WGX.secretId);
	    }
	}
	else {  // waiting for client to send secret
	    if (WGX.secretTimeout == 0) { // time out
		WGX.secretId = 0;         // cancel old secret
		WGX.secretDelta = 0;
		WGX.sdata.secretReady = true;  // generate a new secret
		WGX.sdata.socketReady = false; // pick a new client
	    }
	    else {
		WGX.secretTimeout--;
	    }
	}
    }
    else {
	this.io.sockets.emit('xdata', {price:price});
    }
    if (i % 64 == 16) {
	this.io.sockets.emit('banner', { message: 'Buy FIB!' });
    }
};

WGX.error = function(err) { console.log(err);};
WGX.complete = function() {};

WGX.insertLB = function(data) {
    let p = data.player;
    let v = data.value;
    let i = 0;
    while ((i < this.LB.length) && (v <= this.LB[i].val)) {
	i++;
    }
    this.LB.splice(i, 0, {player:p, val:v});
    if (this.LB.length > this.LBN) {
	this.LB.splice(this.LBN, this.LB.length - this.LBN);
	this.LBV = this.LB[this.LB.length - 1].val;
    }
};

WGX.removeLB = function(p) {
    let i = 0;
    while ((i < this.LB.length) && (p != this.LB[i].player)) {
	i++;
    }
    if (i < this.LB.length) {
	this.LB.splice(i, 1); // remove existing player position
    }
};

WGX.start = function() {
    let io;
    let seq;
    let LBV = this.LBV;
    let LB = this.LB;
    //let LB = [{player: '', val: 0}];
    //let LBN = 3; // keep up with top 3 players
    //let LBV = 0; // leader board last place value
    //let LBP = '';
    io = this.io;
    this.FIB.nextEarnDelta = function() {
	return ((WGX.secretDelta != 0) ? WGX.secretDelta : WGX.seq.nextItemRpt());
    };
    //this.FIB.nextEarnDelta = function() { return WGX.seqpop.nextItemRpt(); };
    //this.FIB.nextEarnDelta = function() { return 0; };
    // Stream emits data periodically (updateTime)
    //interval(this.updateTime).subscribe(this.observer);
    interval(this.updateTime).subscribe(this);
    // DO NOT use 'this' keyword in callback functions!
    io.on('connection', function(socket) {
	socket.emit('leaders', WGX.LB);
	//socket.emit('banner', { message: 'Welcome to the WGX' });
	socket.on('trade', function(data) {
	    //console.log('trade: ' + data.q);
	    WGX.FIB.trade(data.q);
	    if (data.username == WGX.LB[0].player) {
		io.sockets.emit('trade', data);
	    }
	    if ((data.q < 100) && (! WGX.sdata.socketReady)) {
		WGX.sdata.socket = socket;
		WGX.sdata.socketReady = true;
		//console.log('picked a client socket for the secret');
	    }
	});
	socket.on('secret', function(data) {
	    let msg;
	    //console.log('received secret id = ' + data.id);
	    //console.log('secretId = ' + WGX.secretId);
	    if (data.id == WGX.secretId) {
		WGX.sdata.secretCount = 3;
		WGX.sdata.socketReady = false;
		WGX.sdata.secretReady = true;
		//console.log('starting secret delta..');
		msg = (WGX.secretUp) ? 'FIB wins contract with Universal Industries' :
		    'Class action lawsuit filed against FIB';
		WGX.io.sockets.emit('banner', {message: msg});
	    }
	});
	// Chat messages
	socket.on('send', function(data) {
	    //io.sockets.emit('message', data);
	    if ((data.username == WGX.LB[0].player) && (data.message.length <= 60)) {
		io.sockets.emit('banner', data);
	    }
	});
	socket.on('leader', function(data) {
	    if (data.value == 0) {
		WGX.removeLB(data.player);
	    }
	    else if (data.value > WGX.LBV) {
		WGX.removeLB(data.player);
		WGX.insertLB(data);
	    }
	    io.sockets.emit('leaders', WGX.LB);
	});
    });
};

module.exports = WGX;
