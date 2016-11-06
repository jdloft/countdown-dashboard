var blessed = require('../blessed-contrib/node_modules/blessed');
var contrib = require('../blessed-contrib/index.js');
var Countdown = require('./countdown.js');

var screen = blessed.screen();
var grid = new contrib.grid({rows: 12, cols: 12, screen: screen});

// Setup widgets' initial states
var clock = grid.set(0, 0, 4, 6, contrib.lcd,
    {
        label: 'Clock',
        elements: 12,
        display: "--.--.--.---"
    });

var curProgress = grid.set(10, 0, 2, 12, contrib.gauge,
    {
        label: 'Current Progress',
        stroke: 'blue',
        fill: 'white'
    });

screen.render();

// Update widgets
Number.prototype.pad = function(size) {
    var s = String(Math.abs(this));
    while (s.length < (size || 2)) {
        s = "0" + s;
    }

    if (this < 0) {
        return "-" + s;
    }
    else {
        return s;
    }
}

function setClock() {
    date = new Date();
    clock.setDisplay((date.getHours()).pad() + "." + (date.getMinutes()).pad() + "." +
        (date.getSeconds()).pad() + "." + (date.getMilliseconds()).pad(3));
}

setInterval(setClock, 1);

var curProgressPerc = 0.01;
setInterval(function() {
    curProgress.setPercent(parseFloat(curProgressPerc).toFixed(2));
    curProgressPerc += 0.01;
    if (curProgressPerc > 1.00)
        curProgressPerc = 0.00;
}, 500)

// Temp placeholders
grid.set(0, 6, 4, 6, contrib.gauge, {label: 'Countdown', stroke: 'blue', fill: 'white'});
grid.set(4, 0, 6, 4, contrib.gauge, {label: 'Remaining', stroke: 'blue', fill: 'white'});
grid.set(4, 4, 6, 8, contrib.gauge, {label: 'Other Countdowns', stroke: 'blue', fill: 'white'});

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

// Render loop
setInterval(function() {screen.render()}, 50);
