'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Category = mongoose.model('Category'),
    logger = require('winston'),
    _ = require('lodash');

/**
 * Create a Category
 */
exports.create = function (req, res) {
    var category = new Category(req.body);
    category.createdBy = req.user;

    category.save(function (err) {
        if (err) {
            return res.send('users/signup', {
                errors: err.errors,
                category: category
            });
        } else {
            res.jsonp(category);
        }
    });
};

/**
 * Show the current Category
 */
exports.read = function (req, res) {
    res.jsonp(req.category);
};

/**
 * Update a Category
 */
exports.update = function (req, res) {
    var category = req.category;

    category = _.extend(category, req.body);

    category.save(function (err) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            res.jsonp(category);
        }
    });
};

/**
 * Delete an Category
 */
exports.delete = function (req, res, next) {
    var category = req.category;

    category.remove(function (err) {
        if (err) {
            next({ status: 500, error: err });
        } else {
            req.flash('success', '项目删除成功');
            res.jsonp(category);
        }
    });
};

/**
 * List of Categories
 */
exports.list = function (req, res) {

    var filter = { company: req.session.company };
    Category.find(filter).sort('-created').populate('createdBy', 'username').exec(function (err, categories) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            res.jsonp(categories);
        }
    });
};

/**
 * 获得category的树状结构
 */
exports.tree = function (req, res) {
    var company = req.session.company;
    Category.getTreeByCompany(company, function (err, data) {
        if (err) {
            res.jsonp(err);
        } else {
            var result = [];
            for (var i = 0; i < data.length; i++) {
                var index = [ '支出', '收入', '借贷', '账户注资', '户内转账'].indexOf(data[i].name);
                result[index] = data[i];
            }
            res.jsonp(result);
        }
    });
};

/**
 * Frontend Routes
 */
exports.index = function (req, res, next) {
    var company = req.session.company;
    Category.getTreeByCompany(company, function (err, data) {
        if (err) { return next(err); }
        // return res.jsonp(data);
        res.render('categories/index', {
            categories: data,
        });
    });
};

exports.addchild = function (req, res, next) {
    if (!req.body.name) {
        return next(new Error('必须指定子项目名称'));
    }
    if (!req.body.parentId) {
        return next(new Error('必须指定父项目'));
    }

    var child = new Category({
        createdBy: req.user,
        company: req.session.company,
        name: req.body.name.trim(),
    });

    Category.addChild(req.body.parentId, child, function (err, category) {
        if (err) { return next(err); }
        req.flash('success', '子项目添加成功');
        res.redirect('/settings/categories');
    });

};

/**
 * Category middleware
 */
exports.categoryByID = function (req, res, next, id) {
    Category.findById(id).populate('createdBy', 'username').exec(function (err, category) {
        if (err) return next(err);
        if (!category) return next(new Error('Failed to load Category ' + id));
        req.category = category;
        next();
    });
};

/**
 * Category authorization middleware
 */
exports.hasAuthorization = function (req, res, next) {
    if (req.category.createdBy.id !== req.user.id) {
        return res.send(403, 'User is not authorized');
    }
    next();
};

