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


// logging library
function l(string) {
	console.log(new Date().toLocaleString() + " * " + string)
}

function e(string){
	console.error(new Date().toLocaleString() + " ! " + string)
}



const BULLETIN_PATH = "./emails/Bulletin.html";
var bulletin;
// updates bulletin every hours
var bulletinPushTimeout = setInterval(function() {
	l("Bulletin timer update")
	pushBulletin();
}, 3600000);
// updates bulletin on startup
init();
function init() {
	pushBulletin();
	l("Server initialised.")
}
// gets bulletin html and formats it
function updateBulletin() {
	l("Bulletin update requested")
	var data;
	try {
		data = getBulletinData();
	} catch (err){
		throw "Could not get bulletin data (" + err.message + ")";
	}
	var newBulletin;
	try {
		newBulletin = formatBulletin(data)
	} catch (err){
		throw "Could not format bulletin data (" + err.message + ")";
	}
	if(newBulletin === bulletin){
		throw "Bulletin has not changed"
	}
	bulletin = newBulletin
}
// get bulletin html from file and sanitise it
function getBulletinData() {
	// open file in UTF16-LE (ucs2) because windows
	var data = "";
	try {
		data = fs.readFileSync(BULLETIN_PATH, "ucs2")
		l("Found bulletin at " + BULLETIN_PATH)
	} catch (err) {
		throw err;
	}
	str = data.toString();
	str = sanitizeHtml(str);
	l("Bulletin sanitized")
	return str;
}
// returns bulletin object
function formatBulletin(str){
	var date = str.substring(str.indexOf("Plenty Campus – Student Daily Bulletin –") + 42, 
		str.indexOf("CALENDAR ITEMS:")-57);
	var announcements = str.substring(str.indexOf("NOTICES:") + 25);
	var table = str.substring(str.indexOf("<table>"), str.indexOf("</table>")+8);
	l("Bulletin formatted")
	return {date: date, announcements: announcements, table: table};
}
//sends bulletin to all clients
function pushBulletin() {
	try {
		updateBulletin();
	} catch (err) {
		e(err.message)
		return;
	}
	try {
		io.emit("bulletin", {bulletin});
		l("Bulletin pushed (" + bulletin.date + ")");
	} catch (err){
		e(err);
	}
}


// handle console input
var stdin = process.openStdin();

stdin.addListener("data", function(d) {
	str = d.toString().trim();
	l("caught console input [" + str + "]");
	pushMotd(str, "console")
});

var motd;
function pushMotd(info, from){
	try {
		io.emit("motd", {info: info, from: from});
		l("MOTD pushed: " + info + " - " + from);
	} catch (err){
		e(err)
	}
}




io.on('connection', onConnect)

function onConnect(socket) {
	l("Connected to client");

	socket.emit('bulletin', bulletin);
	socket.emit('motd', motd);
}