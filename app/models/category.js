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

var ROOT_CATEGORY_NAME = 'ROOT_CATEGORY';

/**
 * Category Schema
 */
var CategorySchema = new Schema({
    name: {
        type: String,
        default: '',
        required: '科目名称不能为空',
        trim: true
    },
    company: {          // 所属公司
        type: Schema.ObjectId,
        ref: 'Company'
    },
    createdBy: {        // 创建用户
        type: Schema.ObjectId,
        ref: 'User'
    },
    symbolic: {
        type: Number,
    },
});

CategorySchema.plugin(NestedSetPlugin);
CategorySchema.plugin(SoftDeletePlugin);
CategorySchema.plugin(TimeStampPlugin, {
    createdAt: 'gmtCreated',
    updatedAt: 'gmtUpdated'
});
CategorySchema.plugin(auditlog.getPlugin('mongoose', {
    modelName: 'Category',
    namePath: 'name'
}).handler);

// TODO 科目删除的before回调

/**
 * 获取所有科目以树状形态返回
 *
 * @param {Object} company instance or parentId
 * @param {Function} callback
 */
CategorySchema.statics.ROOT_CATEGORY_NAME = ROOT_CATEGORY_NAME;
CategorySchema.statics.getTreeByCompany = function(company, callback) {
    if (!company) {
        return callback(new Error('科目结构获取需要提供公司信息'));
    }

    // CAUTION: 目前只支持2级的层次结构
    this.findOne({company: company, name: ROOT_CATEGORY_NAME}).exec(function(err, root) {
        if (err) { return callback(err); }

        // find 1st class category
        root.children(function (err, parents) {
            if (err) { return callback(err); }

            var tasks = [];
            var data = [];

            parents.sort(function (a, b) {
                return a.gmtCreated - b.gmtCreated;
            });

            // populate 2nd class category
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
 * 初始化默认科目层次结构
 *
 * @param {Object} company
 * @param {Object} operator
 * @param {Function} callback
 */
CategorySchema.statics.addDefaults = function(company, createdBy, callback) {
    if (!company || !createdBy) {
        return callback(new Error('科目初始化需要提供公司和创建者信息'));
    }
    var mapper = {
        '支出': {
            symbolic: -1,
        },
        '收入': {
            symbolic: 1,
        },
        '借贷': {
            childNodes: {
                '借入': {
                    symbolic: 1,
                },
                '借出': {
                    symbolic: -1,
                },
                '收款': {
                    symbolic: 1,
                },
                '还款': {
                    symbolic: -1,
                }
            }
        },
        '户内转账' : {
            symbolic: 0,
        },
        '账户注资' : {
            symbolic: 1,
        }
    };

    var defaultCategorys = {
        '支出': ['工资', '办公室租金', '服务器费用', '宽带费用', '交通费', '差旅费', '业务招待费', '办公室设备', '其他支出'],
        '收入': ['广告收入', '商品销售收入', '服务费收入', '其他收入'],
        '借贷': ['借入', '还款', '借出', '收款'],
        '户内转账': [],
        '账户注资': [],
    };

    var Category = this.model('Category');

    // create root node
    var category = new Category({
        name: ROOT_CATEGORY_NAME,
        company: company,
        createdBy: createdBy,
    });

    // save root node
    category.save(function (err, root) {
        if (err) { return callback(err); }

        var tasks = [];
        var parentMapper;

        _.forEach(defaultCategorys, function (children, parent) {
            var d = Q.defer();
            parentMapper = mapper[parent];

            // save 1st class node
            root.addChild({ name: parent, company: company, createdBy: createdBy, symbolic: parentMapper.symbolic}, function (err, parent) {
                if (err) {
                    return d.reject(err);
                }

                // save 2nd class nodes
                var subtasks = [];
                var parentName = parent.name;
                children.forEach(function (child) {
                    var _d = Q.defer();
                    parentMapper = mapper[parentName] || {};
                    var childMapper = (parentMapper.childNodes || {})[child];
                    childMapper = childMapper || parentMapper;

                    parent.addChild({ name: child, company: company, createdBy: createdBy, symbolic: childMapper.symbolic }, function (err, child) {
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
            logger.info('initialize default categorys for company#%s success', company._id.toString());
        }).fail(function (err) {
            if (callback) callback(err);
            logger.info('initialize default categorys for company#%s failed', company._id.toString());
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
CategorySchema.statics.addChild = function(parent, child, callback) {
    this.findOne({_id: parent._id || parent}).exec(function(err, category) {
        if (err) { return callback(err); }
        category.addChild(child, callback);
    });
};

CategorySchema.methods.addChild = function(child, callback) {
    var model = this.model('Category');
    var category = new model(child);
    category.parentId = this._id;
    category.symbolic = child.symbolic || this.symbolic || 0;
    category.save(function(err) {
        if (err) { return callback(err); }
        callback(null, category);
    });
};

CategorySchema.statics.chain = function(id, callback) {
    this.findOne({_id: id}).exec(function(err, category) {
        if (err) { return callback(err); }
        category.chain(callback);
    });
};

CategorySchema.methods.chain = function(callback) {
    var model = this.model('Category');
    var chain = [];
    var tasks = [];
    chain.push(this._id);
    find(this.parentId);
    function find(parentId) {
        console.log(parentId);
        model.findOne({_id: parentId}).exec(function(err, category) {
            var parentId;
            if (err) {
                callback(err);
            } else {
                parentId = category.parentId;
                if (parentId) {
                    chain.push(category._id);
                    find(parentId);
                } else {
                    callback(null, chain);
                }
            }
        });
    }

};

module.exports = mongoose.model('Category', CategorySchema);
