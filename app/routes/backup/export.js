var _ = require('lodash');
var rModel = require(MODEL + 'recordModel');
module.exports = {
    init: function(app) {
        app.get('/export/record/:src', this.handleExport);
        app.get('/export/', this.index);
    },
    select: function () {
    },
    handleExport: function (req, res) {
        require(CON + 'export').exportIncomeStatement(req, res);
    },
    index: function(req, res) {
        var data = {};
        data = _.merge(data, req.reqDataConfig)
        res.render('export/index', data);
    }
};
