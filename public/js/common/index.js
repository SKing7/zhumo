'use strict';

define('common/index', [
    'jquery',
    'lodash',
    'bootstrap',
    'jquery.validate',
    'jquery.inputclear',
    'common/validate'
], function ($, _) {

    return {
        init: function (config) {

            // bootstrap page-dependent modules
            if ($('[data-nopagejs]').length) {
                console.log('nojs');
                return;
            }
            if (config.path) {
                var components = _.filter(config.path.split('/'));
                if (components.length === 0) {
                    components.push('index');
                    components.push('index');
                }
                if (components.length === 1) {
                    components.push('index');
                }
                if (components.length > 2) {
                    components.pop();
                }
                require([components.join('/')], function (module) {
                    if (module) {
                        module.init();
                    }
                });
            }
        },
    };

});

