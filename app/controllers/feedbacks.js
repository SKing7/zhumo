'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Mail = require('../helpers/mail'),
    Feedback = mongoose.model('Feedback'),
    Company = mongoose.model('Company'),
    _ = require('lodash');

/**
 * Create a Feedback
 */
exports.create = function (req, res, next) {
    var feedbackReq = req.body,
        feedback,
        now = new Date();

    Company.findById(req.body.companyId, function (err, company) {
        if (err) return next(err);

        feedbackReq.date = now.getFullYear() + '/' + (now.getMonth() + 1) + '/' + now.getDate();
        feedbackReq.user = req.user;
        feedbackReq.company = company;
        feedback = new Feedback(feedbackReq);

        // 保存数据
        feedback.save();
        // 改成发送邮件形式
        feedbackReq.user = req.user.email;
        feedbackReq.company = company.name;

        // 发送邮件
        Mail.send('feedback', { to: 'wangshijun@meituan.com' , subject: '意见反馈'}, { feedback: feedbackReq}, function (err) {
            if (err) return res.send(500, '发送失败');
            res.send(200, '发送成功');
        });

    });
};

/**
 * Show the current Feedback
 */
exports.read = function (req, res) {
    res.jsonp(req.feedback);
};

/**
 * Update a Feedback
 */
exports.update = function (req, res) {
    var feedback = req.feedback;

    feedback = _.extend(feedback, req.body);

    feedback.save(function (err) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            res.jsonp(feedback);
        }
    });
};

/**
 * Delete an Feedback
 */
exports.delete = function (req, res) {
    var feedback = req.feedback;

    feedback.remove(function (err) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            res.jsonp(feedback);
        }
    });
};

/**
 * List of Feedbacks
 */
exports.list = function (req, res) {
    Feedback.find().sort('-created').populate('user', 'displayName').exec(function (err, feedbacks) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            res.jsonp(feedbacks);
        }
    });
};

/**
 * Feedback middleware
 */
exports.feedbackByID = function (req, res, next, id) {
    Feedback.findById(id).populate('user', 'displayName').exec(function (err, feedback) {
        if (err) return next(err);
        if (!feedback) return next(new Error('Failed to load Feedback ' + id));
        req.feedback = feedback;
        next();
    });
};

/**
 * Feedback authorization middleware
 */
exports.hasAuthorization = function (req, res, next) {
    if (req.feedback.user.id !== req.user.id) {
        return res.send(403, 'User is not authorized');
    }
    next();
};
