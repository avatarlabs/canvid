(function(root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(require('queue-async'));
    } else if (typeof define === 'function' && define.amd) {
        define(['queue'], factory);
    } else {
        root.canvid = factory(root.queue);
    }
}(this, function(queue) {

    function canvid(params) {
        var defaultOptions = {
                width : 800,
                height : 450,
                selector: 'canvid-wrapper'
            }
            images = {},
            firstPlay = true,
            control = {
                play: function() {
                    console.log('cannot play before images are loaded');
                }
            },
            _opts = merge(defaultOptions, params),
            el = document.querySelector(_opts.selector);
        
        if(!el){
            return console.warn('Error. No element found for selector', _opts.selector);
        }

        if (hasCanvas()) {
            // preload videos images
            var q = queue(4);

            for (var key in _opts.videos) {
                var video = _opts.videos[key];
                q.defer(loadImage, key, video.src);
            }

            q.awaitAll(function(err) {
                if (err) return console.warn('error while loading video sources', err);

                var ctx = initCanvas(),
                    requestAnimationFrame = reqAnimFrame();

                control.play = function(key, reverse) {
                    if (control.pause) control.pause(); // pause current vid

                    var img = images[key],
                        opts = _opts.videos[key],
                        frameWidth = img.width / opts.cols,
                        frameHeight = img.height / Math.ceil(opts.frames / opts.cols);

                    var curFrame = reverse ? opts.frames - 1 : 0,
                        wait = 0,
                        playing = true,
                        loops = 0,
                        delay = 4;

                    requestAnimationFrame(frame);

                    control.resume = function() {
                        playing = true;
                        requestAnimationFrame(frame);
                    };

                    control.pause = function() {
                        playing = false;
                        requestAnimationFrame(frame);
                    };

                    if (firstPlay) {
                        firstPlay = false;
                        hideChildren();
                    }

                    function frame() {
                        if (!wait) {
                            drawFrame(curFrame);
                            curFrame = (+curFrame + (reverse ? -1 : 1));
                            if (curFrame < 0) curFrame += +opts.frames;
                            if (curFrame >= opts.frames) curFrame -= opts.frames;
                            if (reverse ? curFrame == opts.frames - 1 : !curFrame) loops++;
                            if (opts.loops && loops >= opts.loops) playing = false;
                        }
                        wait = (wait + 1) % ((reverse ? 0.5 : 1) * delay);
                        if (playing && opts.frames > 1) requestAnimationFrame(frame);
                    }

                    function drawFrame(f) {
                        var fx = Math.floor(f % opts.cols) * frameWidth,
                            fy = Math.floor(f / opts.cols) * frameHeight;
                        
                        ctx.clearRect(0, 0, _opts.width, _opts.height); // clear frame
                        ctx.drawImage(img, fx, fy, frameWidth, frameHeight, 0, 0, _opts.width, _opts.height);
                    }

                }; // end control.play

                if (isFunction(_opts.loaded)){
                    _opts.loaded(control);
                }

            }); // end awaitAll

        } else if (opts.srcGif) {
            var fallbackImage = new Image();
            fallbackImage.src = opts.srcGif;

            el.appendChild(fallbackImage);
        }

        function loadImage(key, url, callback) {
            var img = images[key] = new Image();
            img.onload = function() { callback(null); };
            img.src = url;
        }

        function initCanvas() {
            var canvas = document.createElement('canvas');
            canvas.width = _opts.width;
            canvas.height = _opts.height;
            canvas.classList.add('canvid');

            el.appendChild(canvas);

            return canvas.getContext('2d');
        }

        function hideChildren(){
            var children = [].slice.call(el.children);

            children.forEach(function(child){
                if(!child.classList.contains('canvid')){
                    child.style.display = 'none';
                }
            });
        }

        function reqAnimFrame() {
            return window.requestAnimationFrame 
                || window.webkitRequestAnimationFrame 
                || window.mozRequestAnimationFrame 
                || window.msRequestAnimationFrame 
                || function(callback) {
                    return setTimeout(callback, 1000 / 60);
                };
        }

        function hasCanvas() {
            // taken from Modernizr
            var elem = document.createElement('canvas');
            return !!(elem.getContext && elem.getContext('2d'));
        }

        function isFunction(obj) {
            // taken from jQuery
            return typeof obj === "function" || !!(obj && obj.constructor && obj.call && obj.apply);
        }

        function merge() {
            var obj = {}, key;

            for (var i = 0; i < arguments.length; i++) {
                for (key in arguments[i]) {
                    if (arguments[i].hasOwnProperty(key)) {
                        obj[key] = arguments[i][key];
                    }
                }
            }

            return obj;
        }

        return control;
    }; // end canvid function

    return canvid;
})); // end factory function