'use strict';

var twitter = require('ntwitter')
  , config = require('./config')
  , hogan = require('hogan.js')
  , _ = require('underscore')
_.str = require('underscore.string');
_.mixin(_.str.exports());


function Twitter(bot) {
  var self = this;
  self.bot = bot;
  self.tweets = [];
  self.ready = false;
}


Twitter.prototype.init = function (cb) {
  var self = this;
  self.templ = hogan.compile(fs.readFileSync(__dirname + '/tweet.template', 'utf8'));
  self.twit = new twitter(config.api);
  // Check credentials and initialize Twitter interactions
  self.twit.verifyCredentials(function (err, data) {
    if (err) { cb(err); return; }
    else { // Read help/configuration
      self.twit.get('/help/configuration.json', function (err, data) {
        if (err) { cb(err); }
        else { // Save short url length
          config.short_url_length = parseInt(data.short_url_length_https, 10);
          self.ready = true;
          cb(null);
        }
      });
    }
  });
};

/*Twitter.prototype.updateTweets = function (cb) {
  var self = this;
  self.twit.getUserTimeline(
    { trim_user: false
    , include_entities: false
    , exclude_replies: true
    , include_rts: false
    , count: 50
    }, function (err, data) {
      if (err) {
        console.error('Failed to retrieve tweets!'); cb(err);
      } else {
        // Only read tweet bodies, that's enough for us.
        self.tweets = data.map(function (t) { return t.text; });
        console.dir(self.tweets);
      }
  });
}*/

Twitter.prototype.format = function (e) {
  var o = e, len;

  o.href = o.href + ' ';
  o.type = (o.type === 'Event' ? '' : o.type);
  o.type = o.type.replace('game', '').toLowerCase();
  o.type = (o.type ? '#' + o.type : '');

  len = config.template_length  // "Empty" template length
      + config.short_url_length // How long will the url be?
      + o.place.length          // Length of the place for example "PMS" or "Main stage"
      + o.type.length;          // Length of the type for example "Event" or "CompoGame"

  // Shorten the text part if tweet is going to be too long.
  o.text = _(o.text).prune(140 - len);

  o.stime = DateToTime(o.sdate);
  o.etime = DateToTime(o.edate);
  o.nolen = (o.stime === o.etime && DateToString(o.sdate) === DateToString(o.edate));

  // If we exceed the maximum length
  if (o.text.length + len > 140) {
    console.error('TWEET: Will be too long!'); // FIXME
  }

  return this.templ.render(o);
};


Twitter.prototype.send = function (event, cb) {
  this.twit.updateStatus(this.format(event), cb);
};

Twitter.prototype.sendRaw = function (msg, cb) {
  this.twit.updateStatus(msg, cb);
};


// Some utils
function DateToTime(d) {
  return [d.getHours(), _.pad(d.getMinutes(), 2, '0')].join(':');
}

function DateToString(d) {
  return [d.getDate(), d.getMonth() + 1, d.getFullYear()].join('.');
}

module.exports = Twitter;