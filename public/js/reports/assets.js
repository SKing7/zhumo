define('reports/assets', ['reports/base', 'jquery', 'common/util'], function($base, $, $util) {
    var proto = {
        init: function () {
            var ndForm = $('.J-reports-filter-form');
            var allAmount;
            ndForm.attr('action', '/api/reports/assets');
            $base.init();
            $base.initPreview(function (pdata) {
                var data = pdata.data;
                var tplData = {
                    title: '资产负债表预览',
                    start: pdata.timeintervalStart.replace(/-/g, ''),
                    end: pdata.timeintervalEnd.replace(/-/g, ''),
                    now: $util.parseDate(new Date).replace(/-/g, '')
                };
                tplData.tbody = createBody(data.assetIterms)
                tplData.tfootBody = createBody(data.rightIterms)
                tplData.thead = [{width: '50%', value: '资产合计'}, { width: '50%', value: data.assetTotal}];
                tplData.tfoot = [{width: '50%', value: '权益合计'}, { width: '50%', value: data.rightTotal}];
                var html = $util.tpl('#J-report-table-tpl', tplData);
                $('.J-report-setting').after(html);
            });
            function createBody(data) {
                var tbody = [];
                var totalAmount;
                for (var i in data) {
                    if (!data.hasOwnProperty(i)) continue;
                    totalAmount = data[i].total;
                    tbody.push({
                        data: [i, totalAmount],
                        children: getSubData(data[i].data)
                    });
                }
                return tbody;
            }
            function getSubData(data) {
                if (!data) return;
                var result = [];
                var child;
                for (var i = 0; i < data.length; i++) {
                    child = [];
                    child.push(data[i].account);
                    child.push((data[i].totalStr));
                    result.push(child);
                }
                return result;
            }
        }
    };
    return proto;
});
