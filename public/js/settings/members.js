'use strict';

define('settings/members', ['jquery', 'bootbox', 'jquery.validate'], function ($, bootbox) {
    function initAddMember() {
        var ndForm = $('#j-add-member-form');
        ndForm.validate({
            submitHandler: function () {
                $.ajax({
                    type: ndForm.attr('method'),
                    url: ndForm.attr('action'),
                    data: ndForm.serialize(),
                    dataType: 'json'
                }).done(function (response) {
                    if (response.status) {
                        bootbox.alert($('#j-add-success-tip').html(), function () {
                            window.location.reload();
                        });
                    } else {
                        bootbox.alert(response.msg.replace('Error: ', ''));
                    }
                });
            },
        });
    }

    function initRemoveMember() {
        $('.j-remove-member').on('click', function (event) {
            var ndContainer = $(this).parents('.j-member-item');
            var email = ndContainer.data('email');
            var role = ndContainer.data('role');

            bootbox.confirm({
                title: '注销提醒',
                message: '<h4>确定注销账户 ' + email + '?</h4><p>注销后，该用户将无法共享本公司财务信息</p>',
                callback: function (confirmed) {
                    if (!confirmed) { return; }
                    $.ajax({
                        type: 'post',
                        url: '/api/companies/removemember',
                        data: { email: email, role: role },
                        dataType: 'json'
                    }).done(function (response) {
                        if (response.status) {
                            bootbox.alert('子账户删除成功');
                            ndContainer.remove();
                        } else {
                            bootbox.alert(response.msg.replace('Error: ', ''));
                        }
                    });
                },
            });
        });
    }

    function initEditMember() {
        $('.j-edit-member').on('click', function (event) {
            var ndContainer = $(this).parents('.j-member-item');
            var ndForm = $('#j-edit-member-form').clone().show();
            var email = ndContainer.data('email');
            var role = ndContainer.data('role');

            ndForm.find('.j-email').val(email);
            ndForm.find('.j-role').val(role);

            bootbox.dialog({
                title: '修改子账号权限',
                message: ndForm,
                buttons: {
                    '取消': {
                        className: 'btn-link',
                        callback: function () {
                        },
                    },
                    '保存': {
                        className: 'btn-success',
                        callback: function () {
                            $.ajax({
                                type: 'post',
                                url: '/api/companies/editmember',
                                data: ndForm.serialize(),
                                dataType: 'json'
                            }).done(function (response) {
                                if (response.status) {
                                    bootbox.alert('子账户保存成功', function () {
                                        window.location.reload();
                                    });
                                } else {
                                    bootbox.alert(response.error.replace('Error: ', ''));
                                }
                            });
                        },
                    },
                },
            });
        });
    }

    return {
        init: function () {
            initAddMember();
            initRemoveMember();
            initEditMember();
        },
    };
});

