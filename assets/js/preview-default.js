YUI.add('media-preview-default', function(Y)
{
    "use strict";

    var HOVER_TARGET_SELECTOR   = ' .generic-list-item';

    /**
    @class ContentPreview
    @namespace Media
    @extends Base
    **/
    Y.namespace('Media').ContentPreview = Y.Base.create('media-preview-default',Y.Base,[], {


        initializer: function (e) {
            var hoverItems = Y.all('#' + e.mod_id + HOVER_TARGET_SELECTOR + ' a');
            hoverItems.on('mouseenter', function(e){ 
                e.currentTarget.ancestor(HOVER_TARGET_SELECTOR).addClass('hover'); 
            });
            hoverItems.on('mouseleave', function(e){ 
                e.currentTarget.ancestor(HOVER_TARGET_SELECTOR).removeClass('hover'); 
            });
        }

    });

}, '0.1', { requires:['node-base','event-base'] });
