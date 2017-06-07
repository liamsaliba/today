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
fs.readFile("./emails/Bulletin-20170605.html", function read(err, data){
	if(err) throw err;
	
	// for whatever reason, the buffer has a space in every second character.
	str = data.toString().split("");
	for(var i = 1; i < str.length-1; i+=2){
		str[i] = ""
		
	}
	string = str.join("");
	string = string.substring(string.indexOf("NOTICES:") + 15);
	bulletin = sanitizeHtml(string);
})

io.on('connection', function(socket){
	console.log("connected to client");
	socket.emit('bulletin', {html: bulletin});
})
/*
function getTimestamp() {
	var d = new Date();
	return (d.getYear()+1900).toString() + 
}*/