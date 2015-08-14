'use strict';

define('users/signin', ['jquery'], function($) {

    function initFormValidations(config) {
        var forms = $('form');

        forms.validate({
            errorClass: 'text-danger',
            validClass: 'text-success',
            errorPlacement: function (ndError, ndInput) {
                ndInput.parent().append(ndError);
            },
        });

        forms.on('submit', function (e) {
            if ($(this).valid() === false) {
                e.preventDefault();
                return false;
            }
        });
    }

    return {
        init: function () {
            initFormValidations();
        },
    };
});
