var ts = setInterval(runEverySecond, 1000);
var th = setInterval(runEveryHour, 3600000);
var td = setInterval(runEveryDay, 86400000);

var d = new Date();
var days = ["Sun", "Mon", "Tues", "Wednes", "Thurs", "Fri", "Satur"];
var months = ["January", "Feburary", "March", "April", "May", "June", "July",
	"August", "September", "October", "November", "December"];
var dayNumber;
var term;
var lastDayOfSchool;
var timetable;
var bulletin;
var enhancements;
var activities;

// Button variables
var DEBUG_RND = false;
var DEBUG_FRZ = false;
var DEBUG_TICK = true;

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

const FMT_PREFIX = "<small>";
const FMT_SUFFIX = "</small>";
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
			returnedString += timeTill[i][0] + FMT_PREFIX + " " + timeTill[i][1];
			if(timeTill[i][0].needsPlural())
				returnedString += "s";
			returnedString += FMT_SUFFIX + " ";
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

//TODO: add admin interface with switchable timetables (duplicate timetable "temporary" object)

Number.prototype.leadZero = function(){
	if (this < 10)
		return "0" + this;
	return this;
}

Number.prototype.needsPlural = function() {
	return !(this == 1);
}

jQuery.fn.extend({
	// animation even when text is not changed
	ahtml: function(text) {
		this.slideUp(100, function(){
			$(this).html(text).slideDown(100);
		});
	}, // animation when text is changed
	bhtml: function(text) {
		if(text != $(this).html()){
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

function getCycleDayNumber(){
	return (dayNumber-1)%5+1;
}


function runEverySecond(){
	updateTime();
	getCurrentInfo();
}
function runEveryHour(){
	updateDate();
	updateEnhancements();
	updateActivities();
	updateBulletin(bulletin);
}

function runEveryDay(){
	window.reload();
}

function init() {
	
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
	updateBulletin(bulletin); // simply to change title
});

/// DEBUG BUTTONS
// click -> set boolean, set button state
$(".btn-toggle").click(function() {
	var bool = $(this).attr('name');
	window[bool] = !window[bool];
	setBtnState(this, window[bool]);
})

// set button state for all toggleable buttons
$(".btn-toggle").each(function() {
	var bool = $(this).attr('name');
	setBtnState(this, window[bool]);
});

// show button state for its variable
function setBtnState(button, bool){
	$(button).removeClass("bg-"+!bool).addClass("bg-"+bool);
}





/// Loads master timetable json into variable
function loadTimetable(data) {
	timetable = JSON.parse(data);
	lastDayOfSchool = getLastDayOfSchool();
	updateDate();
	updateTime();
	updateEnhancements();
	updateActivities();
	getCurrentInfo();
	loadComplete();
}

/// fades out loading screen
function loadComplete() {
	setTimeout(function(){
		$("#loading-container").fadeOut();
	}, 400);
}




function getLastDayOfSchool() {
	var keyDates = timetable.years[d.getYear()+1900];
	var lastDate = new Date();
	for (var t in keyDates.school){
		var thisEndDate = new Date(keyDates.school[t].endDate);
		if(thisEndDate > lastDate)
			lastDate = thisEndDate;
	}
	return lastDate.timeOf("15:30");
}

function updateSchoolLeft(){
	var timeLeft = d.timeTill(lastDayOfSchool);
	if(timeLeft === 0){
		$(".school-left").html("End of year 12!")
	} else {
		$(".school-left").html(timeLeft + " left of year 12!");
	}
}




function getPeriods(periodTimes, currentTime) {
	if(term.break) return ["holiday", "holiday"]
	if(!term.school) return ["dayoff", "dayoff"]
	if(dayNumber === 0) return ["weekend", "weekend"]
	var currentPeriod, nextPeriod;
	currentPeriod = nextPeriod = "afterSchool";
	var beforeSchool = true;
	for (var period in periodTimes){
		if(currentPeriod !== "afterSchool"){
			nextPeriod = period;
			break;
		}
		else if(currentTime < d.timeOf(periodTimes[period].endTime)){
			if(currentTime >= d.timeOf(periodTimes[period].startTime)){
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

function getCurrentInfo() {
	updateSchoolLeft()

	if(term.break){
		$("#holiday-container").fadeIn();
		return;
	}

	var periodTimes = timetable.days[getCycleDayNumber()].times;
	var currentTime = d.getTime()
	var periods = getPeriods(periodTimes, currentTime);
	var currentPeriod = periods[0];
	var nextPeriod = periods[1];

	if(currentPeriod === "afterSchool" && getTerm(d.addNDays(1)).break){
		$("#holiday-container").fadeIn();
		return;
	}
	$("#holiday-container").fadeOut();

	//Time-till indicator
	if(currentPeriod === "weekend" || currentPeriod === "dayoff"){
		$(".column-now .title").html(d.formatDay(d));
	} else {
		$(".column-now .title").html("NOW");
	}

	if(currentPeriod === "afterSchool" || currentPeriod === "weekend" || currentPeriod === "dayoff"){
		$(".column-now .time-till").slideUp();
		$(".column-next .title").html(d.formatDay(d.addNDays(1)));
		var tomorrowBoxes = getTomorrowInfo();
		hideBoxes(".column-next", tomorrowBoxes.length)
		for(var i = 0; i < tomorrowBoxes.length; i++){
			showBox(tomorrowBoxes[i], ".column-next", i);
		}
		$(".column-next .box").applyColor(0, "now");
	}
	else {
		if(currentPeriod === "beforeSchool"){
			$(".column-now .time-till").bhtml(d.minutesTill(d.timeOf(periodTimes[nextPeriod].startTime)) + '<span class="tiny">m till school</span>');
		} else {
			if(currentPeriod.includes("period") && currentTime < d.timeOf(periodTimes[currentPeriod].startTime)){
				$(".column-now .time-till").bhtml(d.minutesTill(d.timeOf(periodTimes[currentPeriod].startTime)) + '<span class="tiny">m to class</span>');
			} else {
				$(".column-now .time-till").bhtml(d.minutesTill(d.timeOf(periodTimes[currentPeriod].endTime)) + '<span class="tiny">m left</span>');
			}
		}
		$(".column-next .title").html("NEXT");
		$(".column-next").slideDown();
		updateColumn(nextPeriod, dayNumber, ".column-next");
	}

	updateColumn(currentPeriod, dayNumber, ".column-now");
}

function getTomorrowInfo(){
	var daysToSchool = getDaysToNextSchoolDay();
	var boxes = [];
	if(daysToSchool > 6){
		boxes.push({name: "No School", room: "for " + daysToSchool + " days"})
	}
	else if(daysToSchool > 1){
		boxes.push({name: "No School", room: "until " + d.formatDay(d.addNDays(daysToSchool))})
		if(days[d.addNDays(daysToSchool).getDay()] !== "Mon"){
			boxes.push({name: getTerm(d.addNDays(daysToSchool-1)).name, abbr: "NO SCHOOL", room: days[d.addNDays(daysToSchool-1).getDay()] + "day"})
		} else {
			boxes.push({name: "It's the weekend!"})
		}
	}
	else {
		//TODO: show blocks?
		boxes.push({name: "School"})
	}
	return boxes;
}

function getDaysToNextSchoolDay(){
	var n; // days until next school day
	var daynum = getCycleDayNumber();
	if(term.break){ // on holiday
		n = d.daysTill(new Date(term.endDate).addNDays(1));
	}
	else if(daynum === 0){
		n = (d.getDay() === 0) ? 1 : 2;
	}
	else if(daynum === 5) {
		n = 3;
	} else {
		n = 1;
	}
	// if day back is a holiday, transform n
	var nextDay = d.addNDays(n);
	while(!getTerm(nextDay).school){
		n++;
		nextDay = d.addNDays(n);
	}
	return n;

}

function showBox(subject, column, pos){
	var box = $(column + " .box:nth-child(" + (pos+2) + ")"); //MUST be +2
	// Short block (json forced)
	if(subject.small) {
		// Need to check, otherwise animation will play every tick
		if(!box.hasClass("box-short")){
			box.addClass("box-short").slideUp();
		}
	} else {
		// regular subjects
		var room = (subject.room === undefined) ? "" : subject.room;
		box.find(".subject-room").html(room);

		var teacher;
		if(subject.teacher === "" || subject.teacher === undefined){
			if(subject.teacherabbr === "" || subject.teacherabbr === undefined){
				teacher = "";
			} else
				teacher = subject.teacherabbr;
		}
		else {
			teacher = subject.teacher;
		}
		box.find(".subject-teacher").html(teacher);

		if(room === "" && teacher === "") {
			if(!box.hasClass("box-short")) {
				box.addClass("box-short").slideUp();
			}
		}
		else {
			if(box.hasClass("box-short")){
				box.removeClass("box-short").slideDown();
			}
		}
	}
	box.find(".subject-title").html(subject.name);
	var abbr = (subject.abbr === undefined) ? "" : subject.abbr;
	box.find(".subject-abbr").html(abbr);

	box.slideDown();
}

function hideBoxes(column, numNeeded){
	$(column + " .box").slice(numNeeded).slideUp();
}

function hideBox(column, pos){
	$(column + " .box:nth-child(" + (pos+2) + ")").slideUp();
}

function showBlock(block, column) {
	var subjects = timetable.blocks[block].subjects;

	for (var i = 0; i < 8; i++){
		var box = $(column + " .box:nth-child(" + (i+2) + ")");
		if(i < subjects.length) {
			showBox(subjects[i], column, i);
		} else {
			// No subject shown in this box
			hideBox(column, i);
		}
	}
}

const ENH_NO = 0
const ENH_YES = 1
const ENH_BLOCK = 2;
function checkEnhancements(periodEnhancements) {
	blockEnhancement = false;
	for(var enhancement in periodEnhancements){
		if(periodEnhancements[enhancement].block !== undefined)
			return ENH_BLOCK;
		blockEnhancement = true;
	}
	return blockEnhancement ? ENH_YES : ENH_NO;
}

function getPeriodEnhancements(period) {
	var periodEnhancements = [];
	var checking;
	if(period === "recess" || period === "lunch"){
		checking = activities;
	}
	else if(period.includes("period")) {
		checking = enhancements;
	} else return periodEnhancements;

	for(var enhancement in checking){
		for(var p in checking[enhancement].periods){
			if(period.replace("period", "") == checking[enhancement].periods[p]){
				periodEnhancements.push(checking[enhancement]);
			}
		}
	}
	return periodEnhancements;
}

function updateEnhancements() {
	var enhancementObj = timetable.years[d.getYear()+1900].enhancement;
	enhancements = [];
	for(var event in enhancementObj) {
		if(d.isToday(new Date(enhancementObj[event].date))){
			enhancements.push(enhancementObj[event]);
		}
	}
}

function updateActivities() {
	var activityObj = timetable.years[d.getYear()+1900].activity;
	activities = [];
	for(var activity in activityObj) {
		if(getCycleDayNumber() === activityObj[activity].day)
			activities.push(activityObj[activity])
	}
}

function updateColumn(period, daynum, column) {
	// Period indicator
	$(column + " .period").bhtml(timetable.periods[period]);
	
	var block;
	var periodEnhancements = getPeriodEnhancements(period)
	var hasEnhancements = checkEnhancements(periodEnhancements);
	switch (hasEnhancements){
		case ENH_BLOCK:
			block = periodEnhancements[0].block;
			showBlock(block, column);
			break;
		case ENH_YES:
			// No subjects, so no blocks or boxes needed
			hideBoxes(column, periodEnhancements.length+1);
			// Show current enhancements
			for(var i = 0; i < periodEnhancements.length; i++){
				showBox(periodEnhancements[i], column, i);
			}
			var name = timetable.periods[period];
			if(timetable.timetable[daynum-1][period] === 0)
				name = "Enhancement Period";
			else if(period.includes("period")){
				hideBox(column, periodEnhancements.length);
				break;
			}
			showBox({name: name}, column, periodEnhancements.length);
			break;
		case ENH_NO:
			if(period.includes("period")) {
				block = timetable.timetable[daynum-1][period];
				showBlock(block, column);
			} else {
				// No subjects, so no blocks or boxes needed
				hideBoxes(column, 1);
				//$(column + " .box:not(:first)").slideUp();
				// Show current period (recess, lunch, before, after school)
				var name = timetable.periods[period];
				var reason = "";
				if(period === "dayoff") {
					name = "No School"
					reason = term.name;
				}
				if(period === "weekend") {
					name = "No School"
					reason = "It's " + days[d.getDay()] + "day!";
				}
				showBox({name: name, room: reason}, column, 0);
			}
			break;
	}

	// Block backgrounds
	var type = column.includes("now") ? "now" : "next";
	$(column + " .box").applyColor(block, type);

	// Block badge
	var blockBadge = $(column + " .block");
	if(block !== 0 && block !== undefined && hasEnhancements !== ENH_YES) {
		blockBadge.html('<span class="tiny">Block</span> ' + block);
		blockBadge.slideDown();
		blockBadge.applyColor(block, "badge");
	} else {
		blockBadge.slideUp();
	}

	// Period start / end time indicators
	if(period.includes("School") || period === "weekend" || period === "dayoff"){
		$(column + " .start-time").fadeOut();
		$(column + " .end-time").fadeOut();
	} else {
		$(column + " .start-time").bhtml(timetable.days[(daynum-1)%5+1].times[period].startTime);
		$(column + " .end-time").bhtml(timetable.days[(daynum-1)%5+1].times[period].endTime);
	}
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

	$("#day").bhtml(days[day]);
	$("#shortdate").bhtml(date.leadZero() + "/" + month.leadZero() + "/" + year);
	$("#yearF").html(year);
	$("#term").bhtml(term.name);

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

	$("#week").bhtml(week2 + " <small>(" + week + ")</small>");
	$("#daynum").bhtml(dayNumber);
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

	$("#hour").bhtml(" " + hours);
	$("#min").bhtml(minutes.leadZero());
	$("#sec").bhtml(seconds.leadZero());
	$("#meridian").bhtml(meridian);
}

// Date function with debugging features
function getCurrentDate(){
	// Freezes time
	if(DEBUG_FRZ){
		return
	} // randomise date
	else if(DEBUG_RND){
		return randomDate();
	} // continue ticking from previous date
	else if(DEBUG_TICK){
		return new Date(d.getTime() + 1000);
	} // new date (default)
	else{
		return new Date();
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





var socket = io();

socket.on('timetable', function(data) {
	loadTimetable(data)
});

socket.on('bulletin', function(data) {
	updateBulletin(data)
});

function updateBulletin(data) {
	bulletin = data;
	table = bulletin.table;
	announcements = bulletin.announcements;
	date = bulletin.date;
	day = date.substring(0, date.indexOf("day"));
	$("#today").bhtml(d.formatDay(new Date(date)));
	// only the date, not day
	date = date.substring(date.indexOf("day")+3)
	$("#bulletin-date").bhtml(date);

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
			tabletext += "<li><span class='bulletin-event'>" + event + "</span> <span class='bulletin-venue'>" + venue + "</span><span class='bulletin-time'>" + startTime + " - " + endTime + "</span></li>";
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

socket.on('motd', function(data){
	if(data === null){
		$("#rotator").fadeOut();
		return;
	}
	$("#rotator").fadeIn();
	$("#motd p").html(data.info);
	$("#motd cite").html("— " + data.from);
})