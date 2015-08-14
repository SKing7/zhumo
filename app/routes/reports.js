'use strict';

module.exports = function (app) {
    var users = require('../../app/controllers/users');
    var reports = require('../../app/controllers/reports');

    // Reports Routes
    app.get('/reports', users.requiresLogin, reports.index);
    app.get('/reports/profits', users.requiresLogin, reports.profits);
    app.get('/reports/assets', users.requiresLogin, reports.assets);
    app.get('/reports/transactions', users.requiresLogin, reports.transactions);

    app.get('/api/reports/categoryinout', users.requiresLogin, reports.inout);
    app.get('/api/reports/transactionsflow', users.requiresLogin, reports.transactionsFlow);
    app.get('/api/reports/assets', users.requiresLogin, reports.assetReport);
};
