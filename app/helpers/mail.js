'use strict';

var mailer = require('nodemailer'),
    consolidate = require('consolidate'),
    smtp = require('nodemailer-smtp-transport'),
    config = require('../../config/config'),
    logger = require('winston');

/**
 * send a email
 *
 * @param {String} template
 * @param {Object} mail { to, subject }
 * @param {Object} data for templates
 * @param {Function} callback
 */
exports.send = function send(template, mail, data, callback) {
    data.config = config;

    consolidate.swig('app/views/emails/' + template + '.html', data, function (err, html) {
        var transport = mailer.createTransport(smtp(config.mail.transport));
        var message = {
            to: mail.to,
            cc: config.mail.cc,
            from: config.mail.from,
            subject: '【' + mail.subject + '】- 朱墨记账',
            html: html
        };
        transport.sendMail(message, function(err){
            if (err) { logger.error(err.toString()); }
            transport.close(); // close the connection pool
            callback && callback(err);
        });
    });
};

