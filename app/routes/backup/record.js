var _ = require('lodash');
var h = require(HELPER + 'util');
var rModel = require(MODEL + 'recordModel');
var upm = require(MODEL + 'userProjectTypeModel');
var pm = require(MODEL + 'projectTypeModel');
var projectTypeController = require(CON + 'projectType');
var recordController = require(CON + 'record');
var i = 0;
var gHbs;
module.exports = {
    init: function(app, hbs) {
        gHbs = hbs;
        app.get('/record/', this.index);
        app.post('/record/add', this.postAdd);
        app.get('/record/add', this.rd);
        app.get('/record/history', this.history);
        app.get('/record/fundmanage', this.fundmanage);
        app.get('/service/record/history/:src', this.historyApi);
        app.get('/service/record/projecttype', projectTypeController.getProjectTypes);
        app.get('/service/record/:time',  recordController.getTotalAmount);
    },
    rd: function (req, res) {
        res.redirect('/record/');
    },
    index: function(req, res) {
        var data = {};
        data = _.merge(data, req.reqDataConfig)
        res.render('record/index', data);
    },
    postAdd: function(req, res) {
        var data = {};
        data = _.merge(data, req.reqDataConfig)
        var postData = req.body;
        recordController.add(req, res, function (error) {
            if (error) {
                data.pgErrorTips = '添加记录失败:' + h.getAllErrors(error);
            } else {
                data.pgSuccessTips = '哇哦，添加记录成功了。再添加一条吧！^ ^';
            }
            res.render('record/index',  _.merge(postData, data))
        });
    },
    history: function (req, res) {
        var data = {};
        data = _.merge(data, req.reqDataConfig)
        res.render('record/history', data);
    },
    historyApi: function (req, res) {
        var src = req.params.src;
        var rm = new rModel();
        var filter = {userId: req.session.userId};
        if (src !== 'all') {
            filter.recordType = src;
        }
        rm.findRecord(filter, function (error, rt) {
            var desc = rm.getDesc();
            var data = {
                historyList: h.value2desc(rt, desc),
                desc: desc 
            }
            res.send(data);
        });
    },
    fundmanage: function (req, res) {
        var data = {};
        data = _.merge(data, req.reqDataConfig)
        res.render('record/fundmanage', data);
    },
};
