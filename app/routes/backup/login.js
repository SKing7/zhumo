var _ = require('lodash');
var uModel = require(MODEL + 'userModel');
var i = 0;
module.exports = {
    init: function(app) {
        app.get('/account/login', this.login);
        app.post('/account/login', this.postLogin);
        app.get('/account/loginout', this.loginout);
    },
    login: function(req, res) {
        var data = {
            userName: '',
            userPwd: ''
        };
        data = _.merge(data, req.reqDataConfig)
        var sess = req.session;
        if (sess.isLogin) {
            res.redirect(302, '/');
            return;
        }
        res.render('account/login', data);
    },
    loginout: function(req, res) {
        req.session.isLogin = false;
        res.redirect(302, '/');
    },
    postLogin: function(req, res) {
        var postData = (req.body);
        var sess = req.session;
        var data = {};
        data.userName = postData.name
        data.userPwd = postData.pwd
        new uModel().find({name: postData.name, pwd: postData.pwd }, function (error, rt) {
            if (rt.length) {
                res.render('account/loginsuccess');
                sess.isLogin = true;
                sess.userId = rt[0]._id.toString();
                if (postData.autologin) {
                    sess.cookie.expires = new Date(Date.now() + AUTO_LOGIN_TIME)
                }
            } else {
                data.pgErrorTips = '用户名或密码错误';
                res.render('account/login', data);
            }
        });
    }
};
