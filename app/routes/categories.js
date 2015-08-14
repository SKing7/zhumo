'use strict';

module.exports = function (router) {
    var users = require('../../app/controllers/users');
    var categories = require('../../app/controllers/categories');

    // API Routes
    router.get('/api/categories/tree', users.requiresLogin, categories.tree);
    // router.post('/api/categories/create', users.requiresLogin, categories.create);
    // router.get('/api/categories/read/:categoryId', users.requiresLogin, categories.hasAuthorization, categories.read);
    // router.put('/api/categories/update/:categoryId', users.requiresLogin, categories.hasAuthorization, categories.update);
    router.delete('/api/categories/delete/:categoryId', users.requiresLogin, categories.hasAuthorization, categories.delete);
    router.post('/api/categories/addchild', users.requiresLogin, categories.addchild);

    // FrontEnd Routes
    router.get('/settings/categories', users.requiresLogin, categories.index);

    // Finish by binding the Category middleware
    router.param('categoryId', categories.categoryByID);
};
