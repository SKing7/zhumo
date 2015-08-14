function initErrors(app) {
    for (var i in datas) {
        if (datas.hasOwnProperty(i)) {
            app.use(datas[i]);
        }
    }
}
var datas = {
    init404: init404,
}
module.exports = initErrors;
function init404(req, res, next) {
    res.status(404).render('404', {title: "Sorry, page not found"});
}
