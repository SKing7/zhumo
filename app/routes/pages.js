'use strict';

module.exports = function (app) {

    var pages = require('../../app/controllers/pages');

    app.get('/pages/about', pages.about);
    app.get('/pages/contact', pages.contact);
};
