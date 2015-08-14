'use strict';

module.exports = {
    port: process.env.PORT || 8990,
    mongodb: 'mongodb://127.0.0.1:27017/daybook',
    baseUrl: 'http://localhost:8990',
    app: {
        title: '朱墨记账 - 开发环境'
    },
};
