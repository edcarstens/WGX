Banner = function(parent, y, length, charWidth, charHeight, lengthLimit) {
    this.parent = parent;
    this.y = y;
    this.length = length;
    this.charWidth = charWidth || 12;
    this.charHeight = charHeight || 20;
    this.lengthLimit = lengthLimit || 200;
    let style = new PIXI.TextStyle({
	fontFamily: "Courier",
	fontSize: 20,
	fill: "white",
	stroke: '#000044',
	strokeThickness: 3,
	dropShadow: true,
	dropShadowColor: "#000000",
	dropShadowBlur: 4,
	dropShadowAngle: Math.PI / 6,
	dropShadowDistance: 6,
    });
    this.bgr = new PIXI.Graphics();
    this.bgr.beginFill(0x5050F0, 0.7);
    this.bgr.drawRect(0, 0, this.length*this.charWidth, this.charHeight << 1);
    this.bgr.endFill();
    this.bgr.x = 0;
    this.bgr.y = this.y-(this.charHeight >> 1);
    this.bgr.anchor = new PIXI.Point(0, 0.5);
    this.parent.addChild(this.bgr);
    this.panel = [new PIXI.Text(' '.repeat(length), style), new PIXI.Text(' ',style)];
    this.panel[0].x = 0;
    this.panel[0].y = this.charWidth << 1;
    this.panel[0].anchor = new PIXI.Point(0, 0.5);
    this.panel[1].x = this.length * this.charWidth;
    this.panel[1].y = this.charWidth << 1;
    this.panel[1].anchor = new PIXI.Point(0, 0.5);
    this.bgr.addChild(this.panel[0]);
    this.bgr.addChild(this.panel[1]);
    this.panelIdx = 1;
    this.cx = this.charWidth;
    this.chars = 0; // characters visible
};

// constructor
Banner.prototype.constructor = Banner;

Banner.prototype.send = function(msg) {
    if (this.panel[this.panelIdx].text.length + msg.length <= this.lengthLimit) {
	this.panel[this.panelIdx].text += msg;
	return true;
    }
    else {
	return false;
    }
}

Banner.prototype.step = function(dx) {
    let p = this.panel[this.panelIdx];
    this.panel[0].x -= dx;
    this.panel[1].x -= dx;
    this.cx -= dx;
    if (this.cx <= 0) {
	this.cx = this.charWidth;
	this.chars++;
	if (p.text.length < this.chars) {
	    p.text = p.text.concat(' ');
	}
    }
    if (p.x <= 0) { // other panel is completely off screen now
	let npIdx = 1 - this.panelIdx;
	let np = this.panel[npIdx];
	//console.log('Switched panels');
	np.x = this.length * this.charWidth;
	if (p.text.length > this.length) {
	    np.text = p.text.slice(this.length);
	    p.text = p.text.slice(0,this.length);
	}
	else {
	    //np.text = npIdx ? 'xyz ' : 'abc ';
	    np.text = '';
	}
	let z0 = this.bgr.children[0];
	let z1 = this.bgr.children[1];
	this.bgr.children = [z1, z0];
	this.chars = 0;
	this.panelIdx = npIdx;
    }
};
