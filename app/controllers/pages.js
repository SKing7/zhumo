'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    _ = require('lodash');

/**
 * about
 */
exports.about = function (req, res) {
    res.render('pages/about', {
    });
};

/**
 * contact
 */
exports.contact = function (req, res) {
    res.render('pages/contact', {
    });
};

