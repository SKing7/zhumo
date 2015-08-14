'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    NestedSetPlugin = require('mongoose-nested-set'),
    SoftDeletePlugin = require('mongoose-softdelete'),
    TimeStampPlugin = require('mongoose-timestamp'),
    auditlog = require('audit-log'),
    logger = require('winston'),
    _ = require('lodash'),
    Q = require('q'),
    Schema = mongoose.Schema;

var ROOT_ACCOUNT_NAME = 'ROOT_ACCOUNT';

/**
 * Account Schema
 */
var AccountSchema = new Schema({
    name: {
        type: String,
        default: '',
        required: '账户名称不能为空',
        trim: true
    },
    company: {          // 所属公司
        type: Schema.ObjectId,
        ref: 'Company',
        required: '必须指定所属公司',
    },
    createdBy: {        // 创建用户
        type: Schema.ObjectId,
        ref: 'User',
        required: '必须指定创建者',
    },
    initialBalance: {   // 初始余额
        type: Number,
        default: 0,
    },
    currentBalance: {   // 当前余额
        type: Number,
        default: 0,
    },
});

AccountSchema.plugin(NestedSetPlugin);
AccountSchema.plugin(SoftDeletePlugin);
AccountSchema.plugin(TimeStampPlugin, {
    createdAt: 'gmtCreated',
    updatedAt: 'gmtUpdated'
});
AccountSchema.plugin(auditlog.getPlugin('mongoose', {
    modelName: 'Account',
    namePath: 'name'
}).handler);

// TODO 账户删除的before回调
// TODO 子账户余额更新之后更新父账户余额

/**
 * 获取所有节点以树状形态返回
 *
 * @param {Object} company instance or parentId
 * @param {Function} callback
 */
AccountSchema.statics.getTreeByCompany = function(company, callback) {
    if (!company) {
        return callback(new Error('账户结构获取需要提供公司信息'));
    }

    // CAUTION: 目前只支持2级的层次结构
    this.findOne({company: company, name: ROOT_ACCOUNT_NAME}).exec(function(err, root) {
        if (err) { return callback(err); }

        // find 1st class account
        root.children(function (err, parents) {
            if (err) { return callback(err); }

            var tasks = [];
            var data = [];

            parents.sort(function (a, b) {
                return a.gmtCreated - b.gmtCreated;
            });

            // populate 2nd class account
            parents.forEach(function (parent) {
                var d = Q.defer();
                var item = parent.toObject();

                parent.children(function (err, children) {
                    if (err) {
                        d.reject(err);
                    } else {
                        children.sort(function (a, b) {
                            return a.gmtCreated - b.gmtCreated;
                        });

                        item.childNodes = children;
                        d.resolve(children);
                    }
                });

                data.push(item);

                tasks.push(d.promise);
            });

            Q.all(tasks).then(function () {
                callback(null, data);
            }).fail(function (err) {
                callback(err);
            });

        });
    });

};

/**
 * 初始化默认账户层次结构
 *
 * @param {Object} company
 * @param {Object} operator
 * @param {Function} callback
 */
AccountSchema.statics.addDefaults = function(company, createdBy, callback) {
    if (!company || !createdBy) {
        return callback(new Error('账户初始化需要提供公司和创建者信息'));
    }

    var defaultAccounts = {
        '现金账户': [],
        '银行账户': ['招商银行', '工商银行', '建设银行', '中国银行'],
        '网络账户': ['支付宝', '财付通'],
    };

    var Account = this.model('Account');

    // create root node
    var account = new Account({
        name: ROOT_ACCOUNT_NAME,
        company: company,
        createdBy: createdBy,
    });

    // save root node
    account.save(function (err, root) {
        if (err) { return callback(err); }

        var tasks = [];

        _.forEach(defaultAccounts, function (children, parent) {
            var d = Q.defer();

            // save 1st class node
            root.addChild({ name: parent, company: company, createdBy: createdBy }, function (err, parent) {
                if (err) {
                    return d.reject(err);
                }

                // save 2nd class nodes
                var subtasks = [];
                children.forEach(function (child) {
                    var _d = Q.defer();

                    parent.addChild({ name: child, company: company, createdBy: createdBy }, function (err, child) {
                        if (err) {
                            _d.reject(err);
                        } else {
                            _d.resolve(child);
                        }
                    });

                    subtasks.push(_d.promise);
                });

                Q.all(subtasks).then(function () {
                    d.resolve();
                }).fail(function (err) {
                    d.reject(err);
                });

            });

            tasks.push(d.promise);
        });

        Q.all(tasks).then(function () {
            if (callback) callback(null);
            logger.info('initialize default accounts for company#%s success', company._id.toString());
        }).fail(function (err) {
            if (callback) callback(err);
            logger.info('initialize default accounts for company#%s failed', company._id.toString());
        });
    });

};

/**
 * 添加子节点
 *
 * @param {Mixed} parent instance or parentId
 * @param {Mixed} child instance or object
 * @param {Function} callback
 */
AccountSchema.statics.addChild = function(parent, child, callback) {
    this.findOne({_id: parent._id || parent}).exec(function(err, account) {
        if (err) { return callback(err); }
        account.addChild(child, callback);
    });
};

AccountSchema.methods.addChild = function(child, callback) {
    var model = this.model('Account');
    var account = new model(child);
    account.parentId = this._id;
    account.save(function(err) {
        if (err) { return callback(err); }
        callback(null, account);
    });
};
AccountSchema.statics.chain = function(id, callback) {
    this.findOne({_id: id}).exec(function(err, account) {
        if (err) { return callback(err); }
        account.chain(callback);
    });
};
AccountSchema.methods.chain = function(callback) {
    var model = this.model('Account');
    var chain = [];
    var parentId = this.parentId;
    chain.push(this._id);
    find(parentId);
    function find(parentId) {
        model.findOne({_id: parentId}).exec(function(err, account) {
            var parentId;
            if (err) {
                callback(err);
            } else {
                parentId = account.parentId;
                if (parentId) {
                    chain.push(account._id);
                    find(account.parentId);
                } else {
                    callback(null, chain);
                }
            }
        });
    }

};

module.exports = mongoose.model('Account', AccountSchema);
