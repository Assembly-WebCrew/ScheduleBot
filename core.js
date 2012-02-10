'use strict';

var http = require('http')
  , path = require('path')
  , fs   = require('fs')
  , config = require('./config')
  , parser = require('./parser')
  , async  = require('async')
  , colors = require('colors');


function ScheduleDigestor() {
  var self = this;
  self.configure = config;
  self.outputs = {};

  self.init(function initialized(e, data) {
    if (e) { console.error(e.stack); }
    else   { self.startBroadCast();  }
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
      console.log(' -> ' + !e ? ' ok'.green : ' fail'.red);
      cb(!e);
    });
  }
  
  // Initialize output modules
  function initializeModules(cb) {
    var keys = Object.keys(self.outputs);
    async.filter(keys, moduleInit, function (results) {
      // Check the results
      for (var i = keys.length; i--;) {
        if (results.indexOf(keys[i]) === -1){
          // It was filtered, thus init failed.
          delete self.outputs[keys[i]];
        }
      }
      //self.outputs = result;
      cb(null);
    });
  }
  
  // Time to use these functions above
  console.log('Parsing calendar data and initializing output modules...');
  async.parallel([parser, initializeModules],
  // Init done!
  function (e, d) {
    cb(e, d[0]); // 0 is the calendar data from parser
  });
};


ScheduleDigestor.prototype.startBroadCast = function () {
  console.log('Starting to broadcast.');
};


// Create a new bot
var bot = new ScheduleDigestor();
