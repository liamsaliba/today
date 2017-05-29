var t1 = setInterval(runEverySecond, 1000);
var t2 = setInterval(runEveryHour, 3600000);

var d = new Date();
var daynum = 6;
var timetable;

// TODO: make this actually function correctly
Date.prototype.getWeek = function() {
    return (this.getYearWeek()) % 2 + 1;
}

Date.prototype.getYearWeek = function() {
	var onejan = new Date(this.getFullYear(), 0, 1);
    return weekInYear = Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7) 
}

Date.prototype.getTerm = function() {
	return Math.ceil(this.getYearWeek()/13);
}

Number.prototype.leadZero = function(){
	if (this < 10)
		return "0" + this;
	return this;
}




function runEverySecond(){
	updateTime();
	getCurrentInfo();
}
function runEveryHour(){
	updateDate();
}

function init() {
	updateDate();
	updateTime();
	unpackJSON();
}

init();


function unpackJSON() {
	$.getJSON('./timetable.json', function(data){
		timetable = data;
		getCurrentInfo(data);
	});
}

function getTodayTime(time) {
	return Date.parse(d.toLocaleDateString() + " " + time);
}

function getCurrentInfo() {
	// gets the current period.
	var timesOfCurrentDay = timetable.days[(daynum-1)%5].times;
	var currentTime = d.getTime();
	var currentPeriod, nextPeriod, afterPeriod;
	currentPeriod = nextPeriod = afterPeriod = "afterSchool";
	var firstrun = true;
	for (var period in timesOfCurrentDay){
		if(nextPeriod !== "afterSchool"){
			afterPeriod = period;
			break;
		}
		else if(currentPeriod !== "afterSchool"){
			nextPeriod = period;
		}
		else if(currentTime < getTodayTime(timesOfCurrentDay[period].endTime)){
			if(currentTime >= getTodayTime(timesOfCurrentDay[period].startTime)){
				currentPeriod = period
			}
			else {
				if(firstrun){
					currentPeriod = "beforeSchool";
					nextPeriod = period;
				} else {
					currentPeriod = period;
				}
			}
		}
		firstrun = false;
	}
	if(currentPeriod.includes("period")) {
		var currentBlock = timetable.timetable[(daynum-1)][currentPeriod];
		var currentSubjects = timetable.blocks[currentBlock].subjects;
		var subjectList = [];
		for (var i = 0; i < 8; i++){
			if(i < currentSubjects.length) {
				subjectList.push(currentSubjects[i].name);
				$(".column-now .box:nth-child(" + (i+2) + ") .subject-title").html(currentSubjects[i].name);
				$(".column-now .box:nth-child(" + (i+2) + ") .subject-abbr").html(currentSubjects[i].abbr);
			} else {
				console.log(i);
			}
		}
		console.log(subjectList)
	} else {

		//TODO show tomorrow's classes
	}
	$("#now > .period").html(timetable.periods[currentPeriod]);
	$("#next > .period").html(timetable.periods[nextPeriod]);

	
}


function updateDate() {
	d = new Date();
	var days = ["sun", "mon", "tues", "wednes", "thurs", "fri", "satur"]
	var day = d.getDay();
	var week = d.getWeek();
	var term = d.getTerm();
	var date = d.getDate();
	var month = d.getMonth();
	if(month === 0)
		month = 12;
	var year = d.getYear()-100;
	daynum = day*week;
	$("#day").html(days[day]);
	$("#week").html(week);
	$("#term").html(term);
	$("#daynum").html(daynum);

	$("#yearF").html(year+2000);
	var months = ["January", "Feburary", "March", "April", "May", "June", "July",
	"August", "September", "October", "November", "December"]
	$("#shortdate").html(" <b>&#8226;</b> " + date.leadZero() + "/" + month.leadZero() + "/" + year);
	$("#date").html(date.leadZero() + " " + months[month] + " " + (year+2000));
}

function updateTime() {
	//d = new Date();
	d = randomDate();
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