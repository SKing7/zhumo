'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    SoftDeletePlugin = require('mongoose-softdelete'),
    LifeCyclePlugin = require('mongoose-lifecycle'),
    TimeStampPlugin = require('mongoose-timestamp'),
    auditlog = require('audit-log'),
    Schema = mongoose.Schema,
    logger = require('winston'),
    crypto = require('crypto'),
    _ = require('lodash'),
    Q = require('q'),
    config = require('../../config/config');

/**
 * Company Schema
 */
var CompanySchema = new Schema({
    name: {
        type: String,
        required: '公司名称必须填写',
        trim: true
    },
    owner: {        // 创建者
        type: Schema.ObjectId,
        ref: 'User',
        required: '必须指定公司创办者',
    },
    type: {         // 公司性质
        type: String,
        trim: true
    },
    industry: {     // 所属行业
        type: String,
        trim: true
    },
    scale: {        // 公司规模
        type: String,
        trim: true
    },
    income: {        // 年收入
        type: String,
        trim: true
    },
    contact: {      // 联系方式
        type: String,
        trim: true
    },
    config: {       // 额外字段
    },
});

CompanySchema.plugin(SoftDeletePlugin);
CompanySchema.plugin(LifeCyclePlugin);
CompanySchema.plugin(TimeStampPlugin, {
    createdAt: 'gmtCreated',
    updatedAt: 'gmtUpdated'
});
CompanySchema.plugin(auditlog.getPlugin('mongoose', {
    modelName: 'Company',
    namePath: 'name'
}).handler);

/**
 * 创建公司之后的初始化工作
 *  - 初始化会计科目
 *  - 初始化财务账户
 */
CompanySchema.on('afterInsert', function (company) {
    logger.info('new company: %s is created by: %s', company._id.toString(), company.owner._id.toString());

    var Account = company.model('Account');
    var Category = company.model('Category');

    function initCategories() {
        var d = Q.defer();
        Category.addDefaults(company, company.owner, function (err) {
            if (err) {
                d.reject(err);
            } else {
                d.resolve();
            }
        });

        return d.promise;
    }

    function initAccounts() {
        var d = Q.defer();
        Account.addDefaults(company, company.owner, function (err) {
            if (err) {
                d.reject(err);
            } else {
                d.resolve();
            }
        });

        return d.promise;
    }

    Q.all([initAccounts(), initCategories()]).then(function () {
        logger.info('company after create hook succeed: %s', company.name);
    }).fail(function (err) {
        logger.info('company after create hook failed: %s', company.name);
    });
});

/**
 * Add new member for the company
 *
 * check user existence
 *  - if registered:
 *      - check for membership
 *          - if member: return error       // TODO role check
 *          - if not: create unverified membership, wait for user verify
 *  - if not: create unverified user, unverified membership
 */
CompanySchema.methods.addMember = function(email, role, callback) {
    var User = this.model('User');
    var Member = this.model('Member');
    var company = this;

    logger.debug('add member for company: %s, user: %s, role: %s', this.name, email, role);

    // try to find user with the email
    User.findOne({ email: email }, function(err, user) {
        if (err) {
            logger.error(err);
            return callback(err);
        }

        if (user) {
            logger.debug('Company.addMember: user exist %s', user.email);
            Member.findOne({ company: company, user: user }, function (err, membership) {
                if (err) {
                    logger.error(err);
                    return callback(err);
                }
                if (membership) {
                    return callback(new Error('用户已经是公司成员'));
                }

                addMembership(company, user, role);
            });
        } else {
            logger.debug('Company.addMember: user donot exist %s', email);
            // create user
            // password is empty by default, user will be forced to fill in password on first login
            user = new User({
                email: email,
                salt: new Buffer(crypto.randomBytes(16).toString('base64'), 'base64'),
                password: '000000',
                provider: 'local',
            });

            // save user
            user.save(function (err, user) {
                if (err) {
                    logger.error(err);
                    return callback(err);
                }
                addMembership(company, user, role);
            });
        }
    });

    function addMembership(company, user, role) {
        // create membership
        var membership = new Member({
            company: company,
            user: user,
            role: role,
        });

        // save membership
        membership.save(function (err, membership) {
            if (err) {
                logger.error(err);
                return callback(err);
            }

            return callback(null, membership);
        });
    }
};

/**
 * Add new member for the company
 *
 * @param {Mixed} company id or model
 * @param {String} email member email
 * @param {String} role member role
 */
CompanySchema.statics.addMember = function(company, email, role, callback) {
    this.findOne({_id: company._id || company}).exec(function(err, company) {
        if (err) { return callback(err); }
        company.addMember(email, role, callback);
    });
};

/**
 * Verify new member for the company
 *
 * check user existence
 *  - if registered:
 *      - check for membership
 *          - if member: update membership
 *          - if not: throw error
 *  - if not: throw error
 */
CompanySchema.methods.verifyMember = function(email, callback) {
    var User = this.model('User');
    var Member = this.model('Member');
    var company = this;

    logger.debug('verify member for company: %s, user: %s', this.name, email);

    // try to find user with the email
    User.findOne({ email: email }, function(err, user) {
        if (err) {
            logger.error(err);
            return callback(err);
        }

        if (!user) {
            logger.error(new Error('Company.verifyMember: 用户不存在'));
            return callback(new Error('用户不存在'));
        }

        if (user.isVerified) {
            verifyMembership(user, { isNewUser: false });
        } else {
            // verify user
            user.isVerified = true;
            user.gmtVerified = new Date();

            user.save(function (err, user) {
                if (err) return callback(err);
                verifyMembership(user, { isNewUser: true });
            });
        }
    });

    function verifyMembership(user, extra) {
        // then verify membership
        Member.findOne({ company: company, user: user }, function (err, membership) {
            if (err) {
                logger.error(err);
                return callback(err);
            }
            if (!membership) {
                logger.error(new Error('Company.verifyMember: 用户不属于公司'));
                return callback(new Error('用户不属于公司'));
            }

            // save membership
            membership.isVerified = true;
            membership.gmtVerified = new Date();

            membership.save(function (err, membership) {
                if (err) {
                    logger.error(err);
                    return callback(err);
                }

                return callback(null, membership, company, user, extra);
            });
        });
    }

};

/**
 * Verify new member for the company
 *
 * @param {Mixed} company id or model
 * @param {String} email member email
 */
CompanySchema.statics.verifyMember = function(company, email, callback) {
    this.findOne({_id: company._id || company}).exec(function(err, company) {
        if (err) { return callback(err); }
        company.verifyMember(email, callback);
    });
};

/**
 * Revoke member for the company
 *
 * @param {Mixed} company id or model
 * @param {String} email member email
 */
CompanySchema.methods.removeMember = function(email, callback) {
    var User = this.model('User');
    var Member = this.model('Member');
    var company = this;

    logger.debug('revoke member for company: %s, user: %s', this.name, email);

    // try to find user with the email
    User.findOne({ email: email }, function(err, user) {
        if (err) {
            logger.error(err);
            return callback(err);
        }

        if (!user) {
            logger.error(new Error('Company.removeMember: 用户不存在'));
            return callback(new Error('用户不存在'));
        }


        // TODO 删除之后用户如何处理, 签名如何处理

        Member.findOne({ company: company, user: user }, function (err, membership) {
            if (err) {
                logger.error(err);
                return callback(err);
            }
            if (!membership) {
            logger.error(new Error('Company.removeMember: 成员不存在'));
                return callback(new Error('成员不存在'));
            }

            // save membership
            membership.remove(function (err, membership) {
                if (err) {
                    logger.error(err);
                    return callback(err);
                }

                return callback(null, membership);
            });
        });
    });

};

CompanySchema.statics.removeMember = function(company, email, callback) {
    this.findOne({_id: company._id || company}).exec(function(err, company) {
        if (err) { return callback(err); }
        company.removeMember(email, callback);
    });
};

/**
 * Edit member role for the company
 * TODO too much duplicate code
 *
 * @param {Mixed} company id or model
 * @param {String} email member email
 * @param {String} rome member rome
 */
CompanySchema.methods.editMember = function(email, role, callback) {
    var User = this.model('User');
    var Member = this.model('Member');
    var company = this;

    logger.debug('edit member for company: %s, user: %s', this.name, email);

    // try to find user with the email
    User.findOne({ email: email }, function(err, user) {
        if (err) {
            logger.error(err);
            return callback(err);
        }

        if (!user) {
            logger.error(new Error('Company.editMember: 用户不存在'));
            return callback(new Error('用户不存在'));
        }

        Member.findOne({ company: company, user: user }, function (err, membership) {
            if (err) {
                logger.error(err);
                return callback(err);
            }
            if (!membership) {
                logger.error(new Error('Company.editMember: 成员不存在'));
                return callback(new Error('成员不存在'));
            }

            // logger.info(membership.toObject());

            // save membership
            membership.role = role;
            membership.save(function (err, membership) {
                if (err) {
                    logger.error(err);
                    return callback(err);
                }

                return callback(null, membership);
            });
        });
    });

};

/**
 * get all members
 */
CompanySchema.methods.getMembers = function(callback) {
    var Member = this.model('Member');

    Member.find({ company: this, deleted: false }).populate('user').exec(function (err, members) {
        if (err) {
            return callback(err);
        }

        // donot show owner members
        members = members.filter(function (member) {
            return member.role !== 'owner';
        });

        callback(null, members);
    });
};

/**
 * Meta info
 */
CompanySchema.statics.getTypes = function () {
    return ['国企', '民营', '合资', '外商独资', '股份制企业', '上市公司', '代表处', '国家机关', '事业单位', '其它'];
};
CompanySchema.statics.getIndustries = function () {
    return [
        'IT、通信、电子、互联网',
        '金融业',
        '房地产、建筑业',
        '商业服务',
        '贸易、批发、零售、租赁',
        '文体教育|工艺美术',
        '交通|运输|物流|仓储',
        '服务业',
        '文化|传媒|娱乐|体育',
        '能源|矿产|环保',
        '政府|非盈利机构',
        '农|林|牧|渔|',
        '其他'
    ];
};
CompanySchema.statics.getScales = function () {
    return [
        '20人以下',
        '20-99人',
        '100-499人',
        '500-999人',
        '1000-9999人',
        '10000人以上',
    ];
};
CompanySchema.statics.getIncomes = function () {
    return [
        '50万以下',
        '50万~200万',
        '200万~500万',
        '500万~1000万',
        '1000万~5000万',
        '5000万以上',
    ];
};

module.exports = mongoose.model('Company', CompanySchema);
