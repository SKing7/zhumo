'use strict';

define('settings/accounts', ['jquery', 'jquery.validate'], function ($) {

    function initRemoveLink() {
        $('.j-remove-child').on('click', function (event) {
            event.preventDefault();
            var ndRemove = $(this);
            $.ajax({ url: ndRemove.attr('href'), method: 'DELETE'}).then(function (data) {
                window.location.reload();
            });
        });
    }

    return {
        init: function () {
            initRemoveLink();
        },
    };
});

