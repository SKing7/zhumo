'use strict';

module.exports = function (app) {
    var agreements = require('../../app/controllers/agreements');

    app.get('/agreements/privacy', agreements.privacy);
    app.get('/agreements/service', agreements.service);
};
