Gameover = function(app) {
    this.stage = app.stage;
    this.width = app.renderer.width;
    this.height = app.renderer.height;
    this.style = new PIXI.TextStyle({
	fontFamily: "Arial",
	fontSize: 24,
	fill: "red",
	stroke: '#000044',
	strokeThickness: 3,
	dropShadow: true,
	dropShadowColor: "#000000",
	dropShadowBlur: 4,
	dropShadowAngle: Math.PI / 6,
	dropShadowDistance: 6,
    });
    this.text = new PIXI.Text('Game Over', this.style);
    //console.log('width=' + this.width);
    //console.log(app);
    this.text.anchor.set(0.5);
    this.text.x = this.width/2;
    this.text.y = this.height/2;
    this.text.scale.x = 0.5;
    this.text.scale.y = 0.5;
    //this.text.x = 100;
    //this.text.y = 20;
    this.text.alpha = 0;
    this.text.blendMode = PIXI.BLEND_MODES.ADD;
    //console.log(this.text);
    this.stage.addChild(this.text);
    this.time = 0;
    this.duration = 700;
};

// constructor
Gameover.prototype.constructor = Gameover;

Gameover.prototype.init = function() {
    this.text.alpha = 1;
    this.time = 0;
    this.text.rotation = 0;
    this.text.scale.x = 0.5;
    this.text.scale.y = 0.5;
};

Gameover.prototype.step = function(dt) {
    this.time += dt;
    //this.text.scale.x = dt/100;
    //this.text.scale.y = dt/100;
    if (this.text.rotation < 3.1416*4) {
	this.text.rotation += 0.03;
	this.text.scale.x += 0.01;
	this.text.scale.y += 0.01;
    }
    if (this.time > this.duration) {
	this.text.alpha = 0;
	return true;
    }
    return false;
};
