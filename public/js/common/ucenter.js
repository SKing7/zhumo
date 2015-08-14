'use strict';

define('common/ucenter', [
    'jquery',
    'lodash',
    'common/popover',
    'common/util',
    'common/helper',
    'common/base',
    'bootstrap',
    'jquery.validate',
    'jquery.inputclear',
    'common/validate'
], function ($, _, Popover,  $util, Helper, Base) {

    function initSidebar(config) {
        var ndSidebar = $('#j-nav-sidebar');
        if (!ndSidebar) { return; }

        ndSidebar.find('li.' + ndSidebar.data('controller')).addClass('active');
    }

    function initSysMessages(config) {
        setTimeout(function () {
            $('.alert .close').click();
        }, 3000);
    }

    function initCompanyAdd(config) {
        var ndModal = $('#j-modal-add-company');
        var ndForm = $('#j-add-company-form');

        if (!ndModal) return false;
        if (!ndForm) return false;

        $(window.document).delegate('#j-add-company', 'click', function (e) {
            e.preventDefault();
            ndModal.modal('show');
        });

        ndForm.on('submit', function (e) {
            if (!ndForm.valid()) {
                e.preventDefault();
            }
        });
    }

    function initCompanyChooser(config) {

        var popover = new Popover({
            trigger: '#j-company-chooser-trigger',
            template: $('#j-company-chooser-template').html(),
            title: '<a id="j-add-company" class="pull-right" href="/companies/add"><i class="fa fa-plus"></i> 创建公司</a> 所有公司',
            content: $('#j-company-chooser-content').html(),
        });

        popover.trigger.on('show.bs.popover', function () {
            initCompanyAdd();
        });

    }

    function initCompanyBalance(config) {
        $util.askForData({url: '/api/transactions/totalamount/account'}, function (data) {
            data = data.data;
            var ndTpl = $('#j-company-balance-content');
            var ndTmp = $(ndTpl.html());
            var ac = data.accounts || {};
            $('.J-all-amount').html(data.sum);
            ndTmp.find('.J-all-amount').find('em').html(data.sum || 0);
            ndTmp.find('.J-bank-amount').find('em').html(ac['银行账户'] || '0.00');
            ndTmp.find('.J-cash-amount').find('em').html(ac['现金账户'] || '0.00');
            ndTmp.find('.J-net-amount').find('em').html(ac['网络账户'] ||  '0.00');
            new Popover({
                trigger: '#j-company-balance-trigger',
                template: $('#j-company-balance-template').html(),
                title: '',
                content: ndTmp.html(),
            });
        });
    }

    function initAccount(config) {
        var popover = new Popover({
            trigger: '#j-account-trigger',
            template: $('#j-account-template').html(),
            title: '',
            content: $('#j-account-content').html(),
        });
    }

    function initPageModules(config) {
        // bootstrap page-dependent modules
        if (config.path) {
            var components = _.filter(config.path.split('/'));
            if (components.length === 1) {
                components.push('index');
            }
            require([components.join('/')], function (module) {
                if (module) {
                    module.init(config);
                }
            });
        }
    }

    return {
        init: function (config) {
            // initSidebar(config);
            Helper.initHbs();
            initSysMessages(config);
            initPageModules(config);
            initCompanyChooser(config);
            initCompanyBalance(config);
            initAccount(config);
            Base.initFormValidations(config);
        },
    };

});

