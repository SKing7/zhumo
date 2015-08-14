'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Account = mongoose.model('Account'),
    Company = mongoose.model('Company'),
    logger = require('winston'),
    Q = require('q'),
    _ = require('lodash');

/**
 * Create a Account
 */
exports.create = function (req, res) {
    var account = new Account(req.body);
    account.createdBy = req.user;

    account.save(function (err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                account: account
            });
        } else {
            res.jsonp(account);
        }
    });
};

/**
 * Show the current Account
 */
exports.read = function (req, res) {
    res.jsonp(req.account);
};

/**
 * Init account balances
 */
exports.init = function (req, res, next) {
    logger.info('get company in session', req.session.company);

    if (!req.session.company) {
        logger.error('没有公司信息不能初始化账户信息');
        req.flash('error', '没有公司信息不能初始化账户信息');
        res.render('accounts/init', {
            accounts: [],
            user: req.user,
            company: {},
        });
    } else {
        Company.findById(req.session.company._id, function (err, company) {
            if (err) { return next(err); }
            Account.getTreeByCompany(company, function (err, data) {
                if (err) { return next(err); }
                res.render('accounts/init', {
                    accounts: data,
                    user: req.user,
                    company: company,
                });
            });
        });
    }
};

/**
 * save user submitted account balances
 */
exports.initAPI = function (req, res, next) {
    var balances = req.body.balances;
    var accounts = req.body.accounts;
    var company = req.session.company;

    // res.jsonp(req.body);

    // param check
    if (!balances || !balances.length) {
        return next(new Error('设置账户期初余额未提供余额信息'));
    }

    if (!accounts || !accounts.length) {
        return next(new Error('设置账户期初余额未提供账户信息'));
    }

    if (balances.length !== accounts.length) {
        return next(new Error('设置账户期初余额请求非法'));
    }

    // set account initialBalance/currentBalance
    var tasks = _.map(balances, function (balance, i) {
        var d = Q.defer();
        Account.findById(accounts[i], function (err, account) {
            if (err) { return d.reject(err); }
            if (!account) { return d.resolve(); }

            account.initialBalance = balance;
            account.currentBalance = balance;

            account.save(function (err) {
                if (err) { return d.reject(err); }
                logger.info('setup balance for company#%s:account#%s to %d', company.name, account.name, balance);
                d.resolve();
            });
        });
    });

    Q.all(tasks).then(function () {
        req.session.company = req.session.company;
        req.session.company = null;
        res.redirect('/transactions/add');
    }).fail(function (err) {
        return next(err);
    });

};

/**
 * Update a Account
 */
exports.update = function (req, res, next) {
    var account = req.account;

    account = _.extend(account, req.body);

    account.save(function (err) {
        if (err) { return next(err); }
        res.jsonp(account);
    });
};

/**
 * Delete an Account
 */
exports.delete = function (req, res, next) {
    var account = req.account;

    account.remove(function (err) {
        if (err) {
            next({ status: 500, error: err });
        } else {
            req.flash('success', '账户删除成功');
            res.jsonp(account);
        }
    });
};

/**
 * List of Accounts
 */
exports.list = function (req, res) {
    Account.find().sort('-created').populate('createdBy', 'username').exec(function (err, accounts) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            res.jsonp(accounts);
        }
    });
};

/**
 * 获得account的树状结构
 */
exports.tree = function (req, res) {
    var company = req.session.company;
    Account.getTreeByCompany(company, function (err, data) {
        if (err) {
            res.jsonp(err);
        } else {
            res.jsonp(data);
        }
    });
};

/**
 * Frontend Routes
 */
exports.index = function (req, res, next) {
    var company = req.session.company;
    Account.getTreeByCompany(company, function (err, data) {
        if (err) { return next(err); }
        // return res.jsonp(data);
        res.render('accounts/index', {
            accounts: data,
        });
    });
};

exports.addchild = function (req, res, next) {
    if (!req.body.name) {
        return next(new Error('必须指定子账户名称'));
    }
    if (!req.body.parentId) {
        return next(new Error('必须指定父账户'));
    }

    var child = new Account({
        createdBy: req.user,
        company: req.session.company,
        name: req.body.name.trim(),
    });

    Account.addChild(req.body.parentId, child, function (err, account) {
        if (err) { return next(err); }
        req.flash('success', '子账户添加成功');
        res.redirect('/settings/accounts');
    });
};

/**
 * Account middleware
 */
exports.accountByID = function (req, res, next, id) {
    Account.findById(id).populate('createdBy', 'username').exec(function (err, account) {
        if (err) return next(err);
        if (!account) return next(new Error('Failed to load Account ' + id));
        req.account = account;
        next();
    });
};

/**
 * Account authorization middleware
 */
exports.hasAuthorization = function (req, res, next) {
    if (req.account.createdBy.id !== req.user.id) {
        return res.send(403, 'User is not authorized');
    }
    next();
};

