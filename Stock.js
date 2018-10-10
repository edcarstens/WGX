Stock = function(name, initEarn, earnLoB, earnUpB, nextEarnDelta) {
    this.name = name || "XYZ";
    this.earn = initEarn || 500; // -> $5.00
    this.earnLoB = earnLoB || 100; // -> $1.00
    this.earnUpB = earnUpB || 9000; // -> $90.00
    this.nextEarnDelta = nextEarnDelta || function(){return 0;};
    this.pe = 10; // price/earnings
    this.price = this.pe*this.earn;
    this.priceVel = 0;
    this.earnDeltas = [];
    this.ben = false; // tight bound enable
    this.uben = false; // upper tight bound enable
    this.pvBound = 200;
    this.pvFrictionBound = 15;
    this.pvFrictionBound2 = 50;
    this.pvFrictionVal = 3;
    this.maxQ = 10;
    this.mQ = this.maxQ * 7;
    this.rDelta = 0;
};

// constructor
Stock.prototype.constructor = Stock;

// next earnings
Stock.prototype.nextEarn = function() {
    var ed;
    this.rDelta = Math.floor(Math.random()*3000) - 1500;
    ed = this.nextEarnDelta();
    this.earn += ed;
    if (this.earn < this.earnLoB)
	this.earn = this.earnLoB;
    if (this.earn > this.earnUpB)
	this.earn = this.earnUpB;
    this.earnDeltas.unshift(ed); // save old earning deltas
    if (this.earnDeltas.length > 3)
	this.earnDeltas.pop();
    return this.earn;
};

Stock.prototype.pvFriction = function() {
    if (Math.abs(this.priceVel) > this.pvFrictionBound2) {
	this.pvFrictionVal = 10;
    }
    else {
	this.pvFrictionVal = 3;
    }
    if (this.priceVel > this.pvFrictionBound) {
	this.priceVel -= this.pvFrictionVal;
	if (this.priceVel < this.pvFrictionBound) {
	    this.priceVel = this.pvFrictionBound;
	}
    }
    if (this.priceVel < -this.pvFrictionBound) {
	this.priceVel += this.pvFrictionVal;
	if (this.priceVel > -this.pvFrictionBound) {
	    this.priceVel = -this.pvFrictionBound;
	}
    }
}

Stock.prototype.pvCheckBound = function() {
    if (this.priceVel > this.pvBound)
	this.priceVel = this.pvBound;
    if (this.priceVel < -this.pvBound)
	this.priceVel = -this.pvBound;
};

// next price
Stock.prototype.nextPrice = function() {
    let tlo;
    let thi;
    if (this.earnDeltas.length > 1) {
	if ((this.earnDeltas[0] > 0) && (this.earnDeltas[1] > 0)) {
	    this.uben = false; // enable tight lower bound on price
	    this.ben = true; // enable tight bound on price
	}
	else if ((this.earnDeltas[0] < 0) && (this.earnDeltas[1] < 0)) {
	    this.uben = true; // enable tight upper bound on price
	    this.ben = true;
	}
	else {
	    this.ben = false; // disable tight bounds on price
	}
	let pr = this.price + this.rDelta;
	let np = this.pe*this.earn;
	tlo = np >> 1; // loose bound (half)
	thi = np << 1; // loose bound (double)
	if (this.ben) {
	    if (this.uben) {
		thi = np + 500; // tight upper bound
	    }
	    else {
		tlo = np - 500; // tight lower bound
	    }
	}
	if (pr > thi) {
	    this.priceVel -= this.mQ;
	}
	else if (pr < tlo) {
	    this.priceVel += this.mQ;
	}

	// Random changes in direction
	if (Math.random() < 0.005) {
	    if (this.priceVel > 0) {
		this.priceVel = -this.mQ;
	    }
	    else {
		this.priceVel = this.mQ;
	    }
	    //this.priceVel = -this.priceVel;
	}
	
	// Prevent price from going much below $10.00
	if (this.price < 1000) {
	    this.priceVel += this.mQ;
	    if (this.price < 900)
		this.price =900; // hard limit is $9.00
	}
    }
    this.pvCheckBound();
    this.price += this.priceVel;
    this.pvFriction();
    return this.price;
};

// buy/sell (ns <= maxQ)
Stock.prototype.trade = function(n) {
    //return; // debug
    ns = n/10;
    if (ns > this.maxQ)
	this.priceVel += this.maxQ;
    else if (ns < -this.maxQ)
	this.priceVel -= this.maxQ;
    else
	this.priceVel += ns;
    this.pvCheckBound();
};

module.exports = Stock;
