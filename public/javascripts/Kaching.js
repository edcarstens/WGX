Kaching = function(parent, texture, swidth, sheight, ncoins) {
    this.parent = parent;
    this.texture = texture;
    this.swidth = swidth;
    this.sheight = sheight;
    this.ncoins = ncoins || 10;
    this.coins = [];
    this.time = 0;
    this.duration = 400;
    this.state = 0;
    let i;
    for(i=0; i<this.ncoins; i++) {
	let s = new PIXI.Sprite(texture);
	s.blendMode = PIXI.BLEND_MODES.ADD;
	s.anchor = new PIXI.Point(0.5,0.5);
	s.alpha = 0;
	parent.addChild(s);
	this.coins.push(s);
    }
    this.vy0 = -Math.sqrt(this.sheight*1.8);
};

// constructor
Kaching.prototype.constructor = Kaching;

Kaching.prototype.init = function() {
    let i;
    let swidth = this.swidth;
    let sheight = this.sheight;
    i = 0;
    this.coins[i].x = swidth/2;
    this.coins[i].y = sheight;
    this.coins[i].vy = this.vy0;
    this.coins[i].alpha = 1;
    for(i=1; i<this.ncoins; i++) {
	this.coins[i].x = swidth/2;
	this.coins[i].y = sheight;
	this.coins[i].vy = 0;
	this.coins[i].alpha = 0;
    }
    this.state = 1;
    this.time = 0;
    //console.log(this);
};

Kaching.prototype.step = function(dt) {
    if (this.state == 1) {
	this.coins[0].y += this.coins[0].vy*dt;
	this.coins[0].vy += 1; // a*dt
	if (this.coins[0].vy >= 0) {
	    this.state = 2;
	    let i;
	    for(i=1; i<this.ncoins; i++) {
		this.coins[i].alpha = 1;
		this.coins[i].y = this.coins[0].y;
		//this.coins[i].vy = i - this.ncoins/2;
	    }
	    this.coins[0].vy = 0;
	    this.coins[1].vy = 4;
	    this.coins[2].vy = -4;
	    this.coins[3].vy = 8;
	    this.coins[4].vy = -8;
	    this.coins[5].vy = 8;
	    this.coins[6].vy = -8;
	    this.coins[7].vy = 4;
	    this.coins[8].vy = -4;
	    this.coins[9].vy = 0;
	}
    }
    else if (this.state == 2) {
	let i;
	let vx = -20;
	for(i=0; i<this.ncoins; i++) {
	    //this.coins[i].x -= dt;
	    this.coins[i].x += vx*dt;
	    vx += 4;
	    this.coins[i].y += this.coins[i].vy*dt;
	    this.coins[i].vy += 1; // a*dt
	}
	this.time += dt;
	if (this.time > this.duration) {
	    this.state = 0;
	    this.time = 0;
	}
    }
};
