/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */

package de.farbtrommel.zwitscherwecker;

import android.os.Bundle;
import org.apache.cordova.*;

import android.view.KeyEvent;

public class zzZwitscherwecker extends CordovaActivity 
{
    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);
        super.init();
        // Set by <content src="index.html" /> in config.xml
        super.loadUrl(Config.getStartUrl());
        //super.loadUrl("file:///android_asset/www/index.html");
    }
	
	@Override
public boolean onKeyDown(int keyCode, KeyEvent event){
    LOG.d(TAG, "KeyDown has been triggered on the view"+keyCode);
    //If volumedown key
    if (keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) { 
        // only override default behaviour is event bound 
        LOG.d(TAG, "Down Key >Hit"); 
        this.loadUrl("javascript:cordova.fireDocumentEvent('volumedownbutton');"); 
        return true; 
    }
    // If volumeup key
    else if (keyCode == KeyEvent.KEYCODE_VOLUME_UP) { 
        LOG.d(TAG, "Up Key Hit"); 
        this.loadUrl("javascript:cordova.fireDocumentEvent('volumeupbutton');"); 
        return true; 
    } else if (keyCode == KeyEvent.KEYCODE_HOME) { 
		LOG.d(TAG, "Home Key Hit"); 
        this.loadUrl("javascript:cordova.fireDocumentEvent('homebutton');"); 
        return true; 
    } else { 
        //return super.onKeyDown(keyCode, event); 
    }
    //return super.onKeyDown(keyCode, event);
    return true;
}

@Override
public boolean onKeyUp(int keyCode, KeyEvent event){
    LOG.d(TAG, "KeyUp has been triggered on the view"+keyCode);
    // If back key
    if (keyCode == KeyEvent.KEYCODE_BACK) { 
        this.loadUrl("javascript:cordova.fireDocumentEvent('backbutton');"); 
        return true; 
    }
    // Legacy
    else if (keyCode == KeyEvent.KEYCODE_MENU) { 
        this.loadUrl("javascript:cordova.fireDocumentEvent('menubutton');"); 
        return true;     
    }
    // If search key
    else if (keyCode == KeyEvent.KEYCODE_SEARCH) { 
        this.loadUrl("javascript:cordova.fireDocumentEvent('searchbutton');"); 
        return true; 
    } else if (keyCode == KeyEvent.KEYCODE_HOME) { 
        this.loadUrl("javascript:cordova.fireDocumentEvent('homebutton');"); 
        return true; 
    }
    return false;
}
}

