'use strict';

define('settings/categories', ['jquery', 'jquery.validate'], function ($) {

    function bindRemoveEvents () {
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
            bindRemoveEvents();
        },
    };
});

