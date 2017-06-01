var t1 = setInterval(runEverySecond, 1000);
var t2 = setInterval(runEveryHour, 3600000);
var t3 = setInterval(runEveryDay, 86400000);

var d = new Date();
var daynum;
var timetable;
var lastPeriod;

// Button variables
var EXTRA_EFFECTS = false;
var DEBUG_RND = false;
var DEBUG_FRZ = false;
var DEBUG_TICK = false;
var DEBUG_COL = false;

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
			$(this).ahtml(text);
		}
	},
	applyColor: function(color) {
		if(!$(this).hasClass("mdc-bg-" + color)){
			$(this).removeClass (function (index, className) {
			    return (className.match (/(^|\s)mdc-bg-\S+/g) || []).join(' ');
			}).addClass("mdc-bg-"+color);
		}
		$(this).slideDown(100);
	}
})


function runEverySecond(){
	updateTime();
	getCurrentInfo();
}
function runEveryHour(){
	updateDate();
}

function runEveryDay(){
	window.reload();
}

function init() {
	updateDate();
	updateTime();
	loadTimetable();
	loadButtons();
	loadComplete();
}

$(document).ready(function() { init(); })




flatpickr('#flatpickr', {
	enableTime: true
});

$("#flatpickr").change(function() {
	d = new Date(Date.parse($(this).val()));
	updateDate();
	updateTime();
	getCurrentInfo();
});

/// BUTTONS
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
	if(bool){
		$(button).removeClass("mdc-bg-red").addClass("mdc-bg-green");
	} else {
		$(button).removeClass("mdc-bg-green").addClass("mdc-bg-red");
	}
}



/// Loads master timetable json into variable
function loadTimetable() {
	$.getJSON('./timetable.json', function(data){
		timetable = data;
		getCurrentInfo(data);
	});
}

/// fades out loading screen
function loadComplete() {
	setTimeout(function(){
		$("#loading").fadeOut();
	}, 400);
}

// 
function getTodayTime(time) {
	return Date.parse(d.toLocaleDateString() + " " + time);
}

function getCurrentInfo() {
	// gets the current period.
	var periodTimes = timetable.days[(daynum-1)%5].times;
	var currentTime = d.getTime();
	var currentPeriod, nextPeriod, afterPeriod;
	currentPeriod = nextPeriod = afterPeriod = "afterSchool";
	var beforeSchool = true;
	for (var period in periodTimes){
		if(nextPeriod !== "afterSchool"){
			afterPeriod = period;
			break;
		}
		else if(currentPeriod !== "afterSchool"){
			nextPeriod = period;
		}
		else if(currentTime < getTodayTime(periodTimes[period].endTime)){
			if(currentTime >= getTodayTime(periodTimes[period].startTime)){
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
	if(currentPeriod === "afterSchool"){
		$(".column-now .time-till").slideUp();
	}
	else {
		if(currentPeriod === "beforeSchool"){
			$(".column-now .time-till").bhtml(minutesUntilTime(getTodayTime(periodTimes[nextPeriod].startTime)) + '<span class="tiny">m until school</span>');
		} else {
			if(currentPeriod.includes("period") && currentTime < getTodayTime(periodTimes[currentPeriod].startTime)){
				$(".column-now .time-till").bhtml(minutesUntilTime(getTodayTime(periodTimes[currentPeriod].startTime)) + '<span class="tiny">m to class</span>');
			} else {
				$(".column-now .time-till").bhtml(minutesUntilTime(getTodayTime(periodTimes[currentPeriod].endTime)) + '<span class="tiny">m left</span>');
			}
		}
	}

	updateColumn(currentPeriod, ".column-now");
	updateColumn(nextPeriod, ".column-next");
}

function minutesUntilTime(time){
	return Math.ceil((time - d.getTime()) / 1000 / 60);
}

function updateColumn(period, column) {
	$(column + " .period").bhtml(timetable.periods[period]);

	if(period.includes("period")) {
		var block = timetable.timetable[(daynum-1)][period];
		var subjects = timetable.blocks[block].subjects;
		var color = timetable.blocks[block].color;
		console.log(color);

		if(block !== 0) {
			$(column + " .block").bhtml('<span class="tiny">Block</span> ' + block);
			$(column + " .block").applyColor(color);
		} else {
			$(column + " .block").slideUp();
		}
		for (var i = 0; i < 8; i++){
			var box = $(column + " .box:nth-child(" + (i+2) + ")")
			if(i < subjects.length) {
				// Private Study short block
				if(subjects[i].name === "Private Study"){
					if(!box.hasClass("box-short")){
						box.find(".line:nth-child(2)").hide();
						box.addClass("box-short").slideUp();
					}
				} else {
					if(box.hasClass("box-short")){
						box.find(".line:nth-child(2)").show();
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
				//TODO: fix this
				if(lastPeriod != period && EXTRA_EFFECTS){
					box.slideUp();
				}
				if(DEBUG_COL)
					box.applyColor(color+"-100");
				box.slideDown();
			} else {
				// box not used
				box.slideUp();
			}
		}
	} else {
		$(column + " .block").slideUp();
		$(column + " .box").slideUp();
		//TODO show tomorrow's classes
	}

	if(!period.includes("School")){
		$(column + " .start-time").bhtml(timetable.days[(daynum-1)%5].times[period].startTime);
		$(column + " .end-time").bhtml(timetable.days[(daynum-1)%5].times[period].endTime);
	} else {
		$(column + " .start-time").fadeOut();
		$(column + " .end-time").fadeOut();
	}

	lastPeriod = period;
}

function updateDate() {
	var days = ["sun", "mon", "tues", "wednes", "thurs", "fri", "satur"]
	var day = d.getDay();
	if(day === 6)
		day = 0;
	var week = d.getWeek();
	var term = d.getTerm();
	var date = d.getDate();
	var month = d.getMonth();
	if(month === 0)
		month = 12;
	var months = ["January", "Feburary", "March", "April", "May", "June", "July",
	"August", "September", "October", "November", "December"];
	var year = d.getYear()-100;
	daynum = day + (week-1)*5;

	$("#date").bhtml(date.leadZero() + " " + months[month] + " " + (year+2000))
	$("#day").bhtml(days[day]);
	$("#week").bhtml(week);
	$("#term").bhtml(term);
	$("#daynum").bhtml(daynum);

	$("#yearF").html(year+2000);
	
	$("#shortdate").bhtml(date.leadZero() + "/" + month.leadZero() + "/" + year);
	$("#date").bhtml(date.leadZero() + " " + months[month] + " " + (year+2000));
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

	//TODO: Fix the jittery time bug
}

function getDate(){
	if(DEBUG_FRZ){

	}
	else if(DEBUG_RND){
		d = randomDate();
	}
	else if(DEBUG_TICK){
		d = new Date(d.getTime() + 1000);
	}
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