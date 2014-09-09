YUI.add('media-preview-slideshow', function(Y)
{
    "use strict";

    var HOVER_TARGET_SELECTOR   = '.latest-content-inline .video',
        previews = [],
        loadedPreviews = [];

    /**
    @class ContentPreview
    @namespace Media
    @extends Base
    **/
    Y.namespace('Media').ContentPreview = Y.Base.create('media-preview-slideshow',Y.Base,[], {

        initializer: function (items) {
            var self = this,
                videos = Y.all(HOVER_TARGET_SELECTOR);

            for ( var i=0; i < items.length; i++) {
                var item = items[i];
                if (item.display_video_preview_thumbnail === true) {
                    previews[item.uuid] = item.content_video_preview;
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
                self.showSlide(videoNode, 0);
            } else {
                self.loadPreview(videoNode);
            }
        },

        _onVideoThumbMouseLeave : function(e) {
            e.stopPropagation();
            var self = this,
                videoNode = e.currentTarget,
                previewloaded = videoNode.getData('previewloaded');

            videoNode.setAttribute('data-mousedetect','out');
            if (previewloaded) {
                var preview = videoNode.one(".preview_thumb"),
                    origSrc = videoNode.getData("source");

                if (preview) {
                    preview.setStyle("opacity", "0");
                    preview.next("img").setAttribute('src', origSrc);
                } else {
                    videoNode.one("img").setAttribute('src', origSrc);
                }
            }
        },

        loadPreview : function(videoNode) {
            var self = this,
                frames = [],
                uuid = videoNode.getData("uuid"),
                previewFrames = previews[uuid].frames;

            //create new frames entry on loaded previews array
            if (!loadedPreviews[uuid]) {
                //get and set original source
                var thumb = videoNode.one("img"),
                    origThumb = thumb.getAttribute("src");

                videoNode.setAttribute("data-source", origThumb);

                loadedPreviews[uuid] = {};
                loadedPreviews[uuid].total = previewFrames.length;
                loadedPreviews[uuid].frame = [];
            }

            for (var i=0; i<previewFrames.length; i++) {
                frames[i] = [];
                frames[i]["frameNode"] = Y.Node.create('<img>');
                frames[i]["frameNode"].on('load', Y.bind(self.populateFrames, self, previewFrames[i].url, uuid, i, videoNode));
                frames[i]["frameNode"].setAttribute('src', previewFrames[i].url);
            }
        },

        populateFrames : function (url, uuid, index, videoNode) {
            var self = this;
            loadedPreviews[uuid].frame[index] = url;

            //start showing the preview only when all frames source are loaded
            if (loadedPreviews[uuid].total === loadedPreviews[uuid].frame.length) {
                videoNode.setAttribute("data-previewloaded", "1");

                self.showSlide(videoNode, 0);
            }
        },

        showSlide : function(videoNode, index) {
            if (!videoNode.getData('previewloaded')) {
                return;
            }

            var self = this,
                uuid = videoNode.getData("uuid"),
                marker = videoNode.one(".thumb-link"),
                preview = videoNode.one(".preview_thumb"),
                previewSource = loadedPreviews[uuid].frame[index],
                transitionConfig = {
                    duration: 1,
                    delay:0,
                    opacity:1
                };

            if (!preview) {
                var thumb = videoNode.one("img"),
                //default img css has 'opacity:1 !important' so need a div wrapper to be able to use opacity transition.
                preview = Y.Node.create('<div style="opacity:0; position:absolute" class="preview_thumb"><img></div>');
            } else {
                var thumb = preview.next("img");
            }

            var width = thumb.getAttribute("width"),
                height = thumb.getAttribute("height");

            preview.setAttribute("width", width);
            preview.setAttribute("height", height);
            preview.one("img").setAttribute("width", width);
            preview.one("img").setAttribute("height", height);
            preview.one("img").setAttribute("src", previewSource);

            if (videoNode.getData('mousedetect') === 'in') {
                if(!videoNode.one(".preview_thumb")) {
                    marker.prepend(preview);
                }
                preview.transition(transitionConfig, Y.bind(self.hideSlide, self, videoNode, index, thumb));
            }

        },

        hideSlide : function(videoNode, index, thumb) 
        {
            var self = this,
                uuid = videoNode.getData("uuid"),
                preview = videoNode.one(".preview_thumb"),
                previewSource = loadedPreviews[uuid].frame[index];

            if (videoNode.getData('mousedetect') === 'in') {
                thumb.setAttribute("src", previewSource);
                preview.setStyle("opacity", "0");
                index++;
                if (index === loadedPreviews[uuid].frame.length) {
                    index = 0;
                }
                self.showSlide(videoNode, index);
            }
        }

    });
}, '0.1', { requires:['node-base','event-base', 'event', 'transition', 'json-parse'] });
