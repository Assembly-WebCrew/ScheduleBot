'use strict';

var http = require('http')
  , path = require('path')
  , fs   = require('fs')
  , config = require('./config')
  , parser = require('./parser')
  , async  = require('async')
  , ical   = require('ical')
  , colors = require('colors')
  , _ = require('underscore');
// Load string helper functions
_.str = require('underscore.string');
_.mixin(_.str.exports());

function ScheduleDigestor(conf) {
  var self = this;
  self.configure = conf;
  self.calData = [];
  self.outputs = {};

  self.init(function initialized(e, data) {
    if (e) { console.error(e.stack); }
    else {
      console.dir(data[1]);
    }
  });
}

ScheduleDigestor.prototype.init = function (cb) {
  console.time('Initializing completed');
  // Load output modules synchronously
  var self = this
    , outputs = fs.readdirSync(__dirname + '/out')
    // Filter files: ./out/module/module.js
    .filter(function (fn) { return path.existsSync(__dirname + '/out/' + fn + '/' + fn + '.js'); })
    .map(function loadModules(out) {
      try { // Try to require module
        self.outputs[out.toLowerCase()] = new (require(__dirname + '/out/' + out + '/' + out))(self);
        return out.green;
      } catch (e) {
        console.error('Failed to load module "%s".', out);
        console.error(e.stack);
        return out.red;
      }
    });
  console.log('Found %s output module(s): %s', String(outputs.length), outputs.join(', '));

  // Initializes a module by it's name, returns true/false
  function moduleInit(module, cb) {
    process.stdout.write('Starting ' + module + ' module...');
    self.outputs[module].init(function (e) {
      console.log(' -> ' + !e ? ' ok'.green : ' fail'.red);
      cb(!e);
    });
  }

  console.log('Parsing calendar data and initializing output modules...');
  async.parallel([
    // Update calendar data
    function updateCalendarData(cb) {
      parser(cb);
    },
    // Initialize output modules
    function initializeModules(cb) {
      async.filter(Object.keys(self.outputs), moduleInit, function (result) {
        self.outputs = result;
        cb(null);
      });
    }
    // init done!
  ], function (e, d) {
    console.timeEnd('Initializing completed');
    cb(e, d[0]);
  });
};

ScheduleDigestor.prototype.startBroadCast = function () {
  console.log(this.outputs);
};

// Some utils
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