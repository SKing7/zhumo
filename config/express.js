'use strict';

/**
 * express application config
 * http://expressjs.com/migrating-4.html
 */
var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    favicon = require('serve-favicon'),
    compress = require('compression'),
    passport = require('passport'),
    moment = require('moment'),
    auditlog = require('audit-log'),
    morgan = require('morgan'),
    methodOverride = require('method-override'),
    MongoStore = require('connect-mongostore')(session),
    flash = require('express-flash'),
    config = require('./config'),
    acl = require('./acl'),
    handlebars = require('./handlebars'),
    // middleware = require('./middleware'),
    path = require('path'),
    util = require('util'),
    _ = require('lodash'),
    winston = require('winston'),
    logger = winston;


module.exports = function (db) {
    // Initialize express app
    var app = express();
    var router = express.Router();

    // mongoose audit log: must go before model init
    // auditlog.addTransport('console');
    auditlog.addTransport('mongoose', {connectionString: config.mongodb});

    // Globbing model files
    config.getGlobbedFiles('./app/models/**/*.js').forEach(function(modelPath) {
        logger.info('load model file: %s', modelPath);
        require(path.resolve(modelPath));
    });

    // Setting the environment locals
    // Setting application local variables
    app.locals.title = config.app.title;
    app.locals.description = config.app.description;
    app.locals.keywords = config.app.keywords;
    //app.locals.jsFiles = config.getJavaScriptAssets();
    //app.locals.cssFiles = config.getCSSAssets();

    // Should be placed before express.static
    app.use(compress({
        filter: function (req, res) {
            return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
        }
    }));

    // Showing stack errors
    app.set('showStackError', true);

    // FIXME custom middlewares
    // middleware(app);

    // Set handlebars as the template engine
    app.engine('hbs', handlebars);

    // Set views path and view engine
    app.set('view engine', 'hbs');
    app.set('views', path.resolve('./app/views'));

    // environment sensible configurations
    switch (process.env.NODE_ENV) {
    case 'development':
        // enable logger
        app.use(morgan('dev'));

        // Disable views cache
        app.set('view cache', false);

        // using colorize console logger when dev
        winston.remove(winston.transports.Console);
        winston.add(winston.transports.Console, {colorize: true});

        // debug switch
        config.debug = true;

        break;

    case 'production':
        app.use(morgan('combined'));

        // setup log rotate on production
        winston.remove(winston.transports.Console);
        winston.add(winston.transports.DailyRotateFile, {
            filename: config.logpath,
            dirname: path.dirname(config.logpath),
            datePattern: '.yyyy-MM-dd',
            timestamp: function() {
                return moment().format(config.timeFormat || 'YYYY-MM-DD HH:mm:ss');
            },
            colorize: true,
        });

        // debug switch
        config.debug = false;

        break;

    case 'test':
        // enable logger
        app.use(morgan('dev'));

        break;
    }

    //  request body parsing middleware should be above methodOverride
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(methodOverride('X-HTTP-Method-Override'));

    // Enable jsonp
    app.enable('jsonp callback');

    // cookieParser should be above session
    app.use(cookieParser());

    // express/mongo session storage: https://github.com/expressjs/session
    app.use(session({
        resave: true,
        rolling: true,
        saveUninitialized: true,
        secret: config.session.secret,
        store: new MongoStore({
            db: db.connection.db,
            collection: config.session.collection
        }),
        cookie: {
            maxAge: config.session.maxAge
        },
    }));

    // use passport session
    app.use(passport.initialize());
    app.use(passport.session());

    // Setting the app router and static folder
    app.use(favicon(path.resolve('./public/favicon.ico')));
    app.use(express.static(path.resolve('./public')));

    // globals: request, config, controller, page
    app.use(function (req, res, next) {
        var components = _.filter(req.path.split('/'));
        if (components.length === 0) {
            components = ['core', 'index'];
        } else if (components.length === 1) {
            components.push('index');
        }
        req.page = components.join('-');
        req.controller = components[0];

        app.locals.request = req;
        app.locals.config = config;

        next();
    });

    // connect flash for flash messages
    app.use(flash());

    // access control
    app.use(acl.authorize());

    require('../app/helpers/util').init();
    // Globbing routing files
    config.getGlobbedFiles('./app/routes/*.js').forEach(function(routePath) {
        logger.info('load router file: %s', routePath);
        require(path.resolve(routePath))(app);
    });

    // Assume 'not found' in the error msgs is a 404. this is somewhat silly, but valid, you can do whatever you like, set properties, use instanceof etc.
    app.use(function (err, req, res, next) {
        // If the error object doesn't exists
        if (!err) return next();

        // check for session expire
        if (!req.user && err.errorCode === 403) {
            req.flash('error', '你无权访问该资源或者会话已过期，请重新登陆');
            return res.redirect('/users/signin');
        }

        logger.error('URL: %s, ERROR: %s', req.url, util.inspect(err));

        if (req.path.indexOf('/api/') === 0 && req.accepts('application/json')) {
            res.jsonp({ status: false, msg: err.msg || err.message || err.toString() });
        } else {
            req.flash('error', err.msg || err.message || err.toString());
            res.redirect(err.redirect || req.get('referer'));
        }
    });

    // Assume 404 since no middleware responded
    app.use(function (req, res) {
        res.render('404', {
            url: req.originalUrl,
            messages: 'Not Found'
        });
    });

    return app;
};
