WGXLOOP.bot1 = function() {
    let eh = WGXLOOP.earnHistory;
    let ehlen = eh.length;
    let nomPrice = eh[ehlen-1]*10;
    let maxPrice = nomPrice*2;
    let minPrice = nomPrice/2;
    if (minPrice < 1000) minPrice = 1000; // $10
    let cp = WGXLOOP.currentPrice;
    let shares = WGXLOOP.portfolio.shares['FIB'];
    let q = WGXLOOP.q;
    let myPrice;
    let holdDelta = 200; // $2
    
    if (eh[ehlen-2] < eh[ehlen-1]) { // earnings are increasing
	myPrice = (nomPrice + maxPrice)/2; // how I value FIB
    }
    else {
	myPrice = (minPrice + nomPrice)/2; // how I value FIB
    }

    if ((cp < myPrice - holdDelta) && (shares <= 3*q)) {
	WGXLOOP.buy();
    }
    if ((cp > myPrice + holdDelta) && (shares > 0)) {
	WGXLOOP.sell();
    }

    // Shorting
    if ((shares <= 0) && (shares >= -q)) {
	if (myPrice > nomPrice) {
	    if (cp > maxPrice - 200) {
		WGXLOOP.sell();
	    }
	}
	else {
	    if (cp > nomPrice - 500) {
		WGXLOOP.sell();
	    }
	}
    }
    // Closing short position
    if (shares < 0) {
	if (myPrice > nomPrice) {
	    if (cp < maxPrice - 1200) {
		WGXLOOP.buy();
	    }
	}
	else {
	    if (cp < nomPrice - 1000) {
		WGXLOOP.buy();
	    }
	}
    }
    
    // Donations
    if ((WGXLOOP.nw > 900000) && (shares == 0)) {
	WGXLOOP.donate();
    }
}
