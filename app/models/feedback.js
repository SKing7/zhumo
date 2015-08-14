'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    TimeStampPlugin = require('mongoose-timestamp'),
    Schema = mongoose.Schema,
    Q = require('q');

/**
 * feedback Schema
 */
var feedbackSchema = new Schema({
    title: {
        type: String,
        default: '',
        trim: true
    },
    content: {
        type: String,
        default: '',
        required: false,
        trim: true
    },
    type: {
        type: String,
    },
    time : {
        type: Date,
    },
    company: {
        type: Schema.ObjectId,
        ref: 'Company'
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
});

var feedbackModel = mongoose.model('Feedback', feedbackSchema);
feedbackSchema.plugin(TimeStampPlugin, {
    createdAt: 'gmtCreated',
    updatedAt: 'gmtUpdated'
});

function Feedback(feedback) {
    this.title = feedback.title;
    this.content = feedback.content;
    this.date = feedback.date;
    this.type = feedback.type;
}

Feedback.prototype.save = function (callback) {
    var feedback = {
        title: this.title,
        content: this.content,
        date: this.date,
        user: user
    };

    var instance = new feedbackModel(feedback);
    instance.save();
}

// 按时间逆序搜索
Feedback.prototype.get = function (config, callback) {
    feedbackModel.find(config).sort({date: -1}).exec(function (err, feedbacks) {
        if (err) {
            return callback(err);
        }
        callback(feedbacks);
    });
}

module.exports = Feedback;
