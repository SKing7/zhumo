'use strict';

var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    User = require('mongoose').model('User');

module.exports = function () {
    // Use local strategy
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },
        function (email, password, done) {
            User.findOne({ email: email }).exec(function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(new Error('用户不存在'), false);
                }
                if (!user.authenticate(password)) {
                    return done(new Error('密码不正确'), false);
                }

                return done(null, user);
            });
        }
    ));
};
