var t1 = setInterval(runEverySecond, 1000);
var t2 = setInterval(runEveryHour, 3600000);

var d = new Date();
var daynum;
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
	loadTimetable();
}

init();


function loadTimetable() {
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
		$(".column-now .time-till").hide();
	}
	else {
		$(".column-now .time-till").show();
		if(currentPeriod === "beforeSchool"){

		} else {
			$(".column-now .time-till").html(minutesUntilTime(d.getTime(), getTodayTime(periodTimes[currentPeriod].endTime)) + "<span class='tiny'>m left</span>");
		}
	}

	updateColumn(currentPeriod, ".column-now");
	updateColumn(nextPeriod, ".column-next");
}

function minutesUntilTime(timeBefore, timeAfter){
	return Math.ceil((timeAfter - timeBefore) / 1000 / 60);
}

function updateColumn(period, column) {
	$(column + " .period").html(timetable.periods[period]);
	$(column + " .block").hide();

	if(period.includes("period")) {
		var block = timetable.timetable[(daynum-1)][period];
		var subjects = timetable.blocks[block].subjects;
		var color = timetable.blocks[block].color;
		console.log(color);

		if(block !== 0)
			$(column + " .block").html("<span class='tiny'>Block</span> " + block).show();

		for (var i = 0; i < 8; i++){
			var box = $(column + " .box:nth-child(" + (i+2) + ")")
			if(i < subjects.length) {
				if(subjects[i].name === "Private Study"){
					box.addClass("box-short");
					box.find(".line:nth-child(2)").hide();
				} else {
					box.find(".subject-room").html(subjects[i].room);
					var teacher = subjects[i].teacher;
					if(teacher === "" || teacher === "TEACHERNAME")
						box.find(".subject-teacher").html(subjects[i].teacherabbr);
					else
						box.find(".subject-teacher").html(subjects[i].teacher);
					box.find(".line:nth-child(2)").show();
					box.removeClass("box-short");
				}
				box.find(".subject-title").html(subjects[i].name);
				box.find(".subject-abbr").html(subjects[i].abbr);
				box.fadeIn();
			} else {
				box.fadeOut();
			}
		}
	} else {
		$(column + " .box").fadeOut();
		//TODO show tomorrow's classes
	}
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