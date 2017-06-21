var ts = setInterval(runEverySecond, 1000);
var th = setInterval(runEveryHour, 3600000);
var td = setInterval(runEveryDay, 86400000);

var d = new Date();
var days = ["Sun", "Mon", "Tues", "Wednes", "Thurs", "Fri", "Satur"];
var months = ["January", "Feburary", "March", "April", "May", "June", "July",
	"August", "September", "October", "November", "December"];
var dayNumber;
var timetable;
var bulletin;
var enhancements;

// Button variables
var DEBUG_RND = false;
var DEBUG_FRZ = false;
var DEBUG_TICK = false;
var DEBUG_COL = true;

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

Date.prototype.minutesUntil = function() {
	return Math.ceil((this.getTime() - d.getTime()) / 1000 / 60)
}

//TODO: implement assemblies/chapels/talks/events into calendar
//TODO: add admin interface with switchable timetables (duplicate timetable "temporary" object)

Number.prototype.leadZero = function(){
	if (this < 10)
		return "0" + this;
	return this;
}

jQuery.fn.extend({
	// animation even when text is not changed
	ahtml: function(text) {
		this.slideUp(100, function(){
			$(this).html(text).slideDown(100);
		});
		return this;
	}, // animation when text is changed
	bhtml: function(text) {
		if(text != $(this).html()){
			//console.log(text + " + " + $(this).html())
			$(this).ahtml(text);
		}
	}, // sets assigned bg color, removing previous colour, with animation
	applyColor: function(color, type) {
		if(color === undefined) color = "default";
		else color = "block" + color;
		const colorClass = "bg-" + color + "-" + type;
		if(!$(this).hasClass(colorClass)){
			$(this).removeClass (function (index, className) {
			    return (className.match (/(^|\s)bg-\S+/g) || []).join(' ');
			}).addClass(colorClass);
		}
	}
})


function runEverySecond(){
	updateTime();
	getCurrentInfo();
}
function runEveryHour(){
	updateDate();
	updateEnhancements();
}

function runEveryDay(){
	window.reload();
}

function init() {
	loadTimetable();
	updateDate();
	updateTime();
	loadButtons();
	loadComplete();
}

$(document).ready(function() { init(); })



// Time/date picker for debug
flatpickr('#flatpickr', {
	enableTime: true
});

$("#flatpickr").change(function() {
	d = new Date(Date.parse($(this).val()));
	runEveryHour();
	runEverySecond();
	updateBulletin();
});

/// DEBUG BUTTONS
// click -> set boolean, set button state
$(".btn-toggle").click(function() {
	var bool = $(this).attr('name');
	window[bool] = !window[bool];
	setBtnState(this, window[bool]);
})

// set button state for all toggleable buttons
function loadButtons() {
	$(".btn-toggle").each(function() {
		var bool = $(this).attr('name');
		setBtnState(this, window[bool]);
	})
}

// show button state for its variable
function setBtnState(button, bool){
	$(button).removeClass("bg-"+!bool).addClass("bg-"+bool);
}





/// Loads master timetable json into variable
function loadTimetable() {
	$.getJSON('./timetable.json', function(data){
		timetable = data;
		getCurrentInfo(data);
		updateDate();
		updateEnhancements();
	});
}

/// fades out loading screen
function loadComplete() {
	setTimeout(function(){
		$("#loading").fadeOut();
	}, 400);
}




function parseTime(time) {
	var returnedDate = new Date(d.toDateString() + " " + time);
	if(returnedDate.toString() == "Invalid Date")
		console.error("(" + d.toDateString() + " " + time + ") is invalid! Please investigate!");
	return returnedDate;
}

function getPeriods(periodTimes, currentTime) {
	var currentPeriod, nextPeriod;
	currentPeriod = nextPeriod = "afterSchool";
	var beforeSchool = true;
	for (var period in periodTimes){
		if(currentPeriod !== "afterSchool"){
			nextPeriod = period;
			break;
		}
		else if(currentTime < parseTime(periodTimes[period].endTime)){
			if(currentTime >= parseTime(periodTimes[period].startTime)){
				currentPeriod = period
			}
			else {
				if(beforeSchool){
					currentPeriod = "beforeSchool";
					nextPeriod = period;
				} else {
					currentPeriod = period;
				}
			}
		}
		beforeSchool = false;
	}

	return [currentPeriod, nextPeriod];
}

function timeLeftOfSchool(){
	var lastDay;
	var keyDates = timetable.years[d.getYear()+1900];
	for (var term in keyDates.school){
		if(keyDates.school[term].name === "Term 4")
			lastDay = new Date(keyDates.school[term].endDate + " 15:30");
	}
	var m = lastDay.minutesUntil();
	if (m > 0) {
		var string = "";
		var timeTill = [[Math.floor(m/7/24/60), "week"], [Math.floor(m/24/60)%7, "day"],
		[Math.floor(m/60)%(24), "hour"], [m%60, "min"]];

		for(var i = 0; i < timeTill.length; i++){
			if(timeTill[i][0] !== 0){
				string += timeTill[i][0] + " " + timeTill[i][1];
				if(timeTill[i][0] == 1)
					string += " ";
				else ///pluralisation
					string += "s ";
			}
		}
		$("#school-left").bhtml(string + "left of year 12!");
	}
	else 
		$("#school-left").bhtml("End of 2017!")
}


function getNextDay() {
	if(dayNumber === 0){
		if(d.getWeek() === 1){ //TODO: fix this (never is 1)
			return 1;
		} else {
			return 6;
		}
	}
	if(dayNumber === 10)
		return 1;
	return dayNumber + 1;
}

function showNext() {

}

function getCurrentInfo() {
	timeLeftOfSchool()

	var periodTimes = timetable.days[d.getDay()].times;
	var currentTime = d.getTime()
	var periods = getPeriods(periodTimes, currentTime);
	var currentPeriod = periods[0];
	var nextPeriod = periods[1];

	//Time-till indicator
	if(currentPeriod === "afterSchool"){
		$(".column-now .time-till").slideUp();
		// TODO: Show what's upcoming
		if(nextPeriod === "afterSchool"){
			showNext();
			$(".column-next").slideUp();
		} else {
			$(".column-next").slideDown();
		}
	}
	else {
		if(currentPeriod === "beforeSchool"){
			$(".column-now .time-till").bhtml(parseTime(periodTimes[nextPeriod].startTime).minutesUntil() + '<span class="tiny">m until school</span>');
		} else {
			if(currentPeriod.includes("period") && currentTime < parseTime(periodTimes[currentPeriod].startTime)){
				$(".column-now .time-till").bhtml(parseTime(periodTimes[currentPeriod].startTime).minutesUntil() + '<span class="tiny">m to class</span>');
			} else {
				$(".column-now .time-till").bhtml(parseTime(periodTimes[currentPeriod].endTime).minutesUntil() + '<span class="tiny">m left</span>');
			}
		}
		$(".column-next").slideDown();
	}

	updateColumn(currentPeriod, dayNumber,".column-now");
	updateColumn(nextPeriod, dayNumber, ".column-next");

}

function isToday(date){
	return new Date(d).setHours(0,0,0,0) === date.setHours(0,0,0,0)
}

function updateEnhancements() {
	var enhancementObj = timetable.years[d.getYear()+1900].enhancement;
	enhancements = [];
	for(var event in enhancementObj) {
		if(isToday(new Date(enhancementObj[event].date))){
			enhancements.push(enhancementObj[event]);
		}
	}
}

function updateColumn(period, daynum, column) {
	// Period indicator
	$(column + " .period").bhtml(timetable.periods[period]);
	var block = undefined;
	if(period.includes("period")) {
		block = timetable.timetable[daynum-1][period];
		var blockBadge = $(column + " .block");

		var subjects = timetable.blocks[block].subjects;

		// Block indicator
		if(block !== 0) {
			blockBadge.bhtml('<span class="tiny">Block</span> ' + block);
			blockBadge.applyColor(block, "badge");
		} else {
			blockBadge.slideUp();
		}

		for (var i = 0; i < 8; i++){
			var box = $(column + " .box:nth-child(" + (i+2) + ")");
			if(i < subjects.length) {
				// Private Study short block
				if(subjects[i].small === true){
					// Need to check, otherwise animation will play every tick
					if(!box.hasClass("box-short")){
						box.addClass("box-short").slideUp();
					}
				} else {
					if(box.hasClass("box-short")){
						box.removeClass("box-short").slideDown();
					}
					// regular subjects
					box.find(".subject-room").html(subjects[i].room);
					var teacher = subjects[i].teacher;
					if(teacher === "" || teacher === "TEACHERNAME")
						box.find(".subject-teacher").html(subjects[i].teacherabbr);
					else
						box.find(".subject-teacher").html(subjects[i].teacher);
				}
				box.find(".subject-title").html(subjects[i].name);
				box.find(".subject-abbr").html(subjects[i].abbr);

				box.slideDown();
			} else {
				// No subject in this box
				box.slideUp();
			}
		}
	} else {
		// No subjects, so no blocks or boxes needed
		$(column + " .block").slideUp();
		$(column + " .box:not(:first)").slideUp();

		// Handle information box when there is no class
		var box = $(column + " .box:nth-child(2)")

		if(!box.hasClass("box-short")){
			box.addClass("box-short").slideUp();
		}
		box.find(".subject-title").html(timetable.periods[period]);
		box.find(".subject-abbr").html("");
		box.slideDown();
	}

	if(DEBUG_COL) {
		var type = column.includes("now") ? "now" : "next";
		$(column + " .box").applyColor(block, type);
	}

	// period time indicators
	if(period.includes("School")){
		$(column + " .start-time").fadeOut();
		$(column + " .end-time").fadeOut();
	} else {
		$(column + " .start-time").bhtml(timetable.days[(daynum-1)%5+1].times[period].startTime);
		$(column + " .end-time").bhtml(timetable.days[(daynum-1)%5+1].times[period].endTime);
	}
}

function getTerm() {
	var keyDates = timetable.years[d.getYear()+1900];
	var currentTime = d.getTime();

	for(var i = 0; i < 2; i++){
		var condition = (i === 0) ? "school" : "holidays";
		for(var epoch in keyDates[condition]){
			var startDate = new Date(keyDates[condition][epoch].startDate + " 00:00");
			var endDate = new Date(keyDates[condition][epoch].endDate + " 23:59");
			if(currentTime >= startDate && currentTime <= endDate) {
				return keyDates[condition][epoch];
			}
		}
	}
	return undefined;
}

function isHoliday(term){
	if(term.toLowerCase().includes("term") || term.toLowerCase().includes("ECP"))
		return false;
	return true;
}

function updateDate() {
	var date = d.getDate();
	var month = d.getMonth();
	if(month === 0)
		month = 12;
	var year = d.getYear()-100;
	var day = d.getDay();
	var week, week2, term;
	if(timetable === undefined) {
		week = d.getYearWeek();
		week2 = d.getWeek();
		term = "term " + d.getTerm();
	} else {
		var termObj = getTerm();
		term = termObj.name;

		if(!isHoliday(term)){
			week = d.getYearWeek() - new Date(termObj.startDate).getYearWeek() + 1;
			week2 = (week-1)%2+1;
			$("#term-info").show();
		} else { // on holiday
			$("#term-info").hide();
			dayNumber = 0;
		}
	}
	
	//weekends
	if(day == 6 || day == 0){
		dayNumber = 0;
	}
	else {
		dayNumber = day + (week2-1)*5;
	}

	//$("#date").bhtml(date.leadZero() + " " + months[month] + " " + (year+2000))
	$("#day").bhtml(days[day]);
	$("#week").bhtml(week2 + " <small>(" + week + ")</small>");
	$("#term").bhtml(term);
	$("#daynum").bhtml(dayNumber);

	$("#yearF").html(year+2000);
	
	$("#shortdate").bhtml(date.leadZero() + "/" + month.leadZero() + "/" + year);
}

function updateTime() {
	getDate();
	var hours = d.getHours();
	var minutes = d.getMinutes();
	var seconds = d.getSeconds();
	var meridian = "am"; 

	if(hours > 11){
		meridian = "pm";
		hours = hours%12;
	}
	if(hours === 0){hours = 12;}

	$("#hour").bhtml(" " + hours);
	$("#min").bhtml(minutes.leadZero());
	$("#sec").bhtml(seconds.leadZero());
	$("#meridian").bhtml(meridian);
}

// Date function with debugging features
function getDate(){
	// Freezes time
	if(DEBUG_FRZ){

	} // randomise date
	else if(DEBUG_RND){
		d = randomDate();
	} // continue ticking from previous date
	else if(DEBUG_TICK){
		d = new Date(d.getTime() + 1000);
	} // new date (default)
	else{
		d = new Date();
	};
}

function randomDate(){
   var startDate = new Date(2017,0,1,8,0,0,0).getTime();
   var endDate =  new Date(2017,0,1,17,0,0,0).getTime();
   var spaces = (endDate - startDate);
   var timestamp = Math.round(Math.random() * spaces);
   timestamp += startDate;
   return new Date(timestamp);
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


var socket = io();

socket.on('bulletin', function(data){
	bulletin = data;
	updateBulletin();
})

function updateBulletin() {
	table = bulletin.table;
	announcements = bulletin.announcements;
	date = bulletin.date;
	day = date.substring(0, date.indexOf("day"));

	if(day === days[d.getDay()]){
		$("#today").html("TODAY");
	} else if (day === days[d.getDay()+1]){
		$("#today").html("TOMORROW");
	} else if (day === days[d.getDay()-1]){
		$("#today").html("Yesterday");
	} else {
		$("#today").html(day + "day");
	}
	date = date.substring(date.indexOf("day")+3)
	$("#bulletin-date").html(date);

	$("#temp-table").html(table);
	var tablerow = $("#temp-table > table > tbody > tr");
	var tabletext = "";
	tablerow.each(function() {
		campus = $(this).find("td:nth-child(3) p").html().replace(/\s\s+/g, ' ');
		if(campus !== "C-PPrim"){
			startTime = $(this).find("td:nth-child(1) p").html().replace(/\s\s+/g, ' ');
			endTime = $(this).find("td:nth-child(2) p").html().replace(/\s\s+/g, ' ');
			event = $(this).find("td:nth-child(4) a").html().replace(/\s\s+/g, ' ');
			venue = $(this).find("td:nth-child(5) p").html().replace(/\s\s+/g, ' ');
			venue = venue.substring(venue.indexOf("]") + 3);
			tabletext += "<li><span class='bulletin-event'>" + event + "</span> at <span class='bulletin-venue'>" + venue + "</span><span class='bulletin-time'>" + startTime + " - " + endTime + "</span></li>";
		}
	});
	$("#events .scroller").html(tabletext);
	$("#announcements .scroller").html("<p></p>" + announcements);

	// ensure that if the scroller is short enough, there's no need to scroll it
	var duration;
	if($("#events .scroller").height() > $("#events").height()){
		duration = (.08*$("#events .scroller").height() + "s");
	} else
		duration = 9999999999999;
	$("#events .marquee div").css("animation-duration", duration)

	if($("#announcements .scroller").height() > $("#announcements").height())
		duration = (.08*$("#announcements .scroller").height() + "s");
	else 
		duration = 9999999999999;
	$("#announcements .marquee div").css("animation-duration", duration)
}

