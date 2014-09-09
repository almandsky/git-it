/**
 * this file replaces weather-search.js
 * it hooks up the loc drop widget to the UH3 search input
 */

// global location widget object variable
var g_ulw2,
    g_WeahterUhSearch = 'media-weather-uh-search';
    
// The yala callback function for the yrb initialization
function LocdropLocationWidgetYalaResp(response) {
    "use strict";
    // Reset pending call flag
    g_ulw2.setPendingYrbCall(false);
    // Initialize the widget message container with the yrb response
    g_ulw2.setYrbContainer(response);
}

YUI.add(g_WeahterUhSearch,
function(Y) {
    "use strict";
    
    var	modId='',
	SEC_UH='uh',
	attachToId = "mnp-search_box",
	attachToSelector = "#"+attachToId,
	searchInputContainer = Y.one('.yucs-form-input'),
	searchInputNode = searchInputContainer? searchInputContainer.one(attachToSelector) : null,
	containerWidth = (searchInputNode ? searchInputNode.get('offsetWidth') : 0),
	searchButtonName = 'yucs-sprop_button',
	searchGoNode = Y.one('#'+searchButtonName);
	
    Y.namespace("Media").Weather = {
        UhSearch: (function() {
	    var cfg = {
		    renderTarget: searchInputContainer,
		    directGo : false,
		    divID : attachToId,
		    appID : "universal_location_widget__v2",
		    ctx   : "weather",
		    locale: "en-US",
		    locationLevel : "city",
		    callback : onSelectLocation,
		    crumb : "",
		    upapiExtracted : {currentLoc : 'null',
				      defaultLoc : 'null' },
		    placeFinderGflags : false,
		    hkloc:"",
		    prefix:"",
		    customInput: true,
		    yrbPath : "/rl/ulw/yrb/2.2.3/",
		    positionXY : [0, 34]
		};
		
	    /**
	     * @param {string} section  ult sec value
	     * @param {string} linkname ult link title
	     * @param {string} bucket   test bucket id
	     * @param {object} keys	additional ult keys {itc, tar, slk}
	     */
	    function rapidClick(section, linkname, bucket, keys) {
                var e = {
                        data: {
                            sec: section,
                            linkname: linkname,
                            test: bucket,
                            keys: keys 
                        },
                        mod_id: modId
                };
                // handled in Y.Media.RapidTracking
                Y.Global.fire('rapid-tracker:click', e);
            }
	    
	    function onSelectLocation(widg) {
                var e = widg.loc,
		    data = null,
		    i = 0,
		    p = -1,
		    searchVal = searchInputNode.get('value'),
		    url = '';
		    
                if(cfg.locale==='zh-Hant-HK' && cfg.hkloc !== '' ){
                    data = Y.JSON.parse(cfg.hkloc);
                    for (i = data.HKOLoc.length - 1; i >= 0; --i) {
                        p = data.HKOLoc[i].woeid;
                        if(e.woe===p){
                            document.location.href = data.HKOLoc[i].url;
                            return;
                        }
                    }
                }

                if(e.state === null) {
                    e.state = e.city;
                }
                if(e.city === null) {
                    e.city = e.state;
                }
                if(e.city === null) { //both city and state are empty
                    e.city = e.state = e.ctry;
                }
                if(e.ctry === null) {
                    e.ctry = e.state;
                }
                url = '/' + e.ctry + '/' + e.state + '/' + e.city + '-' + e.woe + '/';
                url = url.toLowerCase();
                url = url.replace(/[\']/g, '');
                url = url.replace(/[,\s]/g, '-');
                if(cfg.prefix !== ''){
                    url = '/' + cfg.prefix + url ;
                }
		
		
		rapidClick(SEC_UH, searchVal, '', {itc:0, tar:url, slk: ''});
                document.location.href = url;
            }
	    
            return {
                init: function(oCfg) {
		    if (!searchInputNode) {
			return;
		    }
		    modId = oCfg.modId;
		    
                    var handleInputClick = function(e) {
			    e.preventDefault();
			    Y.log('input clicked');
			    var inputVal = searchInputNode.get('value');
			    
			    rapidClick(SEC_UH, inputVal, '', {itc:0, tar:'', slk: attachToId});
			    if (inputVal === '') {
			        g_ulw2.open();
			    }
			},
			handleKeyUp = function(e) {
			    var inputVal = searchInputNode.get('value');
			    if (13 === e.keyCode) {
				rapidClick(SEC_UH, inputVal, '', {itc:0, tar:'enterKey', slk: attachToId});
			    }
			    g_ulw2.handleInputEvents(e);
			};
		    
		    if (oCfg.directGo) {
			cfg.directGo = oCfg.directGo;
		    }
                    cfg.locale = oCfg.locale;
                    cfg.hkloc=oCfg.hkloc;
                    cfg.prefix=oCfg.prefix;
                    cfg.crumb = oCfg.crumbVal;
                    cfg.upapiExtracted.currentLoc = oCfg.curLocObj;
                    cfg.upapiExtracted.defaultLoc = oCfg.defLocObj;
		    cfg.zIndex = 10000801; // sits over UH3
		    cfg.minWidth = containerWidth;
		    
		    if (searchInputNode) {
			searchInputNode.setAttribute('placeholder', 'Enter city, state (Sunnyvale, CA)');
		    }
                    if (searchGoNode) {
			searchGoNode.removeClass('hide');
		    }

                    g_ulw2 = new Y.Media.Weather.LocdropHacked(cfg);
                    g_ulw2.init();

                    //Keyup handler for input field events
                    Y.on("keyup", handleKeyUp, searchInputNode);

                    //Input field click handler
                    Y.on("click", handleInputClick, searchInputNode);

                    //Document click handler for closing widget while clicking out side inputbox
                    Y.on("click", function(e) {
                        //Close the widget while clicking out side
                        if(!g_ulw2.clickedInside(e, attachToId)) {
                            g_ulw2.close();
			    
			    rapidClick(SEC_UH, 'close', '', {itc:0, tar:'', slk: 'clickOut'});
                        }
                    }, document, g_ulw2);

                    Y.on("click", function(e) {
			e.preventDefault();
                        var inputVal = searchInputNode.get('value');
			    
			rapidClick(SEC_UH, inputVal, '', {itc:0, tar:'search', slk: searchButtonName});
                        if (inputVal !== '') {
                            g_ulw2.findlocationGeocode(inputVal);
                        }
                    }, searchGoNode);
                }
            };

        })()
    };
},
'0.0.1', {
    requires: ['event-focus', 'event']
});
