'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    SoftDeletePlugin = require('mongoose-softdelete'),
    TimeStampPlugin = require('mongoose-timestamp'),
    Schema = mongoose.Schema,
    logger = require('winston'),
    crypto = require('crypto');

/**
 * Secret Schema
 */
var SecretSchema = new Schema({
    sign: {
        type: String,
        default: function (){
            return crypto.randomBytes(48).toString('base64');
        }
    },
    secret: {
        type: Schema.Types.Mixed
    },
    isUsed: {
        type: Boolean,
        default: false,
    },
    gmtUsed: {
        type: Date,
        default: null,
    },
});

SecretSchema.plugin(SoftDeletePlugin);
SecretSchema.plugin(TimeStampPlugin, {
    createdAt: 'gmtCreated',
    updatedAt: 'gmtUpdated'
});

/**
 * make a secret sign
 */
SecretSchema.statics.sign = function(secret, callback) {
    var Secret = this.model('Secret');
    var model = new Secret({ secret: secret });

    model.save(function(err, item) {
        if (err) { return callback(err); }
        logger.info('new secret sign created: ', secret);
        callback(null, item.sign);
    });
};

/**
 * resolve a secret sign
 * TODO implement used times
 */
SecretSchema.statics.resolve = function(sign, callback) {
    this.findOne({ sign: sign/* , isUsed: false */ }, function(err, item) {
        if (err) { return callback(err); }
        if (!item) { return callback(new Error('签名不存在')); }

        logger.info('secret sign resolved: ', item.toObject());

        // item.isUsed = true;
        // item.gmtUsed = new Date();
        // item.save();

        callback(null, item.secret);
    });
};

module.exports = mongoose.model('Secret', SecretSchema);
