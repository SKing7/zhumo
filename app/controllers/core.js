'use strict';

/**
 * Module dependencies.
 */
exports.index = function (req, res) {
    res.render('core/index', {
        infos: req.flash('info'),
        errors: req.flash('error'),
        user: req.user || null,
        layout: 'default',
    });
};

