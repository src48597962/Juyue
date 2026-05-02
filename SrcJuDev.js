var d = [];
var tools = {
    request: function(url, options) {
        options = options || {};
        options.headers = options.headers || {};
        if (!options.headers['User-Agent']) {
            options.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
        }
        if (!options.headers['Referer']) {
            var m = url.match(/^(https?:\/\/[^\/]+)/);
            if (m) options.headers['Referer'] = m[1] + '/';
        }
        return fetch(url, options);
    },
    getHost: function(url) {
        var m = url.match(/^(https?:\/\/[^\/]+)/);
        return m ? m[1] : '';
    },
    fullUrl: function(baseUrl, relativeUrl) {
        if (!relativeUrl) return '';
        if (relativeUrl.indexOf('http') === 0) return relativeUrl;
        var host = this.getHost(baseUrl);
        if (relativeUrl.indexOf('/') === 0) return host + relativeUrl;
        var base = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
        return base + relativeUrl;
    }
};

// ============ 输入区 ============
d.push({
    title: '🔗 输入网站Url',
    desc: '输入目标网站的完整地址(https://开头)',
    url: $.toString(function() {
        input = (input || '').trim();
        if (!input) return 'toast://网址不能为空';
        if (!/^https?:\/\//.test(input)) return 'toast://请输入完整网址(https://开头)';
        putMyVar('site_url', input);
        putMyVar('step', 'analyze');
        refreshPage(false);
        return 'hiker://empty';
    }),
    col_type: 'input',
    extra: { defaultValue: getMyVar('site_url', ''), hint: 'https://www.example.com' }
});

var step = getMyVar('step', '');
var siteUrl = getMyVar('site_url', '');

if (step === 'analyze' && siteUrl) {
    d.push({ col_type: 'line_blank' });
    d.push({ title: '⏳ 正在分析: ' + siteUrl, col_type: 'text_center_1' });

    var host = tools.getHost(siteUrl);
    var html = tools.request(siteUrl);

    if (!html || html.length < 200) {
        d.push({ title: '❌ 请求失败，请检查网站是否可以访问', col_type: 'text_center_1' });
        putMyVar('step', '');
        setResult(d);
    }

    // ==================== 一、分类导航 ====================
    d.push({ col_type: 'line' });
    d.push({ title: '📂 一、分类导航', col_type: 'text_center_1', extra: { textSize: 18, isBold: true } });
    d.push({ col_type: 'line' });

    var categories = [];
    var catSelector = '';
    // 【修正1】优先匹配 stui-header__menu
    var catSelectors = [
        '.stui-header__menu li a',
        '.nav-item a', '.nav_menu li a', '.navbar-nav li a',
        '.header-nav a', '.menu-item a', '.nav a',
        '.module-tab-item a', '.hl-type-list a'
    ];

    for (var si = 0; si < catSelectors.length; si++) {
        try {
            var items = pdfa(html, catSelectors[si]);
            var validItems = [];
            for (var ii = 0; ii < items.length; ii++) {
                var title = '';
                var href = '';
                try { title = pdfh(items[ii], 'Text') || ''; } catch(e) {}
                try { href = pd(items[ii], 'a&&href') || ''; } catch(e) {}
                // 【修正2】过滤掉“筛选器用词”
                if (title && title.trim() && title.trim().length < 20 && !/(按|筛选|排行|年份|地区|类型)/.test(title)) {
                    validItems.push({ title: title.trim(), url: tools.fullUrl(siteUrl, href) });
                }
            }
            if (validItems.length >= 2 && validItems.length <= 20) {
                categories = validItems;
                catSelector = catSelectors[si];
                break;
            }
        } catch(e) {}
    }

    if (categories.length > 0) {
        d.push({ title: '定位选择器: ' + catSelector, desc: '✅ 发现 ' + categories.length + ' 个分类', col_type: 'text_icon', url: 'hiker://empty' });
        for (var ci = 0; ci < Math.min(categories.length, 8); ci++) {
            d.push({ title: categories[ci].title, desc: categories[ci].url, col_type: 'text_icon', url: 'hiker://empty' });
        }
        putMyVar('cat_selector', catSelector);
        putMyVar('cat_count', String(categories.length));
    } else {
        d.push({ title: '定位: 未找到', desc: '❌ 未发现分类导航', col_type: 'text_1', url: 'hiker://empty' });
    }

    // ==================== 二、一级列表 ====================
    d.push({ col_type: 'line' });
    d.push({ title: '🎬 二、一级列表', col_type: 'text_center_1', extra: { textSize: 18, isBold: true } });
    d.push({ col_type: 'line' });

    var listItems = [];
    var containerSelector = '';
    var titleSelector = '';
    var imgSelector = '';
    var linkSelector = '';
    var descSelector = '';

    // 【修正3】优先匹配 stui-vodlist 容器
    var itemSelectors = [
        'ul.stui-vodlist li',
        '.stui-vodlist .stui-vodlist__box',
        '.hl-vod-list .hl-list-item', '.module-item',
        '.video-item', '.movie-item', '.myui-vodlist__thumb',
        '.fed-list-item', '.vodlist_item', '.public-list-box .thumb'
    ];

    for (var lsi = 0; lsi < itemSelectors.length; lsi++) {
        try {
            var items = pdfa(html, itemSelectors[lsi]);
            // 【修正4】降低匹配数量要求
            if (items.length >= 3 && items.length <= 200) {
                var testItem = items[0];
                
                // 标题
                var ts = ['a&&title', 'img&&alt', '.title&&Text', 'h4&&Text', 'h3&&Text', '.name&&Text', 'a&&Text', '.stui-vodlist__detail h4 a&&Text'];
                for (var tsi = 0; tsi < ts.length; tsi++) {
                    try { var tt = pdfh(testItem, ts[tsi]); if (tt && tt.length > 1 && tt.length < 100) { titleSelector = ts[tsi]; break; } } catch(e) {}
                }

                // 图片：优先 data-original
                var is = ['a&&data-original', 'img&&data-original', 'img&&data-src', 'img&&src', '.stui-vodlist__thumb&&data-original'];
                for (var isi = 0; isi < is.length; isi++) {
                    try { var ti = pd(testItem, is[isi]); if (ti && ti.length > 5) { imgSelector = is[isi]; break; } } catch(e) {}
                }

                // 链接
                try { var tl = pd(testItem, 'a&&href'); if (tl) linkSelector = 'a&&href'; } catch(e) {}

                // 描述
                try { var td = pdfh(testItem, '.pic-text&&Text') || pdfh(testItem, '.stui-vodlist__detail p&&Text') || ''; if (td) descSelector = '.pic-text&&Text'; } catch(e) {}

                if (titleSelector && imgSelector && linkSelector) {
                    containerSelector = itemSelectors[lsi];
                    for (var ii = 0; ii < Math.min(items.length, 3); ii++) {
                        var it = items[ii];
                        var _t = ''; try { _t = pdfh(it, titleSelector) || ''; } catch(e) {}
                        var _i = ''; try { _i = pd(it, imgSelector) || ''; } catch(e) {}
                        var _l = ''; try { _l = pd(it, 'a&&href') || ''; } catch(e) {}
                        if (_t) listItems.push({ title: _t, img: _i, url: tools.fullUrl(siteUrl, _l) });
                    }
                    break;
                }
            }
        } catch(e) {}
    }

    if (listItems.length > 0) {
        d.push({ title: '列表容器: ' + containerSelector, desc: '✅ 有效', col_type: 'text_icon', url: 'hiker://empty' });
        d.push({ title: '标题选择器: ' + titleSelector, desc: '✅ 有效', col_type: 'text_icon', url: 'hiker://empty' });
        d.push({ title: '图片选择器: ' + imgSelector, desc: '✅ 有效', col_type: 'text_icon', url: 'hiker://empty' });
        d.push({ title: '链接选择器: ' + linkSelector, desc: '✅ 有效', col_type: 'text_icon', url: 'hiker://empty' });
        if (descSelector) d.push({ title: '描述选择器: ' + descSelector, desc: '✅ 有效', col_type: 'text_icon', url: 'hiker://empty' });

        d.push({ col_type: 'blank_block' });
        d.push({ title: '预览:', col_type: 'text_1', url: 'hiker://empty', extra: { isBold: true } });
        for (var li = 0; li < listItems.length; li++) {
            d.push({ title: listItems[li].title, img: listItems[li].img, desc: listItems[li].url, url: listItems[li].url, col_type: 'movie_1_left_pic' });
        }

        putMyVar('container_selector', containerSelector);
        putMyVar('title_selector', titleSelector);
        putMyVar('img_selector', imgSelector);
        putMyVar('link_selector', linkSelector);
        putMyVar('desc_selector', descSelector);
    } else {
        d.push({ title: '定位: 未找到', desc: '❌ 未发现列表容器', col_type: 'text_1', url: 'hiker://empty' });
    }

    putMyVar('step', 'done');
}

if (getMyVar('step', '') === 'done') {
    d.push({ col_type: 'line_blank' });
    d.push({
        title: '🔄 重新分析',
        url: $('#noLoading#').lazyRule(function() {
            putMyVar('step', '');
            putMyVar('site_url', '');
            refreshPage(false);
            return 'hiker://empty';
        }),
        col_type: 'text_center_1'
    });
}

setResult(d);