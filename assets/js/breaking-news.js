YUI.add('media-index', function(Y)
{
    Y.namespace('Media.Index');
    var Index = Y.Media.Index;

    Index.BreakingNews = {

        'init' : function(config)
        {
            var selector = config.mod_id || '.yom-breaking-news',
                tickerDuration = parseInt(config.ticker_duration) || 3,
                animDuration = 0.8,
                timerInterval = (tickerDuration + animDuration) * 1000;
            Y.on('domready', function(e)
            {
                var list = Y.all(selector+' .bd ul li');
                if (list.size() < 2)
                {
                    return;
                }

                var timer,
                    i = 0, // The index of the currently displayed ticker.
                    count = list.size(),
                    height = list.item(0).get('offsetHeight');

                var animOut = new Y.Anim({ 'from':{ 'top':0 }, 'to':{ 'top':-(height) }, 'easing':Y.Easing.easeOut, 'duration':animDuration });
                var animIn = new Y.Anim({ 'from':{ 'top':height }, 'to':{ 'top':0 }, 'easing':Y.Easing.easeOut, 'duration':animDuration });

                var animateTicker = function()
                {
                    animOut.set('node', list.item(i));
                    animOut.run();

                    i = (i + 1) % count;
                    animIn.set('node', list.item(i));
                    animIn.run();

                    clearTimeout(timer);
                    timer = setTimeout(animateTicker, timerInterval);
                };
                timer = setTimeout(animateTicker, timerInterval);
                Y.on('mouseover', function(){ clearTimeout(timer); }, list);
                Y.on('mouseout', function(){ clearTimeout(timer); timer = setTimeout(animateTicker, timerInterval); }, list);
            });
        }
    };

}, '0.1', { requires:['node', 'event', 'anim', 'overlay'] });
