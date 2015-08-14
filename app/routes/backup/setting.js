var _ = require('lodash');
var pm = require(MODEL + 'projectTypeModel');
var um = require(MODEL + 'userModel');
var upm = require(MODEL + 'userProjectTypeModel');
var im = require(MODEL + 'infoModel');
var mongoose = require('mongoose');
var h = require(HELPER + 'util');
var projectTypeController = require(CON + 'projectType');
var userController = require(CON + 'user');
var i = 0;
var proto = {
    init: function(app) {
        app.get('/setting/', this.index);
        app.post('/setting/projecttype/:op', this.opProject);
        app.post('/setting/pwd/changepwd', userController.changePwd);
        app.post('/setting/info/update', this.updateInfo);
    },
    index: function(req, res) {
        var data = {};
        data = _.merge(data, req.reqDataConfig)
        var m_upm = new upm();
        var q = {userId: req.session.userId }
        res.render('setting/index', data);
    },
    opProject: function (req, res) {
        var op = req.params.op;
        if (op === 'add') projectTypeController.add(req, res);
        if (op === 'update') projectTypeController.update(req, res);
        if (op === 'del') projectTypeController.del(req, res);
    },
    updateInfo: function (req, res) {
        var q = { userId: req.session.userId };
        var postData = (req.body);
        var m_im = new im();
        var data = {};
        m_im.saveOrIfExitsUpdate(q, postData, function (error, rt) {
            if (error) {
                data.pgErrorTips = '添加记录失败:' + h.getAllErrors(error);
                //sess.storeMsg.pgErrorTips = '添加记录失败:' + h.getAllErrors(error);
                res.render('setting/index',  _.merge(data, postData))
            } else {
                data.pgSuccessTips = '哇哦，添加记录成功了。再添加一条吧！^ ^';
                res.render('setting/index',  _.merge(data, postData))
            }
        });
    }
};
module.exports = proto;
