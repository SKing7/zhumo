define('dashboards/index', ['jquery', 'common/util', 'common/base', 'echarts', 'echarts/chart/pie', 'echarts/chart/bar'], function($, $util, $base, Echarts) {
    var proto = {
        init: function () {
            this.initPies()
            this.initBars()
            this.bindSearchByData();
            $util.datepicker();
            $util.toggleShow();
        },
        bindSearchByData: function () {
            var _this = this,
                nlInput = $('.J-date-setting-wp').find('input[type="text"]');

            initQDate();
            $('.J-search-data-btn').click(function () {
                var dateStr = '',
                    url = '/api/transactions/totalamount/category/diy?timeinterval=';

                dateStr += nlInput[0].value + ',' + nlInput[1].value;
                $util.askForData({ url: url + dateStr}, function (data) {
                    _this.drawInout('.J-pie-wrapper', 'diy', data);
                });
            });
            function initQDate() {
                var now = new Date,
                    days7 =  7 * 24 * 3600 * 1000;

                var nowStr = $util.parseDate(now, '/');
                var sevenDayAgo = new Date(new Date(nowStr) - days7);
                var sevenStr = $util.parseDate(sevenDayAgo) 
                nlInput[0].value = sevenStr;
                nlInput[1].value = nowStr.replace(/\//g, '-');
            }
        },
        initPies: function () {
            var _this = this;
            var container = '.J-pie-wrapper';
            $base.initTabSwitch({
                container: container, 
                url: '/api/transactions/totalamount/category/'
            });
            $(container).on('status.switch', function (e, data) {
                _this.drawInout(container, data.type, data.data);
            });
        },
        initBars: function () {
            var _this = this;
            var container = '.J-bar-wrapper';
            $base.initTabSwitch({
                container: container, 
                url: '/api/transactions/totalamount/timeunit/'
            });
            $(container).on('status.switch', function (e, data) {
                window.setTimeout(function () {
                    _this.drawBar(container + ' .inout-' + data.type + '-show', data.type, $util.parseJSON(data.data), '');
                }, 100);
            });
        },
        drawInout: function (container, type, data) {
            var _this = this;
            //this.clearEmptyTips(container);
            //if (!data.data['收入'] && !data.data['支出']) {
            //    this.drawEmpty($(container + ' #inout-pie-' + type), data);
            //    return;
            //}
            window.setTimeout(function () {
                _this.drawPie(container + ' .inout-' + type + '-income', data, '收入');
                _this.drawPie(container + ' .inout-' + type + '-expense', data, '支出');
            }, 100);
        },
        drawPie: function (selector, pdata, dataType) {
            var ndCanvasNode = $(selector);
            var data = pdata.data[dataType] || [];
            var title = dataType + '类型比例';
            ndCanvasNode.removeClass('hidden');
            var legend = [],
                values = [],
                tmp,
                opt = {
                    title : {
                        text: title,
                        subtext: pdata.timeintervalStart + '到' + pdata.timeintervalEnd,
                        x:'center'
                    },
                    tooltip : {
                        trigger: 'item',
                        formatter: "{a} <br/>{b} : {c} ({d}%)"
                    },
                    legend: {
                        orient : 'vertical',
                        x : 'left'
                    },
                    toolbox: {
                        show : true
                    },
                    calculable : true,
                    series : [
                        {
                            type:'pie',
                            radius : '55%',
                            center: ['50%', '50%']
                        }
                    ]
                };

            for(var i in data) {
                if (!data.hasOwnProperty(i)) continue;
                tmp = data[i];
                legend.push(tmp.category);
                values.push({
                    value: Math.abs(tmp.total),
                    name: tmp.category
                });
            }
            opt.legend.data = legend;
            opt.series[0].data = values;
            var objChart = Echarts.init(ndCanvasNode[0]);
            objChart.setOption(opt);
        },
        drawEmpty: function (nd, data) {
            nd.append('<p class="J-empty-tips empty-tips">当前时间段(' + data.timeintervalStart + '到'+ data.timeintervalEnd + ')暂没有找到相关数据</p>');
        },
        clearEmptyTips: function (nd) {
            $(nd).find('.J-empty-tips').remove();
        },
        drawBar: function (selector, type, pdata, title) {
            var data = pdata.data;
            var ndCanvasNode = $(selector);
            this.clearEmptyTips(ndCanvasNode.parent());
            //if ($.isEmptyObject(data)) {
            //    this.drawEmpty(ndCanvasNode.parent(), pdata);
            //    return;
            //}
            ndCanvasNode.removeClass('hidden');
            var tmp,
                ins = [],
                outs = [],
                range = 0,
                opt = {
                    title : {
                        text: '收支一览',
                        subtext: pdata.timeintervalStart + '到' + pdata.timeintervalEnd,
                        padding:[5, 0, 20, 0],
                        x: 'center'
                    },
                    tooltip : {
                        trigger: 'axis'
                    },
                    legend: {
                        data:['收入','支出'],
                        x : 'left'
                    },
                    toolbox: {
                        show : true
                    },
                    calculable : true,
                    xAxis : [
                        {
                            type : 'category'
                        }
                    ],
                    yAxis : [
                        {
                            type : 'value'
                        }
                    ],
                    series : [
                        {
                            name:'收入',
                            type:'bar',
                            itemStyle: {
                                normal: {
                                    label: {
                                        show: true,
                                        textStyle: {
                                            baseline: 'middle'
                                        },
                                        position: 'top'
                                    },
                                }
                            },
                            data:[2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3]
                        },
                        {
                            name:'支出',
                            type:'bar',
                            itemStyle: {
                                normal: {
                                    label: {
                                        show: true,
                                        textStyle:{
                                            baseline: 'top'
                                        },
                                        position: 'top'
                                    },
                                }
                            },
                            data:[2.6, 5.9, 9.0, 26.4, 28.7, 70.7, 175.6, 182.2, 48.7, 18.8, 6.0, 2.3]
                        }
                    ]
            };
            if (type === 'month') {
                range = 5;
            } else if (type === 'halfyear'){
                range = 12;
            } else if (type === 'diy') {
                range = 31;
            }
            var xLabel = [],
                i,
                objChart;

            for(i in data) {
                tmp = data[i];
                xLabel.push(i);
                if (!tmp) continue;
                ins.push(tmp['收入'] || 0);
                outs.push(Math.abs(tmp['支出'] || 0));
            }
            opt.xAxis[0].data = xLabel;
            opt.series[0].data = ins;
            opt.series[1].data = outs;
            objChart = Echarts.init(ndCanvasNode[0]);
            objChart.setOption(opt);
        }
    };
    return proto;
})
