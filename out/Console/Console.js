'use strict';

var colors = require('colors');

function Console(bot) {
  var self = this;
  self.bot = bot;
  self.ready = false;
}

Console.prototype.init = function (cb) {
  this.ready = true;
  cb(null);
};

Console.prototype.send = function (event, cb) {
  console.log('[broadcast] '.magenta + event.text);
  cb(null);
};

Console.prototype.sendRaw = function (msg, cb) {
  console.log('[raw] '.magenta + msg);
  cb(null);
};


module.exports = Console;

