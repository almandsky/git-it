/**
 * hacked version
 * removed showing tooltips
 */
YUI.add('media-ulwv2.2.2hack', function (Y) {
    Y.namespace('Media.Weather').LocdropHacked = function (ulwConfig) {
      if (LocdropLocationPickerCommonInstance === null) {
	LocdropLocationPickerCommonInstance = new LocdropLocationPickerCommon();
      }
    
      var existing = LocdropLocationPickerCommonInstance.getWidget(ulwConfig.divID);
      if (existing !== null) {
	return existing; //Return the old one, instead of building a new one.
      }
    
      // @prop directGo
      // @value bool
      // true will skip user interaction
      this.directGo = ulwConfig.directGo;
      this.renderTarget = ulwConfig.renderTarget;
      this.id = ulwConfig.divID;
      this.app = ulwConfig.appID;
      this.ctx = ulwConfig.ctx;
      this.callback = ulwConfig.callback;
      this.errorCallback = ulwConfig.errorCallback;
      //The property configured filter callback
      this.filterCallback = ulwConfig.filterCallback || null;
      //The minimum width needed for the widget rendering
      this.minWidth = ulwConfig.minWidth || 300;
      //The default locale for the widget en-US
      this.defaultLocale = "en-US";
      this.locale =  ulwConfig.locale || this.defaultLocale;
      var overlayAnchor = "#" + this.id;
    
      //The number of locations to show when the widget is opened.
      //Including Current and Default locations
      this.displayLocs = 7;
      //The max string display offset width in pixels after deducting the padding
      //Display string curtailing will be applied based on this value
      this.maxPixelLength = this.minWidth - 60;
      //The minimum string length needed to trigger search
      this.searchStartLen = 3;
      //At what level should locations be shown...
      this.locationLevel = 'addr';
      //Possible values are: 'addr' (default), 'city', 'zip'
      this.widgetLocLevels = ['addr', 'city', 'zip'];
    
      this.state; // Holder for current state
      //Holder for disambiguate search result
      this.searchItemList = null;
      //Holder for disambiguate search selected item id
      this.searchItemId = null;
      //Place finder default type
      this.geoPlaceType = "saved";
      //Boolean flag for setting input field part of widget or not
      this.customInput = ulwConfig.customInput;
      //Holder for widget x,y position
      this.positionXY;
      //offset height in pixels needs be added to the overlays Y position
      this.overlayOffsetY = 20;
      //Width of the help overlay in pixels
      this.helpOverlayWidth = 400;
      //offset height in pixels needs be added to help overlay Y position
      this.helpOverlayOffsetY = 35;
      //The zindex configuration for the widget overlays, default z-index value is 1000
      this.zIndex = parseInt(ulwConfig.zIndex) || 1000;
      //Holder for upapi extracted current, default locations
      this.upapiExtracted = [];
    
      // Widget states
      var LOADING = "loading",
	OPEN = "open",
	REOPEN = "reopen",
	ERROR = "error",
	CLOSED = "closed",
    
	//Location type variables
	DEFAULT_LOC = "default", //default location
	CURRENT_LOC = "current", //current location
	SQ_LOC = "sqloc", //saved and queried location
	SQFIRST = "first", //saved and queried first location
    
	//Location data action variables
	DETECT = "detect",
	SELECT = "select",
    
	//LocDrop location type variables
	POINT_LOC = "point",
	PLACE_LOC = "place";
    
      // Widget overlay variables
      this.guid = YUI.guid("lw");
    
      // Widget overlays
      var helpOverlay,
	loadingStateOverlay,
	openStateOverlay;
    
      // The yrb message container for widget
      this.yrbContainer = null;
      // The default message container for widget
      this.msgContainer = {
	// Network level (Locdrop, FindLocation YQL Timeout errors) | visible ERROR
	LYD_QUERIED_LOC_FETCH_TIMEOUT   : "Attempt to fetch suggestions is taking too long",
	LYD_SAVED_LOC_FETCH_TIMEOUT     : "Attempt to fetch your past locations is taking too long",
    
	// Api level error (Locdrop, FindLocation YQL errors) | visible ERROR
	LYD_QUERIED_LOC_API_ERR         : "Unable to retrieve suggestions",
	LYD_GET_API_ERR                 : "Unable to retrieve your past locations",
	// By default not visible to end user |  log ERROR
	LYD_SET_API_ERR                 : "Unable to set your location",
    
	// Detect location related error | visible ERROR
	LW_DETECTSUPPORT_ERR: "Your browser does not support location detection",
	LW_DETECT_ERR       : "Unable to detect your accurate location",
	// Disabled location default message | visible INFO
	LW_LOC_DISABLED_INFO: "no weather data available for this location",
    
	// Open state strings.
	OS_CURRENT_LOCATION : "current location",
	OS_LOCATION_DETECT  : "Detect your accurate location",
	OS_LOCATION_PICK    : "No default location available",
	OS_DEFAULT_LOC_EDIT : "edit",
	OS_DEFAULT_LOC_ADD  : "add",
	OS_RETRY_ACTION_TXT : "Retry",
    
	// Widget input box ghost text for different location levels
	GHOST_TEXT_ADDR : "Enter an Address",
	GHOST_TEXT_CITY : "Enter a City",
	GHOST_TEXT_ZIP  : "Enter a Postal Code",
    
	// Manage locations
	OS_MANAGE_LOCATIONS  : "Manage Locations",
    
	// Contextual help messages
	CURRENT_LOCATION_CONTEXTUAL_HELP : "Your current location offers a convenient option for you to customize the content on any Yahoo! page in which it appears. <br/><br/> Your current location is based on the IP address provided by the internet service provider through which you are connecting to the internet. From this information, Yahoo! is generally able to determine the city in which you are currently located. <br/><br/> You can allow Yahoo! to detect more accurate location from your HTML5 browser by clicking on the detect link. This will allow Yahoo! to serve more relevant content. <br/><br/> For additional information regarding current location, click <a href=\"{0}\" target=\"_blank\">here</a>",
	PRIVACY_POLICY : "Privacy Policy",
	HELP : "Help",
	CLOSE : "Close",
    
	// Widget UED message urls
	OS_MANAGE_LOCATIONS_URL : "http://info.yahoo.com/locationmgt/?locale=en-US",
	CURRENT_LOCATION_HELP_URL : "http://help.yahoo.com/l/us/yahoo/location/",
	PRIVACY_POLICY_URL : "http://info.yahoo.com/privacy/us/yahoo/location"
      };
    
      //HTML 5 Geo-Location capability...
      this.geoLocation = new YahooGeoLocation(this.app);
    
      // YALA string resource bouldle URL configs
      this.yrbConfig = {
	proto : 'http://',
	// Default pointing Mobstor locationwidget YRB
	host  : ulwConfig.yrbHost || 'l.yimg.com',
	path  : ulwConfig.yrbPath || '/rl/ulw/yrb/2.2.2/',
	base  : 'ulwv2yrb'
      };
    
      // Handler function for yrb request failure
      this.yrbReqFailure = function(response, params) {
	// Unable to load the locale based yrb strings, fallback to default
	params.instance.setYrbContainer(params.instance.msgContainer);
	LocdropLocationPickerCommonInstance.setLocale(this.defaultLocale);
      }
    
      // Handler function for yrb request success, this method will not get invoked
      // as the YALA string JSNOP request to Mobstor response not wrapped in callback
      this.yrbReqSuccess = function(response, params) {
	params.instance.setYrbContainer(response);
	LocdropLocationPickerCommonInstance.setLocale(this.locale);
      }
    
      // Initialization function to request the locale language specific
      // YALA generated string resource boundle
      this.initYrb = function(locale) {
	// Check yrbContainer already being initialized
	var yrb = this.getYrbContainer();
	if(yrb !== null) {
	  this.yrbContainer = yrb;
	  this.msgContainer = this.yrbContainer;
	  return;
	}
    
	var instance =  this;
	// Prepare the yrb resource URL
	var yrbURL = this.yrbConfig.proto + this.yrbConfig.host + this.yrbConfig.path +
		     this.yrbConfig.base + '_' + locale + '.js?callback={callback}';
	//Prepare request param object to pass to the callback
	var reqParams = {
	  instance : instance
	};
    
	// Create a new YUI instance and populate the request
	YUI().use('jsonp', 'jsonp-url', function (Y) {
	  // JSONP is available and ready for use. Add implementation
	  var service = new Y.JSONPRequest(yrbURL, {
	    on: {
	      success: instance.yrbReqSuccess,   // handler function on success
	      failure: instance.yrbReqFailure   // handler function on failure
	    },
	    args: [reqParams]
	  });
	  // Send out the JSONP request
	  service.send();
	});
      }
    
      // The widget initialization function
      // Initialize the widget with the config values
      this.init = function() {
	if(ulwConfig.crumb) {
	  LocdropLocationPickerCommonInstance.setCrumb(ulwConfig.crumb);
	}
	if(ulwConfig.yqlHost) {
	  LocdropLocationPickerCommonInstance.setYqlHost(ulwConfig.yqlHost);
	}
	if(ulwConfig.urlPath) {
	  LocdropLocationPickerCommonInstance.setUrlPath(ulwConfig.urlPath);
	}
	if(ulwConfig.upapiExtracted.currentLoc || ulwConfig.upapiExtracted.defaultLoc) {
	  if(ulwConfig.upapiExtracted.currentLoc) {
	    this.upapiExtracted.push(ulwConfig.upapiExtracted.currentLoc); 
	  }
	  if(ulwConfig.upapiExtracted.defaultLoc) {
	    this.upapiExtracted.push(ulwConfig.upapiExtracted.defaultLoc); 
	  }
	  LocdropLocationPickerCommonInstance.setExtractedLocs(ulwConfig.upapiExtracted.currentLoc,
							       ulwConfig.upapiExtracted.defaultLoc);
	}
	if(ulwConfig.locationLevel) {
	  // The indexOf check has compatibility issue in IE, doing for loop check here
	  var validLocFilter = false;
	  for(var i=0; i < this.widgetLocLevels.length; i++) {
	    if(this.widgetLocLevels[i] === ulwConfig.locationLevel) {
	      validLocFilter = true;
	      break;
	    }
	  }
	  // Check provided location level filter is valid or not
	  if(validLocFilter) {
	    this.locationLevel = ulwConfig.locationLevel;
	  }
	}
	if(ulwConfig.yqlTimeout) {
	  LocdropLocationPickerCommonInstance.setYqlTimeout(ulwConfig.yqlTimeout);
	}
    
	if(!ulwConfig.placeFinderGflags) {
	  LocdropLocationPickerCommonInstance.resetPlaceFinderGflags();
	}
    
	//If default locale is differnt from widget config locale, pull yrb strings
	if(this.defaultLocale !== this.locale) {
	  //Pull the YALA resource files irrespective of the locale support
	  this.initYrb(this.locale);
	  //Use the provided locale for FindLocaltion query
	  LocdropLocationPickerCommonInstance.setLocale(this.locale);
	}
    
	//Set widget overlay x,y position
	this.setPositionXY(ulwConfig.positionXY);
    
	var instance = this;
	YUI().use('node', 'event', 'substitute', 'overlay', function (Y) {
	  //Registering the common event handler for the first time
	  //Will handle all the widget events inside the common handler function
	  if (typeof(instance.state) === "undefined") {
	    if(!instance.customInput) {
	      Y.on("click", instance.handleDocumentClick, document, instance);
	    }
	    Y.on("keyup", instance.handleDocumentKeyup, document, instance);
	  }
    
	  //Create the default anchor element, if widget is not using custom input
	  if(!instance.customInput) {
	    //Initializing the widget anchor element, default invocation end point
	    instance.anchorId = instance.makeElementId("closedState");
	    var templateCfg = {
	      anchorId  : instance.anchorId,
	      anchorTxt : ulwConfig.anchorText || ""
	    };
    
	    var anchorContent = Y.substitute(instance.LW_ANCHOR_TEMPLATE, templateCfg);
	    Y.one(overlayAnchor).set("innerHTML", anchorContent);
    
	    //Register click event to the default anchor element
	    Y.on("click", instance.open, overlayAnchor , instance);
	  }
	});
      }
    
      //Method to set widget x, y position. If an [x,y] co-ordinate array provided
      //widget will use that value, else will calculate from the holder element
      this.setPositionXY = function(positionXY) {
	//[x,y] co-ordinate array provided, use that value
	if(positionXY) {
	  this.positionXY = positionXY;
	//Calculate the rendering position based on the holder element
	} else {
	  var instance = this;
	  YUI().use('node', function (Y) {
	    instance.positionXY = Y.one(overlayAnchor).getXY();
	    instance.positionXY = [instance.positionXY[0],
				   instance.positionXY[1] + instance.overlayOffsetY];
	  });
	}
      }
    
      //Method to dynamically set widget z-index value
      //All the widget overlays will be set as per the new z-index
      this.setZindex = function(zindex) {
	//set widget z-index value
	this.zIndex = parseInt(zindex);
	//dynamically set overlay z-index
	if (typeof(openStateOverlay) !== "undefined") {
	  openStateOverlay.set("zIndex", this.zIndex);
	}
	if (typeof(loadingStateOverlay) !== "undefined") {
	  loadingStateOverlay.set("zIndex", this.zIndex);
	}
    
	if (typeof(helpOverlay) !== "undefined") {
	  helpOverlay.set("zIndex", this.zIndex + 1);
	}
	if (typeof(tooltipOverlay) !== "undefined") {
	  tooltipOverlay.set("zIndex", this.zIndex + 2);
	}
      }
    
      this.setYrbContainer = function(response) {
	this.yrbContainer = response;
	this.msgContainer = this.yrbContainer;
	LocdropLocationPickerCommonInstance.setYrbContainer(response);
      }
    
      this.getYrbContainer = function() {
	return LocdropLocationPickerCommonInstance.getYrbContainer();
      }
    
      this.setPendingYrbCall = function(flag) {
	LocdropLocationPickerCommonInstance.setPendingYrbCall(flag);
      }
    
      this.getPendingYrbCall = function() {
	return LocdropLocationPickerCommonInstance.getPendingYrbCall();
      }
     
      //Makes an unique DOM element ID.
      this.makeElementId = function(suffix) {
	return LocdropLocationPickerCommonInstance.namespace + '_' + this.id + '_' + suffix;
      }
    
      this.getYQLAccessor = function() {
	return LYD;
      }
    
      //findlocation search result sorting, criteria: active, inactive
      this.disabledSorter = function(loc1, loc2) {
	//both locations disabled or enabled, return 0
	if(loc1.disabled === loc2.disabled) {
	  return 0;
	//loc1 disabled, return 1
	} else if(loc1.disabled) {
	  return 1;
	}
	//loc2 disabled, return -1
	return -1;
      }
    
      //user saved location sorting, criteria: frequecy, active, inactive
      this.locationSorter = function(loc1, loc2) {
	//Real life sorting logic is going to be messy. Let's do a simple one here.
	//The higher the frequency, the lower the index.
	var freq1 = loc1.freq;
	if (freq1 === null) {
	  freq1 = 0;
	}
	var freq2 = loc2.freq;
	if (freq2 === null) {
	  freq2 = 0;
	}
    
	//both locations disabled or enabled, consider frequency
	if(loc1.disabled === loc2.disabled) {
	  return freq2 - freq1;
	//loc1 disabled, return 1
	} else if(loc1.disabled) {
	  return 1;
	}
	//loc2 disabled, return -1
	return -1;
      }
    
      //method to hide the overlay states
      //@param : String state
      this.hideOverlayStates = function(state) {
	if (typeof(openStateOverlay) !== "undefined") {
	  openStateOverlay.hide();
	}
	if (typeof(loadingStateOverlay) !== "undefined") {
	  loadingStateOverlay.hide();
	}
	if (typeof(tooltipOverlay) !== "undefined") {
	  tooltipOverlay.hide();
	}
	if (typeof(helpOverlay) !== "undefined") {
	  helpOverlay.hide();
	}
      }
    
      // Set widget overlay states and show overlay
      this.setState = function(state) {
	var instance = this;
	//close the previous state overlay(i.e, the currently set state)
	if(typeof(this.state) !== "undefined") {
	  this.hideOverlayStates(this.state);
	}	
	if (state === OPEN || state === REOPEN) { // open / reopen states
	  if (typeof(openStateOverlay) !== "undefined") {
	    openStateOverlay.show();
	  }
	  if(!this.customInput) {
	    YUI().use('node', function(Y){
	      Y.one("#" + instance.inputId).focus();
	    });
	  }
	} else if (state === LOADING) { // loading state
	  if (typeof(loadingStateOverlay) !== "undefined") {
	    //The widget position can be set dynamically, always get x,y position
	    loadingStateOverlay.set("zIndex", instance.zIndex);
	    loadingStateOverlay.show();
	  } else {
	    //Create random unique id for the string pixel length calculator holder
	    this.rulerId = this.guid + "_ruler";
	    YUI().use('overlay', 'substitute', function(Y){
	      var loadingCnt = Y.substitute(instance.LW_LOADING_MSG, {rulerId : instance.rulerId});
	      loadingStateOverlay = new Y.Overlay({
		bodyContent : loadingCnt,
		width       : instance.minWidth,
		zIndex      : instance.zIndex,
		xy          : [instance.positionXY[0], instance.positionXY[1]],
		render      : false,
		visible     : true
	      });
	      loadingStateOverlay.render(instance.renderTarget);
	    });
	  }
	} else if(state === ERROR) { // error state
	  if (typeof(openStateOverlay) !== "undefined") {
	    openStateOverlay.show();
	  }
	}
	// set the new state as the current state.
	this.state = state;
	return;
      }
    
      //Method to set errors on widget
      this.setError = function(errObj) {
	this.lastError = errObj.errCode;
	var hiddenCls = "hide",
	  retryLink = errMsg = errFrag = simpleDisplay = "",
	  retryFlg = false,
	  locs = null,
	  instance = this;
	//get the error block html fragment
	errFrag = this.populateErrorFragment(errObj);
	if(!instance.customInput && errObj.errCode === "LYD_QUERIED_LOC_FETCH_TIMEOUT") {
	  openStateOverlay.set("bodyContent", errFrag);
	} else {
	  //pull the latest list of fetched locations to construct the widget display
	  locs = this.getYQLAccessor().getCtxTypeLocs("*", "*");
	  //get the simple display (prefetched current, default and saved if any)
	  var simpleDisplay = this.populateLocs(locs, null);
	  //show widget with error + simple display 
	  this.openState(errFrag + simpleDisplay, {footerFlg : false, detectHighlight: false});
	}
    
	YUI().use("node", "event", function (Y) {
	  Y.on("click", Y.bind(instance.hideError, instance), "#" + instance.err_close_id);
	  //in case of recoverable errors enable the Retry link
	  if(errObj.errCode === "LYD_SAVED_LOC_FETCH_TIMEOUT") {
	    Y.on("click", Y.bind(instance.open, instance), "#" + instance.err_retry_id);
	  }
	  if(!instance.customInput && errObj.errCode === "LYD_QUERIED_LOC_FETCH_TIMEOUT") {
	    Y.on("click", Y.bind(function(e) {
	      //invoke widget geocodingRetry method for retrying disambiguation search
	      instance.findlocationRetry();
	      }, instance), "#" + instance.err_retry_id);
	  }
	});
     
	//If property has provided error callback, invoke it
	if(this.errorCallback !== null) {
	  //Error message corresponding to widget error code
	  //All the log error messages will be in default locale en-US
	  errObj.errMsg = this.msgContainer[errObj.errCode];
	  //The widget appID
	  errObj.appID = this.app;
	  //timestamp in milli seconds since epoch
	  errObj.timeStamp = (new Date()).getTime();
	  this.errorCallback(errObj);
	}
      }
     
      //Method to hide widget error block
      this.hideError = function() {
	var instance = this;
	YUI().use("node", "event", function (Y) {
	  Y.one('#' + instance.err_container_id).remove();
	  Y.one('#' + instance.err_separator_id).remove();
	});
      }  
    
      // Handler function for woe id based set-use call
      this.handleWoe = function(widget) {
	// Checking response success/failure
	if (widget.errObj.errCode) {
	  widget.setError(widget.errObj);
	  return;
	}
    
	var id = null;
	var yql = widget.getYQLAccessor();
	if(typeof(widget.response) !== "undefined" &&
	   typeof(widget.response.query.results.Response.Result) !== "undefined") {
    
	  // Get the updated location id from the yql Response Result
	  id = widget.response.query.results.Response.Result;
	  if(id !== null) {
	    // Make set-use call with the updated id
	    yql.setUse(id, widget.ctx, null, null);
	  }
	  return true;
	}
	return false;
      }
    
      this.handleSet = function(widget) {
	// Checking response success/failure
	if (widget.errObj.errCode) {
	  //Error state.
	  widget.setError(widget.errObj);
	}
	//This is a special handling for public computer user set-use call (no 'F' cookie)
	//As well as for set call backend failure scenarios
	//In the case of public computer the set call response Result will be 'null'
	//We won't be doing a set-use call in either of these case,
	//Simply will pass the selected location to callback 
	if (widget.errObj.errCode || (typeof(widget.response) !== "undefined" &&
	    typeof(widget.response.query.results.Response.Result) !== "undefined" &&
	    widget.response.query.results.Response.Result === null)) {
	  var locs = widget.searchItemList;
	  for (var i = 0 ; i < locs.length ; i++) {
	    if (locs[i].id === widget.searchItemId) {
	      widget.loc = locs[i];
	      break;
	    }
	  }
	//Valid Result received from the response data
	//Make set-use call with the updated response id inorder to set it sticky
	} else {
	  // Get the updated location id from the yql Response Result
	  var id = widget.response.query.results.Response.Result;
	  // Make set-use call with the updated id
	  widget.getYQLAccessor().setUse(id, widget.ctx, null, null);
	  var locs = widget.searchItemList;
	  for (var i = 0 ; i < locs.length ; i++) {
	    if (locs[i].id === widget.searchItemId) {
	      widget.loc = locs[i];
	      //Set the widget loc object id with the updated response result id
	      widget.loc.id = id;
	      break;
	    }
	  }
	}
    
	widget.setState(CLOSED);
	if (widget.callback !== null) {
	  widget.callback(widget);
	}
	return true;
      }
    
      //This method will determine a location as a point or place
      //@param locObj - FindLocation response object
      this.getLocationType = function(locObj) {
	//greater than or equal to 80 quality range
	if(locObj.quality >= 80) {
	  return POINT_LOC;
	//greater than or equal to 70 and less than 80 quality range
	} else if(locObj.quality >= 70) {
	  //The following quality values are place locations in this quality range
	  //74 - Postal unit/segment, street ignored (Zip+4 in US)
	  if(locObj.quality !== 74) {
	    return POINT_LOC;
	  }
	//greater than 50 and less than 70 quality range
	} else if(locObj.quality > 50) {
	  ///The following quality values are point locations in this quality range
	  //65 - Postal zone/sector (Zip+2 in US)
	  //64 - Postal zone/sector, street ignored (Zip+2 in US)
	  //63 - AOI
	  if((locObj.quality === 65) || (locObj.quality == 64) ||
	     (locObj.quality === 63)) {
	    return POINT_LOC;
	  }
	//Treat the location as point for a valid house and street field value
	} else if (locObj.house && locObj.street) {
	  return POINT_LOC; 
	}
	//all other fallback cases and less than 50 quality range
	return PLACE_LOC;
      }
    
      this.select = function(data) {
	//The data will be a location id string.
	if (data.search('new-') === 0) {
	  //Add the search item id to Holder
	  this.searchItemId = data;
	  var addr = Base64.decode(data.substr(4)); //Get base64 encoded address.
    
	  var locs = this.searchItemList;
	  //Holder for selected location object
	  var selectedLocObj = null;
	  for (var i = 0 ; i < locs.length ; i++) {
	    if (locs[i].id === this.searchItemId) {
	      selectedLocObj = locs[i];     
	      break;
	    }
	  }
    
	  if (selectedLocObj !== null) {        
	    //Point location do lat, lon based location insertion
	    if (this.getLocationType(selectedLocObj) === POINT_LOC) {
	      this.getYQLAccessor().addPoint(addr, selectedLocObj.latitude, selectedLocObj.longitude,
							   this.ctx, "saved", this.app, this.handleSet, this);
	    //Place location do woeid based location insertion
	    } else {
	      this.getYQLAccessor().addPlace(addr, selectedLocObj.woeid, this.ctx, "saved",
							   this.app, this.handleSet, this);
	    }  
	    this.setState(LOADING);
	  }
	  return true;
	}
    
	var locs = this.getYQLAccessor().getCtxTypeLocs("*", "*");
	this.loc = null;
	//There could be chances that empty result from YQL and
	//widget will still show upapiExtracted locattions
	if(!locs || locs === null) {
	  locs = this.upapiExtracted;
	}
	// Check whether selected location present in the list of YQL | UPAPI 
	for (var i = 0 ; i < locs.length ; i++) {
	  if (locs[i].id === data) {
	    this.loc = locs[i];
	    this.getYQLAccessor().setUse(this.loc.id, this.ctx, null, null);
	    break;
	  }
	}
    
	// Check whether selected location not present
	// In the list of locations from yql resposes
	// In this cases user is trying to set the location served from upapi
	// So far 3 cases has been identified
	// 1) Current location is served from upapi : id_current
	// 2) Default location is served from upapi : id_regzip
	// 3) Signed out user getting default location of
	//    Signed in user from PL cookie: global-default-
	if(this.loc === null) {
	  // Check selcted location id is ip based current location
	  if(data === 'id_current') {
	    this.loc =  LocdropLocationPickerCommonInstance.upapiCurLoc;
    
	    // Add the woe id to get the global-physical index
	    this.getYQLAccessor().addWoe(this.loc.woe, "global",
					 "physical", this.app, this.handleWoe, this);
    
	  // Check selcted location id is regzip default location
	  } else if(data === 'id_regzip') {
	    this.loc =  LocdropLocationPickerCommonInstance.upapiDefLoc;
	    // Add the woe id to get the global-default index
	    this.getYQLAccessor().addWoe(this.loc.woe, "global",
					 "default", this.app, this.handleWoe, this);
	  }
	}
    
	this.setState(CLOSED);
    
	if (this.callback !== null) {
	  this.callback(this);
	}
	return true;
      }
    
      this.detectSuccess = function(widget) {
	widget.open(DETECT);
      }
    
      this.detectFailed = function(widget, errObj) {
	if (errObj.errCode) { //Error state.
	  widget.setError(errObj);
	  return;
	}
      }
    
      this.detect = function(data) {
	this.setState(LOADING);
	this.geoLocation.detect(this.detectSuccess, this.detectFailed, this);
      }
    
      //Build the HTML fragment for detect location block
      this.populateDetectBlock = function() {
	this.detectGeoId = this.guid + "_detect_geo";
	this.chelpId = this.guid + "chelp";
	var detectLoc = '',
	  disabledClass = "lw-loc-disabled",
	  detectIconCls = "detect-disabled",
	  disabledFlg = "1",
	  dataAction =  "",
	  detectTitle = this.msgContainer.LW_DETECTSUPPORT_ERR,
	  chelpSelector = "#" + this.chelpId;
    
	//check html5 detect location  capability, enable/disable detect link
	if (this.geoLocation.geoSupport && this.geoLocation !== null) {
	  detectIconCls = "detect-location";
	  disabledClass = "";
	  disabledFlg = "0";
	  dataAction =  DETECT;
	  detectTitle = "";
	}
	var detectCfg = {
	    displayStr       : this.msgContainer.OS_LOCATION_DETECT,
	    detectId         : this.detectGeoId,
	    locClass	 : disabledClass,
	    detectIconCls    : detectIconCls,
	    disabledFlg      : disabledFlg,
	    lType            : DETECT,
	    dAction          : dataAction,
	    chelpId          : this.chelpId,
	    detectTtl        : detectTitle
	};
	detectLoc = this.templateSubstitute("LW_DETECT_LOC_TEMPLATE", detectCfg);
	return detectLoc;
      }
    
      //Build the HTML fragment for widget error block
      this.populateErrorFragment = function(errObj) {
	var locs = null,
	  hiddenCls = retryLink = errMsg = errFrag ="",
	  retryFlg = false,
	  instance = this;
	this.err_container_id = this.guid + "_err_container";
	this.err_close_id = this.guid + "_err_close";
	this.err_msg_id = this.guid + "_err_msg";
	this.err_separator_id = this.guid + "_err_separator";
	//In case of recoverable errors, show the retry link
	if(errObj.errCode === "LYD_SAVED_LOC_FETCH_TIMEOUT" ||
	   errObj.errCode === "LYD_QUERIED_LOC_FETCH_TIMEOUT") {
	  this.err_retry_id = this.guid + "_err_retry";
	  var retryCfg = {
	    retryId:  this.err_retry_id,
	    retryMsg: this.msgContainer.OS_RETRY_ACTION_TXT
	  };
	  retryLink = this.templateSubstitute("LW_ERR_RETRY_TEMPLATE", retryCfg);
	}
	var errCfg = {
	  lType     : ERROR,
	  errContId  : this.err_container_id,
	  errCloseId  : this.err_close_id,
	  errMsgId  : this.err_msg_id,
	  errSeparatorId  : this.err_separator_id,
	  hiddenCls : hiddenCls,
	  errMsg    : this.msgContainer[errObj.errCode],
	  retryLink : retryLink
	}
	//get the error block html fragment
	errFrag = this.templateSubstitute("LW_LOC_ERR_TEMPLATE", errCfg);
	return errFrag;
      }
    
      //Builds an inner HTML for a location list.
      this.populateLoc = function(type, location, extra) {
	var address = location.addr,
	  label = location.lbl,
	  locId = location.id,
	  disabledClass = "",
	  disabledFlg = "0",
	  dataAction =  SELECT,
	  innerHTML = '';
    
	var address = this.getAddressStr(location);
	if (address === null) {
	  return '';
	}
    
	//Detect location block
	if (extra !== null && extra !== SQFIRST) {
	  innerHTML += extra;
	}
    
	var displayStr = this.getDisplayStr(location, type);
    
	//reset the class, flag, action vlaues if location is disabled
	if(location.disabled) {
	  disabledClass = "lw-loc-disabled";
	  disabledFlg = "1";
	  dataAction =  "";
	}
    
	if(type !== null && type === CURRENT_LOC) { // Current location - global physical
	  var currentCfg = {
	    displayStr      : displayStr,
	    displayTtl      : address,
	    locClass        : disabledClass,
	    disabledFlg     : disabledFlg,
	    lType           : CURRENT_LOC,
	    dAction         : dataAction,
	    locId           : locId,
	    curLocTxt       : this.msgContainer.OS_CURRENT_LOCATION
	  };
	  var currentLoc = this.templateSubstitute("LW_CURRENT_LOC_TEMPLATE", currentCfg);
	  if (currentLoc) {
	    innerHTML += currentLoc;
	  }
	} else if(type !== null && type === DEFAULT_LOC) { // Default location - global default
	  var defaultEditCfg = {
	    displayStr      : displayStr,
	    displayTtl      : address,
	    locClass        : disabledClass,
	    disabledFlg     : disabledFlg,
	    locId           : locId,
	    lType           : DEFAULT_LOC,
	    dAction         : dataAction,
	    editStr         : this.msgContainer.OS_DEFAULT_LOC_EDIT,
	    editLink        : this.msgContainer.OS_MANAGE_LOCATIONS_URL
	  };
    
	  var defaultEdit = this.templateSubstitute("LW_DEFAULT_LOC_EDIT_TEMPLATE", defaultEditCfg);
	  if (defaultEdit) {
	    innerHTML += defaultEdit;
	  }
	} else { //saved and queried locations
	  var firstRecord = (type !== null && extra === SQFIRST) ? "sqlocation-record-first" : "";
	  innerHTML +=
	    '<li class="sqlocation-record line-item ' + firstRecord + ' ' + disabledClass + '" data-lid="' + locId + '" ' +
	    'data-acp="' + address + '" data-ltype="' + SQ_LOC +'" data-action="' + dataAction + '">' +
	    '<a data-lid="' + locId + '" data-acp="' + address + '" data-ltype="' + SQ_LOC +'" ' +
	    'data-action="' + dataAction + '" data-disabled="' + disabledFlg + '" href="javascript: void(0);" class="' + disabledClass + '">' +
	    displayStr +
	    '</a>' +
	    '</li>';
	}
	return innerHTML;
      }
      this.populateLocsSub = function(innerHTML, addedLocs, locations, srchStr) {
	var regexp = null;
	var locsSubCount = 0;
	if ((srchStr !== null) && (srchStr.length > 0)) {
	  regexp = new RegExp(srchStr,"i"); //Case independent regex.
	}
    
	for (var i = 0 ;
	     (i < locations.length) && (addedLocs.length < this.displayLocs) ;
	     i++) {
    
	  if (!this.canBeAddedToDisplayedLocs(locations[i], addedLocs)) {
	    continue; //These have already been added.
	  }
    
	  var location = locations[i];
	  var address = this.getAddressStr(location);
    
	  if (address === null) {
	    address = '';
	  }
	  var label = location.lbl;
	  if (label === null) {
	    label = "";
	  }
    
	  if (regexp !== null) {
	    if (!regexp.test(address) && !regexp.test(label)) {
	      continue;
	    }
	  }
    
	  // Increment the locsSub counter
	  locsSubCount++;
    
	  var htmlFrag = '';
    
	  if(locsSubCount === 1) { // First item
	    htmlFrag += this.populateLoc(SQ_LOC, locations[i], SQFIRST);
	  } else {
	    htmlFrag += this.populateLoc(SQ_LOC, locations[i]);
	  }
    
	  if (htmlFrag.length > 0) {
	    //This location could be added.
	    innerHTML += htmlFrag;
	    addedLocs.push(locations[i]);
	  } else {
	    //The location is not added decrement the locsSub counter
	    locsSubCount--;
	  }
	}
	return innerHTML;
      }
    
      this.isDisabledLoc = function(location) {
	//check if the location disabled field is already set
	if(typeof(location.disabled) !== "undefined" && location.disabled) {
	  return true;
	}
	//check the location level field set with proper value
	//some cases level field will be empty string or string 0
	//{"key":"zip","type":"string","content":""}
	//{"key":"zip","type":"string","content":"0"}
	if((!location[this.locationLevel]) ||
	   location[this.locationLevel] === "" ||
	   location[this.locationLevel] === "0") {
	  return true;
	}
	//The 'addr' field of a location is constructed out of
	//address line fields(line1 + line2 + line3 + line4) of YQL response.
	//For a zip level location the zip code should present in any of these
	//address lines. Confirm this before marking location as active in zip level
	if(this.locationLevel === "zip" &&
	   location["addr"].indexOf(location[this.locationLevel]) === -1) {
	  return true;
	}
	return false;
      }
    
      //mark the locations disabled by checking location level
      this.markDisabledLocs = function(locations) {
	// we don't want to show disabled locations
	filteredLocs = [];
	
	if(locations.length) {
	  for(var i = 0; i < locations.length; i++) {
	    //check if the filterCallback has been configured
	    if(this.filterCallback !== null) {
	      //filterCallback return TRUE then location will NOT be disabled
	      if(this.filterCallback(locations[i])) {
		locations[i].disabled = false;
		filteredLocs.push(locations[i]);
	      } else {
		locations[i].disabled = true;
	      }
	    }
	    if(this.isDisabledLoc(locations[i])) {
	      locations[i].disabled = true;
	    } else {
	      locations[i].disabled = false;
	      filteredLocs.push(locations[i]);
	    }
	  }
	//single location object
	} else if(typeof(locations) === "object") {
	  //check if the filterCallback has been configured
	  if(this.filterCallback !== null) {
	    //filterCallback return TRUE then location will NOT be disabled
	    if(this.filterCallback(locations)) {
	      locations.disabled = false;
	      filteredLocs.push(locations);
	    } else {
	      locations.disabled = true;
	    }
	  }
	  if(this.isDisabledLoc(locations)) {
	    locations.disabled = true;
	  } else {
	    locations.disabled = false;
            filteredLocs.push(locations);
	  }
	}
	
	return filteredLocs;
      }
    
      this.populateLocs = function(locations, srchStr) {
	var innerHTML = "",
	  globalDefaultIndex = -1;
	  globalPhysicalIndex = -1;
	//There could be chances that locations empty ue to backend failures
	if(locations && locations !== null) {
	  //mark user saved locations as active / inactive
	  locations = this.markDisabledLocs(locations);
	  //sort user saved locations
	  locations.sort(this.locationSorter);
	  if ((srchStr === null) || (srchStr.length === 0)) {
	    //This is the default display. So, let's hunt down the global-default
	    //and the global-physical.
	    for (var i = 0 ; i < locations.length ; i++) {
	      var id1 = locations[i].id;
	      if (id1.search("global-default-") !== -1) {
		globalDefaultIndex = i;
	      } else if (id1.search("global-physical-") !== -1) {
		globalPhysicalIndex = i;
	      }
    
	      if ((globalDefaultIndex !== -1) && (globalPhysicalIndex !== -1)) {
		break;
	      }
	    }
	  }
	}
    
	//show the detect block other than autocompletion , disambiguation cases
	if(!srchStr) {
	  innerHTML += this.populateDetectBlock();
	}
	//Keep track of which locations are being added, so we don't have duplicates
	var addedLocs = new Array();
    
	// Current location - global physical
	if (globalPhysicalIndex >= 0) {
	  innerHTML += this.populateLoc(CURRENT_LOC, locations[globalPhysicalIndex]);
	  addedLocs.push(locations[globalPhysicalIndex]);
	} else if((LocdropLocationPickerCommonInstance.upapiCurLoc !== null) && ((srchStr === null) || (srchStr.length === 0))) {
	  LocdropLocationPickerCommonInstance.upapiCurLoc = this.markDisabledLocs(LocdropLocationPickerCommonInstance.upapiCurLoc);
	  innerHTML += this.populateLoc(CURRENT_LOC, LocdropLocationPickerCommonInstance.upapiCurLoc);
	  addedLocs.push(LocdropLocationPickerCommonInstance.upapiCurLoc);
	}
    
	// Default location - global default
	if (globalDefaultIndex >= 0) {
	  innerHTML += this.populateLoc(DEFAULT_LOC, locations[globalDefaultIndex]);
	  addedLocs.push(locations[globalDefaultIndex]);
	} else if((LocdropLocationPickerCommonInstance.upapiDefLoc !== null) && ((srchStr === null) || (srchStr.length === 0))) {
	  LocdropLocationPickerCommonInstance.upapiDefLoc = this.markDisabledLocs(LocdropLocationPickerCommonInstance.upapiDefLoc);
	  innerHTML += this.populateLoc(DEFAULT_LOC, LocdropLocationPickerCommonInstance.upapiDefLoc);
	  addedLocs.push(LocdropLocationPickerCommonInstance.upapiDefLoc);
	} else if ((srchStr === null) || (srchStr.length === 0)) { // No default location set
	  var defaultAddCfg = {
	    displayStr      : this.msgContainer.OS_LOCATION_PICK,
	    displayTtl      : this.msgContainer.OS_LOCATION_PICK,
	    addStr          : this.msgContainer.OS_DEFAULT_LOC_ADD,
	    lType           : DEFAULT_LOC,
	    addLink         : this.msgContainer.OS_MANAGE_LOCATIONS_URL
	  };
    
	  var defaultAdd = this.templateSubstitute("LW_DEFAULT_LOC_ADD_TEMPLATE", defaultAddCfg);
	  if (defaultAdd) {
	    innerHTML += defaultAdd;
	  }
	}
    
	//Populate user locations obtained from YQL response
	if(locations && locations !== null) {
	  return this.populateLocsSub(innerHTML, addedLocs, locations, srchStr);
	//In case of autocomplete there  could be matches in the prefetched
	//current and default if saved location list empty
	} else if(srchStr !== null && srchStr.length) {
	  return this.populateLocsSub(innerHTML, new Array(), this.upapiExtracted, srchStr);
	}
	//No YQL feteched locations to populate, no autocomplete.
	//This will do the simple widget display with detect, current, default blocks
	return innerHTML;
      }
    
      this.getAddressStr = function(location) {
	if(location.disabled) {
	  var addrStr = location['addr'];
	  return addrStr;
	} else {
	  var addrStr = location[this.locationLevel];
	}
	if (addrStr === null) {
	  return null;
	}
	// zip level filter show city also
	if (this.locationLevel === 'zip') {
	  // Don't show location if zip is empty or zero
	  if (addrStr === "" || addrStr === "0") {
	    return null;
	  }
    
	  //Beware, sometimes city can be under zip. TBD.
	  if (location['city'] !== null) {
	    // Show city first then zip
	    addrStr = location['city'] + ", " + addrStr;
	  }
	}
	// city level filter show state and country code also
	if (this.locationLevel === 'city') {
	  if (typeof(location['sc']) !== "undeifned" && location['sc'] !== null) {
	    if(addrStr.length > 0) {
	      addrStr += ", ";
	    }
	    addrStr += location['sc'];
	  }
	  if (typeof(location['cc']) !== "undeifned" && location['cc'] !== null) {
	    if(addrStr.length > 0) {
	      addrStr += ", ";
	    }
	    addrStr += location['cc'];
	  }
	}
    
	return addrStr;
      }
    
      this.getDisplayStr = function(location, ltype) {
	var label = location.lbl;
	var displayStr = null;
	if ((location.lbl !== null) && (location.lbl !== "")) {
	  displayStr = location.lbl;
	} else {
	  displayStr = this.getAddressStr(location);
	}
    
	if (displayStr === null) {
	  return null;
	}
    
	var displayPixel = this.maxPixelLength;
	if(ltype === CURRENT_LOC) {
	  displayPixel = displayPixel - this.getOffsetWidth(this.msgContainer.OS_CURRENT_LOCATION);
	} else if(ltype === DEFAULT_LOC) {
	  displayPixel = displayPixel - this.getOffsetWidth(this.msgContainer.OS_DEFAULT_LOC_EDIT);
	}
	//Check if the display string offset width going beyond max value
	//If growing beyond, trim until display fit to bounds by excluding dot offset
	if(this.getOffsetWidth(displayStr) > displayPixel) {
	  var dotLength = this.getOffsetWidth("...");
	  while ((this.getOffsetWidth(displayStr) + dotLength) > displayPixel) {
	    displayStr = displayStr.substring(0, displayStr.length - 1);
	  }
	  return displayStr + "...";
	}
	return displayStr;
      }
    
      //Return the display offset pixel width for the display string
      this.getOffsetWidth = function(location) {
	var ruler = document.getElementById(this.rulerId);
	ruler.innerHTML = location;
	return ruler.offsetWidth;
      }
    
      this.canBeAddedToDisplayedLocs = function(toBeAddedLoc, addedLocs) {
	var id = toBeAddedLoc.id;
	var displayStr = this.getDisplayStr(toBeAddedLoc, SQ_LOC);
	for (var i = 0 ; i < addedLocs.length ; i++) {
	  var existingLoc = addedLocs[i];
	  if (id === existingLoc.id) {
	    return false;
	  }
	  var existingDisplayStr = this.getDisplayStr(existingLoc, SQ_LOC);
	  if (existingDisplayStr === displayStr) {
	    return false;
	  }
	}
    
	return true;
      }
    
      // This function will display the help overlay
      this.renderHelp = function() {
	var instance = this;
	instance.helpCloseId = this.makeElementId("helpCloseId");
	var helpCloseSelector = "#" + instance.helpCloseId;
	// contextual help container.
	instance.chelpOvlyId = instance.guid + "chelp_ovly";
    
	YUI().use('substitute', 'node', 'overlay', 'event', function(Y){
	  //get help overlay icon x,y position based which the help overlay rendered
	  var xy = Y.one("#" + instance.chelpId).getXY();
	  //get the view port region of the document body
	  var constrainRegion = Y.one("body").get("region");
	  //check the help overlay x co-ordinate position growing beyond the
	  //right view port by adding  help overlay width. If so get help overlay
	  //x co-ordinate position by deducting the overflowing width
	  if((xy[0] + instance.helpOverlayWidth) > constrainRegion.right) {
	    xy[0] =  xy[0] - parseInt((xy[0] + instance.helpOverlayWidth) - constrainRegion.right);
	  }
	  //check the help overlay x co-ordinate position less than left view port
	  //If so ajust the help overlay x co-ordinate position to left view port
	  if(xy[0] < constrainRegion.left) {
	    xy[0] =  constrainRegion.left;
	  }
	  if (typeof(helpOverlay) !== "undefined") { // help overlay exists then show it
	    //The widget position can be set dynamically, always get x,y position
	    helpOverlay.set("xy", [xy[0], xy[1] + instance.helpOverlayOffsetY]);
	    helpOverlay.set("zIndex", instance.zIndex + 1);
	    helpOverlay.show();
	  } else {
	    var chelpHtml = Y.substitute(instance.msgContainer.CURRENT_LOCATION_CONTEXTUAL_HELP,
					 {0 : instance.msgContainer.CURRENT_LOCATION_HELP_URL});
	    var helpContent = Y.substitute(instance.LW_CL_CONTEXTUAL_HELP_TEMPLATE, {
	      chelpHtml : chelpHtml,
	      closeId   : instance.helpCloseId,
	      chelpOvlyId : instance.chelpOvlyId,
	      privacyPolicyTxt : instance.msgContainer.PRIVACY_POLICY,
	      privacyPolicyUrl : instance.msgContainer.PRIVACY_POLICY_URL,
	      closeTxt: instance.msgContainer.CLOSE
	    });
    
	    // Create help overlay from markup
	    helpOverlay = new Y.Overlay({
	      bodyContent : helpContent,
	      render      : true,
	      visible     : true,
	      //help ovelay has higher zindex than widget state overlays
	      zIndex      : instance.zIndex + 1,
	      xy          : [xy[0], xy[1] + instance.helpOverlayOffsetY]
	    });
	  }
    
	  //Bind click event to help close button
	  Y.on("click", Y.bind(instance.hideHelp, instance), helpCloseSelector);
	});
      }
    
      //This function will hide the help overlay
      this.hideHelp = function() {
	if (typeof(helpOverlay) !== "undefined") {
	  helpOverlay.hide();
	}
      }
    
      // This function will substitute the template place holders
      this.templateSubstitute = function(template, cfg) {
	var data;
	var t = this;
	YUI().use('substitute', function (Y) {
	  data = Y.substitute(t[template], cfg);
	});
	return data;
      }
    
      // Disambiguate the search results
      this.disambiguateSearch = function(cnt) {
	//check the open state overlay object already exists
	if(typeof(openStateOverlay) !== "undefined") {
	  var instance = this;
	  var bodyContent = this.templateSubstitute("LW_LOCS_CONTAINER_TEMPLATE",
						  {lwBodyId : instance.lwBodyId, "topLocs" : cnt});
    
	  openStateOverlay.set("bodyContent", bodyContent);
	  openStateOverlay.set("footerContent", ""); // Remove overlay footer
	  this.registerLocationSelect(this); //Register location select event
	//create openStateOverlay for the first time, render disambiguation results
	//set footerFlg false, as we don't want to show the footer(Manage Location)
	} else {
	  this.openState(cnt, {footerFlg : false, detectHighlight: false});
	}
      }
    
      // Auto complete search results
      this.autoCompleteSearch = function(cnt) {
	var instance = this;
	var bodyContent = this.templateSubstitute("LW_LOCS_CONTAINER_TEMPLATE",
						  {lwBodyId : instance.lwBodyId, "topLocs" : cnt});
	openStateOverlay.set("bodyContent", bodyContent);
	openStateOverlay.set("footerContent", ""); // Remove overlay footer
	this.registerLocationSelect(this);
      }
    
      // This function will display the openState widget overlay
      // @param String cnt - location contents to be rendered on widget
      // @param Boolean footerFlg - The boolean flag to show / hide the widget footer
      // @param Array args
      //   Boolean footerFlg - The boolean flag to show / hide the widget footer
      //   Boolean detectHighlight - The boolean flag to show detect location block highlighted
      this.openState = function(cnt, args) {
	if (typeof(loadingStateOverlay) !== "undefined") {
	  loadingStateOverlay.hide();
	}
    
	this.lwBodyId = this.makeElementId("lwBody");
	this.lwFooterId = this.makeElementId("lwFooter");
    
	var instance = this;
	YUI().use('node', 'event', 'overlay', 'substitute', function(Y){
	  var bodyContent = Y.substitute(instance.LW_LOCS_CONTAINER_TEMPLATE,
					 {lwBodyId : instance.lwBodyId, "topLocs" : cnt});
	  var footerContent = Y.substitute(instance.LW_MANAGE_LOC_TEMPLATE,
					   {lwFooterId : instance.lwFooterId,
					    manageLocUrl : instance.msgContainer.OS_MANAGE_LOCATIONS_URL,
					    manageLocTxt : instance.msgContainer.OS_MANAGE_LOCATIONS});
	  //If not custom input
	  if(!instance.customInput) {
	    //Generate widget input box id
	    instance.inputId = instance.makeElementId("input");
	    var inputSelector = "#" + instance.inputId;
	    instance.lwHeaderId = instance.makeElementId("lwHeader");
	    var headContent = Y.substitute(instance.LW_OPEN_STATE_HEAD_TEMPLATE,
					 {lwHeaderId : instance.lwHeaderId, inputId : instance.inputId,
					  ghostTxt: instance.getGhostText()});
	    if(typeof(openStateOverlay) !== "undefined") {
	      openStateOverlay.set("headerContent", headContent);
	      openStateOverlay.set("bodyContent", bodyContent);
	      openStateOverlay.set("footerContent", "");
	      //The widget position can be set dynamically, always get x,y position
	      openStateOverlay.set("zIndex", instance.zIndex);
	      openStateOverlay.show();
	    } else {
	      openStateOverlay = new Y.Overlay({
		  headerContent: "",
		bodyContent  : bodyContent,
		footerContent: "",
		width       : instance.minWidth,
		zIndex      : instance.zIndex,
		xy		: [instance.positionXY[0], instance.positionXY[1]],
		render      : false,
		visible     : true
	      });
	      openStateOverlay.render(instance.renderTarget);
	    }
    
	    //Remove the ghost text while ghosting | focusing on the input box
	    instance.detachGhosting(instance.inputId);
    
	    //Bind input box keyup event
	    Y.on("keyup", Y.bind(instance.handleInputEvents, instance), inputSelector);
    
	  //If property is using custom input field, do not show the header block
	  } else {
    
	    if(typeof(openStateOverlay) !== "undefined") {
	      openStateOverlay.set("bodyContent", bodyContent);
	      openStateOverlay.set("zIndex", instance.zIndex);
	      openStateOverlay.show();
	    } else {
	      openStateOverlay = new Y.Overlay({
		bodyContent  : bodyContent,
		footerContent: "",
		width       : instance.minWidth,
		zIndex      : instance.zIndex,
		xy          : [instance.positionXY[0], instance.positionXY[1]],
		render      : false,
		visible     : true
	      });
	      openStateOverlay.render(instance.renderTarget);
	    }
    
	  }
    
	  //Bind help icon click to the help overlay render method
	  Y.on("click", Y.bind(instance.renderHelp, instance), "#" + instance.chelpId);
	  //Bind location item click event to location items
	  instance.registerLocationSelect(instance);
    
	  //Show detect location block highlighted
	  if(args.detectHighlight) {
	    Y.one('ul#' + instance.lwBodyId + ' li.clocation-record').addClass('clocation-detected');
	    //Setting timeout for removing the highligted class
	    setTimeout(Y.bind(function(e) {
	      Y.one('ul#' + instance.lwBodyId + ' li.clocation-record').removeClass('clocation-detected');
	    } , this), 1500);
	  }
    
	});
    
	//Intialize the overlay focus manager for the first time
	if(typeof instance.overlayContentBox === "undefined") {
	    instance.initFocusManager();
	}
    
	//Set widget state to OPEN
	instance.state = OPEN;
      }
    
      //Register ghosting | focusing events to input box for resetting ghost text
      //@param - selectorId, the element id of which we want to detach the ghosting
      //Properties can make use of this method if want to detach custom ghosting
      this.detachGhosting = function(selectorId) {
	var selector = "#" + selectorId;
	YUI().use('node', 'event', function(Y) {
	  Y.on("ghosting|focus", function(e) {
	    var n = e.target;
	    n.set("value", "");
	    n.removeClass("ghost-text");
	    Y.detach('ghosting|focus');
	  }, selector, this);
	});
      }
    
      //Generate the ghost text based on widget location level
      this.getGhostText = function() {
	var ghostText = "";
	switch (this.locationLevel) {
	  case "city":
	    ghostText = this.msgContainer.GHOST_TEXT_CITY;
	    break;
	  case "zip":
	    ghostText = this.msgContainer.GHOST_TEXT_ZIP;
	    break;
	  default:
	    ghostText = this.msgContainer.GHOST_TEXT_ADDR;
	}
	return ghostText;
      }
    
      //Initalize the overlay focus manager for handling keypress location selection
      this.initFocusManager = function() {
	var instance = this;
	YUI().use('node-focusmanager', function(Y){
	  instance.overlayContentBox = openStateOverlay.get("contentBox");
	  instance.overlayContentBox.plug(Y.Plugin.NodeFocusManager, {
	    descendants: "a",
	    keys: {next: "down:40", // down arrow key press
		   previous: "down:38"}, // up arrow key press
	    focusClass: {
	      className: "line-item-focus",
	      fn: function (node) {
		return node;
	      }
	    },
	    circular: false
	  });
	});
      }
    
      //method to render location hover over tooltip
      this.showTooltip = function(e) {
	e.preventDefault();
      }
    
      this.hideTooltip = function(e) {
	if(typeof(tooltipOverlay) !== "undefined") {
	    tooltipOverlay.hide();
	}
      }
    
    
      //Register the location item click event on location items
      this.registerLocationSelect = function(instance) {
	YUI().use('node', 'event', function(Y){
	  Y.one('#' + instance.lwBodyId).delegate('click', instance.dispatchCallback, '.line-item', instance);
	});
      }
    
      //Dispatch the callback based on data action on location item
      this.dispatchCallback = function(e) {
	var target = e.target,
	  locationId = '',
	  dataAction = '';
	  
	if (target.hasClass("line-item")) {
	  target = target.one("a");
	}
    
	locationId = target.getAttribute("data-lid"),
	dataAction = target.getAttribute("data-action");
	//Check if clicked on a location item having data-lid and data-action
	if(locationId && dataAction) {
	  LocdropLocationPickerCommonInstance.actionCallback(this.id, dataAction, locationId);
	}
      }
    
      // This function will handle the input field key events.
      // Disambiguation search while pressing enter key press
      // and autocomplete search for matching input string on keyup
      this.handleInputEvents = function(e) {
	var instance = this;
    
	// if the value in input field is empty, show widget open state.
	var input = e.target,
	    inputVal = YUI().Lang.trim( input.get("value") );
    
	// down key should focus the locations in widget or the
	// autocomplete list.
	if ( 40 === e.keyCode ) { // down arrow
	  instance.overlayContentBox.focusManager.refresh();
	  instance.overlayContentBox.focusManager.set("activeDescendant", 0);
	  instance.overlayContentBox.focusManager.focus();
	  // Prevent bubbling and default action
	  e.halt();
	  return;
	}
    
	// if there is no input, do nothing
	if("" === inputVal) {
	  // if the autocomplete is rendered, re-render the widget.
	  //var locs = instance.getYQLAccessor().getCtxTypeLocs("*", "*");
	  //var cnt = instance.populateLocs(locs, inputVal);
	  ////showing the full widget, set footerFlg to true
	  //instance.openState(cnt, {footerFlg : false, detectHighlight: false});
	  //this.setState(REOPEN);
	  return;
	}
    
	// if the keycode is enter (13) disambiguate.
	if (13 === e.keyCode) {
    
	  //invoke findlocation geocoding method
	  return this.findlocationGeocode(inputVal, this);
    
	// else autocomplete.
	} else {
    
	  //No real data... Just do a search...
	  // We need to do a search if string large enough to start search
	  // And while completely removing the string
	  if (input === null ||
	      (inputVal.length >= 1 && inputVal.length < this.searchStartLen)) {
	    return false;
	  }
	  var locs = instance.getYQLAccessor().getCtxTypeLocs("*", "*");
	  var cnt = instance.populateLocs(locs, inputVal);
	  instance.autoCompleteSearch(cnt);
	  return true;
	}
      }
    
      this.findlocationRetry = function() {
	var instance = this;
	var inputVal = "";
	YUI().use("node", function(Y) {
	   inputVal = Y.one("#" + instance.inputId).get("value");
	});
	inputVal = YUI().Lang.trim( inputVal );
	this.findlocationGeocode(inputVal);
      }
    
      //method for invoking widget geocoding search, independant of the event handler
      this.findlocationGeocode = function (inputVal) {
	if (inputVal !== null && inputVal.length !== 0) {
	  var success = LocdropLocationPickerCommonInstance.geocode(inputVal, this);
	  if (success) {
	    this.setState(LOADING);
	    return true;
	  }
	}
	return false;
      }
    
      //Common handler for document keyup event
      this.handleDocumentKeyup = function(e) {
	if (27 === e.keyCode) { // escape key press
	  this.close();
	  //Prevent bubbling and default action
	  e.halt();
	  return;
	}
      }
    
      // Trap the document click event
      // Hide Overlay while clicking outside
      this.handleDocumentClick = function(e) {
	if(!this.clickedInside(e, null)) {
	  this.close();
	}
      }
    
      //This method will determine whether clicked inside or outside widget
      //Will return Boolean true / false
      this.clickedInside = function(e, id) {
	var instance = this;
	var target = e.target,
	  tid = target.get("id"),
	  tclass = target.getAttribute("class"),
	  //make sure that parent node exists before accessing it's attribute value
	  //this check is required as we found that otherwise will cause JS error
	  tpid = (target.get("parentNode")) ? target.get("parentNode").get("id") : null,
	  tpclass = (target.get("parentNode")) ? target.get("parentNode").getAttribute("class") : null;
    
	//Widget / Help overlay inside click check
	if((tid || tpid) &&
	   (tid === instance.inputId ||
	   tid === instance.err_container_id ||
	   tid === instance.err_close_id ||
	   tid === instance.err_retry_id ||
	   tpid === instance.lwHeaderId ||
	   tpid === instance.lwBodyId ||
	   tpid === instance.lwFooterId ||
	   tpid === instance.anchorId ||
	   tid === instance.anchorId ||
	   tid === instance.chelpId ||
	   tid === instance.helpCloseId ||
	   tid === instance.detectGeoId ||
	   tid === instance.chelpOvlyId ||
	   tpid === instance.chelpOvlyId)) {
	  return true;
	}
    
	//If an attribute id passed, check that as well
	if(id && (tid === id || tpid === id)) {
	  return true;
	}
    
	//don't hide widget while clicking disabled locations
	if((tclass || tpclass) &&
	   ((tclass.indexOf("lw-loc-disabled") !== -1) ||
	   (tpclass.indexOf("lw-loc-disabled") !== -1))) {
	  return true;
	}
    
	return false;
      }
    
      this.handleGet = function(context) {
	// Checking response success/failure
	if (context.errObj.errCode) {
	  //Error state.
	  context.widget.setError(context.errObj);
	  return;
	}
	context.widget.open(context.locs);
      }
    
      this.open = function(locType) {
	//If the widget configured to use a different locale and the static resource
	//container is not initialized, check for the availabilty of global YALA
	//callback response and initialize the message container
	if(this.defaultLocale !== this.locale && this.yrbContainer === null) {
	  var localevar = this.locale.split("-").join("_");
	  if(window["ulwv2yrb_" + localevar]) {
	    this.setYrbContainer(window["ulwv2yrb_" + localevar]);
	  }
	}
    
	//data will be null.
	var yql = this.getYQLAccessor();
	var allLocs = yql.getCtxTypeLocs("*", "*");
	if (allLocs === null) {
	  var cbCtx = {
	    widget : this,
	    locs   : locType
	  };
	  //Always make context type call to YQL if there are no cached locations
	  yql.fetchCtxTypeLocs("*", "*", this.handleGet, cbCtx);
	  this.setState(LOADING);
	  return true;
	}
    
	this.setState(LOADING);
	var cnt = this.populateLocs(allLocs, null);
	//check wheather the widget is going to open after location detection
	//then set the detect location highlight flag
	if(locType === DETECT) {
	  this.openState(cnt, {footerFlg : false, detectHighlight: true});
	// if not show the widget
	} else {
	  this.openState(cnt, {footerFlg : false, detectHighlight: false});
	}
      }
    
      //Set state to CLOSE and hide widget overlays
      this.close = function() {
	this.setState(CLOSED);
      }
    
      this.geocodeDone = function(result) {
	var count = result.query.count;
    
	//Two cases:
	//Either we did not get anything.
	if (count === 0) {
	  searchContent = this.templateSubstitute("LW_ERR_MSG",
						  {msg : this.msgContainer.LW_LOC_DISABLED_INFO});
	  this.disambiguateSearch(searchContent);
	  this.setState(REOPEN);
//	  this.openState(searchContent, {footerFlg : false, detectHighlight: false});
	  return;
	}
    
	//Or we found something. Even if we found an unique item, it is better to
	//get a confirmation from the user.
	var locs = null;
	if (count === 1) {
	  //Unfortunately, when count == 1, we don't get back an Array!
	  locs = new Array();
	  locs.push(result.query.results.Result);
	} else {
	  locs = result.query.results.Result;
	}
    
	var i;
	var locsLen = locs.length;
	for (i = 0 ; i < locsLen ; i++) {
	  var addr = "";
	  if (locs[i].line1 !== null) {
	    addr = locs[i].line1;
	  }
	  if (locs[i].line2 !== null) {
	    if (addr.length > 0) {
	      addr += ', ';
	    }
	    addr += locs[i].line2;
	  }
	  if (locs[i].line3 !== null) {
	    if (addr.length > 0) {
	      addr += ', ';
	    }
	    addr += locs[i].line3;
	  }
	  if (locs[i].line4 !== null) {
	    if (addr.length > 0) {
	      addr += ', ';
	    }
	    addr += locs[i].line4;
	  }
	  locs[i].id = 'new-' + Base64.encode(addr);
	  locs[i].addr = addr;
	  if(locs[i].uzip !== null && locs[i].uzip !== "" && locs[i].uzip !== "0") {
	    locs[i].zip =locs[i].uzip;
	  }
	  if(locs[i].statecode !== null) {
	    locs[i].sc =locs[i].statecode;
	  }
	  if(locs[i].countrycode !== null) {
	    locs[i].cc =locs[i].countrycode;
	  }
	  if(locs[i].country !== null) {
	    locs[i].ctry =locs[i].country;
	  }
	  if(locs[i].latitude !== null) {
	    locs[i].lat =locs[i].latitude;
	  }
	  if(locs[i].longitude !== null) {
	    locs[i].lon =locs[i].longitude;
	  }
	  if(locs[i].woeid !== null) {
	    locs[i].woe =locs[i].woeid;
	  }
	  locs[i].app = this.app;
	  locs[i].ctx = this.ctx;
	  locs[i].type = this.geoPlaceType;
	}
    
	//mark locations as active / inactive
	locs = this.markDisabledLocs(locs);
	//sort it so that active locations should come top
	locs = locs.sort(this.disabledSorter);
    
    
	//Add the geocoded location results to the searchItemList holder
	this.searchItemList = locs;
    
	if (this.callback && this.directGo && locs.length>0) {
	  this.loc = locs[0];
	  this.callback(this);
	  return;
	}
    
	var addedLocs = new Array();
	var searchContent = this.populateLocsSub("", addedLocs, locs, null);
	// If no matching record found will get empty result string
	if(searchContent === "") {
	  searchContent = this.templateSubstitute("LW_ERR_MSG",
						  {msg : this.msgContainer.LW_LOC_DISABLED_INFO});
	}
	this.disambiguateSearch(searchContent);
	this.setState(REOPEN);
      }
    
      this.handleAction = function(eventStr, data) {
	return this[eventStr](data);
      }
    
      // Template for widget head block with the default input box
      this.LW_OPEN_STATE_HEAD_TEMPLATE =
	'<div id="{lwHeaderId}">' +
	'<label for="{inputId}" class="hide">{ghostTxt}</label>' +
	// 3% is 10px of 300px which is the standard widget width.
	'<input type="text" class="lc-input ghost-text" id="{inputId}" value="{ghostTxt}" style="width:97%;"/>' +
	'</div>';
    
      // Template for the location container
      this.LW_LOCS_CONTAINER_TEMPLATE =
	'<ul id="{lwBodyId}" class="locations-container">' +
	'{topLocs}' +
	'</ul>';
    
      // Template for the location container
      this.LW_LOCS_CON_TEMPLATE =
	'<ul class="locations-container">' +
	'{clMkup}' +
	'{dlMkup}' +
	'{lcsMkup}' +
	'</ul>';
    
      // Template for detect location
      this.LW_DETECT_LOC_TEMPLATE =
	'<li class="detectlocation-con">' +
	'<div style="float:left;">' +
	'<div class="{detectIconCls} line-item {locClass}" data-ltype="{lType}" data-lid="{detectId}" ' +
	'data-acp="" data-action="{dAction}" data-disabled="{disabledFlg}">' +
	'<a id="{detectId}" data-lid="{detectId}" data-ltype="{lType}" data-action="{dAction}" ' +
	'data-acp="{detectTtl}" href="javascript: void(0);" data-disabled="{disabledFlg}" class="{locClass}">' +
	'{displayStr}' +
	'</a>' +
	'</div>' +
	'</div>' +
	'<a id="{chelpId}" href="javascript: void(0);" class="chelp-anchor" role="button">' +
	'<span>{helpTxt}</span>' +
	'</a>' +
	'<div id="{eclOptinId}" class="messageBox hide">' +
	'</div>' +
	'</li>' +
	'<li class="lw-separator" style="clear:both;"></li>';
    
      // Template for current location record  with label
      this.LW_CURRENT_LOC_TEMPLATE =
	'<li class="clocation-record line-item {locClass}" data-lid="{locId}" data-ltype="{lType}" ' +
	'data-action="{dAction}"  data-acp="{displayTtl}">' +
	'<a data-lid="{locId}" data-acp="{displayTtl}" data-ltype="{lType}" class="{locClass}" ' +
	'data-action="{dAction}" data-disabled="{disabledFlg}" href="javascript: void(0);" title="">' +
	'{displayStr} ' +
	'<span class="non-label" data-lid="{id}">' +
	'({curLocTxt})</span>' +
	'</a></li>' +
	'<li class="lw-separator"></li>';
    
      // Template for default location record  edit with label
      this.LW_DEFAULT_LOC_EDIT_TEMPLATE =
	'<li class="dlocation-record line-item {locClass}" data-lid="{locId}" data-ltype="{lType}" ' +
	'data-action="{dAction}" data-acp="{displayTtl}">' +
	'<a data-lid="{locId}" data-acp="{displayTtl}" data-ltype="{lType}" class="{locClass}" ' +
	'data-action="{dAction}" data-disabled="{disabledFlg}" href="javascript: void(0);" title="">' +
	'{displayStr}' +
	'</a> ' +
	'<span><a class="non-label" style="color: #6C717A" id="{defEditId}" href="{editLink}" taget="_blank">({editStr})</a></span>' +
	'</a></li>' +
	'<li class="lw-separator"></li>';
    
      // Template for default location record  add with label
      this.LW_DEFAULT_LOC_ADD_TEMPLATE =
	'<li class="line-item dlocation-wrap" data-lid="" data-ltype="{lType}">' +
	'<div class="dlocation-icon"></div>' +
	'<div style="margin-left: 30px">' +
	'<a data-lid="" data-acp="" taget="_blank" data-ltype="{lType}" href="{addLink}" title="">' +
	'{displayStr} ' +
	'<span class="non-label" style="color: #6C717A">({addStr})</span>' +
	'</a></div></li>' +
	'<li class="lw-separator"></li>';
    
      // Template for saved and queried locations
      this.LW_SQ_LOC_TEMPLATE =
	'<li class="sqlocation-record line-item {sqfirstClass}" data-lid="{locId}" ' +
	'data-acp="{address}" data-ltype="{lType}" data-action="{dAction}">' +
	'<a data-lid="{locId}" data-acp="{address}" data-ltype="{lType}" ' +
	'data-action="{dAction}" href="javascript: void(0);" title="{address}">' +
	'{displayStr}' +
	'</a>' +
	'</li>';
    
      // Template for saved and queried locations
      this.LW_ERR_RETRY_TEMPLATE =
      '<a class="lw-loc-errretry non-label" href="javascript:;" id="{retryId}">({retryMsg})</a>';
    
      // Template for widget error block
      this.LW_LOC_ERR_TEMPLATE =
	'<li id="{errContId}" class="lw-loc-errcon {hiddenCls}" data-ltype="{lType}">' +
	'<div class="lw-loc-errouter">' +
	'<div class="line-item lw-loc-errblock" data-ltype="{lType}">' +
	'<span id="{errMsgId}" class="lw-loc-errmsg" href="javascript:;">{errMsg} {retryLink}</span>' +
	'</div>' +
	'</div>' +
	'<a id="{errCloseId}" href="javascript: void(0);" class="lw-loc-errclose" role="button">' +
	'</a>' +
	'</li>' +
	'<li id="{errSeparatorId}" class="lw-separator" style="clear:both;"></li>';
    
      // Template for manage locations link
      this.LW_MANAGE_LOC_TEMPLATE =
	'<ul id="{lwFooterId}" class="zero-margin">' +
	'<li class="lw-separator"></li>' +
	'<li class="ml line-item">' +
	'<a href="{manageLocUrl}" id="{id}" target="_blank">{manageLocTxt}</a>' +
	'</li>' +
	'</ul>';
    
      // Template for contextual help
      this.LW_CL_CONTEXTUAL_HELP_TEMPLATE =
	'<div class="lw-contextual-help-ovly" id="{chelpOvlyId}" role="alert">' +
	'<div class="lw-contextual-help-close">' +
	'<a id="{closeId}" href="javascript: void(0);"><span>{closeTxt}</span></a>' +
	'</div>' +
	'<div> {chelpHtml} </div> <br/>' +
	'<div> <a href="{privacyPolicyUrl}" target="_blank">{privacyPolicyTxt}</a> </div>' +
	'</div>';
    
      // Template for loading message
      this.LW_LOADING_MSG =
	'<div class="lw-loading-msg">' +
	'<img src="http://l.yimg.com/a/i/ww/met/anim_loading_sm_082208.gif"/>' +
	//Holder for the string pixel offset width calculation
	'<span id="{rulerId}" class="lw-pixel-ruler"></span>' +
	'</div>';
    
      // Template for error message, borrowing lw-loading-msg style
      this.LW_ERR_MSG =
	'<div class="lw-loading-msg">' +
	'<p>{msg}</p>' +
	//Holder for the string pixel offset width calculation
	'<span id="{rulerId}" class="lw-pixel-ruler"></span>' +
	'</div>';
    
    
      // Template for widget closed state, Default invocation point with anchor icon
      this.LW_ANCHOR_TEMPLATE =
	'<a class="lw-anchor-item" id="{anchorId}">' +
	'<span class="lw-anchor-icon"></span>' +
	'<span class="lw-anchor-txt">{anchorTxt}</span>' +
	'</a>';
    
      // Template for disabled location tooltip
      this.LW_LOC_TOOLTIP_TEMPLATE =
	'<div class="lw-tooltip-box">' +
	'<div class="lw-tooltip-cnt"> ' +
	'<span class="{disabledLocIcon}"> </span>' +
	'<span>{hoverCnt}</span>' +
	'</div>' +
	'{disabledInfoBlk}' +
	'<div class="lw-tooltip-bubleup"> </div>' +
	'</div>';
    
      // Template for disabled location tooltip info block
      this.LW_DISABLED_LOC_INFO_TEMPLATE =
	'<div class="lw-tooltip-infoblk">' +
	'<div class="lw-separator" style="margin: 3px 0"> </div>' +
	'<span class="non-label">{disabledInfo}</span>' +
	'</div>';
    
      LocdropLocationPickerCommonInstance.addWidget(this);
    
      return this;
    }
}, "0.1");