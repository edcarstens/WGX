var WGXLOOP = {}; // singleton object

WGXLOOP.init = function(app, swidth, sheight, priceHistory, socket, cdata) {
    WGXLOOP.app = app;
    WGXLOOP.swidth = swidth;
    WGXLOOP.sheight = sheight;
    WGXLOOP.lastEarn = 0;
    WGXLOOP.priceHistory = priceHistory;
    //WGXLOOP.tradeHistory = []
    WGXLOOP.currentPrice = 0; // init flag
    WGXLOOP.centerPrice = 0; // for price history display
    WGXLOOP.q = 1;
    WGXLOOP.socket = socket;
    WGXLOOP.frame = 0;
    WGXLOOP.trades = 0;
    WGXLOOP.tradesQ = 10;
    WGXLOOP.lastTrade = 0;
    WGXLOOP.cdata = cdata; // client data obj (eticks, ..)
    WGXLOOP.player = '';
    WGXLOOP.leaders = '';
    WGXLOOP.LBV = 0;
    WGXLOOP.nw = 0;
    WGXLOOP.donations = 0;
};

WGXLOOP.upQ = function(q) {
    if (q >= 500) return 500; // max
    if ((q == 2) || (q == 20) || (q == 200)) return q*5/2;
    return q*2;
};

WGXLOOP.downQ = function(q) {
    if (q <= 1) return 1; // min
    if ((q == 5) || (q == 50) || (q == 500)) return q*2/5;
    return q/2;
};

WGXLOOP.mapy = function(y, iscp) {
    let center = WGXLOOP.centerPrice;
    let ub = WGXLOOP.sheight/2 - 60;
    let usq = ub - 40;
    let ny = (y >> 4) - center;
    let d;
    let earn = WGXLOOP.earnScroll;
    if (ny > usq) {
	if (iscp) {
	    d = ny - usq;
	    WGXLOOP.centerPrice += d;
	    ny = usq;
	    earn.step(0, -d);
	}
	else {
	    ny = (ny + usq) >> 1; // compress
	}
    }
    else if (ny < -usq) {
	if (iscp) {
	    d = ny + usq;
	    WGXLOOP.centerPrice += d;
	    ny = -usq;
	    earn.step(0, -d);
	}
	else {
	    ny = (ny - usq) >> 1; // compress
	}
    }
    let rv = ny;
    if (rv > ub) {
	rv = ub;
    }
    if (rv < -ub) {
	rv = -ub;
    }
    return rv;
};

WGXLOOP.drawEarn = function(evalue) {
    let texture;
    let anchorX;
    let anchorY;
    if (evalue > WGXLOOP.lastEarn) {
	texture = WGXLOOP.buyArrow;
	anchorX = 0.5;
	anchorY = 1;
    }
    else {
	texture = WGXLOOP.sellArrow;
	anchorX = 0.5;
	anchorY = 0;
    }
    WGXLOOP.earnScroll.draw(texture, anchorX, anchorY, WGXLOOP.mapy(evalue*10));
    WGXLOOP.lastEarn = evalue;
};

WGXLOOP.drawTrade = function(q, buy, sell) {
    let texture;
    let anchorX;
    let anchorY;
    let ph = WGXLOOP.priceHistory;
    if (q > 0) {
	texture = buy;
	anchorX = 0.5;
	anchorY = 1;
    }
    else {
	texture = sell;
	anchorX = 0.5;
	anchorY = 0;
    }
    WGXLOOP.earnScroll.draw(texture, anchorX, anchorY, WGXLOOP.mapy(ph[ph.length - 1]));
};

WGXLOOP.gotoLogin = function() {
    WGXLOOP.state = WGXLOOP.login;
    $('#btnPlay').show();
    $('#btnBuy').hide();
    $('#btnSell').hide();
    $('#btnDonate').hide();
    $('#btnWish').hide();
    $('#btnOmen').hide();
    $('#wgxgfx').hide();
};

WGXLOOP.process = function(price) {
    WGXLOOP.currentPrice = price;
    let net = WGXLOOP.portfolio.netEquity('FIB', price);
    WGXLOOP.nw = net;
    if (net < 0) {
	// Game Over
	WGXLOOP.socket.emit('leader', {value:0, player:WGXLOOP.player});
	WGXLOOP.initVars();
	WGXLOOP.info.text = 'GAME OVER\n\n' + WGXLOOP.info.text;
	WGXLOOP.gotoLogin();
	return;
    }
    let q = WGXLOOP.q;
    if (net > q*20000) {
	WGXLOOP.q = WGXLOOP.upQ(q);
    }
    else if ((net < q*5000) && (Math.abs(WGXLOOP.portfolio.shares['FIB']) < q*5)) {
	WGXLOOP.q = WGXLOOP.downQ(q);
    }

    if (WGXLOOP.portfolio.shares['FIB'] == 0) {
	WGXLOOP.trades = 0; // terminate series
    }
    if (WGXLOOP.trades > 0) {
	// do trades to complete series of small trades
	if (WGXLOOP.portfolio.trade(WGXLOOP.tradesQ, 'FIB', WGXLOOP.currentPrice)) {
	    WGXLOOP.socket.emit("trade", {q:WGXLOOP.tradesQ, username:WGXLOOP.player});
	    WGXLOOP.lastTrade = WGXLOOP.tradesQ;
	    WGXLOOP.trades--;
	    WGXLOOP.updateInfo();
	}
	else {
	    WGXLOOP.trades = 0; // terminate series
	}
    }
    WGXLOOP.portfolio.adjust('FIB', price);
    WGXLOOP.updateInfo();
    if (price > 0) WGXLOOP.priceHistory.push(price);
    if (WGXLOOP.priceHistory.length > 320) WGXLOOP.priceHistory.shift();
    if ((WGXLOOP.centerPrice == 0) && (price > 0)) {
	WGXLOOP.centerPrice = price >> 4; // init
    }
};

WGXLOOP.drawPrice = function() {
    let idx;
    let line = WGXLOOP.line;
    let trades = WGXLOOP.tradesPlot;
    let ph = WGXLOOP.priceHistory;
    let phlen = ph.length;
    //let th = WGXLOOP.tradeHistory;
    //let thlen = th.length;

    WGXLOOP.earnScroll.step(2,0);
    
    line.clear();
    trades.clear();
    if (phlen > 0) {
	let priceY;
	line.x = WGXLOOP.swidth - (phlen << 1)
	line.y = WGXLOOP.sheight >> 1; // middle height
	trades.x = line.x
	trades.y = line.y
	line.lineStyle(6, 0x4444dd, 0.8);
	for(idx=0; idx<phlen; idx++) {
	    priceY = WGXLOOP.mapy(ph[idx], (idx == phlen-1));
	    if (idx == 0) {
		line.moveTo(idx << 1, -priceY);
	    }
	    else {
		line.lineTo(idx << 1, -priceY);
	    }
	}
    }

    // Robots
    if (WGXLOOP.player == 'bot1') {
	WGXLOOP.bot1();
    }
    
};

WGXLOOP.play = function(delta) {
    if (WGXLOOP.cdata.earnReady) {
	WGXLOOP.drawEarn(WGXLOOP.cdata.earn);
	WGXLOOP.cdata.earnReady = false;
    }
    else if (WGXLOOP.cdata.priceReady) {
	WGXLOOP.process(WGXLOOP.cdata.price);
	WGXLOOP.drawPrice();
	WGXLOOP.cdata.priceReady = false;
    }
    if (WGXLOOP.lastTrade != 0) {
	WGXLOOP.drawTrade(WGXLOOP.lastTrade, WGXLOOP.buyTriangle, WGXLOOP.sellTriangle);
	WGXLOOP.lastTrade = 0;
    }
    if (WGXLOOP.cdata.textReady) {
	if (WGXLOOP.infoBanner.send(WGXLOOP.cdata.text + ' ')) {
	    WGXLOOP.cdata.textReady = false;
	}
    }
    if (WGXLOOP.cdata.tradeReady) {
	WGXLOOP.drawTrade(WGXLOOP.cdata.trade, WGXLOOP.buyTriangle1, WGXLOOP.sellTriangle1);
	WGXLOOP.cdata.tradeReady = false;
    }
//    WGXLOOP.wishButton.visible = (WGXLOOP.cdata.secretId && WGXLOOP.cdata.secretUp);
//    WGXLOOP.omenButton.visible = (WGXLOOP.cdata.secretId && !WGXLOOP.cdata.secretUp);
/*
    if (WGXLOOP.cdata.secretId) {
	if (WGXLOOP.cdata.secretUp) {
	    $('#btnWish').show();
	    $('#btnOmen').hide();
	}
	else {
	    $('#btnOmen').show();
	    $('#btnWish').hide();
	}
    }
    else {
	$('btnOmen').hide();
	$('btnWish').hide();
    }
*/
    WGXLOOP.infoBanner.step(1);
};

WGXLOOP.drawButton = function(g,x,y,c,s,sx,style,h) {
    let hh = h || 100;
    g.beginFill(c, 1);
    g.lineStyle(1, c, 1);
    g.drawRect(x,y,100,hh);
    g.endFill();
    // button text
    let bText = new PIXI.Text(s, style);
    bText.position.set(x+sx, y + (hh >> 1) - 10);
    g.interactive = true;
    g.addChild(bText);
    WGXLOOP.app.stage.addChild(g);
};

WGXLOOP.cash2string = function(x) {
    //let d = Math.floor(x/100);
    let unit = '';
    let d = Math.round(x/100); // dollars
    if (d > 10000) {
	unit = 'K';
	d = Math.round(d/1000);
	if (d > 10000) {
	    unit = 'M';
	    d = Math.round(d/1000);
	}
    }
    return '$' + d.toString() + unit;
};

WGXLOOP.updateInfo = function() {
    let d = WGXLOOP.cash2string(WGXLOOP.donations);
    let c = WGXLOOP.cash2string(WGXLOOP.portfolio.cash);
    let s = ' FIB:' + WGXLOOP.portfolio.shares['FIB'];
    //let m = WGXLOOP.cash2string(WGXLOOP.portfolio.margin);
    //let l = WGXLOOP.cash2string(WGXLOOP.portfolio.loans);
    let net = WGXLOOP.cash2string(WGXLOOP.portfolio.netEquity('FIB', WGXLOOP.currentPrice));
    let leaders = WGXLOOP.leaders;
    WGXLOOP.info.text = WGXLOOP.player + '\nGifts:' + d + ' NW:' + net + '\n Cash:' + c + s; // + ' Margin:' + m + ' Loans:' + l;
    WGXLOOP.textLB.text = leaders;
};

WGXLOOP.buy = function() {
    if (WGXLOOP.trades == 0) {
	WGXLOOP.tradesQ = WGXLOOP.q;
	WGXLOOP.trades = 1;
	if (WGXLOOP.q > 100) {
	    WGXLOOP.trades = WGXLOOP.q/100; // series of smaller trades
	    WGXLOOP.tradesQ = 100;
	}
	if (WGXLOOP.portfolio.trade(WGXLOOP.tradesQ, "FIB", WGXLOOP.currentPrice)) {
	    WGXLOOP.socket.emit("trade", {q:WGXLOOP.tradesQ, username:WGXLOOP.player});
	    WGXLOOP.lastTrade = WGXLOOP.tradesQ;
	    WGXLOOP.trades--;
	    WGXLOOP.updateInfo();
	}
	else {
	    WGXLOOP.trades = 0;
	}
    }
};

WGXLOOP.sell = function() {
    if (WGXLOOP.trades == 0) {
	WGXLOOP.tradesQ = -WGXLOOP.q;
	WGXLOOP.trades = 1;
	if (WGXLOOP.q > 100) {
	    WGXLOOP.trades = WGXLOOP.q/100; // series of smaller trades
	    WGXLOOP.tradesQ = -100;
	}
	if (WGXLOOP.portfolio.trade(WGXLOOP.tradesQ, "FIB", WGXLOOP.currentPrice)) {
	    WGXLOOP.socket.emit("trade", {q:WGXLOOP.tradesQ, username:WGXLOOP.player});
	    WGXLOOP.lastTrade = WGXLOOP.tradesQ;
	    WGXLOOP.trades--;
	    WGXLOOP.updateInfo();
	}
	else {
	    WGXLOOP.trades = 0;
	}
    }
};

WGXLOOP.secret = function() {
    if (WGXLOOP.cdata.secretId > 0) {
	WGXLOOP.socket.emit("secret", {id: WGXLOOP.cdata.secretId});
	//console.log('Sent secret ID = ' + WGXLOOP.cdata.secretId);
	WGXLOOP.cdata.secretId = 0;
	$('#btnWish').hide();
	$('#btnOmen').hide();
    }
};

WGXLOOP.donate = function() {
    if (WGXLOOP.nw > 100000) {
	let donation = 10000; // $100.00
	while (WGXLOOP.nw > donation*100) {
	    donation *= 10;
	}
	WGXLOOP.portfolio.cash -= donation;
	WGXLOOP.donations += donation;
	if (WGXLOOP.donations > WGXLOOP.LBV) {
	    WGXLOOP.socket.emit('leader', { value: WGXLOOP.donations, player: WGXLOOP.player });
	}
    }
};

WGXLOOP.drawBackdrop = function() {
    //let buy = new PIXI.Graphics();
    //let sell = new PIXI.Graphics();
    //WGXLOOP.wishButton = new PIXI.Graphics();
    //WGXLOOP.omenButton = new PIXI.Graphics();
    let style = new PIXI.TextStyle({
	fontFamily: "Arial",
	fontSize: 16,
	fill: "white",
	stroke: '#000044',
	strokeThickness: 3,
	dropShadow: true,
	dropShadowColor: "#000000",
	dropShadowBlur: 4,
	dropShadowAngle: Math.PI / 6,
	dropShadowDistance: 6,
    });
    //WGXLOOP.info = new PIXI.Text('$1000',style);
    WGXLOOP.info.position.set(25,10);
    WGXLOOP.textLB.position.set(25,WGXLOOP.sheight - 200);
    
    // Green Buy button
    let h2 = WGXLOOP.sheight >> 1;
    //WGXLOOP.drawButton(buy, WGXLOOP.swidth - 120, h2 - 120, 0x44dd44, "BUY", 30, style);
    // Red Sell button
    //WGXLOOP.drawButton(sell, WGXLOOP.swidth - 120, h2 + 10, 0xdd4444, "SELL", 25, style);
    // Secret buttons
    //WGXLOOP.drawButton(WGXLOOP.wishButton, WGXLOOP.swidth - 120, 20, 0x9999ff, "WISH", 25, style, 50);
    //WGXLOOP.drawButton(WGXLOOP.omenButton, WGXLOOP.swidth - 120, 20, 0xaa6666, "OMEN", 25, style, 50);
    //WGXLOOP.wishButton.visible = false;
    //WGXLOOP.omenButton.visible = false;

    // Click buttons to trade
    //buy.click = WGXLOOP.buy;
    //sell.click = WGXLOOP.sell;
    //WGXLOOP.wishButton.click = WGXLOOP.secret;
    //WGXLOOP.omenButton.click = WGXLOOP.secret;
};

WGXLOOP.login = function(delta) {
    WGXLOOP.info.position.set(25,10);
};

WGXLOOP.initVars = function() {
    WGXLOOP.info.text = 'Enter your name in ChatName box, then click "Play"';
    WGXLOOP.info.x = 10;
    WGXLOOP.info.y = 80;
    WGXLOOP.portfolio.cash = 500000;
    WGXLOOP.portfolio.shares.FIB = 0;
    WGXLOOP.portfolio.margin = 0;
    WGXLOOP.portfolio.loans = 0;
    WGXLOOP.donations = 0;
};

WGXLOOP.start = function() {
    WGXLOOP.line = new PIXI.Graphics(); // stock price
    //WGXLOOP.earnPlot = new PIXI.Graphics();  // earnings plot
    WGXLOOP.earnScroll = new Scroll(WGXLOOP.app.stage, WGXLOOP.swidth + 20, WGXLOOP.sheight >> 1, 20);
    //WGXLOOP.infoBanner = new Banner(WGXLOOP.app.stage, WGXLOOP.sheight - 34, 74, 12, 20);
    WGXLOOP.infoBanner = new Banner(WGXLOOP.app.stage, WGXLOOP.sheight - 34, WGXLOOP.swidth/12, 12, 20);
    WGXLOOP.tradesPlot = new PIXI.Graphics(); // trades plot
    WGXLOOP.buyArrow = new PIXI.Texture.fromImage('../images/buyArrow.png')
    WGXLOOP.sellArrow = new PIXI.Texture.fromImage('../images/sellArrow.png')
    WGXLOOP.buyTriangle = new PIXI.Texture.fromImage('../images/buyTriangle.png')
    WGXLOOP.sellTriangle = new PIXI.Texture.fromImage('../images/sellTriangle.png')
    WGXLOOP.buyTriangle1 = new PIXI.Texture.fromImage('../images/buyTriangle1.png')
    WGXLOOP.sellTriangle1 = new PIXI.Texture.fromImage('../images/sellTriangle1.png')
    let style = new PIXI.TextStyle({
	fontFamily: "Arial",
	fontSize: 16,
	fill: "white",
	stroke: '#000044',
	strokeThickness: 3,
	dropShadow: true,
	dropShadowColor: "#000000",
	dropShadowBlur: 4,
	dropShadowAngle: Math.PI / 6,
	dropShadowDistance: 6,
    });
    let style2 = new PIXI.TextStyle({
	fontFamily: "Arial",
	fontSize: 24,
	fill: "white",
	stroke: '#000044',
	strokeThickness: 3,
	dropShadow: true,
	dropShadowColor: "#000000",
	dropShadowBlur: 4,
	dropShadowAngle: Math.PI / 6,
	dropShadowDistance: 6,
    });
    WGXLOOP.info = new PIXI.Text('Click "Play" to start game',style2);
    WGXLOOP.textLB = new PIXI.Text('Top Givers',style);
    WGXLOOP.portfolio = new Portfolio(2000); // $20
    //WGXLOOP.portfolio = new Portfolio(200000); // $2000
    WGXLOOP.initVars();
    WGXLOOP.drawBackdrop();
    WGXLOOP.app.stage.addChild(WGXLOOP.info);
    WGXLOOP.app.stage.addChild(WGXLOOP.textLB);
    WGXLOOP.app.stage.addChild(WGXLOOP.line);
    //WGXLOOP.app.stage.addChild(WGXLOOP.earnPlot);
    WGXLOOP.app.stage.addChild(WGXLOOP.tradesPlot);
    //WGXLOOP.state = WGXLOOP.login;
    WGXLOOP.gotoLogin();
    WGXLOOP.app.ticker.add(delta => WGXLOOP.state(delta));
};
