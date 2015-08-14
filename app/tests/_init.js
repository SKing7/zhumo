var path = require('path');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */
var init = require('./../../config/init')(),
    config = require('./../../config/config'),
    mongoose = require('mongoose'),
    logger = require('winston');

// bootstrap connection
if (!global.connected) {
    mongoose.connect(config.mongodb, function (err) {
        logger.error(err);
    });

    // bootstrap models
    config.getGlobbedFiles('./app/models/**/*.js').forEach(function(modelPath) {
        logger.info('load model file: %s', modelPath);
        require(path.resolve(modelPath));
    });

    global.connected = true;
}
