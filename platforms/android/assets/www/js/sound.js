var ftsound = {
	// Audio player
	//
	my_media: null,
	mediaTimer: null,
	src: null,
	repeat: true,

	// Play audio
	//
	playAudio: function(src){
		if(phoneapp){
			ftsound.playAudioNative(src);
		}
		else{
			jQuery('#soundplayer').html("<audio src=\""+ftsound.getPhoneGapPath()+src+"\"  controls autoplay loop>" +
						"<p>Your browser does not support the audio element.</p>" +
					"</audio>");
		}
	},
	playAudioNative: function(src) {
		// Create Media object from src
		ftsound.src = src;
		//if one sound still running stop it
		if(ftsound.my_media){
			ftsound.stopAudio();
		}
		
		ftsound.my_media = new Media(ftsound.getPhoneGapPath() + ftsound.src, ftsound.onSuccess, ftsound.onError);
		ftsound.repeat = true;
		ftsound.my_media.setVolume(0.8);
		
		// Play audio
		ftsound.my_media.play();

		// Update ftsound.my_media position every second
		
		if (ftsound.mediaTimer == null) {
			ftsound.mediaTimer = setInterval(function() {
				
				// get my_media position
				ftsound.my_media.getCurrentPosition(
					// success callback
					function(position) {
						//Loop						
						if (position > -1) {
							ftsound.setAudioPosition((position) + " sec");
						}
						
						
					},
					// error callback
					function(e) {
						console.log("Error getting pos=" + e);
						ftsound.setAudioPosition("Error: " + e);
					}
				);
			}, 1000);
		}
	},

	// Pause audio
	// 
	pauseAudio: function() {
		ftsound.repeat = false;
		if (ftsound.my_media) {
			ftsound.my_media.pause();
		}
	},

	// Stop audio
	// 
	stopAudio: function(){
		if(phoneapp){
			ftsound.stopAudioNative();
		}
		else{
			jQuery('#soundplayer').html("");
		}
	},
	stopAudioNative: function() {
		ftsound.repeat = false;
		if (ftsound.my_media) {
			ftsound.my_media.release();
			ftsound.my_media.stop();
		}
		
		clearInterval(ftsound.mediaTimer);
		ftsound.mediaTimer = null;
		
	},

	// onSuccess Callback
	//
	onSuccess: function() {
		if(ftsound.repeat){
			ftsound.playAudio(ftsound.src);
		}
		console.log("playAudio():Audio Success");
	},

	// onError Callback 
	//
	onError: function (error) {
		console.log('code: '    + error.code    + '\n' + 
			  'message: ' + error.message + '\n');
	},

	// Set audio position
	// 
	setAudioPosition: function (position) {
		//document.getElementById('audio_position').innerHTML = position;
	},
	getPhoneGapPath: function() {
		var path = window.location.pathname;
		path = path.substring( 0, path.lastIndexOf('/') + 1 );
		return 'file://' + path;
	}
}