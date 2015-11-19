'use strict';

var Color = require('./color');

var count = 0;

module.exports = function() {
    var background = document.getElementById('background');
    var foreground = document.getElementById('foreground');
    var output = document.getElementById('output');
    var ratio = document.getElementById('ratio');
    var error = document.getElementById('error');
    var backgroundDisplay = document.getElementById('backgroundDisplay');
    var foregroundDisplay = document.getElementById('foregroundDisplay');
    var results = document.getElementById('results');
    var swap = document.getElementById('swap');
    var favicon = document.getElementById('favicon');

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

    background.addEventListener('input', input);
    background.addEventListener('keydown', keydown);
    foreground.addEventListener('input', input);
    foreground.addEventListener('keydown', keydown);

    swap.addEventListener('click', click);

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

    hashchange();
    window.onhashchange = hashchange;

    function rangeIntersect(min, max, upper, lower) {
        return (max < upper? max : upper) - (lower < min? min : lower);
    }

    function updateLuminance(input) {
        input.title = 'Relative luminance: ';

        var color = input.color;

        if (input.color.alpha < 1) {
            input.title += color.overlayOn(Color.BLACK).luminance() + ' - ' + color.overlayOn(Color.WHITE).luminance();
        } else {
            input.title += color.luminance();
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

            ratio.textContent = contrast.ratio;

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

            favicon.setAttribute('href', canvas.toDataURL());
        }
    }

    function colorChanged(input) {
        input.style.width = input.value.length * .56 + 'em';
        input.style.width = input.value.length + 'ch';

        var isForeground = input == foreground;

        var display = isForeground? foregroundDisplay : backgroundDisplay;

        var previousColor = getComputedStyle(display).backgroundColor;

        // Match a 6 digit hex code, add a hash in front.
        if (input.value.match(/^[0-9a-f]{6}$/i)) {
            input.value = '#' + input.value;
        }

        display.style.background = input.value;

        var color = getComputedStyle(display).backgroundColor;

        if (color && input.value && (color !== previousColor || color === 'transparent' || color === 'rgba(0, 0, 0, 0)')) {
            // Valid & different color
            if (isForeground) {
                backgroundDisplay.style.color = input.value;
            }

            try {
                input.color = new Color(color);
                return true;
            } catch(e) {
                return false;
            }
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

        background.dispatchEvent(new Event('input'));
        foreground.dispatchEvent(new Event('input'));
    }

    function input() {
        var valid = colorChanged(this);

        if (valid) {
            update();
        }
    }

    function keydown(e) {
        var action = false;
        var amount = 1;
        var color, format;

        if (e.keyCode === 38) {
            action = 'lighten';
        } else if (e.keyCode === 40) {
            action = 'darken';
        }

        if (!action) {
            return false;
        }

        if (e.shiftKey) {
            amount *= 10;
        }

        color = this.value;
        format = getFormat(color);

        try {
            color = new Color(color);
            color[action](amount);
            this.value = color[format + 'String']();
            this.dispatchEvent(new Event('input'));

            e.preventDefault();
        } catch(e) {
            //do nothing
        }
    }

    function click() {
        var backgroundColor = background.value;

        background.value = foreground.value;
        foreground.value = backgroundColor;

        colorChanged(background);
        colorChanged(foreground);

        update();
    }

    function getFormat(color) {
        if (color.indexOf('#') === 0) {
            return 'hex';
        } else if (color.indexOf('rgba') === 0) {
            return 'rgba';
        } else if (color.indexOf('hsla') === 0) {
            return 'hsla';
        } else if (color.indexOf('hsl') === 0) {
            return 'hsl';
        } else if (color.indexOf('hwb') === 0) {
            return 'hwb';
        }

        return 'rgb';
    }
}
