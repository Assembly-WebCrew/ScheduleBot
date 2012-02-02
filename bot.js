'use strict';

var http = require('http')
  , fs = require('fs')
  , config = require('./config')
  , _ = require('underscore')
  , async = require('async')
  , path = require('path');
_.str = require('underscore.string');
_.mixin(_.str.exports());

function ScheduleDigestor(conf) {
  var self = this;
  self.conf = conf;
  self.calData = [];
  self.outputs = {};

  self.init();
}

ScheduleDigestor.prototype.init = function () {
  // Load output modules
  var self = this
    , files = fs.readdirSync(__dirname + '/out')
    , outputs = files
    // Filter files
    .filter(function (fn) { return path.existsSync(__dirname + '/out/' + fn + '/' + fn + '.js'); })
    .map(function loadModules(out) {
      try {
        console.log(__dirname + '/out/' + out + '/' + out);
        self.outputs[out.toLowerCase()] = new (require(__dirname + '/out/' + out + '/' + out))(self);
        console.log('Loading module %s...', out);
        self.outputs[out.toLowerCase()].init();
        return out;
      } catch (e) {
        console.error('Failed to load module "%s".', out);
        console.error(e.stack);
        return out;
      }
    });
  console.log('Loaded %s output module(s): %s', String(outputs.length), outputs.join(', '));

  // Update calendar data
  console.log('Updating calendar data...');
  self.updateCalendar(function (e) {
    if (e) {
      console.error(e); console.warning('Failed to update calendar data!');
    } else {
      self.startBroadCast();
      /*var rand = Math.floor(Math.random() * self.calData.length);
      console.dir(self.calData[rand]);
      self.calData.forEach(function (e) {
        console.log(self.outputs.twitter.format(e));
        console.log(self.outputs.twitter.format(e).length);
      });*/
    }
  });
};

ScheduleDigestor.prototype.startBroadCast = function () {
  
};

/**
 * Load calendar
 */
ScheduleDigestor.prototype.updateCalendar = function (cb) {
  // HTTP-kutsulla iCal-data jsoniksi ja talteen objektiin ScheduleDigestor.calData
  var self = this
    , data = ''
    , options = { host: 'ical2json.pb.io', port: 80, path: self.conf.url};

  function parseCalData(e) {
    // Parse dates
    var sd = self.vCalDate(e.DTSTART)
      , ed = self.vCalDate(e.DTEND);
    // Return object
    return {
        "sdate": DateToString(sd)
      , "edate": DateToString(ed)
      , "stime": DateToTime(sd)
      , "etime": DateToTime(ed)
      ,  "href": e.URL.length > 5 ? e.URL + ' ' : undefined
      ,  "text": e.SUMMARY
      , "place": e.LOCATION
      ,  "type": _.camelize(e.CATEGORIES)
      ,  "head": self.conf.headstart / 60000
    };
  }
    
  // GET done
  function done () {

    // Parse JSON
    try {
      var rawData = JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse JSONified vCalendar data!');
      cb(e); return;
    }

    // Parse vCalendar data
    self.calData = rawData['VCALENDAR']['VEVENT'].map(parseCalData);

    // Format the data even more
    self.calData.forEach(function (e, i) {
      e.hasDuration = !(e.stime === e.etime && e.sdate === e.edate); // Same end and start time
    });

    // No errors
    cb(null);
  }
  // GET data
  http.get(options, function(res) {
    if (res.statusCode !== 200) {
      console.error('GET calendar data failed (%d)', res.statusCode);
      cb(e); return;
    }
    res.on('data', function (d) { data += d; }).on('end', done);
  }).on('error', cb);
};

ScheduleDigestor.prototype.vCalDate = function (s) {
  var a = s.split('T');                 // Split string to date and time
  return new Date(
    a[0].substr(0, 4) + '-' +           // Year
    _.chop(a[0].substr(4), 2).join('-') // Date
    + 'T' + _.chop(a[1], 2).join(':')   // Time
    + this.conf.timezone                // Timezone TODO: support ZDDDD-format
  );
}

function DateToTime(d) {
  return [d.getHours(), _.pad(d.getMinutes(), 2, '0')].join(':');
}

function DateToString(d) {
  return [d.getDate(), d.getMonth() + 1, d.getFullYear()].join('.');
}

// Create a new bot
var bot = new ScheduleDigestor(config);


  /*
  .updateStatus('Test tweet!', function (err, data) {
    console.log('e: ' + err);
    console.log(console.dir(data));
  });*/