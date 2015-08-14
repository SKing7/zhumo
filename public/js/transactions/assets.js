define('transactions/assets', ['transactions/base', 'jquery', 'common/util'], function($index, $, $util) {
    var proto = {
        init: function () {
            $index.initOptionGroup();
            this.initForm();
            //this.initAccountSum();
        },
    };
    return proto;
});
