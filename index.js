// function handler : express
var express = require('express');
var app = express();
// http server made from function handler 'app'
var http = require('http').Server(app);

var fs = require('fs');
// Route handler, sends index.html when root address is hit.
app.use(express.static(__dirname + '/public'));

const PORTNUMBER = 6060;

// HTTP server, listen for activity on port 3000
http.listen(PORTNUMBER, function(){
	console.log("Public server started, listening on port " + PORTNUMBER);
});


// words for username generation
//var words;
//fs.readFile(__dirname + "/public/timetable.json", function(err, data) {
//    if(err) throw err;
//    words = data.toString().split("\n");
//});