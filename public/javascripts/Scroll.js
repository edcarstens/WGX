Scroll = function(parent, panelWidth, panelY, panelOverlap, scale) {
    this.parent = parent;
    this.panelWidth = panelWidth;
    this.panelY = panelY;
    this.panelOverlap = panelOverlap;
    this.scale = scale || 1.0;
    this.panel = [new PIXI.Graphics(), new PIXI.Graphics()];
    this.panel[0].x = 0;
    this.panel[0].y = this.panelY;
    this.panel[1].x = this.panelWidth - this.panelOverlap;
    this.panel[1].y = this.panelY;
    this.parent.addChild(this.panel[0]);
    this.parent.addChild(this.panel[1]);
    this.panelIdx = 1;
    this.childIdx = 0; // child index for current panel
    this.x = 0; // x coord for new items drawn on current panel
    this.y = 0; // y coord for new items drawn on current panel
};

// constructor
Scroll.prototype.constructor = Scroll;

Scroll.prototype.draw = function(texture, anchorX, anchorY, y) {
    let sprite;
    let cidx = this.childIdx;
    let p = this.panel[this.panelIdx];
    if (p.children.length <= cidx) {
	sprite = new PIXI.Sprite(texture);
	sprite.blendMode = PIXI.BLEND_MODES.ADD;
	sprite.anchor = new PIXI.Point(anchorX, anchorY);
	sprite.setTransform(this.x, this.y - y, this.scale, this.scale);
	sprite.alpha = 1;
	p.addChild(sprite);
	this.childIdx++;
    }
    else {
	// reuse existing sprite
	sprite = p.children[cidx];
	sprite.texture = texture;
	sprite.anchor.x = anchorX;
	sprite.anchor.y = anchorY;
	sprite.x = this.x;
	sprite.y = this.y - y;
	sprite.alpha = 1;
	sprite.visible = true;
	this.childIdx++;
    }
};

Scroll.prototype.clear = function() {
    this.panel[0].clear();
    this.panel[1].clear();
    this.panel[0].x = 0;
    this.panel[0].y = this.panelY;
    this.panel[1].x = this.panelWidth - this.panelOverlap;
    this.panel[1].y = this.panelY;
    this.panelIdx = 1;
    this.childIdx = 0; // child index for current panel
    this.x = 0; // x coord for new items drawn on current panel
    this.y = 0; // y coord for new items drawn on current panel
};

// TODO - add capability to scroll either way
Scroll.prototype.step = function(dx, dy) {
    let child;
    let childIdx;
    let px;
    this.panel[0].x -= dx;
    this.panel[1].x -= dx;
    this.panel[0].y -= dy;
    this.panel[1].y -= dy;
    this.x += dx;
    this.y += dy;
    // fade feature
    for (childIdx in this.panel[0].children) {
	child = this.panel[0].children[childIdx];
	if (child.alpha >= 0.003) {
	    child.alpha -= 0.003;
	}
    }
    for (childIdx in this.panel[1].children) {
	child = this.panel[1].children[childIdx];
	if (child.alpha >= 0.003) {
	    child.alpha -= 0.003;
	}
    }
    px = this.panel[this.panelIdx].x;
    if (px <= -this.panelOverlap) { // other panel is completely off screen now
	let nextPanelIdx = 1 - this.panelIdx;
	let np = this.panel[nextPanelIdx];
	//console.log('Switched panels');
	this.x = 0;
	this.y = 0;
	this.childIdx = 0;
	np.x = this.panelWidth - this.panelOverlap + px;
	np.y = this.panelY;
	for (childIdx in np.children) {
	    np.children[childIdx].visible = false;
	}
	this.panelIdx = nextPanelIdx;
    }
};
