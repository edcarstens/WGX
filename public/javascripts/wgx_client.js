var socket = io();
var messages = [];
var priceHistory = [];
let earn;
var cdata = {};
cdata.price = 0;
cdata.priceReady = false;
cdata.earn = 0;
cdata.earnCount = 0;
cdata.earnDelta = 0;
cdata.earnReady = false;
cdata.trade = 0;
cdata.tradeReady = false;
cdata.secretId = 0;
cdata.secretUp = true;
cdata.secretTime = 10;

// Hide the address bar on iphone safari
window.addEventListener("load", function() {
    setTimeout(function() {
	window.scrollTo(0,0);
    }, 0);
});

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
	cdata.earnCount = data.earnCount;
	cdata.earnDelta = data.earnDelta;
	cdata.earnReady = true;
    }
    cdata.price = data.price;
    cdata.priceReady = true;
    c = earn%100;
    cs = c.toString()
    if (c < 10) {
	cs = '0' + cs;
    }
    html = '<b><i>WGX</i> FIB</b> $' + Math.floor(data.price/100);
    $('#wgxdata1').html(html);
    html = '<b>Earnings:</b> $' + Math.floor(earn/100) + '.' + cs;
    $('#wgxdata2').html(html);    
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
    cdata.secretTime = 10;
    if (data.up) {
	$('#btnWish').show();
    }
    else {
	$('#btnOmen').show();
    }
});

socket.on('secretTimer', function(data) {
    cdata.secretTime = data.t;
    if (cdata.secretUp) {
	if (data.t == 0) {
	    $('#btnWish').hide();
	}
	else {
	    $('#btnWish').html('<b>WISH</b><br>' + data.t);
	}
    }
    else {
	if (data.t == 0) {
	    $('#btnOmen').hide();
	}
	else {
	    $('#btnOmen').html('<b>OMEN</b><br>' + data.t);
	}
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
    if (text == 'bot1') {
	WGXLOOP.player = 'bot1';
	WGXLOOP.portfolio.cash = 100000;
	WGXLOOP.updateInfo();
	WGXLOOP.state = WGXLOOP.play;
	//console.log('bot1 started');
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
    $('#wgxgfx').show();
});

$('#btnOmen').on('click', function() {
    WGXLOOP.secret();
}).hide();
$('#btnWish').on('click', function() {
    WGXLOOP.secret();
}).hide();

//Create a Pixi Application
let width;
let height;
width = $('#wgxtop').width();
height = $('#wgxtop').height();
console.log('width=' + width + ' height=' + height)
let dwidth = $(window).width();
let dheight = $(window).height();
width = dwidth;
height = dheight;

console.log('width=' + width + ' height=' + height)
$('#debug').html('<h2>width=' + width + ' height=' + height)
//if (width < 900) {
//    width = width*2;
//    height =height*2;
//}
//width = 1000;
//height = 720;
$('#wgxtop').width(width);
$('#wgxtop').height(height);
$('#inputChatName').css("left", width/2 - 200);
$('#inputChatName').css("top", height/2 - 50);
$('#btnPlay').css("left", width/2 - 45);
$('#btnPlay').css("top", height/2 - 50 + 70);
width = width - 150;
height = height - 150;
$('#inputMessage').width(width);
let pixiApp = new PIXI.Application({width: width, height: height});
//$('#inputMessage').width = width;
//Add the canvas that Pixi automatically created for you to the HTML document
//document.body.appendChild(pixiApp.view);
//$('#wgxgfx').appendChild(pixiApp.view);
let gfx = document.getElementById('wgxgfx');
//let gfx = $('wgxgfx');
//console.log(gfx);
gfx.appendChild(pixiApp.view);
WGXLOOP.init(pixiApp, width, height, priceHistory, socket, cdata);
WGXLOOP.start();
//console.log('loaded wgx_client.js');
