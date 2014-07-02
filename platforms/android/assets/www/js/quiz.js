var ftquiz = {

counter: 4,
currentBird: null,
data: null,
settings: {panel: "#panels", main: "#quiz", output: '#quiz_output', label: '#quizlabel', details: '#quizdetails'},
stats: {start: null, end: null, clickcount: null, question: null, answer: null, deviceid: null},
toWeekday: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
initialize: function() {
	//fired before page is created (one of the very first state in page-lifecycle)
	$(ftquiz.settings.main).bind('pagebeforecreate', function (event, ui) {
		ftquiz.generateBirdList(ftquiz.counter)
	});
	//fired when page is loaded, to fill the html with the birds data
	$(ftquiz.settings.main).bind('pagebeforeshow', ftquiz.prepareQuiz);
	
	$(document).on('ftAlarmStart', ftquiz.onQuizStart);
	$(document).on('ftAlarmEnd', ftquiz.onQuizEnd);
},
prepareQuiz: function(event, ui){
	ftquiz.setBirds()
	ftquiz.stats = {start: Date.now(), end: null, clickcount: 0, options: null, answer: null, deviceid: ((typeof device == "undefined")?"web":jQuery.sha256(device.uuid))};
	ftquiz.setQuizHeader();
	jQuery(ftquiz.settings.output+' .answer-wrong').removeClass('answer-wrong');
	jQuery(ftquiz.settings.output+' .answer-right').removeClass('answer-right');
},
/**
 * Set Quiz header with stored label and current time
 */
setQuizHeader: function(){
	try{
		var d = new Date();
		jQuery(ftquiz.settings.details + ' .time').text(fttheme.displayTime(d));
		jQuery(ftquiz.settings.details + ' .date').text(ftquiz.toWeekday[d.getDay()] + ', ' + d.getDate() + '.' + d.getMonth() + '.' + d.getFullYear());
		jQuery(ftquiz.settings.label).text(ftalarm.settings.label);
	}
	catch(e){
		console.log(e);
	}
},
/**
 * generate html-list with "count" list-elements
 */
generateBirdList: function() {
    var html = jQuery('<div/>', {class: "quizview"}).appendTo(ftquiz.settings.output);//"<ul data-role=\"listview\" class=\"ui-listview\">";
    for (var i = 1; i < ftquiz.counter + 1; i++) {
        jQuery( 
			"<div class='quizanswerwrapper'><div id=\"quiz_answer_" + i + "\" class=\"quizanswer\">\n\n" +				
				//"<img class=\"birdimg\"  src=\"\">\n" +
				"<h3 class=\"birdname\">Dunkelente</h3>\n" +
				"<p class=\"sciname\">Anas rubripes</p>\n\n" +
				"<p class=\"abs\"></p>\n\n" +
			"</div></div>").appendTo(html);
    }
},
/**
 * Start a new Quiz Game
 */
setBirds: function () {
	//Reset flagged Answers
	jQuery('div.quizanswer').removeClass('answer-wrong answer-right')

	//Data is already loaded
	if(ftquiz.data != undefined && ftquiz.data != null){
		ftquiz.chooseBirds(ftquiz.data)
	}//Retrieve Data
	else{
		$.ajax({
			type: "GET",
			//URL to the XML-Document
			url: "./res/birds.xml",
			dataType: "xml",
			success: ftquiz.chooseBirds,
			//ajax error
			error: function (xml) {
				console.log(xml.status + ' ' + xml.statusText);
			}
		});
	}
},
/**
 * 
 */
chooseBirds: function (xml) {
	ftquiz.data = $(xml);
	//this stores the random numbers taken, to avoid multiple choice of equivalent numbers
	chosenNumbers = [];
	
	//Work-around seed the Math rand function
	var seed = Math.floor((Math.random() * 30) + 1);
	for (var i = 0; i < seed; i++) {
		Math.random();
	}

	correctAnwser = Math.floor((Math.random() * ftquiz.counter) + 1);
	var total = ftquiz.data.find('bird').length;
	
	for (var i = 1; i < ftquiz.counter + 1; i++) {
		
		//gets random number between 1-10
		var randomNumber = Math.floor((Math.random() * total) + 1);
		//tests if this number was already taken
		while (chosenNumbers.indexOf(randomNumber) > -1) {
			var randomNumber = Math.floor((Math.random() * total) + 1);
		}
		//add taken number to array, so it will not be taken a second time
		chosenNumbers.push(randomNumber);

		//get bird with id=randomNumber
		var x = ftquiz.data.find("bird[id=" + randomNumber + "]");
		ftquiz.setQuizDetails(i, correctAnwser, x);
	}
	
	jQuery(document).trigger('ftAlarmStart');
},
setQuizDetails: function(i, correctAnwser, xml){
	//get img, name an sciname
	var id = xml.attr('id');
	var name = xml.find("name").text();
	var sciname = xml.find("sciname").text();
	var abs = xml.find("abs").text();
	
	//manipulate the html-page to fill in the birds-data
	//list
	var answer = $('#quiz_answer_' + i);
	answer.parent().css("background-image", "url('res/thumbnails/"+id+".jpg')");
	answer.attr('data-id',id);
	answer.find('.birdimg').attr('src', 'res/'+id+'.jpg');
	answer.find('.birdname').text(name);
	answer.find('.sciname').text(sciname);
	answer.find('.abs').text(abs);

	
	//set onclick events (is anwser correct, id)
	if (correctAnwser === i) {
		answer.attr('onclick', 'ftquiz.clicked(1,' + i + ');');		
		ftquiz.currentBird = id;
	}
	else {
		answer.attr('onclick', 'ftquiz.clicked(0,' + i + ');');
	}
},
onQuizStart: function(){

	try{
		 $.mobile.loading('hide');

		//Play sound
		ftsound.playAudio('res/'+ftquiz.currentBird+'.mp3');
		
		ftquiz.stats.answer = ftquiz.currentBird;
		
		if(phoneapp){
			//Push notification
			window.plugin.notification.local.add({ title:'zzZwtischerwecker', message: ftalarm.settings.label, id: 'zwtischerwecker', autoCancel: false,  ongoing: true});
		}
	}
	catch(e){
		console.log(e);
	}

},
onQuizEnd: function(stats){
	try{
		//Stop sound
		ftsound.stopAudio();
		//Clear Notification
		if(phoneapp){
			window.plugin.notification.local.cancelAll();
		}
		
		//Send Result to Server
		ftquiz.sendStats(ftquiz.stats)
	}
	catch(e){
		console.log(e);
	}
	
	//Goto detail page
	setTimeout(function(){
		$.mobile.navigate( "#result" );
	}, 1500);
	
},
sendStats: function(stats){
	$.ajax({
			type: "POST",
			//URL to the Stats-Server
			url: "https://www.farbtrommel.de/api/v1/zwitscherwecker/stats/",
			dataType: "json",
			data: "data="+JSON.stringify(stats),
			crossDomain: true ,
			success: function(json){
				ftquiz.stats = {start: null, end: null, clickcount: null, question: null, answer: null, deviceid: null};
				console.log("data transmit...");
				return;
			},
			//ajax error
			error: function (json) {
				console.log(json.status + ' ' + json.statusText);
			}
		});
},
/**
 * GUI: On click on a answer this function will be executed
 */
clicked: function (bool, id) {
    var answer = $('#quiz_answer_'+id);
	answer.attr('onclick','');
	ftquiz.stats.clickcount+=1;
    //correct anwser
    if (bool === 1) {
		answer.addClass('answer-right');
		ftquiz.stats.end = Date.now();
		ftquiz.stats.options = jQuery.makeArray(jQuery('div.quizanswer').map(function(i, el){return parseInt($(el).attr('data-id'));}));
		$.mobile.loading('show');
		//throw event
		jQuery(document).trigger('ftAlarmEnd', ftquiz.stats);
		
    } else { //wrong anwser
		answer.addClass('answer-wrong');
		//Two wrong guesses start new game
		if(jQuery('div.quizanswer.answer-wrong').length == 2){
			jQuery('div.quizanswer').addClass('answer-wrong');
			jQuery('div.quizanswer[data-id='+ftquiz.currentBird+']').addClass('answer-right');
			ftsound.stopAudio();
			$.mobile.loading('show'); 
			setTimeout(function(){
				ftquiz.setBirds();
			}, 1000);
		}
    }
}
}; 