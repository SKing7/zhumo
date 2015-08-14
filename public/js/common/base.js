define('common/base', ['jquery', 'common/util'], function($, $util) {
    var proto = {
        /**
            @param {String} container selector Tab的容器选择器 
            @param {String} url ajax请求数据的url 
            @param {String} tpl 渲染模板的selector
            @param {function} parseData: 返回数据后可自定义处理数据函数
            @example html

                <a class="tab" href="[prefix][type]">
                <div class="tab-content" id="[prefix][type]"></div>

            @example params
            
                {
                    container: '#J-history-table', 
                    url: '/api/transactions/history/', 
                    tpl: '#J-record-history-tpl',
                }

         **/
        initTabSwitch: function (params) {
            var container = params.container,
                tabFilter = ' .J-toggle-tab', 
                ndContainer = $(container),
                nlTabs = $(container + tabFilter),
                url = params.url,
                tpl = params.tpl, 
                parseData = params.parseData,
                //请求数据时的参数
                postData = params.postData;

            //默认初始化
            nlTabs.click(function (e) {
                if (this.getAttribute('data-nofetch')) return;
                fetchData(this, true);
            });
            ndContainer.on('data.fetch', function (e) {
                var ndTabAction = ndContainer.find('.active' + tabFilter);
                fetchData(ndTabAction);
            });
            $(nlTabs[0]).trigger('click');
            function fetchData(ndTrigger, statusSwitch) {
                var type,
                    href =  $(ndTrigger).attr('href'),
                    dataType = href.substring(href.lastIndexOf('-') + 1);

                //href: xxx-[type]
                type = $(ndTrigger).attr('data-type') || dataType;
                $util.askForData({
                    data: getPostData(),
                    url : url + type
                }, function (data, url) {
                    fillTabContent(data);
                });
                function fillTabContent(data) {
                    var tplData = data,
                        html = '';

                    if (tpl) {
                        tplData = parseTplData(data);
                        html = $util.tpl($(tpl), tplData);
                        $(href).html(html);
                    }
                    if (statusSwitch) {
                        ndContainer.trigger('status.switch', {
                            data: data,
                            type: dataType
                        });
                    }
                }
                function getPostData() {
                    if ($util.checkType(postData) === 'function') {
                        return postData();
                    }
                    return postData || '';
                }
                function parseTplData(data) {
                    var tplData;
                    if (parseData) {
                        if ($util.checkType(data) === 'array') {
                            tplData = $.extend(true, [], data);
                        } else {
                            tplData = $.extend(true, {}, data);
                        }
                        tplData = parseData(tplData, dataType);
                    } else {
                        tplData = data;
                    }
                    return tplData;
                }
            }
        },
        initPagination: function (params) {
            var ndWp = $('.J-pagination-wp');
            if (!ndWp) return;
            var cPre = 'J-pagination-pre';
                cNext = 'J-pagination-next',
                ndPre = ndWp.find('.' + cPre),
                ndNext = ndWp.find('.' + cNext),
                curPos = 0,
                ch = params.clickHandle || $.noop,
                nlLi = ndWp.find('li'),
                len = nlLi.length;

            bind();
            updateStatus();
            function bind() {
                ndWp.delegate('li', 'click', function () {
                    if ($(this).hasClass('disabled')) return;
                    if ($(this).hasClass(cPre)) {
                        curPos--;
                    } else if ($(this).hasClass(cNext)) {
                        curPos++;
                    } else {
                        curPos = $(this).attr('data-index');
                    } 
                    updateStatus();
                    ch();
                });
            }
            function updateStatus() {
                if (len <= 3) {
                    ndWp.addClass('hidden');
                    return;
                } 
                nlLi.removeClass('active');
                ndWp.removeClass('hidden');
                if (curPos < len - 3) {
                    ndNext.removeClass('disabled');
                } else {
                    ndNext.addClass('disabled');
                }
                if (curPos > 0) {
                    ndPre.removeClass('disabled');
                } else {
                    ndPre.addClass('disabled');
                }
                $(nlLi[+curPos + 1]).addClass('active');
            }
        },
        createPagination: function (count, rowCount) {
            var p = [];
            rowCount = rowCount || 10;
            for (var i = 0; i < count; i++) {
                p[parseInt(i/rowCount)] = parseInt(i/rowCount) + 1;
            }
            var tpl = $('#J-record-pagination-tpl');
            var html = $util.tpl(tpl, {
                pagination: p,
                rowcount: rowCount
            });
            return html;
        },
        initFormValidations: function () {
            var defaults = {
                errorClass: 'text-danger',
                validClass: 'text-success',
                errorPlacement: function (ndError, ndInput) {
                    ndInput.parents('.form-group').addClass('has-error');
                    ndError.append('<i class="fa fa-times"></i>').addClass('help-block');
                    ndInput.parent().next().append(ndError);
                },
            };

            var forms = $('form');
            forms.each(function (index, form) {
                var ndForm = $(form);

                if (ndForm.data('auto-validate') === false) {
                    return false;
                }

                var extra = {};
                if (ndForm.data('error-container')) {
                    var ndContainer = $(ndForm.data('error-container'));
                    extra.errorPlacement = function (ndError, ndInput) {
                        ndContainer.empty().append(ndError);
                        setTimeout(function () {
                            ndContainer.empty();
                        }, 3000);
                    };
                }

                ndForm.validate($.extend(defaults, extra));
                ndForm.on('submit', function (e) {
                    if ($(this).valid() === false) {
                        e.preventDefault();
                        return false;
                    }
                });
            });
        },

    };
    return proto;
});
