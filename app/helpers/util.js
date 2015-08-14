var _ = require('lodash');
module.exports = {
    init: function () {
        var _this = this;
        Number.prototype.format = function () {
            return _this.parseNumber(this);
        }
        Number.prototype.fix = function () {
            return _this.fixNumber(this);
        }
    },
    parseNumber: function (n) {
        var sign = ''
        n = +n;
        if (n < 0) {
            sign = '-';
        }
        n = Math.abs(n);
        var ns = n.toFixed(2);
        var integer = ns.split('.')[0];
        var point = ns.split('.')[1];
        integer = integer.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + ',');
        return sign + integer + '.' + point
    },
    fixNumber: function (n) {
        return Math.round(n);
    }
}
