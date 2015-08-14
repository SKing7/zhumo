'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    passport = require('passport'),
    moment = require('moment'),
    User = mongoose.model('User'),
    Member = mongoose.model('Member'),
    Secret = mongoose.model('Secret'),
    Mail = require('../helpers/mail'),
    config = require('../../config/config'),
    acl = require('../../config/acl'),
    _ = require('lodash'),
    crypto = require('crypto'),
    logger = require('winston');

/**
 * Signup
 *
 * - create new user and save it
 * - create new company that owned by user
 */
exports.signup = function (req, res, next) {
    logger.info('user signup: ', req.body);

    if (!req.body.email) {
        return next(new Error('必须提供邮箱才能注册'));
    }
    if (!req.body.password) {
        return next(new Error('必须提供密码才能注册'));
    }

    User.findOne({ email: req.body.email }, function (err, found) {
        if (err) { return next(err); }
        if (found) { return next(new Error('邮箱已经被注册')); }

        var user = new User(req.body);

        // crypto
        user.salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
        user.password = User.hashPassword(user.password, user.salt);

        // Add missing user fields
        user.provider = 'local';

        user.save(function (err, user) {
            if (err) { return next(err); }

            var name = req.body.company ? req.body.company.trim() : user.email.split('@').shift() + '的公司';

            // create company for user
            user.addCompany(name, function (err, company, member) {
                if (err) { return next(err); }

                Secret.sign({ user: user._id, company: company._id, type: 'signupVerify' }, function(err, sign) {
                    var data = {
                        sign: sign,
                        config: config,
                        user: user,
                        company: company,
                    };

                    var to = {
                        to: user.email,
                        subject: '新用户激活',
                    };

                    Mail.send('signup', to, data);

                    user.password = undefined;
                    user.salt = undefined;

                    req.login(user, function (err) {
                        if (err) return next(err);

                        req.session.company = company.toObject();
                        req.session.member = member.toObject();
                        res.redirect('/users/signupcomplete');
                    });
                });
            });
        });

    });

};

/**
 * Signin after passport authentication
 */
exports.signin = function (req, res, next) {
    logger.info('user login: ', req.body);

    passport.authenticate('local', function (err, user) {
        if (err) { 
            req.flash('error', '登录失败');
            res.redirect('/users/signin');
            logger.error('user login error: ', err.message);
            return; 
        }

        // Remove sensitive data before login
        user.password = undefined;
        user.salt = undefined;

        req.login(user, function (err) {
            if (err) { return next(err); }
            // logger.info('logged in user', JSON.stringify(req.user.toObject()));

            user.getCompanies(function (err, companies) {
                if (err) { 
                    return next(err); 
                }

                user.companies = companies;

                // check default company first, then select from list
                var company;
                if (user.defaultCompany) {
                    company = user.defaultCompany;
                } else if (user.companies.length) {
                    company = user.companies[0];
                }

                // FIXME 没有公司时如何处理

                // save membership in session
                Member.findOne({ company: company, user: user }).exec(function (err, member) {
                    if (err) { return next(err); }

                    logger.info('user %s:%s select company %s', member.role, user.email, company.name);

                    req.session.company = company.toObject();
                    req.session.member = member.toObject();

                    res.redirect('/api/companies/select/' + company._id.toString());

                });
            });
        });
    })(req, res, next);

};

/**
 * Update user details
 */
exports.update = function (req, res, next) {
    // Init Variables
    var user = req.user;
    var message = null;

    if (user) {
        // Merge existing user
        user = _.extend(user, req.body);

        user.save(function (err) {
            if (err) {
                return next(err);
            } else {
                req.login(user, function (err) {
                    if (err) {
                        next({ status: 400, error: err });
                    } else {
                        res.jsonp(user);
                    }
                });
            }
        });
    } else {
        next({ status: 400, error: new Error('用户为登录') });
    }
};

/**
 * Change Password
 */
exports.changePassword = function (req, res, next) {
    // Init Variables
    var passwordDetails = req.body;

    if (req.user) {
        User.findById(req.user._id, function (err, user) {
            if (err) { return next(err); }
            if (!user) { return next(new Error('用户未找到')); }

            logger.info('change password: ', user.toObject());

            if (user.authenticate(passwordDetails.currentPassword)) {
                if (passwordDetails.newPassword === passwordDetails.verifyPassword) {
                    user.password = User.hashPassword(passwordDetails.newPassword, user.salt);

                    user.save(function (err) {
                        if (err) { return next(err); }
                        req.login(user, function (err) {
                            if (err) { return next(err); }
                            var data = {
                                dateStr: moment().format('YYYY-MM-DD HH:mm'),
                                user: user,
                            };

                            var to = {
                                to: user.email,
                                subject: '成功修改登陆密码',
                            };

                            Mail.send('changepassword', to, data);

                            req.flash('info', '密码修改成功');
                            res.redirect('/users/changepassword');
                        });
                    });

                } else {
                    return next(new Error('两次新密码不匹配'));
                }
            } else {
                return next(new Error('旧密码输入不正确'));
            }
        });
    } else {
        return next(new Error('用户未登录'));
    }

};

/**
 * Signout
 */
exports.signout = function (req, res) {
    req.logout();
    req.flash('info', '您已经安全退出');
    res.redirect('/');
};

/**
 * check email
 */
exports.checkEmail = function (req, res) {
    User.findOne({ email: req.query.email }).exec(function (err, user) {
        if (err) {
            logger.error(err);
            res.status(200).send(err);
        }

        if (user) {
            res.status(200).send('false');
        } else {
            res.status(200).send('true');
        }

    });
};

/**
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
    User.findOne({ _id: id }).populate('defaultCompany').exec(function (err, user) {
        if (err) return next(err);
        if (!user) return next(new Error('Failed to load User ' + id));
        req.profile = user;
        next();
    });
};

/**
 * Require login routing middleware
 */
exports.requiresLogin = function (req, res, next) {
    // logger.info(req.user);
    // logger.info(req.session);

    if (!req.isAuthenticated()) {
        req.flash('error', '您正试图访问未授权的页面，请先登录');
        return res.redirect('/users/signin');
    }

    next();
};

/**
 * User authorizations routing middleware
 */
exports.hasAuthorization = function (req, res, next) {
    if (req.profile.id !== req.user.id) {
        return res.send(403, 'User is not authorized');
    }

    next();
};

/**
 * Front end routes
 */
exports.frontendSignin = function (req, res, next) {
    if (req.user) {
        var userId = req.user._id.toString();
        acl.isAllowed(userId, '/transactions/add', 'get', function (err, allowed) {
            if (err) {
                return next(err);
            }
            if (allowed) {
                res.redirect('/transactions/add');
            } else {
                res.redirect('/reports/');
            }
        });
    } else {
        res.render('users/signin', { });
    }
};

exports.frontendSignup = function (req, res) {
    res.render('users/signup', {
    });
};

exports.signupcomplete = function (req, res, next) {
    if (!req.user) { return next(new Error('非法的访问')); }

    logger.info('user %s signup complete with company %s', req.user.email, req.session.company.name);

    var emails = {
        'gmail.com': 'https://mail.google.com/',
        '163.com': 'http://mail.163.com/',
        '126.com': 'http://mail.126.com/',
        'qq.com': 'http://mail.qq.com/',
        'sina.com': 'http://mail.sina.com/',
        'sohu.com': 'http://mail.sohu.com/',
        '21.cn': 'http://mail.21cn.com/',
        '139.com': 'http://mail.139.com/',
        '263.net': 'http://mail.263.net/',
    };

    var provider = req.user.email.split('@').pop();
    var emailUrl = emails[provider] ? emails[provider] : 'http://www.' + provider;

    res.render('users/signupcomplete', {
        company: req.session.company,
        user: req.user,
        emailUrl: emailUrl,
    });
};

exports.changepassword = function (req, res) {
    res.render('users/changepassword', { });
};

/**
 * 注册后邮箱验证
 */
exports.signupverify = function (req, res, next) {
    if (!req.params.sign) {
        return next(new Error('没有签名参数'));
    }
    Secret.resolve(req.params.sign, function (err, secret) {
        if (err) return next(err);
        if (!secret.user || !secret.company) return next(new Error('非法的签名'));

        User.findOne({ _id: secret.user }).exec(function (err, user) {
            if (err) return next(err);
            if (!user) return next(new Error('用户不存在'));

            user.isVerified = true;
            user.gmtVerified = new Date();

            user.save(function (err, user) {
                if (err) return next(err);
                logger.info('user signup verify success: ', secret);

                user.password = undefined;
                user.salt = undefined;

                req.login(user, function (err) {
                    if (err) return next(err);
                    req.session.secret = secret;
                    res.redirect('/users/signup/verifycomplete');
                });
            });
        });
    });
};

/**
 * 注册邮箱验证成功后的页面
 */
exports.verifycomplete = function (req, res, next) {
    logger.info('verify user with secret: ', req.session.secret);

    var secret = req.session.secret;
    if (!secret) {
        return next(new Error('非法的访问'));
    }

    req.session.secret = null;
    res.render('users/verifycomplete', { secret: secret });
};

/**
 * 设置初始登录密码
 */
exports.setpassword = function (req, res, next) {
    if (!req.session.secret) {
        return next(new Error('非法访问'));
    }

    res.render('users/setpassword', {
        secret: req.session.secret,
    });
};

/**
 * 设置密码，跳转到登陆页
 */
exports.postSetpassword = function (req, res, next) {
    if (!req.session.secret) {
        return next(new Error('非法访问'));
    }

    if (!req.body.password || !req.body.verifyPassword) {
        return next(new Error('请提供密码和确认码'));
    }

    User.findOne({ email: req.session.secret.email}, function (err, user) {
        if (err) return next(err);
        if (!user) return next(new Error('用户未找到'));

        var data = req.body;
        if (data.password === data.verifyPassword) {
            user.password = User.hashPassword(data.password, user.salt);

            user.save(function (err) {
                if (err) return next(err);
                req.session.secret = null;
                req.flash('info', '登陆密码设置成功');
                res.redirect('/users/signin');
            });

        } else {
            return next(new Error('两次密码不匹配'));
        }
    });
};

/**
 * 校验当前密码是否正确
 */
exports.checkpassword = function (req, res, next) {
    if (!req.user) {
        logger.error('user.checkpassword: no login user');
        return res.status(200).send('false');
    }

    if (!req.query.currentPassword) {
        logger.error('user.checkpassword: no currentPassword');
        return res.status(200).send('false');
    }

    User.findById(req.user._id).exec(function (err, user) {
        if (err) {
            logger.error(err);
            res.status(200).send('false');
        }

        if (User.hashPassword(req.query.currentPassword, user.salt) === user.password) {
            res.status(200).send('true');
        } else {
            res.status(200).send('false');
        }

    });
};

