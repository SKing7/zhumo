'use strict';

define('common/validate', ['jquery', 'jquery.validate'], function ($) {
    $.extend($.validator.messages, {
        required: '必须填写',
        remote: '请修正此栏位',
        email: '请输入有效邮箱',
        url: '请输入有效网址',
        date: '请输入有效日期',
        dateISO: '请输入有效日期 (YYYY-MM-DD)',
        number: '请输入正确数字',
        digits: '只可输入数字',
        creditcard: '请输入有效的信用卡号码',
        equalTo: '两次输入不相同',
        extension: '请输入有效的后缀',
        maxlength: $.validator.format('最多 {0} 个字符'),
        minlength: $.validator.format('最少 {0} 个字符'),
        rangelength: $.validator.format('请输入长度为 {0} 至 {1} 之間的字符串'),
        range: $.validator.format('请输入 {0} 至 {1} 之间的数值'),
        max: $.validator.format('请输入不大于 {0} 的数值'),
        min: $.validator.format('请输入不小于 {0} 的数值')
    });
});
