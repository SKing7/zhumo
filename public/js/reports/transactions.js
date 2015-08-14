define('reports/transactions', ['reports/base', 'jquery', 'common/util', 'common/base'], function($base, $, $util, $cbase) {
    var proto = {
        init: function () {
            var ndForm = $('.J-reports-filter-form'),
                _this = this;

            ndForm.attr('action', '/api/reports/transactionsflow');
            $base.init();
            $base.initPreview(function (data) {
                _this.createReportTable(data);
                _this.initPagination(data.count);
            });
        },
        initPagination: function (count) {
            var _this = this;
            var html = $cbase.createPagination(count, 10);
            var ndForm = $('.J-reports-filter-form');
            $('.main-content').append(html);
            $cbase.initPagination({
                clickHandle: function () {
                    ndForm.trigger('data.fetch', function (data) {
                        _this.createReportTable(data);
                    });
                }
            });
        },
        createReportTable: function (data) {
            var tplData = {
                title: '交易流水预览',
                start: data.timeintervalStart.replace(/-/g, ''),
                end: data.timeintervalEnd.replace(/-/g, ''),
                now: $util.parseDate(new Date).replace(/-/g, '')
            };
            data = data.data;
            var tbody = [];
            tplData.tbody = tbody;
            tplData.thead = [
                { width: '20%', value: '记账类型'}, 
                { width: '20%', value: '收支项目'},
                { width: '20%', value: '金额'},
                { width: '25%', value: '添加时间'},
                { width: '15%', value: '操作人'}
            ];
            var tmp,
                html;

            if (!data.length) {
            }
            for (var i = 0; i < data.length; i++) {
                tmp = data[i];
                tbody.push({
                    data: [tmp.category[tmp.category.length - 1].name, tmp.category[0].name, tmp.amount, tmp.gmtUpdated, tmp.createdBy.username]
                });
            }
            var html = $util.tpl('#J-report-table-tpl', tplData);
            $('.J-report-table-wp').remove();
            $('.J-report-setting').after(html);
        }
    };
    return proto;
});
