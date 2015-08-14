'use strict';

define('users/changepassword', ['jquery', 'jquery.validate'], function($) {
    return {
        init: function () {
            var ndForm = $('#j-changepassword-form');
            ndForm.submit(function (event) {
                if (!ndForm.valid()) {
                    event.preventDefault();
                }
            });
        },
    };
});

