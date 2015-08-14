'use strict';

/**
 * handlebars engine config
 */
var path = require('path'),
    handlebars = require('handlebars'),
    expresshbs = require('express-hbs');

// register helpers
// https://github.com/danharper/Handlebars-Helpers/blob/master/src/helpers.js
require('../app/helpers/handlebars');

module.exports = expresshbs.express3({
    handlebars: handlebars,
    blockHelperName: 'block',
    contentHelperName: 'append',
    partialsDir: [ path.resolve('./app/views/partials/') ],
    layoutsDir: path.resolve('./app/views/layouts/'),
    defaultLayout: path.resolve('./app/views/layouts/ucenter.hbs'),
});

