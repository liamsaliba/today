var d = randomDate();//new Date();

Date.prototype.getWeek = function() {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

updateDate();
updateTime();

function updateDate() {
	var days = ["sun", "mon", "tues", "wednes", "thurs", "fri", "satur"]
	var months = ["january", "feburary", "march", "april", "may", "june", "july",
	"august", "september", "october", "november", "december"]
	$("#day").html(days[d.getDay()]);
	$("#date").html(d.getDate());
	$("#month").html(months[d.getMonth()]);
	$("#year").html(d.getYear()+1900);
	$("#week").html(d.getWeek());
}

function updateTime() {
	var hours = d.getHours();
	var minutes = d.getMinutes();
	var meridian = "pm";
	
	if(hours === 0 || hours === 12){hours = 12;}
	else if(hours < 12){meridian = "am";}
	else {hours = hours%12;}

	if(minutes < 10) {minutes = "0"+minutes};
	$("#time").html(hours + ":" + minutes + meridian);
}

function randomDate(){
   var startDate = new Date(2015,0,1).getTime();
   var endDate =  new Date(2017,0,1).getTime();
   var spaces = (endDate - startDate);
   var timestamp = Math.round(Math.random() * spaces);
   timestamp += startDate;
   return new Date(timestamp);
}


