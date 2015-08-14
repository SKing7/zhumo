'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    SoftDeletePlugin = require('mongoose-softdelete'),
    TimeStampPlugin = require('mongoose-timestamp'),
    auditlog = require('audit-log'),
    logger = require('winston'),
    _ = require('lodash'),
    Q = require('q'),
    Schema = mongoose.Schema;

/**
 * Transaction Schema
 */
var TransactionSchema = new Schema({
    company: {          // 所属公司
        type: Schema.ObjectId,
        ref: 'Company',
        required: '账款记录必须指定公司',
    },
    category: [{
        type: Schema.ObjectId,
        ref: 'Category',
    }],
    from: [{             // 资金来源账户
        type: Schema.ObjectId,
        ref: 'Account',
    }],
    to: [{               // 资金去向账户
        type: Schema.ObjectId,
        ref: 'Account',
    }],
    amount: {           // 发生金额
        type: Number,
        default: 0,
    },
    remark: {           // 备注
        type: String,
        default: '',
        trim: true
    },
    config: {           // 配置: 如税率等
        type: Schema.Types.Mixed
    },
    createdBy: {        // 操作人
        type: Schema.ObjectId,
        ref: 'User',
        required: '账款记录必须操作人',
    },
    isVerified: {       // 是否核对
        type: Boolean,
        default: true,
    },
    isDeleted: {        // 软删除
        type: Boolean,
        default: false,
    },
    gmtHappened: {      // 发生日期
        type: Date,
        default: Date.now
    },
    gmtVerified: {      // 核验时间
        type: Date,
        default: Date.now
    },
    gmtDeleted: {       // 删除时间
        type: Date
    },
});

TransactionSchema.plugin(SoftDeletePlugin);
TransactionSchema.plugin(TimeStampPlugin, {
    createdAt: 'gmtCreated',
    updatedAt: 'gmtUpdated'
});
TransactionSchema.plugin(auditlog.getPlugin('mongoose', {
    modelName: 'Transaction',
    namePath: '_id'
}).handler);

module.exports = mongoose.model('Transaction', TransactionSchema);
