'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport');

module.exports = function (router) {
    // User Routes
    var users = require('../../app/controllers/users');

    // signin, signup
    router.get('/users/signin', users.frontendSignin);
    router.post('/users/signin', users.signin);
    router.get('/users/signup', users.frontendSignup);
    router.post('/users/signup', users.signup);
    router.get('/users/checkemail', users.checkEmail);
    router.get('/users/signout', users.signout);
    router.get('/users/signupcomplete', users.signupcomplete);
    router.get('/users/signup/verify/:sign', users.signupverify);
    router.get('/users/signup/verifycomplete', users.verifycomplete);

    // password related
    router.get('/users/changepassword', users.changepassword);
    router.get('/users/checkpassword', users.checkpassword);
    router.post('/users/changepassword', users.changePassword);
    router.get('/users/setpassword', users.setpassword);
    router.post('/users/setpassword', users.postSetpassword);

    // Finish by binding the user middleware
    router.param('userId', users.userByID);
};
