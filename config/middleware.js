//   /report/,/record/,/setting/ 类型的分别会设置为isReport = true
var _ = require('lodash');
var navMap = {
    report: [],
    record: [],
    setting: [],
}
function initVars(req, res, next) {
    var sess = req.session;
    req.reqDataConfig = _.merge(sess.storeMsg, req.reqDataConfig || {});
    sess.storeMsg = {}; //清空
    next();
}
var datas = {
    setNavState: function (req, res, next) {
        if (/\.[^.]+$/.test(req.url)) {
            next();
            return;
        }
        var path = req.path.match(/^\/([^\/]*)/)[1];
        var state = {};
        var tmp;
        state['isIndex'] = true;
        if (path) {
            state['is' + path.substring(0,1).toUpperCase( ) + path.substring(1)] =  true;
            state['isIndex'] = false;
        }
        res.reqDataConfig = _.merge(req.reqDataConfig, state);
        next();
    },
    checkLogin: function (req, res, next) {
        var noNeedLoginUrls = ['/account/sign'];
        if (/\.[^.]+$/.test(req.url)) {
            next();
            return;
        }
        var needLogin = true;
        _.forEach(noNeedLoginUrls, function (item) {
            if (req.path.indexOf(item) === 0) needLogin = false; 
        });
        if (!needLogin) {
            next();
            return;
        }
        var sess = req.session;
        if (!sess.isLogin && req.path.indexOf('/account/login') === -1) {
            res.redirect(302, '/account/login');
        } else {
            next();
        }
    },
    initBodyData: function (req, res, next) {
        var postData = (req.body);
        postData.userId = req.session.userId;
        next();
    },
    initService: function (req, res, next) {
        if (req.url.indexOf('/service/') === 0) {
            res.set({
                'Content-Type': 'text/text'
            })
        }
        next();
    },

}
function initMiddleware(app) {
    app.use(initVars);
    for (var i in datas) {
        if (datas.hasOwnProperty(i)) {
            app.use(datas[i]);
        }
    }
}
module.exports = initMiddleware;
