define('transactions/base', ['jquery', 'common/util'], function($, $util) {
    var proto = {
        //单选组
        initRadioGroup: function (params, cb) {
            params = params || {};
            var container = params.container || '';
            var ndRadioGroup = $(container + ' .J-radio-group');
            var _this = this;
            var url = '/api/categories/tree';
            var toShow = params.toShow;
            var showAll = false;
            if (!toShow) {
                showAll = true;
            }
            //var cName = params.categoryName;
            var data = $util.getAjaxData(url);
            if (!data) {
                $.ajax({
                      type: "get",
                      url: url
                }).done(function (data) {
                    var data = $util.parseJSON(data);
                    $util.storeAjaxData(data, url);
                    create(data);
                });
            } else {
                create(data);
            }
            function create(data) {
                var html = '';
                var selectedIndex = -1;
                var isSelected = false;
                for(var i = 0; i < data.length; i++) {
                    if (!showAll && (!data[i] || $.inArray(data[i].name, toShow) < 0)) continue;
                    isSelected = false;
                    if (data[i].name === params.selected) {
                        selectedIndex = i;
                        isSelected = true;
                    }
                    html += '<label class="radio-inline">' +
                        '<input type="radio"' + ( isSelected ? ' checked="true"' : '')
                        + ' name="parentCategory" data-name="' + data[i].name + '" data-index="' + i + '" value="' + data[i]._id + '">'
                        + data[i].name+ '</label>';
                }
                ndRadioGroup.html(html);
                if (cb) cb(ndRadioGroup, selectedIndex);
            }
        },
        //项目类型对应的级联
        initCascade: function (params, cb) {
            params = params || {};
            var container = params.container || '';
            ndContainer = $(container);
            if (!ndContainer) return;
            var _this = this;
            var url = '/api/categories/tree';
            var ndSelect = $(container + ' .J-select-category');
            var nlParentCateogry = ndContainer.find('[name="parentCategory"]');
            var data = $util.getAjaxData(url);
            var selected = params.selected || '';

            if (!data) {
                $.ajax({
                      type: "get",
                      url: url
                }).done(function (data) {
                    var data = $util.parseJSON(data);
                    $util.storeAjaxData(data, url);
                    create(data);
                });
            } else {
                create(data);
            }
            function create(data) {
                createOptions(data, nlParentCateogry.filter(':checked').attr('data-index'));
                //绑定事件
                nlParentCateogry.change(function (e) {
                    var v = $(this).attr('data-index');
                    createOptions(data, v);
                });
            }
            function createOptions(data, index) {
                index = index || 0;
                data = data[index];
                var childs = data.childNodes;
                var html = '<option value="">点击选择项目</option>'
                if (childs && childs.length) {
                    for (var i = 0; i < childs.length; i++) {
                        html += '<option' + (childs[i].name === selected ? ' selected="true"' : '')+ ' value="' + childs[i]._id + '">' + childs[i].name + '</option>';
                    }
                } else {
                    var ndSelectedRadio = nlParentCateogry.filter(':checked');
                    if (ndSelectedRadio.length) {
                        html = '<option value="' + ndSelectedRadio.val() + '">' + ndSelectedRadio.parent().text() + '</option>';
                    }
                }
                $(ndSelect).html(html);
            }
        },
        //options group
        initOptionGroup: function (params, cb) {
            params = params || {};
            var container = params.container || '';
            var url = '/api/accounts/tree';
            var ndAccountGroup = $(container + ' .J-account-group');
            var data = $util.getAjaxData(url);
            var selected = params.selected || {};
            if (!data) {
                $.ajax({
                      type: "get",
                      url: url
                })
                .done(function(data) {
                    var data = $util.parseJSON(data);
                    $util.storeAjaxData(data, url);
                    create(data);
                });
            } else {
                create(data);
            }
            function create(data) {
                var html = '';
                var opt;
                var childs;
                var selectedName = '';
                ndAccountGroup.each(function (key, item) {
                    html = '<option value="">点击选择账户</option>'
                    selectedName = selected[item.getAttribute('name')];
                    for(var i = 0; i < data.length; i++) {
                        opt = data[i];
                        html += '<optgroup label="' + opt.name + '">';
                        childs = opt.childNodes;
                        if (!childs.length) {
                            html += '<option ' + (selectedName === opt.name ? ' selected="true"' : '') + '  value="' + opt._id + '">' + opt.name+ '</option>';
                        }
                        for(var j = 0; j < childs.length; j++) {
                            html += '<option ' + (selectedName === childs[j].name ? ' selected="true"' : '') + ' value="' + childs[j]._id + '">' + childs[j].name+ '</option>';
                        }
                        html += '</optgroup>';
                    }
                    $(item).html(html);
                })
                if (cb) cb();
            }
        }
    };
    return proto;
});
