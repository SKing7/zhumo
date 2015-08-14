'use strict';

/**
 * acl configurations
 * https://github.com/OptimalBits/node_acl
 */
var ACL = require('acl'),
    backend = require('acl-mem-regexp'),
    path = require('path'),
    _ = require('lodash'),
    config = require('./config'),
    logger = require('winston');

var acl = new ACL(new ACL.memoryBackend(), logger);

// acl settings
acl.allow([
    {   // public resources
        roles: ['nobody', 'owner', 'writer', 'viewer'],
        allows: [
            { resources: '/', permissions: 'get' },
            { resources: '/pages/about', permissions: 'get' },
            { resources: '/pages/contact', permissions: 'get' },
            { resources: '/agreements/privacy', permissions: 'get' },
            { resources: '/agreements/service', permissions: 'get' },
            { resources: '/users/signup', permissions: ['get', 'post'] },
            { resources: '/users/signin', permissions: ['get', 'post'] },
            { resources: '/users/setpassword', permissions: ['get', 'post'] },
            { resources: '/users/checkemail', permissions: 'get' },
            { resources: '/users/signupcomplete', permissions: 'get' },
            { resources: '/users/signup/verify', permissions: 'get' },
            { resources: '/users/signup/verifycomplete', permissions: 'get' },
        ],
    },
    {   // member only resources
        roles: ['owner', 'writer', 'viewer'],
        allows: [
            { resources: '/users/signout', permissions: ['get', 'post'] },
            { resources: '/users/changepassword', permissions: ['get', 'post'] },
            { resources: '/users/checkpassword', permissions: 'get' },

            { resources: '/reports/', permissions: 'get' },
            { resources: '/reports/assets', permissions: 'get' },
            { resources: '/reports/profits', permissions: 'get' },
            { resources: '/reports/transactions', permissions: 'get' },

            { resources: '/dashboards/', permissions: 'get' },

            { resources: '/api/companies/create', permissions: 'post' },
            { resources: '/api/companies/select', permissions: 'get' },
            { resources: '/api/companies/verifymember', permissions: 'get' },

            { resources: '/api/transactions/category', permissions: 'get' },
            { resources: '/api/transactions/totalamount', permissions: 'get' },

            { resources: '/api/accounts/tree', permissions: 'get' },
            { resources: '/api/categories/tree', permissions: 'get' },

            { resources: '/api/reports/categoryinout', permissions: 'get' },
            { resources: '/api/reports/transactionsflow', permissions: 'get' },
            { resources: '/api/reports/assets', permissions: 'get' },
        ],
    },
    {   // owner only resources
        roles: ['owner'],
        allows: [
            { resources: '/settings/categories', permissions: 'get' },
            { resources: '/settings/accounts', permissions: 'get' },
            { resources: '/settings/profile', permissions: 'get' },
            { resources: '/settings/members', permissions: 'get' },

            { resources: '/transactions/add', permissions: 'get' },
            { resources: '/transactions/assets', permissions: 'get' },
            { resources: '/transactions/history', permissions: 'get' },

            { resources: '/api/companies/update', permissions: 'post' },
            { resources: '/api/companies/addmember', permissions: 'post' },
            { resources: '/api/companies/removemember', permissions: 'post' },
            { resources: '/api/companies/editmember', permissions: 'post' },

            { resources: '/api/transactions/create', permissions: 'post' },
            { resources: '/api/transactions/delete', permissions: 'delete' },
            { resources: '/api/transactions/update', permissions: 'put' },

            { resources: '/api/categories/delete', permissions: 'delete' },
            { resources: '/api/categories/addchild', permissions: 'post' },

            { resources: '/api/accounts/addchild', permissions: 'post' },
            { resources: '/api/accounts/delete', permissions: 'delete' },
        ],
    },
    {   // writer only resources
        roles: ['writer'],
        allows: [
            { resources: '/transactions/add', permissions: 'get' },
            { resources: '/transactions/assets', permissions: 'get' },
            { resources: '/transactions/history', permissions: 'get' },

            { resources: '/api/transactions/create', permissions: 'post' },
            { resources: '/api/transactions/delete', permissions: 'delete' },

            { resources: '/api/categories/delete', permissions: 'delete' },
            { resources: '/api/categories/addchild', permissions: 'post' },

            { resources: '/api/accounts/addchild', permissions: 'post' },
            { resources: '/api/accounts/delete', permissions: 'delete' },
        ],
    }
]);

// user id getter
var getUserId = function (req) { return req.user ? req.user._id.toString() : null; };

// middleware for express
acl.authorize = function () {
    return function (req, res, next) {
        if (req.user && req.session && req.session.member) {
            acl.addUserRoles(getUserId(req), req.session.member.role, function (err) {
                if (err) { return next(err); }
                acl.middleware(3, getUserId, req.method.toLowerCase())(req, res, next);
            });
        } else {
            acl.addUserRoles('nobody', 'nobody', function (err) {
                if (err) { return next(err); }
                acl.middleware(3, 'nobody', req.method.toLowerCase())(req, res, next);
            });
        }
    };
};

// menu permissions
acl.menuResources = {
    '/transactions/add': '记账',
    '/reports/': '导出报表',
    '/dashboards/': '收支图表',
    '/settings/categories': '设置',
};

module.exports = acl;

