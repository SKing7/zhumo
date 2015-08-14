'use strict';

module.exports = function (router) {
    var users = require('../../app/controllers/users');
    var accounts = require('../../app/controllers/accounts');

    // API Routes
    router.get('/api/accounts/tree', users.requiresLogin, accounts.tree);
    // router.post('/api/accounts/create', users.requiresLogin, accounts.create);
    // router.get('/api/accounts/read/:accountId', users.requiresLogin, accounts.hasAuthorization, accounts.read);
    // router.put('/api/accounts/update/:accountId', users.requiresLogin, accounts.hasAuthorization, accounts.update);
    router.delete('/api/accounts/delete/:accountId', users.requiresLogin, accounts.hasAuthorization, accounts.delete);
    router.post('/api/accounts/addchild', users.requiresLogin, accounts.addchild);

    // FrountEnd Routes
    router.get('/settings/accounts', users.requiresLogin, accounts.index);
    // router.get('/accounts/init', users.requiresLogin, accounts.init);
    // router.post('/accounts/init', users.requiresLogin, accounts.initAPI);

    // Finish by binding the Account middleware
    router.param('accountId', accounts.accountByID);
};
