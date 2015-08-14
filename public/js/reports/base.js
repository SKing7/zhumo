define('reports/base', ['jquery', 'common/util'], function($, $util) {
    var proto = {
        init: function () {
            this.bindSetDate()
            $util.datepicker();
        },
        initPreview: function (cb) {
            var ndForm = $('.J-reports-filter-form');
            $('.J-preview').click(function () {
                $('.J-report-table-wp').remove();
                $('.J-pagination-wp').remove();
                fetchData(cb);
            });
            $('.J-preview').trigger('click');
            ndForm.on('data.fetch', function (e, cb) {
                fetchData(cb);
            })
            function fetchData(cb) {
                var ndPage = $('.J-pagination-wp');
                var data = {
                    timeinterval: ndForm.find('input[name="start"]').val() + ',' +ndForm.find('input[name="end"]').val(),
                    rowcount: ndPage.attr('data-rowcount'),
                    pageindex: ndPage.find('.active').attr('data-index') || 0,
                    fileformat: ndForm.find('input[name="fileformat"]:checked').val(),
                    type: 'preview'
                };
                $util.askForData({
                    url: ndForm.attr('action'),
                    data: data
                }, cb);
            }
        },
        setDate: function (start, end) {
            var ndForm = $('.J-reports-filter-form');
            ndForm.find('input[name="start"]').val($util.parseDate(start));
            ndForm.find('input[name="end"]').val($util.parseDate(end));;
        },
        bindSetDate: function () {
            var _this = this;
            var now = new Date;
            var ndDatePicker = $('.J-set-datepicker');
            var nlDatePicker = ndDatePicker.find('[data-interval]');
            nlDatePicker.on('click', function () {
                var now = new Date;
                var interval = $util.calcDate(this.getAttribute('data-interval'));
                _this.setDate(new Date(now-24 * 3600 * 1000 * interval), now);
                nlDatePicker.removeClass('label-active');
                $(this).addClass('label-active');
            });
            $(nlDatePicker[2]).trigger('click');
        }
    };
    return proto;
});
