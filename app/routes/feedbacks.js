'use strict';

module.exports = function (router) {
    var feedbacks = require('../../app/controllers/feedbacks');

    // Feedbacks Routes
    router.post('/api/feedbacks', feedbacks.create);
};
