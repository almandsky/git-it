YUI.add('media-preview-thumbnail', function(Y)
{
    "use strict";

    var HOVER_TARGET_SELECTOR   = '.latest-content-inline .video',
        previews = [];

    /**
    @class ContentPreview
    @namespace Media
    @extends Base
    **/
    Y.namespace('Media').ContentPreview = Y.Base.create('media-preview-thumbnail',Y.Base,[], {

        initializer: function (items) {
            var self = this,
                videos = Y.all(HOVER_TARGET_SELECTOR);

            for ( var i=0; i < items.length; i++) {
                var item = items[i];
                if (item.display_video_preview_thumbnail === true) {
                    previews[item.uuid] = item.content_video_preview[0];
                }
            }


            videos.each(function (videoItem) {
                var uuid = videoItem.getData('uuid');

                if (previews[uuid]) {
                    // register events
                    videoItem.on('mouseenter', self._onVideoThumbMouseEnter, self);
                    videoItem.on('mouseleave', self._onVideoThumbMouseLeave, self);
                }
            });

        },

        _onVideoThumbMouseEnter : function(e) {
            e.stopPropagation();
            var self = this,
                videoNode = e.currentTarget,
                previewloaded = videoNode.getData('previewloaded');

            videoNode.setAttribute('data-mousedetect','in');
            if (previewloaded) {
                self.showPreview(videoNode);
            } else {
                self.loadPreview(videoNode);
            }
        },

        _onVideoThumbMouseLeave : function(e) {
            e.stopPropagation();
            var self = this,
                videoNode = e.currentTarget,
                thumb = videoNode.one("img"),
                origThumb = videoNode.getData("source"),
                previewloaded = videoNode.getData('previewloaded');

            videoNode.setAttribute('data-mousedetect','out');
            if (previewloaded) {
               thumb.setAttribute("src", origThumb); 
            }
        },

        loadPreview : function(videoNode) {
            var self = this,
                uuid = videoNode.getData("uuid"),
                source = previews[uuid].url,
                previewNode = Y.Node.create('<img style="display:none">');

            previewNode.on('load', Y.bind(self.showPreview, self, videoNode));

            if (source) {
                var thumb = videoNode.one("img"),
                    origThumb = thumb.getAttribute("src");
 
                previewNode.setAttribute('src',source);
                videoNode.setAttribute("data-source", origThumb);
                videoNode.setAttribute('data-previewloaded', '1');
            } 

        },

        showPreview : function(videoNode) {
            var self = this,
                uuid = videoNode.getData("uuid"),
                source = previews[uuid].url,
                thumb = videoNode.one("img");

            if (videoNode.getData('mousedetect') === 'in') {
                thumb.setAttribute("src", source);
            }
        }

    });

}, '0.1', { requires:['node-base','event-base', 'json-parse'] });
