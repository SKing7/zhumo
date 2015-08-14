require.config({
    baseUrl: '/js/',
    paths: {
        'jquery': 'vendor/jquery/dist/jquery',
        'lodash': 'vendor/lodash/dist/lodash.min',
        'bootstrap': 'vendor/bootstrap/dist/js/bootstrap',
        'jquery.validate': 'vendor/jquery.validation/dist/jquery.validate',
        'jquery.prettydate': 'vendor/jquery-prettydate/jquery.prettydate',
        'jquery.inputclear': 'vendor/input-with-clear-button/src/quick-clear',
        'handlebars': 'vendor/handlebars/handlebars.amd',
　　    'raphael': 'vendor/raphael/raphael',
　　    'g.raphael': 'vendor/wangshijun.g.raphael/g.raphael',
　　    'g.pie': 'vendor/wangshijun.g.raphael/g.pie',
　　    'g.bar': 'vendor/wangshijun.g.raphael/g.bar',
　　    'bootbox': 'vendor/bootbox/bootbox',
　　    'echarts': 'vendor/echarts/build/echarts-original',
　　    'echarts/chart/bar': 'vendor/echarts/build/echarts-original',
　　    'echarts/chart/pie': 'vendor/echarts/build/echarts-original',
　　    'datepicker': 'vendor/bootstrap-datepicker/js/bootstrap-datepicker'
　　},
    shim: {
        'bootstrap': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        'jquery.validate': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        'jquery.prettydate': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        'jquery.inputclear': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        'datepicker': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        'g.pie': {
            deps: ['g.raphael']
        },
        'g.bar': {
            deps: ['g.raphael']
        },
        'g.raphael': {
            deps: ['raphael']
        },
    }
});

window.ownConfig = {};
window.ownConfig.SEPARATOR = '\u0001';

// load jquery and bootstrap immediately
require(['bootstrap'], function ($) {
});

