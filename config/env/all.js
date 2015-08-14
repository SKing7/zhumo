'use strict';

module.exports = {
    app: {
        title: '朱墨记账',
        description: '朱墨记账：小微企业记账和金融解决方案',
        keywords: 'zhumo, finance'
    },
    port: process.env.PORT || 8081,
    debug: process.env.NODE_ENV !== 'production',
    logpath: '/opt/logs/zhumo/zhumo.log',
    session: {
        maxAge: 3600000,
        secret: '4b80f6dc0e149a9b82d54db96d872a63',
        collection: 'sessions',
    },
    mail: {
        cc: 'wangshijun@zhumo.cc',
        from: 'wangshijun@zhumo.cc',
        transport: {
            host: 'smtp.exmail.qq.com',
            port: 465,
            secure: true,
            auth: {
                user: 'wangshijun@zhumo.cc',
                pass: 'zhumo2014'
            }
        },
    },
    assets: {
        vendor: {
            css: [
                '/vendor/bootstrap/dist/css/bootstrap.css',
                '/vendor/font-awesome/css/font-awesome.css',
            ],
            js: [
                '/vendor/lodash/dist/lodash.js',
                '/vendor/jquery/dist/jquery.min.js',
                '/vendor/bootstrap/dist/js/bootstrap.min.js',
                '/vendor/requirejs/require.js',
                '/vendor/momentjs/moment.js',
            ]
        },
        css: [
            'public/css/**/*.css'
        ],
        js: [
            'public/config/*.js',
            'public/js/**/*.js',
        ],
        tests: [
            'public/vendor/angular-mocks/angular-mocks.js',
            'public/modules/*/tests/*.js'
        ]
    }
};
