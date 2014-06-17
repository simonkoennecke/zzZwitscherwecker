var ftalarm = {
	config: {page: '#panel_settings',form: '#settings'},
	settings: {},
	day2id: {'So': 0, 'Mo': 1, 'Di': 2, 'Mi':3, 'Do':4, 'Fr':5, 'Sa':6},
	/**
	 * On init
	 */
    initialize: function() {
		//Observer
        ftalarm.view.initialize();
		
		if(phoneapp){
			try{
				chrome.alarms.onAlarm.addListener(ftalarm.onAlarm);
			}
			catch(e){
				console.log(e);
			}
		}
    },
	/**
	 * Load data from file system
	 */
	 loadFS: function(){
		ftfile.load()
	 },
	 loadFSCallback: function(set){
		ftalarm.settings = set;
		ftalarm.deserialize();
	 },
	/**
	 * Convert all form settings to an json object
	 */
	serialize: function(){
		ftalarm.settings = $.extend( ftalarm.settings, {
				'days': ftalarm.view.getDays(),
				'status': ftalarm.view.getStatus(),
				'label': ftalarm.view.getLabel(),
				'time': ftalarm.view.getTime(),
				'repeate': ftalarm.view.getRepeate(),
				'modified': Date.now() });
		return ftalarm.settings;
	},
	/**
	 * Restore the form setting from this.setting to the form.
	 */
	deserialize: function(){
		ftalarm.view.setLabel(ftalarm.settings.label);
		ftalarm.view.setTime(ftalarm.settings.time);
		ftalarm.view.setRepeate(ftalarm.settings.repeate);
		ftalarm.view.setDays(ftalarm.settings.days);
		ftalarm.view.setStatus(ftalarm.settings.status);
		
		jQuery(document).trigger('ftAlarmSettingsLoaded');
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
	// Set Alarm Clock
	//
	setAlarm: function(){		
		var time = ftalarm.getNextAlarm();
		chrome.alarms.clearAll();
		
		if(ftalarm.settings.status == "on" && Date.now() < time){
			chrome.alarms.create('zwtischerwecker',{'when': time.getTime()});
			console.log('Set a Alarm on ' + time.toUTCString());
			jQuery(document).trigger('ftAlarmSet');
		} else {			
			console.log('Cleared all Alarms');
		}
	},
	onAlarm: function(evt){
		//Ring only once, disable alarm clock
		if(ftalarm.settings.repeate == "once"){
			console.log('switch alarm off');
			$( ftalarm.config.form + ' select option[value=off]').trigger('click');
			ftalarm.serialize();
		}
		$.mobile.navigate( "#quiz" );
	},
	clearAlarm: function(){
		chrome.alarms.clearAll();
		jQuery(document).trigger('ftAlarmCleared');
	},
	/**
	 * All GUI related function
	 */
	view: {
		getDays: function(){
			return $.map($( ftalarm.config.form + ' input[data-theme="a"]'), function(ele, i){return $(ele).val();})
		},
		setDays: function(values){
			$( ftalarm.config.form + ' input[type=button]').attr('data-theme','');			
			$.map(values, function(ele, i){ 
				ftalarm.view.swapDayBtnTheme($( ftalarm.config.form + ' input[value="' + ele + '"]'));
			});
		},
		getStatus: function(){
			return $( ftalarm.config.form + ' select').val()
		},
		setStatus: function(value){
			if($( ftalarm.config.form + ' select').val() != value){
				$( ftalarm.config.form + ' select option[value='+value+']').trigger('click');
			}
		},
		getLabel: function(){
			return $( ftalarm.config.form + ' input[id=label]').val()
		},
		setLabel: function(value){
			return $( ftalarm.config.form + ' input[id=label]').val(value)
		},
		getTime: function(){
			//Time should not empty
			fttheme.time();
			return $( ftalarm.config.form + ' input[name=time]').val()
		},
		setTime: function(value){
			return $( ftalarm.config.form + ' input[name=time]').val(value)
		},
		getRepeate: function(){
			return (($( ftalarm.config.form + ' input[id=repeat_once]').prev('label').hasClass('ui-checkbox-on'))?"once":"multi")
		},
		setRepeate: function(){
			fttheme.checkbox({target: {id:'repeat_once', checked: (ftalarm.settings.repeate=="once")?true:false }})
		},
		
		initialize: function(){
			//change button color
			if(phoneapp){
				jQuery( ftalarm.config.form + ' input[type=button]').on('tap', ftalarm.view.onFormularEvent);
			} else {
				jQuery( ftalarm.config.form + ' input[type=button]').on('click', ftalarm.view.onFormularEvent);
			}
			
			//onchange save
			jQuery( ftalarm.config.form + ' input[type!=button]').on('change', ftalarm.view.onFormularEvent);
			jQuery( ftalarm.config.form + ' select').on('change', ftalarm.view.onFormularEvent);
			
			//pageshow load settings from file system
			jQuery(ftalarm.config.page).bind('pagebeforeshow', function (event, ui) {
				ftalarm.loadFS();
				
				//set default value by time input field
				var currentElement = $('#time');
				if(currentElement.val() == ""){
					var d = new Date();
					currentElement.attr('value', d.getHours()+":"+d.getMinutes());
					currentElement.trigger('change');
				}
			});
			
			//Prevent submit on all formulars
			jQuery("form").on('submit', function(ev){
				ev.preventDefault();
			});
		},
		/**
		 * Change theme on a day button
		 */
		swapDayBtnTheme: function(btn){
			if(btn.attr('data-theme') == 'a'){
				btn.button({ theme: 'b' })
				btn.attr('data-theme','b');
				btn.parent().removeClass('ui-btn-a');
			} else {
				btn.button({ theme: 'a' });
				btn.attr('data-theme','a');
				btn.parent().removeClass('ui-btn-b');
			}
		},
		/**
		 * Receives all click/tap and change events triggered on formular 
		 */
		onFormularEvent: function(){
			currentElement = $(this);
			
			//Change theme
			if(currentElement.attr('type')=="button"){
				ftalarm.view.swapDayBtnTheme($(this));
			}
			//When Time empty set current time
			else if(currentElement.attr('id') == "time" && currentElement.val() == ""){				
				var d = new Date();
				currentElement.val(d.getHours()+":"+d.getMinutes());
			}
			
			//Save and setAlarm only when App mode is active
			if(phoneapp){
				ftfile.save();
				ftalarm.setAlarm();
			}
		}
	}
};