var d = new Date();

updateDate();

function updateDate() {
	var days = ["sun", "mon", "tues", "wednes", "thurs", "fri", "sat"]
	var months = ["january", "feburary", "march", "april", "may", "june", "july",
	"august", "september", "october", "november", "december"]
	$("#day").html(days[d.getDay()]);
	$("#date").html(d.getDate());
	$("#month").html(months[d.getMonth()]);
	$("#year").html(d.getYear()+1900);

}