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
  //console.log('Logging in to Twitter, and fetching settings...');
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

Twitter.prototype.format = function (o) {
  var len = config.template_length  // "Empty" template length
          + config.short_url_length // How long will the url be?
          + o.place.length          // Length of the place for example "PMS" or "Main stage"
          + o.type.length;          // Length of the type for example "Event" or "CompoGame"

  // Shorten the text part if tweet is going to be too long.
  o.text = _(o.text).prune(140 - len)

  // If we exceed the maximum length
  if (o.text.length + len > 140) {
    console.error('TWEET: Will be too long!'); // FIXME
  }

  return this.templ.render(o);
};


module.exports = Twitter;