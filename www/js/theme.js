var fttheme = {
initialize: function(){
	if(phoneapp){
		document.addEventListener("backbutton", fttheme.backButtonHandler, false);
	}
	
	jQuery( document ).on('ftAlarmSettingsLoaded', function(ev){fttheme.time()});
	jQuery( '#time' ).on('change', function(ev){fttheme.time()});
	
	jQuery('#result').bind('pagebeforeshow',function (event, ui) {fttheme.showQuizResult()});
	jQuery(document).on('ftAlarmEnd', function(ev){fttheme.showQuizResult()});
	
	jQuery('.repeat').on('change', fttheme.checkbox);
},
checkbox: function(ev){
	var m = $("#repeat_multiply");
	var o = $("#repeat_once");
	var d = null, a=null;
	if(ev.target.id == "repeat_once" && ev.target.checked){
		d = m; a = o;
	}
	else{
		d = o; a = m;
	}
	
	a.attr('checked', 'checked');
	a.prop('checked', true);
	a.prev('label').addClass('ui-checkbox-on');
	a.prev('label').removeClass('ui-checkbox-off');
	
	d.attr('checked', '');
	d.prop('checked', false);
	d.prev('label').removeClass('ui-checkbox-on');
	d.prev('label').addClass('ui-checkbox-off');
	
	if(ev.target.id == "repeat_once" && ev.target.checked){
		$("#settings .ui-controlgroup").hide();
	}
	else{		
		$("#settings .ui-controlgroup").show();
	}
},
time: function(){
	var lbl = jQuery('#lblTime');
	var txt = jQuery('#time');
	if(txt.val() != ""){
		var date = txt.val().split(":");
		var d = new Date();
		d.setHours(date[0]);
		d.setMinutes(date[1]);
		lbl.html(fttheme.displayTime(d));
	} else {
		txt.attr('value',fttheme.displayTime(new Date()));
		txt.trigger('change');
	}
},
showQuizResult: function (event, ui) {
	var id = parseInt($('#quiz .answer-right').attr('data-id'));
	console.log('ShowQuizResult (id: '+id+')');
	
	var x = ftquiz.data.find("bird[id=" + id + "]");
	
	var name = $(x).find("name").text();
	var sciname = $(x).find("sciname").text();
	var abs = $(x).find("abs").text();
	var wikiLink = $(x).find("link").text();
	
	var html = $('#result');
	html.find('.resBirdName').html(name);
	html.find('.resBirdImg').attr('src', 'res/'+id+'.jpg');
	html.find('.resAudio').attr('src', 'res/'+id+'.mp3');
	html.find('.resAbs').html(abs);
	jQuery('div.moreinformation a').attr('href', wikiLink);
	
	if(!phoneapp){
		html.find('.resAudio').html("<audio src=\"res/"+id+".mp3\"  controls loop>"+
				"<p>Your browser does not support the audio element.</p>" +
			"</audio>");
	}
	else{
		fttheme.buttonPlayNativeSound(id);		
	}
},
buttonPlayNativeSound: function(soundid){
	jQuery('#result .resAudio').html(
		'<div class="ui-btn ui-input-btn ui-btn-b ui-corner-all ui-shadow ui-first-child audiocontrol glyphicon glyphicon-volume-up" onclick="fttheme.btnPlayHandler(' + soundid + ')"></div>');
	return false;
},
btnPlayHandler: function(soundid){
	var el = $('#result .resAudio .audiocontrol');
	if(el.hasClass('glyphicon-volume-up')){
		ftsound.playAudio('res/' + soundid + '.mp3');
		el.removeClass('glyphicon-volume-up');
		el.addClass('glyphicon-volume-off');
	}
	else{
		ftsound.stopAudio();
		el.addClass('glyphicon-volume-up');
		el.removeClass('glyphicon-volume-off');
	}
	
	return false;
},
displayTime: function(d){
	return ((d.getHours()<10)?"0":"") + d.getHours() + ':' + ((d.getMinutes()<10)?"0":"") + d.getMinutes();
},
/*
 * On Alarm disable back button, settings panel close app, default back to settings panel
 */
backButtonHandler: function(e){
	e.preventDefault();
	console.log("Back button pressed");
	if($('#quiz').hasClass('ui-page-active')){
		//Do nothing
	}
	else if($('#panel_settings').hasClass('ui-page-active')){
		navigator.app.exitApp();
	}
	else{
		$.mobile.navigate( "#panel_settings" );
	}
	return false;
},
onError: function() {
	console.log('Acceleration: Error.');
}
};
