// function handler : express
var express = require('express');
var app = express();
// http server made from function handler 'app'
var http = require('http').Server(app);

var fs = require('fs');
// Route handler, sends index.html when root address is hit.
app.use(express.static(__dirname + '/public'));

var sanitizeHtml = require('sanitize-html');
var io = require('socket.io')(http);

const PORTNUMBER = 6060;

// HTTP server, listen for activity on port 3000
http.listen(PORTNUMBER, function(){
	console.log("Public server started, listening on port " + PORTNUMBER);
});

var bulletin;
var bulletinTimeout = setInterval(readBulletin, 100000)

function readBulletin() {
	// open file in UTF16-LE because windows
	var data = "";
	try {
		data = fs.readFileSync("./emails/Bulletin.html", "ucs2")
		l("Bulletin loaded")
	} catch (err) {
		l(err.message)
	}
	
	if(data === "") {
		bulletin = "No Announcements Found.";
		l("Bulletin not found.")
		return
	}

	str = data.toString();
	str = str.substring(str.indexOf("NOTICES:") + 15);
	str = sanitizeHtml(str);
	l("Bulletin sanitized")
	bulletin = str;
}

io.on('connection', onConnect)

function l(string) {
	console.log(new Date().toLocaleString() + " * " + string)
}

function onConnect(socket) {
	l("Connected to client");
	readBulletin();

	socket.emit('bulletin', {html: bulletin});
}