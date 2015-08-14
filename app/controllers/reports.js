'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Report = mongoose.model('Report'),
    transactionsController = require('./transactions'),
    _ = require('lodash'),
    nodeExcel = require('excel-export'),
    Util = require('../helpers/util'),
    csv = require('express-csv');

/**
 * Frontend Routes
 */
exports.index = function (req, res, next) {
    res.render('reports/index', {
    });
};

exports.profits = function (req, res, next) {
    res.render('reports/profits', {
    });
};

exports.inouts = function (req, res, next) {
    res.render('reports/inouts', {
    });
};

exports.assets = function (req, res, next) {
    res.render('reports/assets', {
    });
};

exports.transactions = function (req, res, next) {
    res.render('reports/transactions', {
    });
};
exports.transactionsFlow = function (req, res, next) {
    console.log(type);
    var type = req.param('type');
    var fileformat = req.param('fileformat') || 'excel';
    transactionsController.list(req, res, next, function (data) {
        console.log(data);
        var cols = [{
            caption: '记账类型',
            type:'string',
            width:20
        },{
            caption: '收支项目',
            type:'string',
            width:20
        },{
            caption: '金额',
            type:'string',
            width:20
        },{
            caption: '添加时间',
            type:'string',
            width:40
        },{
            caption: '操作人',
            type:'string',
            width:40
        }];
        var rows = [];
        if (type === 'preview') {
            res.json(data);
            return;
        }
        var transactions = data.data;
        _.forEach(transactions, function (tran) {
            var cg = tran.category;
            rows.push([
                cg[0].name,
                cg[cg.length - 1].name,
                tran.amount,
                tran.gmtCreated,
                tran.createdBy.username,
            ]);
        });
        var name = 'flow';
        if (fileformat === 'excel') {
            exportToExcel(req, res, cols, rows, name);
        } else  if (fileformat === 'csv') {
            exportToCSV(res, rows, name);
        } else if (fileformat === 'pdf'){
            exportToPDF(res, rows, name);
        } else {
            next();
        }

    });
}
exports.assetReport = function (req, res, next) {
    var type = req.param('type');
    var fileformat = req.param('fileformat') || 'excel';
    transactionsController.all(req, res, next, function (pdata) {
        var data = pdata.data;
        var row = [];
        var viewData = {};
        var shareTotal = 0;
        var rightData = {shareTotal: 0};
        var totalInout = 0;
        var totalAmount = 0;
        //按照账户类型分组
        var dataByAccount = _.groupBy(data, function (trans) {
            var chain = trans.category;
            if (chain[chain.length - 1].name === '账户注资') {
                shareTotal += trans.amount;
            }
            return trans.from[0].name;
        });
        var total = {},
            from;

        _.forEach(dataByAccount, function (v, k) {
            total[k] = {}; 
            total[k].total = 0; 
            _.forEach(v, function (v1, k1) {
                from = v1.from;
                total[k].total += v1.category[0].symbolic * v1.amount;
                total[k].parentAccount = from[from.length - 1].name;
                total[k].account = k;
            })
        })
        _.forEach(total, function (v1) {
            v1.total = v1.total.fix();
            v1.totalStr = v1.total.format();
        });
        total = _.groupBy(total, function (v) {
            return v.parentAccount;
        });
        _.forEach(total, function (v, k) {
            totalAmount = 0;
            viewData[k] = {}; 
            _.forEach(v, function (v1) {
                totalAmount += v1.total;
                row.push([v1.account, v1.totalStr]);
            });
            viewData[k].total = totalAmount.format(); 
            viewData[k].data = v; 
            totalInout += totalAmount;
        })
        row.push(['资产合计：', totalInout.format()]);
        //res.send(total);
        if (type === 'preview') {
            res.json(_.extend(pdata, {
                data: {
                    assetIterms: viewData,
                    rightIterms: {
                        股东投入: {
                            total: shareTotal.format(),
                        },
                        未分配利润:{ 
                            total: (totalInout - shareTotal).format(),
                        }
                    },
                    assetTotal: totalInout.format(),
                    rightTotal: totalInout.format(),
                }
            }));
            return;
        }
        row = row.reverse();
        var name = 'assets';
        if (fileformat === 'excel') {
            exportToExcel(req, res, [ {
                    caption: '',
                    type:'string',
                    width:40
                },{
                    caption: '',
                    type:'string',
                    width:40
                }], row, name);
        } else if (fileformat === 'csv') {
            exportToCSV(res, row, name);
        } else if (fileformat === 'pdf'){
            exportToPDF(res, row, name);
        } else {
            next();
        }
    });
};
exports.inout = function (req, res, next) {
    var type = req.param('type');
    var fileformat = req.param('fileformat') || 'excel';
    transactionsController.groupBySubCategory(req, res, next, function (pdata) {
        var data = pdata.data;
        var total = {};
        var categories;
        _.forEach(data, function (v, k) {
            total[k] = {}; 
            total[k].total = 0; 
            _.forEach(v, function (v1, k1) {
                categories = v1.category;
                total[k].total += categories[0].symbolic * v1.amount;
                total[k].parentCategory = categories[categories.length - 1].name;
                total[k].category = k;
            })
        })
        var row = [];
        var totalInout = 0;
        var totalAmount = 0;
        _.forEach(total, function (v1) {
            v1.totalStr = v1.total.format();
        });
        total = _.groupBy(total, function (v) {
            return v.parentCategory;
        });
        var viewData = {
            总收入: {total: 0, data: []},
            总支出: {total: 0, data: []},
        }; 
        _.forEach(total, function (v, k) {
            totalAmount = 0;
            if (!(k === '支出' ||  k === '收入')) return;
            k = '总' + k;
            _.forEach(v, function (v1) {
                totalAmount += v1.total;
                row.push([v1.category, v1.totalStr]);
            });
            viewData[k].total = totalAmount.format(); 
            viewData[k].data = v; 
            row.push([k, viewData[k].total]);
            totalInout += totalAmount;
        })
        totalInout += totalAmount;
        row.push(['总利润', totalInout]);
        if (type === 'preview') {
            res.json(_.extend(pdata, {
                data: {
                    items: viewData,
                    total: totalInout.format(),
                }
            }));
            return;
        }
        row = row.reverse();
        var name = 'profit';
        if (fileformat === 'excel') {
            exportToExcel(req, res, [ {
                    caption: '',
                    type:'string',
                    width:40
                },{
                    caption: '',
                    type:'string',
                    width:40
                }], row, name);
        } else  if (fileformat === 'csv') {
            exportToCSV(res, row, name);
        } else if (fileformat === 'pdf'){
            exportToPDF(res, row, name);
        } else {
            next();
        }
        
    });
}
function exportToExcel(req, res, cols, rows, filename) {
    var conf = {};
    //res.header('Content-Type:', 'application/vnd.ms-excel; charset=utf-8');
    res.header('Content-disposition', 'attachment; filename=' + filename + '.xls');
    conf.cols = cols;
    conf.rows = rows;
    res.end(nodeExcel.execute(conf), 'binary');
}
function exportToCSV(res, data, name) {
    res.header('Content-type', 'text/csv; charset=utf-8');
    res.header('Content-disposition', 'attachment; filename=' + name + '.csv');
    res.csv(data);
}
function exportToPDF(res, data, name) {
    return;
    var doc = new pdfDocument();
    res.statusCode = 200;
    res.setHeader('Content-type', 'application/pdf');
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.setHeader('Content-disposition', 'attachment; filename=' + name + '.pdf');     

    var data = "data:image/svg+xml," +
               "<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>" +
                 "<foreignObject width='100%' height='100%'>" +
                   "<div xmlns='http://www.w3.org/1999/xhtml' style='font-size:40px'>" +
                     "<em>I</em> like <span style='color:white; text-shadow:0 0 2px blue;'>cheese</span>" +
                   "</div>" +
                 "</foreignObject>" +
               "</svg>";

    var img = new Image();
    img.onload = function() { 
        doc.image(img);
        doc.pipe(res);
        doc.end();
    }
    img.src = data;
}
