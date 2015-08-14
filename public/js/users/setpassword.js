'use strict';

define('users/setpassword', ['jquery', 'jquery.validate'], function($) {

    function initFormValidations(config) {
        var forms = $('form');

        forms.validate({
            errorClass: 'text-danger',
            validClass: 'text-success',
            errorPlacement: function (ndError, ndInput) {
                // console.log(ndInput.parent().next());
                // ndInput.parents('.form-group').addClass('has-error');
                // ndError.html('<i class="fa fa-times"></i>&nbsp;' + ndError.html()).addClass('help-block');
                ndInput.parent().next().append(ndError);
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

