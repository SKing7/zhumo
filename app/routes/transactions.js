'use strict';

module.exports = function (router) {
    var users = require('../../app/controllers/users');
    var transactions = require('../../app/controllers/transactions');
    var userController = require('../../app/controllers/users');

    // Transactions API Routes
    router.post('/api/transactions/create', users.requiresLogin, transactions.create);
    router.get('/api/transactions/read/:transactionId', users.requiresLogin, transactions.read);
    router.put('/api/transactions/update/:transactionId', users.requiresLogin, transactions.update);
    router.delete('/api/transactions/delete/:transactionId', users.requiresLogin, transactions.delete);

    router.get('/api/transactions/category/:category', users.requiresLogin, transactions.listTransfer);
    router.get('/api/transactions/totalamount/:groupby/:timealias', users.requiresLogin, transactions.hasAuthorization, transactions.transactionTotalGroupByTransfer);
    router.get('/api/transactions/totalamount/:groupby', users.requiresLogin, transactions.hasAuthorization, transactions.transactionTotalGroupByTransfer);

    // Front End Routes
    router.get('/transactions/add', users.requiresLogin, transactions.add);
    router.get('/transactions/assets', users.requiresLogin, transactions.assets);
    router.get('/transactions/history', users.requiresLogin, transactions.history);

    // Finish by binding the Transaction middleware
    router.param('transactionId', transactions.transactionByID);

};
