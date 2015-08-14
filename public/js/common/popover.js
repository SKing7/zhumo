'use strict';

define('common/popover', ['jquery', 'bootstrap'], function ($) {
    var $document = $(window.document);
    var instances = [];

    function Popover(config) {
        var instance = this;

        this.trigger = $(config.trigger);
        this.namespace = '.popover.' + (new Date()).getTime();

        instances.push(this);

        this.trigger.popover({
            html: true,
            trigger: 'manual',
            placement: config.placement || 'bottom',
            template: config.template,
            title: config.title,
            content: config.content,
        });

        this.trigger.on('click', function (e) {
            instance.trigger.popover('toggle');
            hideOtherInstance();
            e.stopPropagation();
            e.preventDefault();
        });

        this.trigger.on('show.bs.popover', function () {
            instance.trigger.find('.fa').removeClass('fa-caret-down').addClass('fa-caret-up');
            $document.on('click' + instance.namespace, hidePopoverOnBlur);
        });

        this.trigger.on('hide.bs.popover', function () {
            instance.trigger.find('.fa').addClass('fa-caret-down').removeClass('fa-caret-up');
            $document.off('click' + instance.namespace);
        });

        function hidePopoverOnBlur(e) {
            if (!isEventInsidePopover(e)) {
                instance.trigger.popover('hide');
            }
        }

        function hideOtherInstance() {
            for (var i = 0, n = instances.length; i < n; i++) {
                if (instances[i] !== instance) {
                    instances[i].trigger.popover('hide');
                }
            }
        }

        function isEventInsidePopover(e) {
            var target = $(e.target);
            if (target.parents('.popover').length > 0) {
                return true;
            }
            return false;
        }
    }

    return Popover;

});


