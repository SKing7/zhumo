'use strict';

define('users/signup', ['jquery', 'bootbox', 'jquery.validate'], function ($, bootbox) {

    function initFormValidations(config) {
        var forms = $('form');

        forms.validate({
            errorClass: 'text-danger',
            validClass: 'text-success',
            success: function (ndError, ndInput) {
                if (!ndError || !ndInput) { return; }
                var ndIcon = $('<i class="fa fa-2x fa-check-circle"></i>');
                ndError.removeClass('text-danger').addClass('text-success').append(ndIcon);
                ndInput.parents('.col-sm-6').next('.error-container').html(ndError);
            },
            errorPlacement: function (ndError, ndInput) {
                if (!ndError || !ndInput) { return; }
                ndInput.parents('.col-sm-6').next('.error-container').html(ndError);
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

