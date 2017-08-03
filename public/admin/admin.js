var ts, th, td;

const socket = io.connect("/");
const adminSocket = io.connect("/admin");

var d = new Date();
const days = ["Sun", "Mon", "Tues", "Wednes", "Thurs", "Fri", "Satur"];
const months = ["January", "Feburary", "March", "April", "May", "June", "July",
	"August", "September", "October", "November", "December"];
var dayNumber;
var term;
var lastDayOfSchool;
var timetable;
var bulletin;
var enhancements;
var activities;
var motd;

// Button variables
var timeFreeze = false;
var timeTick = false;
var timeReset = false;

Date.prototype.getWeek = function() {
	var onejan = new Date(this.getFullYear(), 0, 1); // January 1st
    return weekInYear = Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7) 
}
Date.prototype.secondsTill = function(date) {
	return Math.ceil((date.getTime() - this.getTime()) / 1000);
}
Date.prototype.minutesTill = function(date) {
	return Math.ceil((date.getTime() - this.getTime()) / 1000 / 60);
}
Date.prototype.daysTill = function(date) {
	return Math.ceil((date.getTime() - this.getTime()) / 1000 / 60 / 60 / 24);
}

Date.prototype.timeTill = function(date) {
	var secondsLeft = this.secondsTill(date);
	if(secondsLeft <= 0) return 0;
	var returnedString = "";
	var timeTill = [[Math.floor(secondsLeft/7/24/60/60), "week"], 
		[Math.floor(secondsLeft/24/60/60)%7, "day"],
		[Math.floor(secondsLeft/60/60)%24, "hour"], 
		[Math.floor(secondsLeft/60%60), "min"], 
		[Math.floor(secondsLeft%60), "sec"]];

	for(var i in timeTill){
		if(timeTill[i][0] !== 0){
			returnedString += timeTill[i][0] + " " + timeTill[i][1];
			if(timeTill[i][0].needsPlural())
				returnedString += "s";
			returnedString += " ";
		}
	}
	return returnedString.trim();
}

Date.prototype.isToday = function(date) {
	return new Date(this.getTime()).setHours(0,0,0,0) === new Date(date.getTime()).setHours(0,0,0,0);
}
// was parseTime
Date.prototype.timeOf = function(time){
	return new Date(this.toDateString() + " " + time);
}

Date.prototype.addNDays = function(n) {
	return new Date(new Date(this.getTime() + 86400000 * n).setHours(0,0,0,0))
}
Date.prototype.formatDay = function(compare) {
	if(compare.isToday(this)) return "today";
	if(compare.addNDays(1).isToday(this)) return "yesterday";
	if(compare.addNDays(-1).isToday(this)) return "tomorrow";
	else return days[compare.getDay()] + "day"
}

Number.prototype.leadZero = function(){
	if (this < 10)
		return "0" + this;
	return this;
}

Number.prototype.needsPlural = function() {
	return !(this == 1);
}

function getCycleDayNumber(){
	return (dayNumber-1)%5+1;
}

function runEverySecond(){
	updateTime();
}
function runEveryHour(){
	updateDate();
}

function runEveryDay(){
	window.reload();
}

function init() {
	ts = setInterval(runEverySecond, 1000);
	th = setInterval(runEveryHour, 3600000);
	td = setInterval(runEveryDay, 86400000);
	resetButtons();
}

$(document).ready(function() { init(); })

// Time/date picker for debug
var fp = flatpickr('#flatpickr', {
	enableTime: true
});

$("#flatpickr").change(function() {
	d = new Date(Date.parse($(this).val()));
	setState(this, true)
	timeTick = true;
	adminSocket.emit("time-set", d);


	runEveryHour();
	runEverySecond();
});

/// DEBUG BUTTONS
// click -> set boolean, set button state
$(".btn-toggle").click(function() {
	var bool = $(this).attr('name');
	window[bool] = !window[bool];
	setState(this, window[bool]);
})

function resetButtons() {
	// set button state for all toggleable buttons
	$("#debug-buttons .btn-toggle, #debug-buttons input").each(function() 	{
		var bool = $(this).attr('name');
		setState(this, window[bool]);
	});
	setState($("#motd-submit"),false);
}

// show button state for its variable
function setState(button, bool){
	$(button).removeClass("bg-"+!bool).addClass("bg-"+bool);
}





/// Loads master timetable json into variable
function loadTimetable(data) {
	timetable = JSON.parse(data);
	updateDate();
	updateTime();
}

/// fades out loading screen
function loadComplete() {
	setTimeout(function(){
		$("#loading-container").fadeOut();
	}, 400);
}


const conditions = ["special", "school", "holidays"]
function getTerm(date) {
	var keyDates = timetable.years[date.getYear()+1900];
	var currentTime = date.getTime();

	for(var i = 0; i < conditions.length; i++){
		for(var epoch in keyDates[conditions[i]]){
			var startDate = new Date(keyDates[conditions[i]][epoch].startDate + " 00:00");
			var endDate = new Date(keyDates[conditions[i]][epoch].endDate + " 23:59");
			if(currentTime >= startDate && currentTime <= endDate) {
				return keyDates[conditions[i]][epoch];
			}
		}
	}
	return undefined;
}

function updateDate() {
	if(timetable === undefined) {
		console.error("could not find timetable")
		return;
	}
	var date = d.getDate();
	var month = d.getMonth();
	if(month === 0)
		month = 12;
	var year = d.getYear()+1900;
	var day = d.getDay();
	var week, week2;
	term = getTerm(d);

	$("#day").html(days[day]);
	$("#shortdate").html(date.leadZero() + "/" + month.leadZero() + "/" + year);
	$("#yearF").html(year);
	$("#term").html(term.name);

	if(term.break){ // on holiday
		$("#term-info").hide();
		var termResume = new Date(term.endDate).addNDays(1);
		$("#resume-date").html(days[termResume.getDay()] + "day " + termResume.getDate() + " " + months[termResume.getMonth()] + " " + termResume.getFullYear());
		$("#resume-left").html(d.daysTill(termResume) + " days left of the holidays");
		dayNumber = 0;
		return;
	}
	$("#term-info").show();
	week = d.getWeek() - new Date(term.startDate).getWeek() + 1;
	week2 = (week-1)%2+1;
	dayNumber = (day == 6 || day == 0) ? 0 : day + (week2-1)*5; //weekends

	$("#week").html(week2 + " <small>(" + week + ")</small>");
	$("#daynum").html(dayNumber);
}

function updateTime() {
	d = getCurrentDate();
	var hours = d.getHours();
	var minutes = d.getMinutes();
	var seconds = d.getSeconds();
	var meridian = "am"; 

	if(hours > 11){
		meridian = "pm";
		hours = hours%12;
	}
	if(hours === 0){hours = 12;}

	$("#hour").html(" " + hours);
	$("#min").html(minutes.leadZero());
	$("#sec").html(seconds.leadZero());
	$("#meridian").html(meridian);
}

// Date function with debugging features
function getCurrentDate(){
	if(timeReset) {
		adminSocket.emit("time-set", "reset")
		timeReset = false;
		timeTick = false;
		resetButtons();
	}	
	// Freezes time
	if(timeFreeze){
		adminSocket.emit("time-set", "freeze")
		return
	} // continue ticking from previous date
	else if(timeTick){
		var tempDate = new Date(d.getTime() + 1000);
		fp.setDate(tempDate);
		return tempDate;
	} // new date (default)
	else{
		return new Date();
	};
}




socket.on('timetable', function(data) {
	loadTimetable(data)
});

socket.on('motd', function(data){
	if(data === null){
		$("#rotator").fadeOut();
		return;
	}
	$("#rotator").fadeIn();
	$("#motd p").html(data.info);
	$("#motd cite").html("— " + data.from);
	if(motd !== data)
		setState($("#motd-submit"),false);
	else motd = data;
})

$('#motd-input').submit(function(){
	motd = $('#motd-input form').serializeArray().reduce(function(obj, item) {
	    obj[item.name] = item.value;
	    return obj;
	}, {});
	if (motd.info === "")
		motd = null;
	adminSocket.emit("motd", motd);
	setState($("#motd-submit"),true);
	return false;
});