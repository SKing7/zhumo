'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Transaction = mongoose.model('Transaction'),
    Category = mongoose.model('Category'),
    Account = mongoose.model('Account'),
    moment = require('moment'),
    Util = require('../helpers/util'),
    _ = require('lodash');

/**
 * API: Create a Transaction
 */
exports.create = function (req, res, next) {
    _.extend(req.body, {
        company: req.session.company,
        createdBy: req.user
    });
    req.body.category = req.body.category || req.body.parentCategory;
    Category.chain(req.body.category, function (err, cChain) {
        if (err) { 
            return next(err); 
        }
        req.body.category = cChain;
        Account.chain(req.body.from, function (err, fromChain) {
            if (err) {  
                return next(err); 
            }
            req.body.from = fromChain;
            if (req.body.to) {
                Account.chain(req.body.to, function (err, toChain) {
                    if (err) { 
                        return next(err); 
                    }
                    req.body.to = toChain;
                    create(req.body);
                });
            } else {
                create(req.body);
            }
        });
    });
    function create(reqData) {
        reqData.gmtHappened = new Date(reqData.gmtHappened);
        var transaction = new Transaction(reqData);
        transaction.save(function (err) {
            if (err) { 
                return next(err); 
            }
            req.flash('success', '添加成功');
            res.redirect('/transactions/add');
        });
    }
    function error(e) {
        req.flash('error', e.message);
        res.redirect('/transactions/add');
    }
};

/**
 * API: Show the current Transaction
 */
exports.read = function (req, res) {
    res.jsonp(req.transaction);
};

/**
 * API: Update a Transaction
 */
exports.update = function (req, res, next) {
    var transaction = req.transaction;

    transaction = _.extend(transaction, req.body);
    Category.chain(req.body.category, function (err, cChain) {
        if (err) { return next(err); }
        transaction.category = cChain;
        Account.chain(req.body.from, function (err, fromChain) {
            if (err) { return next(err); }
            transaction.from = fromChain;
            if (req.body.to) {
                Account.chain(req.body.to, function (err, toChain) {
                    if (err) { return next(err); }
                    transaction.to = toChain;
                    save();
                });
            } else {
                save();
            }
        });
    });
    function save() {
        transaction.save(function (err) {
            if (err) { return next(err); }
            res.jsonp({
                status:1,
                msg: '更新成功'
            });
        });
    }
};

/**
 * API: Delete an Transaction
 */
exports.delete = function (req, res, next) {
    var transaction = req.transaction;

    transaction.softdelete(function (err) {
        if (err) { return next(err); }
        res.jsonp({
            status:1,
            msg: '删除成功'
        });
    });
};

exports.listTransfer = function (req) {
    var category = req.params.category;
    switch (category) {
    case 'all':
        exports.list.apply(this, arguments);
        break;
    default:
        exports.listAllGroupByCategory.apply(this, arguments);
        break;
    }
};

//按账户类型和时间区间
exports.transactionTotalGroupByTransfer = function (req, res, next) {
    var groupby = req.params.groupby;
    if (groupby === 'account') {
        _totalGroupByParentAccount(req, res, null, cb);
    } else if (groupby === 'category'){
        _totalGroupByParentCategory(req, res, null, cb);
    } else if (groupby === 'timeunit'){
        _timeUnitTransfer(req, res, null, cb);
    }
    function cb(err, data) {
        if (err) return next(err);
        res.json(_.extend({
            data: data,
        }, getTimeintervalRes(req)));
    }
};


/**
 * List of Transactions
 */
exports.list = function (req, res, next, cb) {
    cb = cb || defaultCb;
    _getHistoryTransactions(req, res, {}, function (err, data) {
        if (err) return next(err);
        var pageFilter = getPageFilter(req);
        var count = data.length;
        data = data.slice(pageFilter.start, pageFilter.start + pageFilter.count);
        _.forEach(data, function (v) {
            v.amount = v.amount.format();
        });
        cb(_.extend({
            count: count,
            data: data
        }, getTimeintervalRes(req)), res);
    });
};
exports.all = function (req, res, next, cb) {
    getAllTransactions(req, res, null, function (err, data) {
        if (err) return next(err);
        cb(_.extend({
            data: data
        }, getTimeintervalRes(req)));
    });
};
/**
 * group of Transactions
 */
exports.listAllGroupByCategory = function (req, res, next) {
    _groupByParentCategory(req, res, null, function (err, data) {
        if (err) return next(err);
        var pageFilter = getPageFilter(req);
        var count;

        _.forEach(data, function (v, k) {
            _.forEach(v, function (v1) {
                v1.amount = v1.amount.format();
            });
            data[k] = {
                count: v.length,
                data: v.slice(pageFilter.start, pageFilter.start + pageFilter.count)
            };
        });
        res.jsonp(data);
    });
};
exports.groupBySubCategory = function (req, res, next, cb) {
    _groupBySubCategory(req, res, null, function (err, transactions) {
        if (err) return next(err);
        cb(_.extend({
            data: transactions
        }, getTimeintervalRes(req)));
    });
}
function _groupBySubCategory (req, res, filterParam, cb) {
    getAllTransactions(req, res, filterParam, function (err, transactions) {
        if (!err) {
            //按照子类型分组
            transactions = _.groupBy(transactions, function (trans) {
                var chain = trans.category;
                return chain[0].name;
            });
        }
        cb(err, transactions);
    });
}

exports.groupBySubAccount = function (req, res, next, cb) {
    getAllTransactions(req, res, null, function (err, transactions) {
        if (err) return next(err);
        //按照账户类型分组
        transactions = _.groupBy(transactions, function (tran) {
            return tran.from[0].name;
        });
        cb(_.extend({
            data: transactions
        }, getTimeintervalRes(req)));
    });
}
/**
 * Transaction middleware
 */
exports.transactionByID = function (req, res, next, id) {
    Transaction.findById(id).populate('createdBy', 'username').exec(function (err, transaction) {
        if (err) return next(err);
        if (!transaction) return next(new Error('Failed to load Transaction ' + id));
        req.transaction = transaction;
        next();
    });
};

/**
 * Transaction authorization middleware
 */
exports.hasAuthorization = function (req, res, next) {
    next();
    return;
    if (req.transaction.createdBy.id !== req.user.id) {
        return res.send(403, 'User is not authorized');
    }
    next();
};
// Frontend routes
exports.add = function (req, res, next) {
    res.render('transactions/add', {});
};

exports.assets = function (req, res, next) {
    res.render('transactions/assets', {});
};

exports.history = function (req, res, next) {
    res.render('transactions/history', {});
};
function _groupByParentCategory(req, res, filterParam, cb) {
    _getHistoryTransactions(req, res, filterParam, function (err, transactions) {
        if (err) {
            cb(err, transactions);
        }
        else {
            //按照父类型分组
            transactions = _.groupBy(transactions, function (trans) {
                var chain = trans.category;
                return chain[chain.length - 1].name || '无';
            });
            cb(err, transactions);
        }
    });
}

function _totalGroupByParentCategory(req, res, filterParam, cb) {
    _groupBySubCategory(req, res, filterParam, function (err, data) {
        var total = {};
        var categories;
        var len;
        _.forEach(data, function (v, k) {
            total[k] = {};
            total[k].total = 0;
            _.forEach(v, function (v1, k1) {
                categories = v1.category;
                len = categories.length;
                total[k].total += categories[len - 1].symbolic * v1.amount;
                total[k].parentCategory = categories[categories.length - 1].name;
                total[k].category = k;
            });
        });
        total = _.groupBy(total, function (v) {
            return v.parentCategory;
        });
        cb(err,  total);
    });
}

function _timeUnitTransfer(req, res, filterParam, cb) {
    _transationsGroupByDate(req, res, null, function (err, data) {
        var timeFilter = getTimeIntervalByAlias(req);
        var mo = timeFilter.gmtHappened || {};
        var startTime = mo.$gt || moment();
        var endTime = mo.$lt || moment();
        var y = startTime.year();
        var s_m = startTime.months() + 1;
        var e_m = endTime.months() + 1;
        var e_d = endTime.date();
        var result = {};
        var unit = req.param('timealias');
        var key;
        var v;
        var keytmp;
        var total = {};
        s_m = s_m < 10 ? '0' + s_m : s_m;
        data = data[y] || {};
        if (unit === 'month') {
            data = data[s_m] || {};
            //每七天共用合并一个key
            for (var k = 1; k <= e_d; k++) {
                v = data[k] || [],
                key = Math.ceil(k/7);
                if (key > 4) {
                    keytmp = (key - 1)  * 7 + '-月底';
                } else {
                    keytmp = (key - 1) * 7 + 1;
                    //不足7天到当前时间为止
                    if (keytmp === e_d) {
                        keytmp = e_d + '日'; 
                    } else if (e_d > (key - 1) * 7 && e_d < key * 7) {
                        keytmp = keytmp + '-' + e_d + '日'; 
                    } else {
                        keytmp = keytmp + '-' +  (keytmp + 6) + '日';
                    }
                }
                result[keytmp] = result[keytmp] || [];
                result[keytmp] = result[keytmp].concat(v);
            }
        } else if (unit === 'halfyear') {
            var rk,
                v;
            if (data) {
                for (var k = s_m; k <= e_m; k++) {
                    v = data[k];
                    k = k < 10 ? '0' + k : k;
                    rk = k + '月';
                    result[rk] = result[rk] || [];
                    _.forEach(v, function (v1) {
                        result[rk] = result[rk].concat(v1);
                    });
                }
            }
        } else if (unit === 'diy') {
            data = data[s_m] || {};
            result = data;
        }
        //按parent category 分组
        _.forEach(result, function (v, k) {
            result[k] = _.groupBy(v, function (v1, k1) {
                var c = v1.category;
                return c[c.length - 1].name;
            });
        });
        //计算parent category 下面各个分组的总和
        _.forEach(result, function (v, k) {
            total[k] =  {};
            _.forEach(v, function (v1, k1) {
                total[k][k1] = 0;
                _.forEach(v1, function (v2, k2) {
                    total[k][k1] += v2.category[0].symbolic * v2.amount;
                });
            });
        });
        cb(err, total);
    });
}

function _transationsGroupByDate(req, res, filterParam, cb) {
    getAllTransactions(req, res, filterParam, function (err, transactions) {
        if (err)  return cb(err, transactions);
        var total = {};
        var categories;
        var len;
        var data = {};
        var tmp = {};
        transactions = _.groupBy(transactions, function (v) {
            return moment().format('YYYY');
        });
        // iterator year
        _.forEach(transactions, function (v, k) {
            data[k] = _.groupBy(v, function (v1) {
                return moment(getOpDate(v1)).format('MM');
            });
            // iterator month
            _.forEach(data[k], function (v1, k1) {
                data[k][k1] = _.groupBy(v1, function (v2) {
                    return moment(getOpDate(v2)).format('DD');
                });
            });
        });
        cb(err, data);
    });
}

function getOpDate(transaction) {
    return transaction.gmtHappened || transaction.gmtUpdated;
}

function _totalGroupByParentAccount(req, res, filterParam, cb) {
    filterParam = commonFilter(req, filterParam)
    Transaction.find(filterParam).sort('-gmtHappened').populate('createdBy', 'username')
        .populate('from')
        .populate('to')
        .populate('category', 'name symbolic').exec(function (err, transactions) {
            var total = {},
                allTotal = 0,
                from,
                len;

            if (!err) {
                parseDateOfTransaction(transactions);
                //按照账户类型分组
                transactions = _.groupBy(transactions, function (tran) {
                    len = tran.from.length;
                    return tran.from[len - 1].name;
                });
                _.forEach(transactions, function (v, k) {
                    total[k] = 0;
                    _.forEach(v, function (v1, k1) {
                        total[k] += v1.category[0].symbolic * v1.amount;
                    });
                    allTotal += total[k];
                    total[k] = total[k].format();
                });
            }
            cb(err, {
                accounts: total,
                sum: allTotal.format()
            });
        });
}

function parseDateOfTransaction(transactions) {
    var result = [];
    var tmp;
    _.forEach(transactions, function (v) {
        tmp = v.toObject();
        tmp.gmtUpdated = parseDate(v.gmtUpdated);
        tmp.gmtHappened = moment(v.gmtHappened).format('YYYY-MM-DD')
        tmp.gmtCreated = parseDate(v.gmtCreated);
        result.push(tmp);
    });
    return result;
    function parseDate(date) {
        return moment(date).format('YYYY-MM-DD HH:mm:ss')
    }
}

function getAllTransactions(req, res, filter, cb) {
    filter = commonFilter(req, filter);
    //start count
    Transaction.find(filter)
        .sort('-gmtHappened')
        .populate('createdBy', 'username email provider')
        .populate('category')
        .populate('from')
        .populate('to')
        .exec(function (err, data) {
            if (!err) {
                data = parseDateOfTransaction(data);
            }
            cb(err, data);
        });
}
function _getHistoryTransactions(req, res, filter, cb) {
    filter = historyFilter(req, filter);
    //start count
    Transaction.find(filter)
        .sort('-gmtUpdated')
        .populate('createdBy', 'username email provider')
        .populate('category')
        .populate('from')
        .populate('to')
        .exec(function (err, data) {
            var count = 0;
            if (!err) {
                count = data.length;
                data = parseDateOfTransaction(data);
            }
            cb(err, data);
        });
}
function getPageFilter(req) {
    var start = req.param('rowstart') || 0;
    var count = req.param('rowcount') || 10;
    var page = req.param('pageindex') || 0;
    start = page * count || start;
    return {
        start: start,
        count: count
    };
}
function getTimeIntervalFilter(req) {
    var filter = {};
    var start,
        end;

    var timeInterval = req.param('timeinterval') || 'all';
    if (timeInterval === 'all') {
        filter = {};
    } else {
        timeInterval = timeInterval.split(',');
        if (timeInterval.length === 2) {
            start = new Date(timeInterval[0]);
            end = new Date(timeInterval[1]);
            if (start && end) {
                start.setHours(0)
                start.setMinutes(0)
                start.setSeconds(0);
                end.setHours(23);
                end.setMinutes(59);
                end.setSeconds(59);
            }
            filter = {gmtHappened: { $gt: moment(start) , $lt: moment(end)}};
        }
    }
    return filter;
}

function commonFilter(req, filter) {
    filter = filter || {};
    filter = _.extend(filter,  { company: req.session.company });
    filter = _.extend(filter,  { deleted: false });
    filter = _.extend(filter, getTimeIntervalByAlias(req))
    return filter;
}
function historyFilter(req, filter) {
    var historyTimeFilter = getTimeIntervalByAlias(req);
    filter = filter || {};
    filter = _.extend(filter,  { company: req.session.company });
    filter = _.extend(filter,  { deleted: false });
    if (historyFilter.gmtHappened) {
        filter = _.extend(filter, {
            gmtUpdated: historyTimeFilter.gmtHappened
        })
    }
    return filter;
}

function getTimeIntervalByAlias(req) {
    var timeFilter = null;
    var filter;
    var timeAlias = req.param('timealias');
    if (timeAlias && timeAlias != 'diy') {
        if (timeAlias === 'week') {
            timeFilter = moment({hour: 0, minute: 0, seconds: 0}).subtract(7, 'days');
        } else if (timeAlias === 'month') {
            timeFilter = moment({hour: 0, minute: 0, seconds: 0}).date(1);
        } else if (timeAlias === 'halfyear'){
            timeFilter = moment({hour: 0, minute: 0, seconds: 0}).subtract(6, 'months');
        } else if (timeAlias === 'today'){
            timeFilter = moment({hour: 0, minute: 0, seconds: 0});
        }
        filter = { gmtHappened: { $gt: timeFilter, $lt: moment({hour: 23, minute: 59, seconds: 59})}};
    } else {
        filter = getTimeIntervalFilter(req);
    }
    return filter;
}
function reverseForIn(obj, f) {
    var arr = [];
    for (var key in obj) {
        if (!obj.hasOwnProperty(key)) continue;
        arr.push(key);
    }
    for (var i=arr.length-1; i>=0; i--) {
      f.call(obj, arr[i]);
    }
}
function getTimeintervalRes(req) {
    var timeFilter = getTimeIntervalByAlias(req);
    var mo = timeFilter.gmtHappened || {};
    return {
        timeintervalStart: (mo.$gt || moment()).format('YYYY-MM-DD'),
        timeintervalEnd: (mo.$lt || moment()).format('YYYY-MM-DD'),
    };
}
function defaultCb(data, res) {
    res.json(data);
}
