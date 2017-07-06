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
var aio = io.of('/admin');

const PORTNUMBER = 6060;

// HTTP server, listen for activity on port
http.listen(PORTNUMBER, function(){
	l("Public server started, listening on port " + PORTNUMBER);
	init();
});


// logging library
function l(string) {
	console.log(new Date().toLocaleString() + " * " + "[" + l.caller.name + "] " + string)
}

function e(string){
	console.error(new Date().toLocaleString() + " ! " + "[" + e.caller.name + "] " + string)
}

function init() {
	loadTimetable();
	pushTimetable();
	pushBulletin();
	l("Server initialised.")
}


// load file using fs (library)
function loadFile(path, encode) {
	var data = "";
	try {
		data = fs.readFileSync(path, encode)
		l("Found " + path)
	} catch (err) {
		throw "Could not find " + path
	}
	return data.toString();
}


var timetable;
const TIMETABLE_PATH = "./resources/timetable.json";
const TIMETABLE_EXAMPLE_PATH = "./resources/timetable.example.json";
function updateTimetable() {
	
}

function loadTimetable() {
	l("Timetable load requested")
	var newTimetable;
	try {
		newTimetable = loadFile(TIMETABLE_PATH, "utf8");
	} catch(err){
		e(err.message);
	}

	if(newTimetable === timetable){
		throw "Timetable has not changed"
	}
	timetable = newTimetable;
	l("Timetable updated.")
}

//sends bulletin to all clients
function pushTimetable() {
	l("Timetable push requested")
	try {
		io.emit("timetable", {timetable});
		l("Timetable pushed");
	} catch (err){
		e(err);
	}
}

var bulletin;
// updates bulletin every hours
var bulletinPushTimeout = setInterval(function() {
	l("Bulletin timer update")
	pushBulletin();
}, 3600000);


const BULLETIN_PATH = "./emails/Bulletin.html";
const BULLETIN_EXAMPLE_PATH = "./emails/Bulletin.example.html";
// gets bulletin html and formats it
function updateBulletin() {
	l("Bulletin update requested")
	var data;
	try {
		data = loadFile(BULLETIN_PATH, "ucs2");
	} catch(err){
		try {
			data = loadFile(BULLETIN_EXAMPLE_PATH, "ucs2");
		} catch (err) {
			throw "Could not get bulletin data (" + err.message + ")";
		}
	}
	data = sanitizeHtml(data);
	l("Bulletin sanitized")
	var newBulletin;
	try {
		newBulletin = formatBulletin(data)
	} catch (err){
		throw "Could not format bulletin data (" + err.message + ")";
	}
	if(newBulletin === bulletin){
		throw "Bulletin has not changed"
	}
	bulletin = newBulletin;
	l("Bulletin updated")
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
	l("Bulletin push requested")
	try {
		updateBulletin();
	} catch (err) {
		e(err.message)
		return;
	}
	try {
		io.emit("bulletin", {bulletin});
		l("bulletin pushed (" + bulletin.date + ")");
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
	motd = {info: info, from: from}
}


io.on('connection', (socket) => {
	l("Connected to client");

	socket.emit('timetable', timetable);
	l("Sent timetable to client")
	socket.emit('bulletin', bulletin);
	l("Sent bulletin to client")
	if(motd !== undefined) {
		socket.emit('motd', motd);
		l("Sent motd to client")
	}
})

io.of('/admin').on('connection', (socket) => {
	l("Connected to admin client");

	socket.on("motd", function(data){
		l("Caught new motd")
		motd = data;
		io.sockets.emit("motd", motd);
		l("Sent motd to clients");
	})
})