var _ = require('lodash');
var rModel = require(MODEL + 'recordModel');
var recordController = require(CON + 'record');
var i = 0;
module.exports = {
    init: function(app) {
        app.get('/', this.index);
        app.get('/service/inout/:time', recordController.getInOutTotal);
    },
    index: function(req, res) {
        recordController.findRecentRecords(req, res, function (records) {
            res.render('index', _.merge({ recentList: records}, req.reqDataConfig));
        });
    }
};
