ftfile = {
	//
	// File System
	//
	fspath: "zzZwitscherwecker",
	save: function(){
		if(phoneapp){
			console.log('Store settings ('+JSON.stringify(ftalarm.serialize())+')');
			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, ftfile.gotFsWrite, ftfile.fail);
		}		
	},
	load: function(){
		if(phoneapp){
			//console.log('Load settings');		
			window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, ftfile.gotFS, ftfile.fail);
		}
	},
    gotFS: function(fileSystem) {
		fileSystem.root.getDirectory(ftfile.fspath, {create: true}, ftfile.gotDir);
      
    },
	gotDir: function(dirEntry){
		  dirEntry.getFile("settings.json", null, ftfile.gotFileEntry, ftfile.fail);
	},
    gotFileEntry: function(fileEntry) {
        fileEntry.file(ftfile.gotFile, ftfile.fail);
    },

    gotFile: function(file){
        //ftfile.readDataUrl(file);
        ftfile.readAsText(file);
    },

    readDataUrl: function(file) {
        var reader = new FileReader();
        reader.onloadend = function(evt) {
            //console.log("Read as data URL");
            //console.log(evt.target.result);
        };
        return reader.readAsDataURL(file);
    },

    readAsText: function(file) {
        var reader = new FileReader();
        reader.onloadend = function(evt) {
            console.log("Read alarm settings: " + evt.target.result);
			ftalarm.loadFSCallback(JSON.parse(evt.target.result));
        };
        reader.readAsText(file);
    },
	
	gotFsWrite: function(fileSystem) {
		fileSystem.root.getDirectory(ftfile.fspath, {create: true}, ftfile.gotFsWriteDir);
        
    },
	gotFsWriteDir: function(dirEntry){
		dirEntry.getFile("settings.json", {create: true, exclusive: false}, ftfile.gotFileEntryWrite, ftfile.fail);
	},
    gotFileEntryWrite: function(fileEntry) {
        fileEntry.createWriter(ftfile.gotFileWriter, ftfile.fail);
    },

    gotFileWriter: function(writer) { 
		var str = JSON.stringify(ftalarm.serialize());
		writer.write(str);
    },

    fail: function(evt) {
        console.log(evt.target.error.code);
    }
}