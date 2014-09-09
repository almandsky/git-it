YUI.add('media-lead', function(Y)
{
    Y.namespace('Media.Lead');
    var Lead = Y.Media.Lead;
    Lead.MediaContentLead = {
        'init' : function(config)
        {
            var leadClickFunc = function(e) {
                var cookieDomain = Y.config.win.location.hostname,
                    contextData = '',
                    Cookie  = Y.Cookie;
                
                function getExpiry(){
                    var now = new Date();
                    now.setFullYear(now.getFullYear() + 1);
                    return now;
                }

                function setUserModuleState(key, value){
                    setCookieValue("fpms", "u_30345786", "context", value);
                }

                function setCookieValue(cookieName, key, subkey, value){
                    var cookieValue = Cookie.getSub(cookieName, key),
                        data = cookieValue ? Y.JSON.parse(cookieValue) : {};
                    data[subkey] = value;
                    Cookie.setSub(cookieName, key, JSON.stringify(data), { expires: getExpiry(), domain: cookieDomain, path: "/" });
                }
                contextData = { cat: config.cat, catName: config.catName, listid: config.listid, u: e.currentTarget.getAttribute("data-uuid") };
                setUserModuleState("context", contextData);
            };

            Y.one('.yom-lead').delegate('click', leadClickFunc, 'a');
        }
    };

}, '0.1', { requires:['node-base','event-base', 'cookie', 'json-parse'] });

