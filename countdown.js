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

function Countdown(time) {
    this.time = time;
    this.seconds = 1000;
    this.minutes = this.seconds * 60;
    this.hours = this.minutes * 60;
}

Countdown.prototype.update = function() {
    this.delta = this.time - Date.now();
}

Countdown.prototype.toString = function() {
    this.update();
    var past = (this.delta < 0);
    var hoursRem = parseInt(this.delta / this.hours);
    var minutesRem = parseInt((this.delta % this.hours) / this.minutes);
    var secondsRem = parseInt((this.delta % this.minutes) / this.seconds);
    var millisecondsRem = parseInt(this.delta % this.seconds);
    if (past) {
        return Math.abs(hoursRem).pad() + ":" + Math.abs(minutesRem).pad() + ":" +
            Math.abs(secondsRem).pad() + ":" + Math.abs(millisecondsRem).pad(3);
    }
    else {
        return "-" + hoursRem.pad() + ":" + minutesRem.pad() + ":" + secondsRem.pad() + ":" + millisecondsRem.pad(3);
    }
}

Countdown.prototype.stats = function() {
    this.update();
    var output = "Milliseconds: " + this.remaining() + "\n";
    output += "Seconds: " + this.remainingSeconds() + "\n";
    output += "Minutes: " + this.remainingMinutes() + "\n";
    output += "Hours: " + this.remainingHours() + "\n";
    return output;
}

Countdown.prototype.remaining = function() {
    return parseInt(this.delta);
}

Countdown.prototype.remainingSeconds = function() {
    return parseInt(this.delta / this.seconds);
}

Countdown.prototype.remainingMinutes = function() {
    return parseInt(this.delta / this.minutes);
}

Countdown.prototype.remainingHours = function() {
    return parseInt(this.delta / this.hours);
}

module.exports = Countdown;
