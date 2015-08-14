'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');

/**
 * Frontend Routes
 */
exports.index = function (req, res, next) {
    res.render('dashboards/index', {
    });
};
