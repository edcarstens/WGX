// Hierarchical
// Ordered
// Repeatable
// SEquences

// Class Horse extends Seq

Horse = function(itemList, iterList, name, randomize) {
    this.className = this.className || 'Horse';
    Seq.call(this, itemList, name, randomize);
    this.iterList = iterList;
    this.iterCnts = this.iterList.slice(0); // copy
};

Horse.prototype = Object.create(Seq.prototype);
Horse.prototype.constructor = Horse;

Horse.prototype.nextItem = function(depth) {
    var d, item, x, n;
    d = depth || 0;
    if (d > 99) {
	throw 'exceeded recursive limit of 99';
    }
    
    if (this.currentIdx < 0) {
	this.currentIdx = 0; // initial entry
	if (this.randomize) {
	    for(n=0; n<this.iterCnts.length; n++) {
		x = this.iterCnts[n] + this.getRndInt();
		if (x >= 0) {
		    this.iterCnts[n] = x;
		}
	    }
	}
    }

    item = false;
    while (item === false) {
	n = this.iterCnts[this.currentIdx];
	while (n == 0) {
	    if (this.incIdx()) {
		this.iterCnts = this.iterList.slice(0);
		return false; // end of this Horse
	    }
	    n = this.iterCnts[this.currentIdx];
	}
	x = this.itemList[this.currentIdx];
	item = x.nextItem(d+1);
	if (item === false) {
	    this.iterCnts[this.currentIdx]--;
	}
    }
    return item;
};

Horse.prototype.nextItemRpt = function() {
    var x;
    x = this.nextItem();
    while (x === false) x = this.nextItem();
    return x;
};

module.exports = Horse;
