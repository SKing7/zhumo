define('transactions/add', ['transactions/base', 'jquery', 'common/util', 'transactions/history'], function($base, $, $util, $history) {
    var proto = {
        init: function () {
            var selected = setSelected(),
                _this = this;

            $base.initRadioGroup({
                container: '.J-transactions-add',
                categoryName: 'parentCategory',
                selected: selected
            }, function (data) {
                $base.initCascade({
                    container: '.J-transactions-add'
                });
            });
            $base.initOptionGroup({
                container: '.J-transactions-add'
            }, function () {
                _this.toggleShow();
            });

            $('input[name="gmtHappened"]').val($util.parseDate());
            //$util.bindSubmitEvent('.J-transactions-add');
            $history.initList(true);
            $util.datepicker();

            function setSelected() {
                var reg = /category=([^&]+)/;
                var q = document.location.search;
                var selected = '支出';
                var mts = q.match(reg);
                if (mts) {
                    mts = mts[1]; 
                    switch (mts) {
                    case 'zhuzi':
                        selected = '账户注资';
                        break;
                    case 'transfer':
                        selected = '户内转账';
                        break;
                    }
                }
                return selected;
            }
        },
        toggleShow: function () {
            var ndContainer = $('.J-transactions-add'),
                ndWrapper = ndContainer.find('.J-radio-group'),
                ndGroup =   ndContainer.find('.J-op-group-wp'),
                ndTarget0 = ndContainer.find('.J-transfer-wp'),
                ndTarget1 = ndContainer.find('.J-others-wp');

            ndWrapper.delegate('input[type="radio"]', 'click', function (e) {
                handle($(this));
            });
            handle(ndWrapper.find('input[type="radio"]:checked'));
            function handle(nd) {
                var name = nd.attr('data-name');
                if ( name === '户内转账') {
                    ndGroup.html('');
                    ndGroup.append(ndTarget0);
                    ndTarget0.removeClass('hidden');
                    $('.J-category-item').addClass('hidden');
                } else {
                    ndGroup.html('');
                    ndGroup.append(ndTarget1);
                    if (name === '账户注资') {
                        $('.J-category-item').addClass('hidden');
                    } else {
                        $('.J-category-item').removeClass('hidden');
                    }
                }
            }
        }
    };
    return proto;
});
