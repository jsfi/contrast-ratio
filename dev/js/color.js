'use strict';

var Color = require('color');

Color.prototype.lighten = function(ratio) {
    this.values.hsl[2] += ratio;
    this.setValues('hsl', this.values.hsl);
    return this;
};

Color.prototype.darken = function(ratio) {
    this.values.hsl[2] -= ratio;
    this.setValues('hsl', this.values.hsl);
    return this;
};

Color.prototype.luminance = function() {
    // Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
    var rgb = this.rgbArray();

    for(var i=0; i<3; i++) {
        var color = rgb[i];

        color /= 255;

        color = color < .03928 ? color / 12.92 : Math.pow((color + .055) / 1.055, 2.4);

        rgb[i] = color;
    }

    return .2126 * rgb[0] + .7152 * rgb[1] + 0.0722 * rgb[2];
};

// Overlay a color over another
Color.prototype.overlayOn = function (color) {
    var overlaid = this.clone();
    var alpha = this.alpha();
    var colorAlpha = color.alpha();

    if (alpha >= 1) {
        return overlaid;
    }

    overlaid.red(this.red() * alpha + color.red() * colorAlpha * (1 - alpha));
    overlaid.green(this.green() * alpha + color.green() * colorAlpha * (1 - alpha));
    overlaid.blue(this.blue() * alpha + color.blue() * colorAlpha * (1 - alpha));
    overlaid.alpha(alpha + colorAlpha * (1 - alpha));

    return overlaid;
};

Color.prototype.contrast = function (color) {
    // Formula: http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
    var alpha = this.alpha();

    if (alpha >= 1) {
        if (color.alpha() < 1) {
            color = color.overlayOn(this);
        }

        var l1 = this.luminance() + .05,
            l2 = color.luminance() + .05,
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

    var closest = this.rgbArray().map(function(c, i) {
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
};

Color.BLACK = new Color().rgb([0,0,0]);
Color.GRAY = new Color().rgb([127.5, 127.5, 127.5]);
Color.WHITE = new Color().rgb([255,255,255]);

module.exports = Color;

// Extend Math.round to allow for precision
function preciseRound(number, decimals) {
    decimals = +decimals || 0;

    var multiplier = Math.pow(10, decimals);

    return Math.round(number * multiplier) / multiplier;
}
