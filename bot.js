'use strict';

var http = require('http')
  , path = require('path')
  , fs   = require('fs')
  , config = require('./config')
  , async  = require('async')
  , _ = require('underscore');
// Load string functions
_.str = require('underscore.string');
_.mixin(_.str.exports());

function ScheduleDigestor(conf) {
  var self = this;
  self.conf = conf;
  self.calData = [];
  self.outputs = {};

  self.init(function initialized(e) {
    if (e) { console.error(e.stack); }
    else { console.log('Initialize successful!'); }
  });
}

ScheduleDigestor.prototype.init = function (cb) {
  // Load output modules synchronously
  var self = this
    , files = fs.readdirSync(__dirname + '/out')
    , outputs = files
    // Filter files: ./out/module/module.js
    .filter(function (fn) { return path.existsSync(__dirname + '/out/' + fn + '/' + fn + '.js'); })
    .map(function loadModules(out) {
      try { // Try to require module
        self.outputs[out.toLowerCase()] = new (require(__dirname + '/out/' + out + '/' + out))(self);
        return out;
      } catch (e) {
        console.error('Failed to load module "%s".', out);
        console.error(e.stack);
        return out;
      }
    });
  console.log('Found %s output module(s): %s', String(outputs.length), outputs.join(', '));
  
  // Initializes a module by it's name, returns true/false
  function moduleInit(module, cb) {
    process.stdout.write('Initializing ' + module + ' module...');
    self.outputs[module].init(function (e) {
      console.log(' -> ' + !e ? ' ok' : ' fail');
      cb(!e);
    });
  }
  
  async.parallel([
    // Update calendar data
    function updateCalendarData(cb) {
      console.log('Updating calendar data...');
      self.updateCalendar(cb);
    },
    // Initialize output modules
    function initializeModules(cb) {
      console.log('Initializing output modules...');
      async.filter(Object.keys(self.outputs), moduleInit, function (result) {
        self.outputs = result;
        cb(null);
      });
    }
    // init done!
  ], cb);
  /*
  self.updateCalendar(function (e) {
    if (e) {
      console.error(e); console.warning('Failed to update calendar data!');
    } else {
      self.startBroadCast();
      var rand = Math.floor(Math.random() * self.calData.length);
      console.dir(self.calData[rand]);
      self.calData.forEach(function (e) {
        console.log(self.outputs.twitter.format(e));
        console.log(self.outputs.twitter.format(e).length);
      });
    }
  });*/
};

ScheduleDigestor.prototype.startBroadCast = function () {
  console.log(this.outputs);
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