YUI.add('media-preview', function(Y)
{
    "use strict";

    var HOVER_TARGET_SELECTOR   = ' .latest-content-inline .video',
        MP4_MIME_TYPE = 'video/mp4',
        MP4_FULL_TYPE = 'video/mp4; codecs=avc1.42E01E,mp4a.40.2',
        TEXT_NO_PREVIEW = 'No Preview Available';

    /**
    @class ContentVideoPreview
    @namespace Media
    @extends Base
    **/
    Y.namespace('Media').ContentVideoPreview = Y.Base.create('media-preview',Y.Base,[], {


        initializer: function (e) {
            var testpreview = Y.one('.video-preview');
            if (testpreview) {
                if (Y.Node.getDOMNode(testpreview).canPlayType === undefined) {
                    return;
                }
            } else {
                return;
            }

            var self = this,
                videos = Y.all('#' + e.mod_id + HOVER_TARGET_SELECTOR);

            self.no_preview_text = (e.no_preview_text)? e.no_preview_text : TEXT_NO_PREVIEW;
            self.preview_audio = (e.video_preview_audio)? e.video_preview_audio : 'off';
            videos.each(function (videoItem) {
                videoItem.on('mouseenter',self._onVideoThumbMouseEnter,self);
                videoItem.on('mouseleave',self._onVideoThumbMouseLeave,self);
            });
        },

        _onVideoThumbMouseEnter : function(e) {
            e.stopPropagation();
            var self = this,
                item = e.currentTarget,
                videoNode = item.one(".video-preview"),
                thumb = item.one("img");

            if (videoNode) {
                var previewloaded = videoNode.getData('previewloaded');

                videoNode.setAttribute('data-mousedetect','in');
                item.setAttribute('data-mousedetect','in');
                if (previewloaded) {
                    self.playPreview(videoNode, thumb);
                } else {
                    self.loadPreview(videoNode, thumb);
                }
            } else {
                self.showNoPreviewNotice(item);
            }
        },

        _onVideoThumbMouseLeave : function(e) {
            e.stopPropagation();
            var self = this,
                item = e.currentTarget,
                videoNode = item.one(".video-preview"),
                thumb = item.one("img"),
                previewloaded;

            if (videoNode) {
                previewloaded = videoNode.getData('previewloaded');

                self.toggleLoading(videoNode, false);
                videoNode.setAttribute('data-mousedetect','out');
                item.setAttribute('data-mousedetect','out');
                if (previewloaded) {
                    Y.Node.getDOMNode(videoNode).pause();
                    thumb.setStyle('display','block');
                    videoNode.setStyle('display','none');
                }
            }
            self.hideNoPreviewNotice(item);
        },


        loadPreview : function(preview, thumb) {
            var self = this,
                sources = preview.all("source");

            preview.on('canplaythrough', Y.bind(self.playPreview, self, preview, thumb));

            sources.each( function(source) {
                var video = Y.Node.getDOMNode(this),
                    src = source.getData("source"),
                    type = (source.getAttribute("type") === MP4_MIME_TYPE)? MP4_FULL_TYPE : source.getAttribute("type"),
                    canplay = '';

                try {
                    canplay = video.canPlayType(type);
                } catch (e) {
                    Y.log('browser does not support html5 video methods');
                }

                if (src && (canplay === 'probably')) {
                    src = src.replace(/&amp;/g, '&');
                    source.setAttribute('src',src);
                    video.volume = (self.preview_audio === 'on')? 0.5 : 0;
                    self.toggleLoading(preview, true);
                    video.load();

                    //firefox does not fire canplaythrough event on load. need to start play to detect canplaythrough
                    var browser=navigator.userAgent.toLowerCase();
                    if ((browser.indexOf('safari') > -1) || (browser.indexOf('firefox') > -1)) {
                       video.play();
                    }

                    this.setAttribute('data-previewloaded', '1');
                }
            }, preview);

        },

        toggleLoading : function (preview, show) {
           var item = preview.ancestor(".generic-list-item"),
               overlay = item.one(".video-preview-overlay-mask");

           if (overlay) {
               if (show) {
                   overlay.setStyle('display','table-cell');
               } else {
                   overlay.setStyle('display','none');
               }
           }
        },

        showNoPreviewNotice : function(item) {
            var self = this,
                overlay = item.one(".overlay-mask"),
                notice = item.one(".video-no-preview"),
                isAd = item.hasAttribute('data-ad-section');

            if (!notice && !isAd) {
                item.append('<span class="video-no-preview" style="display: none;">' + self.no_preview_text + '</span>');
                notice = item.one(".video-no-preview");
            } 
            overlay.setStyle('display','block');
            if (!isAd){
                notice.setStyle('display','block');
            }

        },

        hideNoPreviewNotice : function(item) {
            var overlay = item.one(".overlay-mask"),
                notice = item.one(".video-no-preview"),
                isAd = item.hasAttribute('data-ad-section'),
                isSidekickOn = item.hasClass('sidekick');

            if (notice) {
                overlay.setStyle('display','none');
                notice.setStyle('display','none');
            }
            
            if ((isAd && overlay) || (isSidekickOn && overlay)){
                overlay.setStyle('display','none');
            }

        },

        playPreview : function(videoNode, thumb) {
            if (videoNode.getData('mousedetect') === 'in') {
                this.toggleLoading(videoNode, false);
                Y.Node.getDOMNode(videoNode).play();
                videoNode.setStyle('display','block');
                thumb.setStyle('display','none');
            }
        }

    });

}, '0.1', { requires:['node-base','event-base', 'node-event-html5', 'json-parse'] });
