var _ = require('lodash');
var uModel = require(MODEL + 'userModel');
var upM = require(MODEL + 'userProjectTypeModel');
var i = 0;
module.exports = {
    init: function(app) {
        app.get('/account/signup', this.sign);
        app.get('/account/signupcomplete', this.signcomplete);
        app.post('/account/signup', this.postSign);
    },
    sign: function(req, res) {
        var data = {};
        var sess = req.session;
        data = _.merge(data, req.reqDataConfig)
        res.render('account/signup', data);
    },
    signcomplete: function(req, res) {
        var data = {};
        var sess = req.session;
        data = _.merge(data, req.reqDataConfig)
        res.render('account/signupcomplete', data);
    },
    postSign: function(req, res) {
        var postData = (req.body);
        var sess = req.session;
        var data = {};
        var obj_um = new uModel(); 
        obj_um.find({name: postData.name}, function (error, rt) {
            if (rt.length) {
                data.pgErrorTips = '用户名重复';
                res.render('account/signup', data);
                //sess.isLogin = true;
                //sess.userId = rt[0]._id.toString();
            } else {
                obj_um.add(data, function () {
                    sess.storeMsg.pgSuccessTips = '注册成功';
                    res.redirect('/account/signupcomplete');
                });
            }
        });
    }
};
