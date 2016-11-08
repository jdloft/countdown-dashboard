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
        color: 'red'
    });

var curProgress = grid.set(10, 0, 2, 12, contrib.gauge,
    {
        label: 'Current Progress',
        stroke: 'blue',
        fill: 'white',
        percent: 0.00
    });

var stats = grid.set(4, 0, 3, 4, blessed.box,
    {
        label: 'Stats',
        tags: true
    });

var nextCountdownStats = grid.set(7, 0, 3, 4, blessed.box,
    {
        label: 'Next Countdown',
        tags: true
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
                "end": Date.parse(today.toDateString() + " " + countdown["end"]),
                "startCountdown": new Countdown(Date.parse(today.toDateString() + " " + countdown["start"])),
                "endCountdown": new Countdown(Date.parse(today.toDateString() + " " + countdown["end"]))
            });
        }
    });
});

var nextStart = -1;
var nextEnd = -1;

function setCountdown() {
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

setCountdown();

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

var currentCountdown;
var nextCountdown;

function updateCountdown() {
    if (nextEnd == -1) {
        countdownClock.setDisplay("---.--.--.---");
        countdownClock.setOptions({color: 'white'});
    }
    else if (nextStart == nextEnd) {
        currentCountdown = countdowns[nextStart]["startCountdown"];
        nextCountdown = countdowns[nextEnd]["endCountdown"];
        countdownClock.setOptions({color: 'blue'});
    }
    else {
        currentCountdown = countdowns[nextEnd]["endCountdown"];
        if (nextStart != -1) {
            nextCountdown = countdowns[nextStart]["startCountdown"];
        }
        countdownClock.setOptions({color: 'red'});
    }
}

updateCountdown();

var statsHeader;
var nextCountdownHeader;
var nextCountdownFooter;

function updateStats() {
    if (nextStart == -1 && nextEnd == -1) {
        stats.setContent("All countdowns have passed");
        nextCountdownStats.setContent("All countdowns have passed");
    }
    else if (nextStart == nextEnd) {
        statsHeader = "{blue-fg}Counting down to the start of " + countdowns[nextStart]["name"] + "{/blue-fg}\n";
        statsHeader += "Start: " + (new Date(countdowns[nextStart]["start"])).toTimeString() + "\n";
        statsHeader += "End: " + (new Date(countdowns[nextStart]["end"])).toTimeString() + "\n";

        if (nextStart == -1) {
            nextCountdownStats.setContent("No next countdown");
        }
        else {
            nextCountdownHeader = "{red-fg}Counting down to the end of " + countdowns[nextEnd]["name"] + "\n";
            nextCountdownFooter = "{/red-fg}\n"
            nextCountdownFooter += "Start: " + (new Date(countdowns[nextEnd]["start"])).toTimeString() + "\n";
            nextCountdownFooter += "End: " + (new Date(countdowns[nextEnd]["end"])).toTimeString() + "\n";
        }
    }
    else {
        statsHeader = "{red-fg}Counting down to the end of " + countdowns[nextEnd]["name"] + "{/red-fg}\n";
        statsHeader += "Start: " + (new Date(countdowns[nextEnd]["start"])).toTimeString() + "\n";
        statsHeader += "End: " + (new Date(countdowns[nextEnd]["end"])).toTimeString() + "\n";

        if (nextStart != -1) {
            nextCountdownHeader = "{blue-fg}Counting down to the start of " + countdowns[nextStart]["name"] + "\n";
            nextCountdownFooter = "{/blue-fg}\n";
            nextCountdownFooter += "Start: " + (new Date(countdowns[nextStart]["start"])).toTimeString() + "\n";
            nextCountdownFooter += "End: " + (new Date(countdowns[nextStart]["end"])).toTimeString() + "\n";
        }
    }
}

updateStats();

// Clock and countdown update every 1 ms
setInterval(function() {
    setClock();
    if (nextEnd != -1) {
        countdownClock.setDisplay(currentCountdown.toString());
        stats.setContent(statsHeader + currentCountdown.stats());
        if (nextStart != -1) {
            nextCountdownStats.setContent(nextCountdownHeader + nextCountdown.toString() +
                nextCountdownFooter + nextCountdown.stats());
        }
        else {
            stats.setContent(statsHeader + currentCountdown.stats());
        }

        if (currentCountdown.remaining() <= 0) {
            setCountdown();
            updateCountdown();
            updateStats();
        }
    }
}, 1);

// Progress updates every 1/2 second
setInterval(function() {
    if (nextStart == nextEnd) {
        curProgress.setPercent(0.00);
    }
    else {
        var progress = countdowns[nextEnd]["end"] - countdowns[nextEnd]["start"];
        progress = (Date.now() - countdowns[nextEnd]["start"]) / progress;
        curProgress.setPercent(parseFloat(progress).toFixed(2));
    }
}, 500)

// Temp placeholders
grid.set(4, 4, 6, 8, blessed.box, {label: 'Other Countdowns'});

screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

// Render loop
setInterval(function() {screen.render()}, 50);
