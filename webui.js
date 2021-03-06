'use strict';

var colors   = require('colors')
  , express  = require('express')
  , passport = require('passport')
  , moment   = require('moment')
  , hogan    = require('hogan.js')
  , adapter  = require('./hogan-express')
  , LocalStrategy = require('passport-local').Strategy
  // Read configure
  , config = require('./config').webui;

function findById(id, fn) {
  var idx = id - 1;
  if (config.users[idx]) {
    fn(null, config.users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findByUsername(username, fn) {
  for (var i = 0, len = config.users.length; i < len; i++) {
    var user = config.users[i];
    if (user.username === username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}

function timeDiff(earlierDate, laterDate) {
  var nTotalDiff = laterDate.getTime() - earlierDate.getTime()
    , oDiff = {};
  oDiff.days = Math.floor(nTotalDiff / 1000 / 60 / 60 / 24);
  nTotalDiff -= oDiff.days * 1000 * 60 * 60 * 24;
  oDiff.hours = Math.floor(nTotalDiff / 1000 / 60 / 60);
  nTotalDiff -= oDiff.hours * 1000 * 60 * 60;
  oDiff.minutes = Math.floor(nTotalDiff / 1000 / 60);
  nTotalDiff -= oDiff.minutes * 1000 * 60;
  oDiff.seconds = Math.floor(nTotalDiff / 1000);
  return oDiff;
}

// WebUI Class
//////////////
function WebUI(bot) {
  var self = this;
  self.bot = bot;

  // Start the web server
  self.initExpress();

  console.log('WebUI'.green + ': Listening at port ' + config.port);
}


WebUI.prototype.initExpress = function () {
  var self = this;

  // Set up logging in with passport
  passport.serializeUser(function(user, done) { done(null, user.id); });
  passport.deserializeUser(function(id, done) {
    findById(id, function (err, user) { done(err, user); });
  });
  passport.use(new LocalStrategy(
    function verify(username, password, done) {
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (user.password != password) { return done(null, false); }
        return done(null, user);
      });
    }
  ));

  var app  = self.app = express.createServer();

  app.configure(function() {
    // Setup templating
    app.set('view engine','hogan.js');
    app.set("view options", {layout: false});
    app.set("views", __dirname + '/web/views');
    app.register(".html", adapter.init(hogan));
    app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
    app.set('basepath', config.base)
    // Setup necessary modules
    app.use(express.cookieParser());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.session({secret: config.secret}));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(__dirname + '/web/public'));
  });

  // Handle connections

  app.get('/', function (req, res) { self.index(req, res); });

  app.post('/login', passport.authenticate('local', { failureRedirect: 'home' }),
    function (req, res) { res.redirect('home'); });

  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('home');
  });

  app.post('/broadcast', ensureAuthenticated, function (req, res) {
    self.bot.broadcastString(req.body.msg);
    res.redirect('home');
  });
  
  app.listen(config.port);
};


WebUI.prototype.index = function (req, res) {
  var self = this;

  function output(name) {
    var o = self.bot.outputs[name];
    return {
      name: name,
      ready: o.ready
    };
  }

  function event(e) {
    if (new Date(Date.now() + e.headstart) < e.sdate) {
      var diff = timeDiff(new Date(Date.now() + e.headstart), e.sdate);
    } else {
      var diff = timeDiff(e.sdate, new Date(Date.now() + e.headstart));
    }
    e.fromNow = (diff.days    > 0 ? diff.days    + ' days '   : '')
              + (diff.hours   > 0 ? diff.hours   + ' hours '  : '')
              + (diff.minutes > 0 ? diff.minutes + ' minutes' : '');
    e.fromNow = e.fromNow || 'now';
    return e;
  }

  if (req.isAuthenticated()) {
    res.render("main.html", {
      locals: {
        authenticated: req.isAuthenticated(),
        user: req.user,
        events: self.bot.events.map(event),
        outs: Object.keys(self.bot.outputs).map(output)
      }
    });
  } else { res.render("main.html"); }
};

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

module.exports = WebUI;
