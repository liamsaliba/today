var t1 = setInterval(runEverySecond, 1000);
var t2 = setInterval(runEveryHour, 3600000);

function runEverySecond(){
	updateTime();
}

function runEveryHour(){
	updateDate();
}

Date.prototype.getWeek = function() {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

Number.prototype.leadZero = function(){
	if (this < 10)
		return "0" + this;
	return this;
}

updateDate();
updateTime();

function updateDate() {
	var d = new Date();
	var days = ["sun", "mon", "tues", "wednes", "thurs", "fri", "satur"]
	var day = d.getDay();
	var week = d.getWeek();
	var term = Math.ceil(week/13);
	var date = d.getDate();
	var month = d.getMonth();
	if(month === 0)
		month = 12;
	var year = d.getYear()-100;

	$("#day").html(days[day]);
	// TODO: make this actually function correctly
	$("#week").html(week);
	$("#term").html(term);

/*	var months = ["january", "feburary", "march", "april", "may", "june", "july",
	"august", "september", "october", "november", "december"]
	$("#date").html(d.getDate());
	$("#month").html(months[d.getMonth()]);
*/
	$("#date").html(date.leadZero());
	$("#month").html(month.leadZero());
	$("#year").html(year.leadZero());
}

function updateTime() {
	var d = new Date();
	//var d = randomDate();
	var hours = d.getHours();
	var minutes = d.getMinutes();
	var seconds = d.getSeconds();
	var meridian = "am";

	if(hours > 11){
		meridian = "pm";
		hours = hours%12;
	}
	if(hours === 0){hours = 12;}

	$("#time").html(hours + ":" + minutes.leadZero() + "<small>:" + seconds.leadZero() + "</small><b>" + meridian + "</b>");
}



function randomDate(){
   var startDate = new Date(2015,0,1).getTime();
   var endDate =  new Date(2017,0,1).getTime();
   var spaces = (endDate - startDate);
   var timestamp = Math.round(Math.random() * spaces);
   timestamp += startDate;
   return new Date(timestamp);
}





// TODO: Migrate to node.js express server,
// allow this kind of content to be served by the webserver.
function getQuote(){
	console.log(importJSON("quotes.txt"));
}

// read file helper function
// https://stackoverflow.com/questions/14446447/javascript-read-local-text-file
function importJSON(filename){
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {
	        return JSON.parse(this.responseText);
	    }
	};
	xmlhttp.open("GET", filename, true);
	xmlhttp.send();
}