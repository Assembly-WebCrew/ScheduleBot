var colors   = require('colors')
  , express  = require('express')
  , mustache = require('mustache')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  // Read configure
  , config = require('./config').webui;

var tmpl = {
  compile: function (source, options) {
    if (typeof source == 'string') {
      return function(options) {
        options.locals = options.locals || {};
        options.partials = options.partials || {};
        if (options.body) // for express.js > v1.0
          locals.body = options.body;
        return mustache.to_html(
          source, options.locals, options.partials);
      };
    } else {
      return source;
    }
  },
  render: function (template, options) {
    template = this.compile(template, options);
    return template(options);
  }
};

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
    app.set("views", __dirname + '/web/views');
    app.set("view options", {layout: false});
    app.register(".template", tmpl);
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

  app.post('/login', passport.authenticate('local', { failureRedirect: '/' }),
    function (req, res) { res.redirect(config.base); });

  app.get('/logout', function(req, res){
    req.logout();
    res.redirect(config.base);
  });

  app.listen(config.port);
};


WebUI.prototype.index = function (req, res) {
  var self = this;
  if (req.isAuthenticated()) {
    res.render("main.template", {
      locals: {
        authenticated: req.isAuthenticated(),
        user: req.user,
        events: self.bot.events
      }
    });
  } else { res.render("main.template"); }

};


module.exports = WebUI;
