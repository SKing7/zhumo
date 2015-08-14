'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    SoftDeletePlugin = require('mongoose-softdelete'),
    TimeStampPlugin = require('mongoose-timestamp'),
    auditlog = require('audit-log'),
    Schema = mongoose.Schema,
    logger = require('winston'),
    crypto = require('crypto');

/**
 * A Validation function for local strategy password
 */
var validateLocalStrategyPassword = function (password) {
    return (this.provider !== 'local' || (password && password.length >= 6));
};

/**
 * User Schema
 */
var UserSchema = new Schema({
    email: {
        type: String,
        trim: true,
        required: '邮箱不能为空',
        unique: '邮箱已经被注册',
        match: [/.+\@.+\..+/, '请输入合法的邮箱地址']
    },
    username: {
        type: String,
        default: '',
        trim: true
    },
    password: {
        type: String,
        default: '',
        validate: [validateLocalStrategyPassword, '密码至少6位以上']
    },
    defaultCompany: {   // 默认公司
        type: Schema.ObjectId,
        ref: 'Company'
    },
    salt: {             // 密码加密串
        type: String
    },
    provider: {         // 用户来源，默认为local
        type: String,
        required: 'Provider is required'
    },
    providerData: {     // 第3方用户的额外信息
    },
    isVerified: {       // 是否验证
        type: Boolean,
        default: false
    },
    gmtVerified: {      // 验证日期
        type: Date,
    },
});

UserSchema.plugin(SoftDeletePlugin);
UserSchema.plugin(TimeStampPlugin, {
    createdAt: 'gmtCreated',
    updatedAt: 'gmtUpdated'
});
UserSchema.plugin(auditlog.getPlugin('mongoose', {
    modelName: 'User',
    namePath: 'email'
}).handler);

/**
 * Create schema method for hashing a password
 */
UserSchema.statics.hashPassword = function (password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
};

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function (password) {
    var User = this.model('User');

    logger.info('authenticate %s => %s', this.password, User.hashPassword(password, this.salt));
    return this.password === User.hashPassword(password, this.salt);
};

/**
 * Find possible not used username
 */
UserSchema.statics.findUniqueUsername = function (username, suffix, callback) {
    var _this = this;
    var possibleUsername = username + (suffix || '');

    _this.findOne({username: possibleUsername}, function (err, user) {
        if(!err) {
            if (!user) {
                callback(possibleUsername);
            } else {
                return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
            }
        } else {
            callback(null);
        }
    });
};

/**
 * Create self owned company: save company, add to companies property
 *
 * @param {String} name company name
 * @param {Function} callback
 */
UserSchema.methods.addCompany = function (name, callback) {
    if (!name) {
        return callback(new Error('必须指定公司名称'));
    }

    var user = this;
    var Company = this.model('Company');
    var Category = this.model('Category');
    var Account = this.model('Account');

    // create company
    var company = new Company({
        name: name,
        owner: user,
    });

    // save company
    company.save(function (err, company) {
        if (err) { return callback(err); }
        logger.info('add company %s for user %s', name, user.email);

        // add company-user membership
        company.addMember(user.email, 'owner', function (err, membership) {
            if (err) {
                logger.error(err);
                return callback(err);
            }

            logger.info('add membership %s for company %s and user %s', membership._id, name, user.email);

            // init default categories
            Category.addDefaults(company, company.owner, function (err) {
                if (err) {
                    logger.error(err);
                    return callback(err);
                }

                // init default accounts
                Account.addDefaults(company, company.owner, function (err) {
                    if (err) {
                        logger.error(err);
                        return callback(err);
                    }
                    callback(null, company, membership);
                });
            });
        });
    });

};

/**
 * get companies for the user
 */
UserSchema.methods.getCompanies = function (callback) {
    var Member = this.model('Member');

    Member.find({ user: this, deleted: false }).populate('company').exec(function (err, memberships) {
        if (err) {
            return callback(err);
        }

        if (!memberships) {
            return callback(null, []);
        }

        var companies = [];
        memberships.forEach(function (membership) {
            companies.push(membership.company);
        });

        callback(null, companies);
    });
};

module.exports = mongoose.model('User', UserSchema);
