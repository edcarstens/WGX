Portfolio = function(cash) {
    this.cash = cash;
    this.shares = {};
    this.loans = 0;
    this.margin = 0;
    this.leverage = 10; // 10x leverage allows for a loan up to 10*cash
};

Portfolio.prototype.constructor = Portfolio;

Portfolio.prototype.initStock = function(stock) {
    if (this.shares[stock] === undefined)
	this.shares[stock] = 0;
    if (this.loans[stock] === undefined)
	this.loans[stock] = 0;
};

Portfolio.prototype.simpleTrade = function(q, stock, price, mq) {
    // where's the money?
    if ((q > 0) && (this.margin < q*price)) {
	return false;
    }
    // selling shares you don't have?
    let myq = mq || this.shares[stock];
    if ((q < 0) && (myq < -q)) {
	return false;
    }
    // execute the trade
    this.shares[stock] += q;
    //this.cash -= q*price;
    this.margin -= q*price;
    this.adjust(stock, price);
    return true;
};

Portfolio.prototype.trade = function(q, stock, price) {

    if (price <= 0) {
	return false;
    }
    this.initStock(stock);
    this.adjust(stock, price);
    
    // Shorting allowed
    if ((q < 0) && (this.shares[stock] < -q)) {
	if (this.shares[stock] > 0) {
	    // just sell the shares
	    return this.simpleTrade(-this.shares[stock], stock, price);
	}
	else {
	    if (this.cash*this.leverage < -q*price) {
		return false;
	    }
	    let margin = -price*q; // required margin = 100% of sale proceeds
	    this.loans += margin;
	    this.margin += margin;
	    // borrow the shares and execute a normal sale
	    return this.simpleTrade(q, stock, price, -q);
	}
    }

    // Normal sale
    if (q < 0) {
	return this.simpleTrade(q, stock, price)
    }

    if (this.shares[stock] >= 0) {
	// Purchase
	let cost = q*price;
	let margin = Math.round(cost/this.leverage);
	if (this.cash < margin) {
	    return false;
	}
	this.margin += cost;
	this.loans += cost;
	return this.simpleTrade(q, stock, price);
    }
    else {
	// closing a short position
	if (q > -this.shares[stock]) {
	    q = -this.shares[stock];
	}
	let cost = q*price;
	this.loans += cost;
	this.margin += cost; // make sure margin acct has enough
	return this.simpleTrade(q, stock, price);
    }
};

// For multiple stocks, this needs to sum all holdings
// For now, we just have one stock
Portfolio.prototype.adjust = function(stock, price) {
    let q = this.shares[stock];
    let loans;
    let margin;
    if (q >= 0) {
	let sval = q*price;
	margin = Math.round(sval/this.leverage);
	loans = sval;
    }
    else {
	margin = -q*price; // required margin to maintain
	let rcash = Math.round(margin/this.leverage); // required cash
	loans = margin - rcash;
	margin += margin; // add in cash from sale of borrowed shares
    }
    this.cash += (loans - this.loans + this.margin - margin);
    this.loans = loans;
    this.margin = margin;

};

Portfolio.prototype.netEquity = function(stock, price) {
    // For now we just have one stock, "FIB"
    let q = this.shares[stock]
    return (q*price + this.cash + this.margin - this.loans);
};
