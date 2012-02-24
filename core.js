'use strict';

var http = require('http')
  , path = require('path')
  , fs   = require('fs')
  , async  = require('async')
  , colors = require('colors')
  , moment = require('moment')
  , config = require('./config')
  , webui  = require('./webui');


function ScheduleDigestor() {
  var self = this;
  self.configure = config;
  self.outputs = {};
  self.events = [];
  self.webui = new webui(this);
  self.initDone = false;

  self.init(function initialized(e, data) {
    if (e) { console.error(e.stack); }
    else {
      self.events = data;
      self.initDone = true;
      self.startBroadCast();
    }
  });
}

/**
 * Digest data and fire up output modules
 **/
ScheduleDigestor.prototype.init = function (cb) {
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
      console.log(' -> ' + (e === null ? ' ok'.green : ' fail'.red));
      cb(e === null);
    });
  }

  // Initialize output modules
  function initializeModules(cb) {
    var keys = Object.keys(self.outputs);
    async.filterSeries(keys, moduleInit, function (results) { cb(null); });
  }

  // Parser for the input data
  function parser (cb) {
    var input = self.configure.input;
    require('./in/' + input.parser).call(self, input.config, cb);
  }

  // Time to use these functions above
  console.log('Parsing input data and initializing output modules...');
  async.parallel([parser, initializeModules],
  // Init done!
  function (e, d) {
    cb(e, d[0]); // 0 is the calendar data from parser
  });
};


ScheduleDigestor.prototype.startBroadCast = function () {
  var self = this
    , event, diff;

  // Sort events
  self.events.sort(function sort(a, b) {
    return moment(a.sdate).diff(Date.now()) - moment(b.sdate).diff(Date.now());
  });

  //self.events[0].sdate = new Date(Date.now() + self.configure.headstart + 5000);
  //self.events[1].sdate = new Date(Date.now() + self.configure.headstart + 5000);

  // Set timeouts
  console.log('Starting broadcast.');
  self.events.forEach(function (event) {
    event.headstart = self.configure.headstart;
    diff = event.sdate - Date.now();
    event.diff = Math.floor(event.headstart / 1000 / 60);
    if (diff - self.configure.headstart < 0) {
      // Too late
      event.done = true;
    } else {
      event.done = false;
      event.timeout = setTimeout(function () { self.broadcast(event); },
        diff - self.configure.headstart);
    }
  });
};

ScheduleDigestor.prototype.broadcast = function (event) {
  var self = this;
  
  function send(o, cb) {
    o = self.outputs[o];
    if (o.ready) {
      o.send(event, cb);
    } else {
      // Skip it
      cb(null);
    }
  }

  async.map(Object.keys(self.outputs), send, function broadcastDone(err, data) {
    if (err) { console.error(err.stack); }
    else { event.done = true; }
  });
};

ScheduleDigestor.prototype.broadcastString = function (msg) {
  var self = this;
  
  function send(o, cb) {
    o = self.outputs[o];
    if (o.ready) {
      o.sendRaw(msg, cb);
    } else {
      // Skip it
      cb(null);
    }
  }

  async.map(Object.keys(self.outputs), send, function broadcastDone(err, data) {
    if (err) { console.error(err.stack); }
  });
};

// Create a new bot
var bot = new ScheduleDigestor();
