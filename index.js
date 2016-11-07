var blessed = require('../blessed-contrib/node_modules/blessed');
var contrib = require('../blessed-contrib/index.js');
var fs = require('fs');

var Countdown = require('./countdown.js');

var screen = blessed.screen();
var grid = new contrib.grid({rows: 12, cols: 12, screen: screen});

// Setup widgets' initial states
var clock = grid.set(0, 0, 4, 6, contrib.lcd,
    {
        label: 'Clock',
        elements: 12,
        display: "--.--.--.---",
        color: 'white'
    });

var countdownClock = grid.set(0, 6, 4, 6, contrib.lcd,
    {
        label: 'Countdown',
        elements: 13,
        display: "---.--.--.---",
        color: 'yellow'
    });

var curProgress = grid.set(10, 0, 2, 12, contrib.gauge,
    {
        label: 'Current Progress',
        stroke: 'blue',
        fill: 'white'
    });

screen.render();

// Parse config file and setup countdowns
var countdowns = [];

var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
config.forEach(function(countdown) {
    var today = new Date();
    countdown["days"].forEach(function(day) {
        var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        if (day == days[today.getDay()]) {
            countdowns.push({
                "name": countdown["name"],
                "start": Date.parse(today.toDateString() + " " + countdown["start"]),
                "end": Date.parse(today.toDateString() + " " + countdown["end"])
            });
        }
    });
});

var nextStart = -1;
var nextEnd = -1;

function setNextCountdown() {
    nextStart = -1;
    var smallest;

    Object.keys(countdowns).forEach(function(countdown) {
        var delta = countdowns[countdown]["start"] - Date.now();
        if (delta > 0) {
            smallest = delta;
            nextStart = countdown;
        }
    });

    Object.keys(countdowns).forEach(function(countdown) {
        var delta = countdowns[countdown]["start"] - Date.now();
        if (delta < smallest && delta > 0) {
            smallest = delta;
            nextStart = countdown;
        }
    });

    nextEnd = -1;
    Object.keys(countdowns).forEach(function(countdown) {
        var delta = countdowns[countdown]["end"] - Date.now();
        if (delta > 0) {
            smallest = delta;
            nextEnd = countdown;
        }
    });

    Object.keys(countdowns).forEach(function(countdown) {
        var delta = countdowns[countdown]["end"] - Date.now();
        if (delta < smallest && delta > 0) {
            smallest = delta;
            nextEnd = countdown;
        }
    });
}

setNextCountdown();

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

if (nextStart != -1 && nextEnd != -1 && nextStart == nextEnd) {
    var currentCountdown = new Countdown(countdowns[nextStart]["start"]);
    countdownClock.setOptions({color: 'blue'});
}
else {
    var currentCountdown = new Countdown(countdowns[nextEnd]["end"]);
}

setInterval(function() {
    setClock();
    countdownClock.setDisplay(currentCountdown.toString());
}, 1);

var curProgressPerc = 0.01;
setInterval(function() {
    curProgress.setPercent(parseFloat(curProgressPerc).toFixed(2));
    curProgressPerc += 0.01;
    if (curProgressPerc > 1.00)
        curProgressPerc = 0.00;
}, 500)

// Temp placeholders
grid.set(4, 0, 6, 4, contrib.gauge, {label: 'Remaining', stroke: 'blue', fill: 'white'});
grid.set(4, 4, 6, 8, contrib.gauge, {label: 'Other Countdowns', stroke: 'blue', fill: 'white'});

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

// Render loop
setInterval(function() {screen.render()}, 50);
