var ftalarm = {
	config: {'form': '#settings'},
	settings: {},
	day2id: {'So': 0, 'Mo': 1, 'Di': 2, 'Mi':3, 'Do':4, 'Fr':5, 'Sa':6},
	/**
	 * Convert all form settings to an json object. Save (this.settings) and return json object. 
	 */
	serialize: function(){		
		ftalarm.settings = $.extend( ftalarm.settings, {
				'days': $.map($( ftalarm.config.form + ' input[data-theme="b"]'), function(ele, i){return $(ele).val();}),
				'status': $( ftalarm.config.form + ' input[name=status]').val(),
				'label': $( ftalarm.config.form + ' input[name=label]').val(),
				'time': $( ftalarm.config.form + ' input[name=time]').val()});
		return ftalarm.settings;
	},
	/**
	 * Restore the form setting from this.setting to the form.
	 */
	deserialize: function(){
		$( ftalarm.config.form + ' input[name=label]').val(config.label);
		$( ftalarm.config.form + ' input[name=time]').val(config.time);
		$( ftalarm.config.form + ' input[type=button]').attr('data-theme','');
		$.map(settings.days, function(ele, i){ 
			$( ftalarm.config.form + ' input[data-theme="' + ele + '"]').attr('data-theme','b');
		});
	},
	/**
	 * Convert the form settings (this.settings) to calculable version.
	 */
	getSelectedDays: function(){
		//No specific day selected, each day is valid.
		if((ftalarm.settings.days != undefined && ftalarm.settings.days.length == 0)){
			var selected = [true,true,true,true,true,true,true];
		}else{
		//Specific days are selected
			var selected = [false,false,false,false,false,false,false];
			$.map(ftalarm.settings.days, function(ele, i){selected[ftalarm.day2id[ele]]=true;});
		}
		return selected;
	},
	/**
	 * Calculate the next ring time based on this.settings
	 */
	getNextAlarm: function(){
		//Is the alarm clock active and is a day selected
		if(!(ftalarm.settings.status === 'on'))
			return undefined;
		
		var date = new Date();
		var day  = date.getDay();//weekday
		var mday = date.getDate();//day of month
		var alarmHour = parseInt(ftalarm.settings.time.split(":")[0]);
		var alarmMin = parseInt(ftalarm.settings.time.split(":")[1]);
		var days = ftalarm.getSelectedDays();//See function
		
		//Alarm time today pasted?
		if(date.getHours() >= alarmHour && date.getMinutes() > alarmMin){
			day += 1; //ring at next day
			mday += 1;
		}
		
		//Find next valid Weekday			
		while(true){
			if(days[day])
				break;
			day = (day + 1) % 7;
			mday += 1;
		}
		//return timestamp for the next alarm
		return new Date(date.getFullYear(), date.getMonth(), mday, alarmHour, alarmMin, 0, 0);		
	},
	//
	// GUI Event
	//
	initobserver: function(){
		//change button color
		$( ftalarm.config.form + ' input[type=button]').click(function(){
			ftalarm.swapDayBtn($(this));
			ftalarm.save();			
		});
		//onchange save
		$( ftalarm.config.form + ' input[type!=button]').on('change', function(){
			ftalarm.save();
		});
		
	},
	swapDayBtn: function(btn){
		if(btn.attr('data-theme') == 'b'){
			btn.button({ theme: 'a' })
			btn.attr('data-theme','a');
			btn.parent().removeClass('ui-btn-b');
		} else {
			btn.button({ theme: 'b' });
			btn.attr('data-theme','b');
			btn.parent().removeClass('ui-btn-a');
		}
	},
	//
	// File System
	//
	save: function(){
		console.log('save');
		console.log(ftalarm.serialize());
		//this.serialize();
		//window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, fail);
	},
	
	onFileSystemSuccess: function(fileSystem) {
		console.log(fileSystem.name);
		console.log(fileSystem.root.name);
	},
	fail: function (evt) {
		console.log(evt.target.error.code);
	}
};