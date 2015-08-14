define('common/util', ['jquery', 'handlebars', 'datepicker', 'bootbox'], function($, handlebars, datepicker, bootbox) {
    initDatepicker();
    var hbs = handlebars.default;
    var doc = $(document.body);
    var proto = {
        askForData: function (param, cb) {
            param = param || {};
            var _this = this,
                url = param.url,
                postData = param.data || {},
                label = asLabel(postData);
                data = _this.getAjaxData(url, label);

            if (data) {
                cb(data, url);
            } else {
                param = $.extend({
                    type: "GET"
                }, param);
                $.ajax(param) .done(function(data) {
                    _this.storeAjaxData(data, url, label);
                    cb(data, url);
                });
            }
            function asLabel(obj) {
                var s = '';
                for(var i in obj) {
                    if (obj.hasOwnProperty(i)) {
                        s +=  '&' + i + '=' + obj[i];
                    }
                }
                return s.substr(1);
            }
        },
        /**
         * 绑定from提交表单事件
         **/
        bindSubmitEvent: function (form, params, cb) {
            var _this = this;
            cb = cb || _this.alert;
            params = params || {};
            $(form).submit(function(e) {
                e.preventDefault();
                var config = {
                    url: this.action + (params.urlPath ? '/' + params.urlPath : ''),
                    type: this.getAttribute('method'),
                    data: $(form).serialize()
                };
                $.extend(config, params);
                $.ajax(config).done($.proxy(_this.alert, _this));
            });
        },
        /**
         * 存储ajax数据到body节点，key是根据url生成
         **/
        storeAjaxData: function (data, url, label) {
            if ($.isEmptyObject(data)) return false;
            var key =  url.replace(/\//g, '_') + (label || '');
            return doc.data(key, data);
        },
        getAjaxData: function (url, label) {
            var key =  url.replace(/\//g, '_') + (label || '');
            return doc.data(key);
        },
        parseJSON: function (data) {
            if (this.checkType(data) !== 'string') return data;
            if (window.JSON) return window.JSON.parse(data);;
            return (new Function('return ' + data))();
        },
        tpl: function (tplFilter, data) {
             if (this.checkType(data) === 'string') data = this.parseJSON(data);
             var source   = $(tplFilter).html();
             var template = hbs.compile(source);
             return template(data);
        },
        toggleShow: function (container) {
            var ndWrapper = $(container || '.J-toggle-show-wp'),
                index,
                nlTargets,
                targetFilter = '.' +  $(ndWrapper).attr('data-target-class'),
                nlTriggers;

            ndWrapper.delegate('.J-toggle-show-trigger', 'click', function (e) {
                var ndTarget = $(e.delegateTarget).find(targetFilter);
                handle(ndTarget, $(e.currentTarget));
            });
            function handle(ndTarget, nd) {
                if (nd.hasClass('J-trigger-show')) {
                    ndTarget.removeClass('hidden');
                } else {
                    ndTarget.addClass('hidden');
                }
            }
        },
        datepicker: function () {
            $('.J-date-picker input').datepicker({
                format: "yyyy-mm-dd",
                language: "zh-CN",
                autoclose: true
            });
        },
        alert: function (msg) {
            if (this.checkType(msg) !== 'string') {
                msg = msg.msg;
            }
            if (!msg) return;
            bootbox.alert(msg, function () {
                window.location.href = window.location.href;
            });
        },
        parseDate: function (d, sp) {
           sp = sp || '-';
           d = d || new Date;
           var curr_date = d.getDate();
           var curr_month = d.getMonth() + 1;
           var curr_year = d.getFullYear();
           return curr_year + sp + curr_month+ sp + curr_date;
        },
        calcDate: function (time) {
            var interval = eval(time.replace('d', '*1').replace('m', '*30').replace('y', '*365'));
            return parseInt(interval, 10);
        },
        clickRange: function (wp, targetFilter) {
            var ndWp = $(wp);
            targetFilter = targetFilter || 'a';
            $(ndWp).click('click', function (e) {
                if (e.target.tagName.toLowerCase() === 'a') {
                    return;
                }
                var ndTarget = $(ndWp.find(targetFilter)[0]);
                window.open(ndTarget.attr('href'), ndTarget.attr('target'));
            });
        },
        checkType: function (obj) {
            var type = Object.prototype.toString.call(obj);
            switch(type)
            {
            case '[object Number]':
                return 'number';
            case '[object String]':
                return 'string';
            case '[object Boolean]':
                return 'boolean';
            case '[object RegExp]':
                return 'regexp';
            case '[object Function]':
                return 'function';
            case '[object Array]':
                return 'array';
            case '[object Object]':
                return 'object';
            case '[object Date]':
                return 'date';
            default:
                return 'unknown';
            }
        }
    };
    return proto;
    function initDatepicker() {
        $.fn.datepicker.dates['zh-CN'] = {
                    days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
            daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六", "周日"],
            daysMin:  ["日", "一", "二", "三", "四", "五", "六", "日"],
            months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
            monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
            today: "今日",
            format: "yyyy年mm月dd日",
            weekStart: 1
        };
    }
});
