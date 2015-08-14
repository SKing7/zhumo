'use strict';

module.exports = function (app) {
    var users = require('../../app/controllers/users');
    var dashboards = require('../../app/controllers/dashboards');

    // Dashboards Routes
    app.get('/dashboards', users.requiresLogin, dashboards.index);

};
