define('transactions/history', ['transactions/base', 'jquery', 'common/util', 'common/base'], function($index, $, $util, $base) {
    var proto = {
        init: function () {
            this.initList();
        },
        initPagination: function (count) {
            var rowCount = 10,
                ndWp = $('.J-transactions-history-wp'),
                ndPagination = $('.J-pagination-wp'),
                p = [];

            count = Math.min(count, 10 * rowCount);
            var html = $base.createPagination(count);
            ndWp.after(html);
            $base.initPagination({
                clickHandle: function () {
                   $('#J-history-table').trigger('data.fetch');
                }
            });
        },
        initList: function (onlytoday) {
            var _this = this,
                typeMap =  {
                    'income':'收入',
                    'expense': '支出',
                    'borrowing': '借贷',
                    'injection': '账户注资',
                    'transfer': '户内转账',
                };

            $base.initTabSwitch({
                container: '#J-history-table',
                url: '/api/transactions/category/',
                tpl: '#J-record-history-tpl',
                parseData: parseData,
                postData: getPostData
            });
            this.handleOps();
            $('#J-history-table').on('status.switch', function (e, data) {
                if (data.type !== 'all') {
                    data = data.data[typeMap[data.type]];
                } else {
                    data = data.data;
                    if (onlytoday && !data.count) {
                        $('.J-today-transactions').remove();
                        return;
                    }
                }
                $('.J-pagination-wp').remove();
                _this.initPagination(data.count);
            });
            function getPostData() {
                var index = $('.J-pagination-wp').find('.active').attr('data-index');
                var config = { 
                    rowcount: 10,
                    pageindex: index || 0
                };
                if (onlytoday) {
                    config.timealias = 'today';
                }
                return config;
                
            }
            function parseData(data, dataType) {
            var index = 0,
                tmpData,
                p = [],
                len,
                count;

                if (dataType !== 'all') {
                    data = data[typeMap[dataType]] || [];
                }
                count = data.count || 0;
                data = data.data || [];
                for (var i = 0; i < data.length; i++) {
                    tmpData = data[i];
                    len = tmpData.category.length;
                    tmpData.type = tmpData.category[len - 1].name;
                    if (len === 1) {
                        tmpData.subType = '无';
                    } else {
                        tmpData.subType = tmpData.category[0].name;
                    }
                    tmpData.from = tmpData.from[0].name;
                    tmpData.remark = tmpData.remark || '无';
                }
                return {
                    data: data,
                    count: count,
                    names: ['记账类型',  '项目类型', '金额', '日期', '账户', '备注', '操作']
                };
            }
        },
        handleOps: function () {
            this.handleDel();
            this.handleUpdate();
        },
        handleDel: function () {
            $('.J-transactions-history-wp').delegate('.J-history-del', 'click', function () {
                var r = window.confirm('是否删除此条记录？');
                if (!r) return;
                var ndInput = $(this).siblings('input[type="hidden"]')[0];
                $.ajax({
                    url: '/api/transactions/delete/' + $(ndInput).val(),
                    method: 'delete',
                }).done($.proxy($util.alert, $util));
            });
        },
        handleUpdate: function () {
            $('.J-transactions-history-wp').delegate('.J-history-update', 'click', function () {
                var ndInput = $(this).siblings('input[type="hidden"]'),
                    arrData,
                    ndTr = $(this).closest('tr'),
                    nlTd = ndTr.find('td'),
                    ndModel = $('.J-transactions-update-wp'),
                    id = ndInput.val();

                ndModel.modal()
                ndModel.find('input[name="amount"]').val($(nlTd[2]).text())
                ndModel.find('input[name="remark"]').val($(nlTd[5]).text())
                $index.initRadioGroup({
                    categoryName: 'parentCategory',
                    container: '.J-transactions-update-wp',
                    selected: $(nlTd[0]).text()
                },function (ndRadioGroupWp, selectedIndex) {
                    $index.initCascade({
                        container: '.J-transactions-update-wp',
                        selected: $(nlTd[1]).text()
                    });
                    var ndCommon     = ndModel.find('.J-account-common');
                    var ndCategoryWp = ndModel.find('.J-category-wp');
                    var ndTransfer   = ndModel.find('.J-account-transfer');
                    var ndWp         = ndModel.find('.J-account-wp');
                    if (selectedIndex >= 0) {
                        toggleShowWhich(ndRadioGroupWp.find('input')[selectedIndex]);
                    }
                    if (!ndRadioGroupWp.attr('inited')) {
                        init();
                    };
                    $index.initOptionGroup({
                        container: '.J-transactions-update-wp',
                        selected: {
                            from: $(nlTd[4]).text()
                        }
                    });
                    ndRadioGroupWp.attr('inited', true);
                    function init() {
                        ndRadioGroupWp.delegate('input', 'change', function (e) {
                            toggleShowWhich(this);
                            $index.initOptionGroup();
                        });
                    }
                    function toggleShowWhich(ndTrigger) {
                        var index = ndTrigger.getAttribute('data-name');
                        if (index === '户内转账') {
                            ndCommon.remove();
                            ndWp.append(ndTransfer);
                            ndCategoryWp.hide();
                            ndTransfer.show();
                        } else if (index === '账户注资'){
                            ndWp.append(ndCommon);
                            ndCategoryWp.hide();
                            ndCommon.show();
                            ndTransfer.remove();
                        } else {
                            ndWp.append(ndCommon);
                            ndCategoryWp.show();
                            ndCommon.show();
                            ndTransfer.remove();
                        }
                    }
                });
                $util.bindSubmitEvent('.J-transactions-update-form', {
                    urlPath: $(ndTr).find('input[name="t_id"]')[0].value
                });
            });
        }
    };
    return proto;
});
