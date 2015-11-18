/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(1)(__webpack_require__(2));


/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	module.exports = function(Color) {
	    /*global incrementable, Incrementable*/

	    var background = document.getElementById('background');
	    var foreground = document.getElementById('foreground');
	    var backgroundDisplay = document.getElementById('backgroundDisplay');
	    var foregroundDisplay = document.getElementById('foregroundDisplay');
	    var results = document.getElementById('results');
	    var swap = document.getElementById('swap');

	    var messages = {
	        'semitransparent': 'The background is semi-transparent, so the contrast ratio cannot be precise. Depending on what’s going to be underneath, it could be any of the following:',
	        'fail': 'Fails WCAG 2.0 :-(',
	        'aa-large': 'Passes AA for large text (above 18pt or bold above 14pt)',
	        'aa': 'Passes AA level for any size text and AAA for large text (above 18pt or bold above 14pt)',
	        'aaa': 'Passes AAA level for any size text'
	    };

	    var canvas = document.createElement('canvas'),
	        ctx = canvas.getContext('2d');

	    canvas.width = canvas.height = 16;
	    document.body.appendChild(canvas);

	    incrementable.onload = function() {
	        if (window.Incrementable) {
	            new Incrementable(background);
	            new Incrementable(foreground);
	        }
	    };

	    if (window.Incrementable) {
	        incrementable.onload();
	    }

	    var output = $('output');

	    var levels = {
	        'fail': {
	            range: [0, 3],
	            color: 'hsl(0, 100%, 40%)'
	        },
	        'aa-large': {
	            range: [3, 4.5],
	            color: 'hsl(40, 100%, 45%)'
	        },
	        'aa': {
	            range: [4.5, 7],
	            color: 'hsl(80, 60%, 45%)'
	        },
	        'aaa': {
	            range: [7, 22],
	            color: 'hsl(95, 60%, 41%)'
	        }
	    };

	    function rangeIntersect(min, max, upper, lower) {
	        return (max < upper? max : upper) - (lower < min? min : lower);
	    }

	    function updateLuminance(input) {
	        input.title = 'Relative luminance: ';

	        var color = input.color;

	        if (input.color.alpha < 1) {
	            input.title += color.overlayOn(Color.BLACK).luminance + ' - ' + color.overlayOn(Color.WHITE).luminance;
	        }
	        else {
	            input.title += color.luminance;
	        }
	    }

	    function update() {
	        var i, level;

	        if (foreground.color && background.color) {
	            if (foreground.value !== foreground.defaultValue || background.value !== background.defaultValue) {
	                window.onhashchange = null;

	                location.hash = '#' + encodeURIComponent(foreground.value) + '-on-' + encodeURIComponent(background.value);

	                setTimeout(function() {
	                    window.onhashchange = hashchange;
	                }, 10);
	            }

	            var contrast = background.color.contrast(foreground.color);

	            updateLuminance(background);
	            updateLuminance(foreground);

	            var min = contrast.min,
	                max = contrast.max,
	                range = max - min,
	                classes = [], percentages = [];

	            for (level in levels) {
	                var bounds = levels[level].range,
	                    lower = bounds[0],
	                    upper = bounds[1];

	                if (min < upper && max >= lower) {
	                    classes.push(level);

	                    percentages.push({
	                        level: level,
	                        percentage: 100 * rangeIntersect(min, max, upper, lower) / range
	                    });
	                }
	            }

	            $('strong', output).textContent = contrast.ratio;

	            var error = $('.error', output);

	            if (contrast.error) {
	                error.textContent = '±' + contrast.error;
	                error.title = min + ' - ' + max;
	            }
	            else {
	                error.textContent = '';
	                error.title = '';
	            }

	            if (classes.length <= 1) {
	                results.textContent = messages[classes[0]];
	                output.style.backgroundImage = '';
	                output.style.backgroundColor = levels[classes[0]].color;
	            }
	            else {
	                var fragment = document.createDocumentFragment();

	                var p = document.createElement('p');
	                p.textContent = messages.semitransparent;
	                fragment.appendChild(p);

	                var ul = document.createElement('ul');


	                for (i=0; i<classes.length; i++) {
	                    var li = document.createElement('li');

	                    li.textContent = messages[classes[i]];

	                    ul.appendChild(li);
	                }

	                fragment.appendChild(ul);

	                results.textContent = '';
	                results.appendChild(fragment);

	                // Create gradient illustrating levels
	                var stops = [], previousPercentage = 0;

	                for (i=0; i < 2 * percentages.length; i++) {
	                    var info = percentages[i % percentages.length];

	                    level = info.level;
	                    var color = levels[level].color,
	                        percentage = previousPercentage + info.percentage / 2;

	                    stops.push(color + ' ' + previousPercentage + '%', color + ' ' + percentage + '%');

	                    previousPercentage = percentage;
	                }
	            }

	            output.className = classes.join(' ');

	            ctx.clearRect(0, 0, 16, 16);

	            ctx.fillStyle = background.color + '';
	            ctx.fillRect(0, 0, 8, 16);

	            ctx.fillStyle = foreground.color + '';
	            ctx.fillRect(8, 0, 8, 16);

	            $('link[rel="shortcut icon"]').setAttribute('href', canvas.toDataURL());
	        }
	    }

	    function colorChanged(input) {
	        input.style.width = input.value.length * .56 + 'em';
	        input.style.width = input.value.length + 'ch';

	        var isForeground = input == foreground;

	        var display = isForeground? foregroundDisplay : backgroundDisplay;

	        var previousColor = getComputedStyle(display).backgroundColor;

	        // Match a 6 digit hex code, add a hash in front.
	        if(input.value.match(/^[0-9a-f]{6}$/i)) {
	            input.value = '#' + input.value;
	        }

	        display.style.background = input.value;

	        var color = getComputedStyle(display).backgroundColor;

	        if (color && input.value && (color !== previousColor || color === 'transparent' || color === 'rgba(0, 0, 0, 0)')) {
	            // Valid & different color
	            if (isForeground) {
	                backgroundDisplay.style.color = input.value;
	            }

	            input.color = new Color(color);

	            return true;
	        }

	        return false;
	    }

	    function hashchange() {

	        if (location.hash) {
	            var colors = location.hash.slice(1).split('-on-');

	            foreground.value = decodeURIComponent(colors[0]);
	            background.value = decodeURIComponent(colors[1]);
	        }
	        else {
	            foreground.value = foreground.defaultValue;
	            background.value = background.defaultValue;
	        }

	        background.oninput();
	        foreground.oninput();
	    }

	    background.oninput =
	    foreground.oninput = function() {
	        var valid = colorChanged(this);

	        if (valid) {
	            update();
	        }
	    }

	    swap.onclick = function() {
	        var backgroundColor = background.value;
	        background.value = foreground.value;
	        foreground.value = backgroundColor;

	        colorChanged(background);
	        colorChanged(foreground);

	        update();
	    }

	    window.encodeURIComponent = (function(){
	        var encodeURIComponent = window.encodeURIComponent;

	        return function (str) {
	            return encodeURIComponent(str).replace(/[()]/g, function ($0) {
	                return escape($0);
	            });
	        };
	    })();

	    window.decodeURIComponent = (function(){
	        var decodeURIComponent = window.decodeURIComponent;

	        return function (str) {
	            return str.search(/%[\da-f]/i) > -1? decodeURIComponent(str) : str;
	        };
	    })();

	    function $(expr, con) {
	        return typeof expr === 'string'? (con || document).querySelector(expr) : expr;
	    }

	    hashchange();
	    window.onhashchange = hashchange;
	}


/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';

	var Color = function(rgba) {
	    if (rgba === 'transparent') {
	        rgba = [0,0,0,0];
	    }
	    else if (typeof rgba === 'string') {
	        var rgbaString = rgba;
	        rgba = rgbaString.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?\)/);

	        if (rgba) {
	            rgba.shift();
	        }
	        else {
	            throw new Error('Invalid string: ' + rgbaString);
	        }
	    }

	    if (rgba[3] === undefined) {
	        rgba[3] = 1;
	    }

	    rgba = rgba.map(function (a) { return preciseRound(a, 3) });

	    this.rgba = rgba;
	}

	Color.prototype = {
	    get rgb () {
	        return this.rgba.slice(0,3);
	    },

	    get alpha () {
	        return this.rgba[3];
	    },

	    set alpha (alpha) {
	        this.rgba[3] = alpha;
	    },

	    get luminance () {
	        // Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
	        var rgba = this.rgba.slice();

	        for(var i=0; i<3; i++) {
	            var rgb = rgba[i];

	            rgb /= 255;

	            rgb = rgb < .03928 ? rgb / 12.92 : Math.pow((rgb + .055) / 1.055, 2.4);

	            rgba[i] = rgb;
	        }

	        return .2126 * rgba[0] + .7152 * rgba[1] + 0.0722 * rgba[2];
	    },

	    get inverse () {
	        return new Color([
	            255 - this.rgba[0],
	            255 - this.rgba[1],
	            255 - this.rgba[2],
	            this.alpha
	        ]);
	    },

	    toString: function() {
	        return 'rgb' + (this.alpha < 1? 'a' : '') + '(' + this.rgba.slice(0, this.alpha >= 1? 3 : 4).join(', ') + ')';
	    },

	    clone: function() {
	        return new Color(this.rgba);
	    },

	    // Overlay a color over another
	    overlayOn: function (color) {
	        var overlaid = this.clone();

	        var alpha = this.alpha;

	        if (alpha >= 1) {
	            return overlaid;
	        }

	        for(var i=0; i<3; i++) {
	            overlaid.rgba[i] = overlaid.rgba[i] * alpha + color.rgba[i] * color.rgba[3] * (1 - alpha);
	        }

	        overlaid.rgba[3] = alpha + color.rgba[3] * (1 - alpha)

	        return overlaid;
	    },

	    contrast: function (color) {
	        // Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
	        var alpha = this.alpha;

	        if (alpha >= 1) {
	            if (color.alpha < 1) {
	                color = color.overlayOn(this);
	            }

	            var l1 = this.luminance + .05,
	                l2 = color.luminance + .05,
	                ratio = l1/l2;

	            if (l2 > l1) {
	                ratio = 1 / ratio;
	            }

	            ratio = preciseRound(ratio, 1);

	            return {
	                ratio: ratio,
	                error: 0,
	                min: ratio,
	                max: ratio
	            }
	        }

	        // If we’re here, it means we have a semi-transparent background
	        // The text color may or may not be semi-transparent, but that doesn't matter

	        var onBlack = this.overlayOn(Color.BLACK).contrast(color).ratio,
	            onWhite = this.overlayOn(Color.WHITE).contrast(color).ratio;

	        var max = Math.max(onBlack, onWhite);

	        var closest = this.rgb.map(function(c, i) {
	            return Math.min(Math.max(0, (color.rgb[i] - c * alpha)/(1-alpha)), 255);
	        });

	        closest = new Color(closest);

	        var min = this.overlayOn(closest).contrast(color).ratio;

	        return {
	            ratio: preciseRound((min + max) / 2, 2),
	            error: preciseRound((max - min) / 2, 2),
	            min: min,
	            max: max,
	            closest: closest,
	            farthest: onWhite == max? Color.WHITE : Color.BLACK
	        };
	    }
	}

	Color.BLACK = new Color([0,0,0]);
	Color.GRAY = new Color([127.5, 127.5, 127.5]);
	Color.WHITE = new Color([255,255,255]);

	module.exports = Color;

	// Extend Math.round to allow for precision
	function preciseRound(number, decimals) {
	    decimals = +decimals || 0;

	    var multiplier = Math.pow(10, decimals);

	    return Math.round(number * multiplier) / multiplier;
	}


/***/ }
/******/ ]);