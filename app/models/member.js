'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    SoftDeletePlugin = require('mongoose-softdelete'),
    TimeStampPlugin = require('mongoose-timestamp'),
    logger = require('winston'),
    _ = require('lodash'),
    Q = require('q'),
    Schema = mongoose.Schema;

var MEMBER_ROLES = {
    owner: '超级管理员权限',
    writer: '所有权限',
    viewer: '只能查看财务数据',
};

var validateRole = function () {
    return !!MEMBER_ROLES[this.role];
};

/**
 * Member Schema
 */
var MemberSchema = new Schema({
    company: {
        type: Schema.ObjectId,
        required: '必须指定公司',
        ref: 'Company'
    },
    user: {
        type: Schema.ObjectId,
        required: '必须指定用户',
        ref: 'User'
    },
    role: {             // 角色
        type: String,
        required: '必须指定角色',
        validate: [validateRole, '角色设置不正确，允许的值owner, writer, reader']
    },
    isVerified: {       // 是否验证
        type: Boolean,
        default: false
    },
    gmtVerified: {      // 是否验证
        type: Date,
    },
});

MemberSchema.plugin(SoftDeletePlugin);
MemberSchema.plugin(TimeStampPlugin, {
    createdAt: 'gmtCreated',
    updatedAt: 'gmtUpdated'
});

MemberSchema.statics.getRoles = function() {
    return MEMBER_ROLES;
};

mongoose.model('Member', MemberSchema);
