Seq = function(itemList, name, randomize) {
    this.className = this.className || 'Seq';
    this.itemList = itemList;
    this.name = name;
    this.currentIdx = -1;
    this.period = this.itemList.length;
    this.randomize = randomize || 0;
    this.randomizeRange = (this.randomize << 1) + 1;
};

Seq.prototype.constructor = Seq;

Seq.prototype.incIdx = function() {
    this.currentIdx++;
    if (this.currentIdx >= this.itemList.length) {
	this.currentIdx = -1; // exit
	return true; // exit
    }
    return false;
};

Seq.prototype.getRndInt = function() {
    if (this.randomize) {
	return Math.floor(Math.random() * this.randomizeRange) - this.randomize;
    }
    return 0;
};

Seq.prototype.nextItem = function() {
    if (this.currentIdx < 0) {
	this.currentIdx = 0; // initial entry
    }
    else if (this.incIdx()) {
	return false; // exit
    }
    return this.itemList[this.currentIdx] + this.getRndInt();
};

module.exports = Seq;
