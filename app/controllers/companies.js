'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    moment = require('moment'),
    Company = mongoose.model('Company'),
    Member = mongoose.model('Member'),
    User = mongoose.model('User'),
    Secret = mongoose.model('Secret'),
    Mail = require('../helpers/mail'),
    request = require('request'),
    url = require('url'),
    config = require('../../config/config'),
    acl = require('../../config/acl'),
    Q = require('q'),
    _ = require('lodash'),
    logger = require('winston');

/**
 * create new company
 */
exports.create = function (req, res, next) {
    var user = req.user;

    if (!req.body.name) {
        return next(new Error('必须指定公司名称'));
    }

    // create company for user
    user.addCompany(req.body.name.trim(), function (err, company) {
        if (err) { return next(err); }

        logger.info('user %s created company %s', user.email, company.name);

        // verify membership between company and user
        company.verifyMember(user.email, function (err, membership) {
            if (err) { return next(err); }

            logger.info('user %s and company %s membership is verified', user.email, company.name);

            // switch to new company
            logger.info('save new company in session', req.session.company);
            req.session.company = company.toObject();

            req.flash('info', '新公司创建成功');
            res.redirect('/transactions/add');
        });
    });
};

/**
 * Show the current Company
 */
exports.read = function (req, res) {
    res.jsonp(req.company);
};

/**
 * Update a Company
 */
exports.update = function (req, res, next) {
    var company = req.company;

    company = _.extend(company, req.body);

    company.save(function (err, company) {
        if (err) {
            return next(err);
        } else {
            req.session.company = company.toObject();
            req.flash('success', '公司信息保存成功');

            if (req.body.setDefault === undefined) {
                return res.redirect('/settings/profile');
            }

            // set user default company
            // TODO optimize this
            User.findById(req.user._id).exec(function (err, user) {
                if (req.body.setDefault) {
                    user.defaultCompany = company;
                    user.save(function (err) {
                        if (err) {
                            logger.error(err);
                        }
                        return res.redirect('/settings/profile');
                    });
                } else {
                    user.defaultCompany = null;
                    user.save(function (err) {
                        if (err) {
                            logger.error(err);
                        }
                        return res.redirect('/settings/profile');
                    });
                }
            });
        }
    });
};

/**
 * Delete an Company
 * TODO delete refrences
 */
exports.delete = function (req, res) {
    var company = req.company;

    company.remove(function (err) {
        if (err) {
            res.render('error', {
                status: 500
            });
        } else {
            res.jsonp(company);
        }
    });
};

/**
 * List of companies
 */
exports.list = function (req, res) {
    var conditions = {};

    if (req.query.my) {
        if (req.user) {
            conditions.owner = req.user._id;
            if (req.query.enabled) {
                conditions.enabled = true;
            }
        } else {
            return res.jsonp([]);
        }
    } else {
        if (req.user) {
            conditions['$or'] = [
                { isPublic: true },
                { owner: req.user._id }
            ];
        } /* else {
            // TODO 验证API权限
        } */
    }

    var query = Company.find(conditions).sort('-created').populate('owner', 'email');
    query.exec(function (err, companies) {
        if (err) { return res.send(500, err); }
        res.jsonp(companies);
    });
};

/**
 * 切换公司，更新SESSION的信息
 */
exports.select = function (req, res, next) {
    var userId = req.user._id.toString();

    acl.removeUserRoles(userId, req.session.member.role, function (err) {
        if (err) { return next(err); }

        Member.findOne({ company: req.company, user: req.user }).exec(function (err, member) {
            if (err) { return next(err); }

            // save user role in session
            acl.addUserRoles(userId, member.role, function (err) {
                if (err) { return next(err); }

                logger.info('user %s:%s select company %s', member.role, req.user.email, req.company.name);

                req.session.company = req.company.toObject();
                req.session.member = member.toObject();

                acl.allowedPermissions(userId, Object.keys(acl.menuResources), function (err, permissions) {
                    if (err) { return next(err); }

                    logger.info('company.select: permissions', permissions);

                    // get allowed resources
                    var allowed = [];
                    for (var key in permissions) {
                        if (permissions[key].length) {
                            allowed.push(key);
                        }
                    }

                    // construct menu items
                    req.session.menu = [];
                    allowed.forEach(function (item) {
                        req.session.menu.push({
                            url: item,
                            title: acl.menuResources[item],
                            controller: _.filter(item.split('/')).shift(),
                        });
                    });
                    logger.info('company.select: menu', req.session.menu);

                    // redirect to referer if allowed, otherwise redirect to first menu item
                    var referer = req.get('referer');
                    logger.info('company.select: referer', referer);

                    if (!referer || (referer = referer.replace(config.baseUrl, '')) === '/') {
                        logger.info('company.select: redirect', allowed[0]);
                        return res.redirect(allowed[0]);
                    }

                    // force redirect to admin pages after signup or verify
                    if (referer.indexOf('signupcomplete') > 0 || referer.indexOf('verifycomplete') > 0) {
                        return res.redirect(allowed[0]);
                    }

                    acl.isAllowed(userId, referer, 'get', function (err, isAllowed) {
                        if (err) { return next(err); }

                        if (isAllowed) {
                            logger.info('company.select: redirect', referer);
                            res.redirect(referer);
                        } else {
                            logger.info('company.select: redirect', allowed[0]);
                            res.redirect(allowed[0]);
                        }
                    });
                });

            });

        });
    });
};

/**
 * add new member: create membership, create unverified user
 */
exports.addmember = function(req, res, next) {
    if (!req.body.email || !req.body.role) {
        return next(new Error('添加子账号必须指定邮箱和角色'));
    }

    var company = req.session.company;
    Company.findById(company._id).exec(function (err, company) {
        if (err) { return next(err); }

        var email = req.body.email.trim();
        var role = req.body.role.trim();

        logger.info('user %s add member %s:%s to company %s', req.user.email, role, email, company.name);

        company.addMember(email, role, function(err, membership) {
            if (err) { return next(err); }

            Secret.sign({company: company._id, email: email, role: role, type: 'company.addmember' }, function(err, sign) {
                if (err) { return next(err); }

                var roles = Member.getRoles();

                // send email to new member
                var data = {
                    member: { email: email, role: roles[role] },
                    user: req.user,
                    company: company,
                    sign: sign,
                    dateStr: moment().format('YYYY-MM-DD HH:mm')
                };

                var to = { to: email, subject: '子账户授权邀请' };
                Mail.send('addmember', to, data, function(err) {
                    if (err) { logger.error(err.toString()); }
                });

                // send email to admin
                to = { to: req.user.email, subject: '授权子账户' };
                Mail.send('addedmember', to, data, function(err) {
                    if (err) { logger.error(err.toString()); }
                });

                res.jsonp({
                    status: true,
                    msg: null,
                });
            });
        });
    });

};

/**
 * remove member
 */
exports.removemember = function(req, res, next) {
    if (!req.body.email) {
        return next(new Error('删除子账号必须指定邮箱'));
    }

    var company = req.session.company;
    Company.findById(company._id).exec(function (err, company) {
        if (err) { return next(err); }

        var email = req.body.email.trim();
        var role = req.body.role.trim();

        logger.info('user %s remove member %s:%s from company %s', req.user.email, role, email, company.name);

        company.removeMember(email, function(err, membership) {
            if (err) { return next(err); }

            res.jsonp({
                status: true,
                msg: null,
            });
        });
    });

};

/**
 * edit member: change role
 */
exports.editmember = function(req, res, next) {
    if (!req.body.email || !req.body.role) {
        return next(new Error('编辑子账号必须指定邮箱'));
    }

    var company = req.session.company;
    Company.findById(company._id).exec(function (err, company) {
        if (err) { return next(err); }

        var email = req.body.email.trim();
        var role = req.body.role.trim();

        logger.info('user %s edit member %s:%s from company %s', req.user.email, role, email, company.name);

        company.editMember(email, role, function(err, membership) {
            if (err) { return next(err); }

            res.jsonp({
                status: true,
                msg: null,
            });
        });
    });

};
/**
 * verify new member: user, membership
 */
exports.verifymember = function(req, res, next) {
    if (!req.params.sign) {
        return next(new Error('没有签名参数'));
    }
    Secret.resolve(req.params.sign, function (err, secret) {
        if (err) return next(err);
        if (!secret.email || !secret.company) return next(new Error('非法的签名'));

        Company.findOne({ _id: secret.company }).populate('owner').exec(function (err, company) {
            if (err) return next(err);
            if (!company) return next(new Error('公司不存在'));

            company.verifyMember(secret.email, function (err, membership, company, user, extra) {
                if (err) return next(err);
                logger.info('company member verify success: ', secret);

                var roles = Member.getRoles();

                // send email to new member
                var data = {
                    member: { email: secret.email, role: roles[secret.role] },
                    user: req.user,
                    company: company,
                    dateStr: moment().format('YYYY-MM-DD HH:mm')
                };

                var to = { to: secret.email, subject: '子账户成功激活' };
                Mail.send('verifymember', to, data, function(err) {
                    if (err) { logger.error(err.toString()); }
                });

                // send email to admin
                to = { to: company.owner.email, subject: '子账户授权成功' };
                Mail.send('verifiedmember', to, data, function(err) {
                    if (err) { logger.error(err.toString()); }
                });

                // redirect to setpassword page for new user
                if (extra.isNewUser) {
                    req.session.secret = secret;
                    req.flash('success', '你已经正式成为公司“' + company.name + '”的成员，首次登录请设置密码');
                    res.redirect('/users/setpassword');

                // redirect to transactions page for existing user
                } else {
                    req.login(user, function (err) {
                        if (err) { return next(err); }
                        req.flash('success', '你已经正式成为公司“' + company.name + '”的成员');
                        req.session.company = company.toObject();
                        res.redirect('/users/signin');
                    });
                }
            });
        });
    });
};

/**
 * Frontend Routes
 */
exports.add = function (req, res, next) {
    res.render('companies/add', {
    });
};

exports.profile = function (req, res, next) {
    res.render('companies/profile', {
        types: Company.getTypes(),
        scales: Company.getScales(),
        industries: Company.getIndustries(),
        incomes: Company.getIncomes(),
    });
};

/**
 * 成员管理
 */
exports.members = function (req, res, next) {
    var roleList = _.map(Member.getRoles(), function (value, key) {
        return {
            key: key,
            value: value,
        };
    });

    roleList.splice(0, 1);     // remove root

    Company.findById(req.session.company._id, function (err, company) {
        company.getMembers(function (err, members) {
            var roles = Member.getRoles();

            members = _.map(members, function (member) {
                member.roleTitle = roles[member.role];
                return member;
            });

            res.render('companies/members', {
                members: members,
                roleList: roleList,
                roles: roles,
            });
        });
    });
};

/**
 * Company middleware
 */
exports.companyByID = function (req, res, next, id) {
    Company.findById(id).populate('owner').exec(function (err, company) {
        if (err) return next(err);
        if (!company) return next(new Error('Failed to load Company ' + id));
        req.company = company;
        next();
    });
};

/**
 * Company authorization middleware
 */
exports.hasAuthorization = function (req, res, next) {
    if (req.company.owner.id !== req.user.id) {
        return res.send(403, 'User is not authorized');
    }
    next();
};

