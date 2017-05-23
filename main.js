var d = new Date();
// var d = randomDate();


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
	var days = ["sun", "mon", "tues", "wednes", "thurs", "fri", "satur"]
	$("#day").html(days[d.getDay()]);

/*	var months = ["january", "feburary", "march", "april", "may", "june", "july",
	"august", "september", "october", "november", "december"]
	$("#date").html(d.getDate());
	$("#month").html(months[d.getMonth()]);
*/
	$("#date").html(d.getDate().leadZero());
	if(d.getMonth()===0)
		$("#month").html(12);
	else
		$("#month").html(d.getMonth().leadZero());
	$("#year").html(d.getYear()-100);
	$("#week").html(d.getWeek());
	$("#term").html(Math.ceil(d.getWeek()/13));
}

function updateTime() {
	var hours = d.getHours();
	var minutes = d.getMinutes();
	var meridian = "pm";

	if(hours === 0 || hours === 12){hours = 12;}
	else if(hours < 12){meridian = "am";}
	else {hours = hours%12;}

	$("#time").html(hours + ":" + minutes.leadZero() + meridian);
}

function randomDate(){
   var startDate = new Date(2015,0,1).getTime();
   var endDate =  new Date(2017,0,1).getTime();
   var spaces = (endDate - startDate);
   var timestamp = Math.round(Math.random() * spaces);
   timestamp += startDate;
   return new Date(timestamp);
}

