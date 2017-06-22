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
	l("Public server started, listening on port " + PORTNUMBER);
});

var bulletin = "";
const BULLETIN_PATH = "./emails/Bulletin.html";
function getBulletin() {
	// open file in UTF16-LE because windows
	var data = "";
	try {
		data = fs.readFileSync(BULLETIN_PATH, "ucs2")
		l("Found bulletin at " + BULLETIN_PATH)
	} catch (err) {
		l(err.message)
	}
	
	if(data === "") {
		l("Bulletin not found.")
		return;
	}

	str = data.toString();
	str = sanitizeHtml(str);
	l("Bulletin sanitized")
	return str;
}

io.on('connection', onConnect)

function l(string) {
	console.log(new Date().toLocaleString() + " * " + string)
}

function onConnect(socket) {
	l("Connected to client");

	updateBulletin(socket);
	var bulletinTimeout = setInterval(function() {
		updateBulletin(socket)
	}, 3600000)
}

function updateBulletin(socket) {
	l("Bulletin update requested");
	str = getBulletin();
	l("Bulletin mismatch!")
	date = str.substring(str.indexOf("Plenty Campus – Student Daily Bulletin –") + 42, 
		str.indexOf("CALENDAR ITEMS:")-57);
	l("Bulletin changed for date " + date);
	announcements = str.substring(str.indexOf("NOTICES:") + 25);
	table = str.substring(str.indexOf("<table>"), str.indexOf("</table>")+8);
	try{
		socket.emit('bulletin', {date: date, announcements: announcements,
		table: table});
	} catch(err){
		console.log(err);
	}
	bulletin = str;
}