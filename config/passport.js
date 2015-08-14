'use strict';

var passport = require('passport'),
    User = require('mongoose').model('User'),
    config = require('./config'),
    logger = require('winston'),
    path = require('path');

module.exports = function () {
    // Serialize sessions
    passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    // Deserialize sessions
    passport.deserializeUser(function (id, done) {
        User.findOne({ _id: id }).select('-salt -password').populate('defaultCompany').exec(function (err, user) {
            if (err) {
                logger.error('passport.deserializeUser: ', err.toString());
                return done(err, user);
            }
            if (!user) {
                logger.error('passport.deserializeUser: user not found');
                return done(err, user);
            }
            user.getCompanies(function (err, companies) {
                if (err) {
                    logger.error('passport.deserializeUser: ', err.toString());
                    return done(err, user);
                }
                // logger.info('passport.deserializeUser: got %d companies for user %s', companies.length, user.email);
                user.companies = companies;
                done(err, user);
            });
        });
    });

    // Initialize strategies
    config.getGlobbedFiles('./config/strategies/**/*.js').forEach(function(strategy) {
        require(path.resolve(strategy))();
    });
};
