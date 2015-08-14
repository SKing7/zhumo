'use strict';

module.exports = function (router) {
    var users = require('../../app/controllers/users');
    var companies = require('../../app/controllers/companies');

    // API Routes
    // router.get('/api/companies', users.requiresLogin, companies.list);
    router.post('/api/companies/create', users.requiresLogin, companies.create);
    // router.get('/api/companies/read/:companyId', users.requiresLogin, companies.read);
    // router.delete('/api/companies/delete/:companyId', users.requiresLogin, companies.delete);
    router.post('/api/companies/update/:companyId', users.requiresLogin, companies.update);
    router.get('/api/companies/select/:companyId', users.requiresLogin, companies.select);
    router.post('/api/companies/addmember', users.requiresLogin, companies.addmember);
    router.post('/api/companies/removemember', users.requiresLogin, companies.removemember);
    router.post('/api/companies/editmember', users.requiresLogin, companies.editmember);
    router.get('/api/companies/verifymember/:sign', companies.verifymember);

    // FrontEnd Routes
    router.get('/settings/profile', users.requiresLogin, companies.profile);
    router.get('/settings/members', users.requiresLogin, companies.members);

    // Finish by binding the company middleware
    router.param('companyId', companies.companyByID);
};
