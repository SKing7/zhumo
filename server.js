'use strict';

if (process.env.NODE_ENV !== 'production'){
    require('longjohn');
}

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */
var init = require('./config/init')(),
    config = require('./config/config'),
    mongoose = require('mongoose'),
    logger = require('winston');

// Bootstrap db connection
var db = mongoose.connect(config.mongodb);

// Init the express application
var app = require('./config/express')(db);

// Bootstrap passport config
require('./config/passport')();

// Start the app by listening on <port>
app.listen(config.port);

// Expose app
exports = module.exports = app;

// Log initialization
logger.info('app started on port ' + config.port);

