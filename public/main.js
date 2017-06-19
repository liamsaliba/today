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

// Button variables
var EXTRA_EFFECTS = false;
var DEBUG_RND = false;
var DEBUG_FRZ = false;
var DEBUG_TICK = false;
var DEBUG_COL = false;

// TODO: make these function correctly
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



// Time/date picker for debug
flatpickr('#flatpickr', {
	enableTime: true
});

$("#flatpickr").change(function() {
	d = new Date(Date.parse($(this).val()));
	updateDate();
	updateBulletin();
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
		updateDate();
	});
}

/// fades out loading screen
function loadComplete() {
	setTimeout(function(){
		$("#loading").fadeOut();
	}, 400);
}

function parseTime(time) {
	return new Date(d.toLocaleDateString() + " " + time);
}

function parseDate(date) {
	return new Date(date + " 16:00");
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
	if (m > 0)
		$("#school-left").bhtml(Math.floor(m/7/24/60) + " weeks " + Math.floor(m/24/60%7) + " days " + Math.floor(m/60%(24)) + " hours " + (m%60) + " mins until the end of year 12");
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

	var dayNum = dayNumber;

	updateColumn(currentPeriod, dayNum,".column-now");
	updateColumn(nextPeriod, dayNum, ".column-next");

	timeLeftOfSchool()
}

function updateColumn(period, daynum, column) {
	// period number is the same, then there hasn't been a change.
	// TODO: implement temporary timetable check
	//if($(column + " .period").html() === timetable.periods[period]){
	//	return;
	//}
	// Period indicator
	$(column + " .period").bhtml(timetable.periods[period]);

	if(period.includes("period")) {
		var block = timetable.timetable[daynum-1][period];
		var blockObj = $(column + " .block");

		var subjects = timetable.blocks[block].subjects;

		var color = timetable.blocks[block].color;
		// Block indicator
		if(block !== 0) {
			blockObj.bhtml('<span class="tiny">Block</span> ' + block);
			blockObj.applyColor(color);
		} else {
			blockObj.slideUp();
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
				

				// NOT USED due to performance issues.
				if(DEBUG_COL) {
					if(column.includes("now"))
						$(column + " .box").applyColor(color+"-200");
					else
						$(column + " .box").applyColor(color+"-100");
				}
				if(EXTRA_EFFECTS){					
					box.fadeIn();
				}

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

		var box = $(column + " .box:nth-child(2)")

		if(!box.hasClass("box-short")){
			box.addClass("box-short").slideUp();
		}
		box.find(".subject-title").html(timetable.periods[period]);
		box.find(".subject-abbr").html("");
		box.slideDown();
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

function updateDate() {
	var date = d.getDate();
	var month = d.getMonth();
	if(month === 0)
		month = 12;
	var year = d.getYear()-100;
	var day, week, term
	if(timetable === undefined) {
		day = d.getDay();
		week = d.getWeek();
		term = "term " + d.getTerm();
	} else {
		var keyDates = timetable.years[year+2000];
		var currentTime = d.getTime();
		term = undefined;
		for(var t in keyDates.school){ // t for term
			if(currentTime >= parseDate(keyDates.school[t].startDate) && currentTime <= parseDate(keyDates.school[t].endDate))
				term = keyDates.school[t].name;
		}
		if(term === undefined){
			for(var b in keyDates.holidays){
				if(currentTime >= parseDate(keyDates.holidays[b].startDate) && currentTime <= parseDate(keyDates.holidays[b].endDate))
					term = keyDates.holidays[b].name;
			}
		}
	}
	
	
	//weekends
	if(day == 6 || day == 0){
		dayNumber = 0;
	}
	else {
		dayNumber = day + (week-1)*5;
	}

	//$("#date").bhtml(date.leadZero() + " " + months[month] + " " + (year+2000))
	$("#day").bhtml(days[day]);
	$("#week").bhtml(week);
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




function debugAnnouncements() {
	$(".announcements").html("<p><strong>NOTICES:</strong></p><p><strong>Learn to Play Chess:</strong> If you would like to learn to play chess, then here is your chance. Come to the Library at Lunchtime on Thursdays &ndash; Year 12 students will be available to teach you the skills of the game.</p><p><strong><span lang=\"EN-US\">Cambodia Service Project Trip:</span></strong><span lang=\"EN-US\">On </span><strong><span lang=\"EN-US\">Friday 9 of June</span></strong><span lang=\"EN-US\">, I will be running a Fundraising Pizza Lunch for the 2017 Cambodian Service Project Trip.It will be held in the Round, and soft drink will be sold on the day. The order form can be handed to your year level manager NO LATER than <strong>Wednesday the 7th of June. </strong>Thanks for your support!Kate O&rsquo;Sullivan</span></p><p><strong><span lang=\"EN-GB\">Snow Sports:</span></strong>Snow Sports training commences Thursday 1 June. This will occur each Thursday in the weights room from 3.45pm until 4.45pm. Any queries please see Mr Bullen.</p><p><strong><span lang=\"EN-GB\">Fringe Week:</span></strong>The School would like to announce that from 13-16 June we will celebrate 'Fringe Week' at the Plenty Campus. This event is run annually by the Year 12 Fringe Week Committee. Fringe Week is all about, 'letting the hair down' and adding some different flavours and colours to celebrate individuality. Term 2 is a busy time of year and we all tend to feel tired by the end of it, so Fringe Week aims to revitalise the School at the end of the Term. During this week there are many activities running and we have outlined the theme and activities for you.</p><p><strong>The Fringe Week Hat Hunt</strong></p><p>Someone has stolen Mr Brown's precious hat and has left clues around the school to find it. The School must unite to find the clues and figure out who has stolen it! The GROUP of students that presents concrete evidence as to who has stolen the hat will be rewarded with a prize!</p><p><strong>The central theme for the week is 'Individuality and Unity'</strong></p><p><strong>Tuesday 13 June - &ldquo;Crazy Tie and Scarf Day\"</strong></p><p>All levels 7-12 may wear their choice of tie and/or scarf for the day with their School Uniform.</p><p><strong>Wednesday 14 June &ndash; &ldquo;Wacky Hat and Hair Day\"</strong></p><p>Years 7-10 may create their craziest hair style and find their craziest hat to wear with their school uniform. Year 11 and 12 will need to wear Full School Uniform for the VCE GAT.</p><p><strong>Thursday 15 June &ndash; Year 7-12 &ldquo;Silly Shoes and Socks Day\"</strong></p><p>All Levels 7-12 may wear the craziest shoes and socks you have available in your wardrobe with your school uniform.</p><p><strong>Friday 16 June &ndash; &lsquo;Mystery Night and Casual Clothes Day'</strong></p><p>Years 7 to 12 students are given permission to either wear their Mystery Night Costume or Casual Clothes to mark the conclusion of Fringe Week. A $2.00 donation will be required for all students participating on this day, the funds raised will go towards the Cambodia Service Project. Students will have the opportunity to purchase lunch at a sausage sizzle during lunchtime. Also there will be an assembly which highlights this year's theme of &ldquo;Unity\".</p><p><span lang=\"EN-GB\">The <strong>PIANO and SOLOISTS COMPETITION</strong> entries are now open. </span></p><p><span lang=\"EN-GB\">The competition is open to <strong>All Piano Players</strong> (Years Prep to 12) and other Instrumental soloists in Years 10-12, who learn at the School or outside the School. All performers are invited to enter and compete. The competition date is <strong>Thursday 24 August</strong> but the auditions will run early in Term 3. The closing date for applications is Friday 23 June. Please go to the Music Office for Application Forms. </span></p><p><strong>Bus Students: </strong>All Bus Travellers are reminded that they should not be placing their bags on seats, or taking up several seats. For the safety of all, every student should be seated whilst on the bus.</p><p><strong><br /></strong><strong>Library: </strong>A reminder for students in Year 10 to 12 that the library is open until <strong>6.00 pm on Tuesdays.</strong> For students in Year 7-9 it is 5.00 pm as usual.</p><p><strong>THINK BEFORE YOU SPEAK Campaign (TERM 2 WELLBEING)</strong></p><p>MAN-UP</p><p><a href=\"https://www.youtube.com/watch?v=gpxqXZvH0kI\">https://www.youtube.com/watch?v=gpxqXZvH0kI</a></p><p>LIKE A GIRL</p><p><a href=\"https://www.youtube.com/watch?v=XjJQBjWYDTs\">https://www.youtube.com/watch?v=XjJQBjWYDTs</a></p><p>There are some casual sayings in our everyday speech that can have more impact than intended, &lsquo;you throw like a girl&rsquo;, &lsquo;that&rsquo;s so gay&rsquo;, &lsquo;be a man&rsquo; are common phrases that are said day to day with little intent to insult or harm a person. Yet, when you give it a little thought their meaning is clear and this sort of language can normalise more harmful ideas and behaviours.</p><p>Then of course there are purposeful insults said with the intention to offend, or &lsquo;get a laugh&rsquo; at someone else&rsquo;s expense. These insults often cut to the differences between us and highlight the power that some members of the community might have over others helping to maintain inequality, and of course, often deeply hurting the receiver of the insult.</p><p>With this campaign we ask that all members of Plenty Campus pause and think before we speak, does what you&rsquo;re about to say perpetuate an inequality in our culture, will it offend or hurt people around you, is it intended to harm &ndash; if it will do any of these things, then simply choose not to say it and help enhance the respectful culture of our school community. Over term two there will be Wellbeing presentations, notices and video links in the daily bulletin and posters around the school on this issue so keep an eye out for this material.</p>")
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
	$("#date").html(date);

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

