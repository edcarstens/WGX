var socket = io();
var messages = [];
var priceHistory = [];
let earn;
var cdata = {};
cdata.price = 0;
cdata.priceReady = false;
cdata.earn = 0;
cdata.earnReady = false;
cdata.trade = 0;
cdata.tradeReady = false;
cdata.secretId = 0;
cdata.secretUp = true;

// Banner
socket.on('banner', function (data) {
    if (data.message) {
	cdata.text = data.message;
	cdata.textReady = true;
    }
});

// Chat
socket.on('message', function (data) {
    let html;
    let i;
    if (data.message) {
	messages.push(data);
	html = '';
	for(i=0; i<messages.length; i++) {
	    html += '<b> ' + (messages[i].username ? messages[i].username : 'Server') + ': </b>';
	    html += messages[i].message + '<br />';
	}
	$('#wgxcontent').html(html);
    }
});

socket.on('xdata', function(data) {
    let html;
    let c;
    let cs;
    if (data.earn) {
	earn = data.earn; // save earnings
	cdata.earn = data.earn;
	cdata.earnReady = true;
    }
    cdata.price = data.price;
    cdata.priceReady = true;
    html = '';
    c = earn%100;
    cs = c.toString()
    if (c < 10) {
	cs = '0' + cs;
    }
    html += '<b>FIB</b> $' + Math.floor(data.price/100) + ' earnings $' + Math.floor(earn/100) + '.' + cs;
    $('#wgxdata').html(html);
    
});

socket.on('trade', function(data) {
    if (data.username != WGXLOOP.player) {
	cdata.trade = data.q;
	cdata.tradeReady = true;
    }
});

socket.on('secret', function(data) {
    cdata.secretId = data.id;
    cdata.secretUp = data.up;
    if (data.up) {
	$('#btnWish').show();
    }
    else {
	$('#btnOmen').show();
    }
});

socket.on('leaders', function(data) {
    let s = 'Top Givers\n';
    //console.log(data);
    WGXLOOP.LBV = data[data.length-1].val;
    for(let i=0; i<data.length; i++) {
	s += data[i].player + ' ' + WGXLOOP.cash2string(data[i].val) + '\n';
    }
    WGXLOOP.leaders = s;
});

$('#btnSend').on('click', sendMessage = function() {
    var text = $("#inputMessage").val();
    var name = $("#inputChatName").val();
    //console.log('text = ', text);
    socket.emit('send', { message: text, username: name });
    if (WGXLOOP.state === WGXLOOP.login) {
	if (text == 'play') {
	    WGXLOOP.player = name;
	    WGXLOOP.updateInfo();
	    WGXLOOP.state = WGXLOOP.play;
	}
	else if (text == 'test') {
	    WGXLOOP.player = name;
	    WGXLOOP.portfolio.cash = 100000;
	    WGXLOOP.updateInfo();
	    WGXLOOP.state = WGXLOOP.play;
	}
	else if (text == 'bot1') {
	    WGXLOOP.player = 'bot1';
	    WGXLOOP.portfolio.cash = 100000;
	    WGXLOOP.updateInfo();
	    WGXLOOP.state = WGXLOOP.play;
	    //console.log('bot1 started');
	}
    }
});

$('#btnDonate').on('click', function() {
    WGXLOOP.donate();
}).hide();

$('#btnBuy').on('click', function() {
    WGXLOOP.buy();
}).hide();

$('#btnSell').on('click', function() {
    WGXLOOP.sell();
}).hide();

$('#btnPlay').on('click', function() {
    var name = $("#inputChatName").val();
    $("#inputChatName").hide();
    WGXLOOP.player = name;
    WGXLOOP.updateInfo();
    WGXLOOP.state = WGXLOOP.play;
    $('#btnPlay').hide();
    $('#btnBuy').show();
    $('#btnSell').show();
    $('#btnDonate').show();
    $('#btnOmen').hide();
    $('#btnWish').hide();
});

$('#btnOmen').on('click', function() {
    WGXLOOP.secret();
}).hide();
$('#btnWish').on('click', function() {
    WGXLOOP.secret();
}).hide();

//Create a Pixi Application
let width = 780;
let height = 440;
let pixiApp = new PIXI.Application({width: width, height: height});

//Add the canvas that Pixi automatically created for you to the HTML document
//document.body.appendChild(pixiApp.view);
//$('#wgxgfx').appendChild(pixiApp.view);
let gfx = document.getElementById('wgxgfx');
//console.log(gfx);
gfx.appendChild(pixiApp.view);
WGXLOOP.init(pixiApp, width, height, priceHistory, socket, cdata);
WGXLOOP.start();
//console.log('loaded wgx_client.js');
