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

d.push({
    title: '🔗 输入网站Url',
    desc: '输入目标网站的完整地址(https://开头)',
    url: $.toString(function() {
        input = (input || '').trim();
        if (!input) {
            return 'toast://网址不能为空';
        }
        if (!/^https?:\/\//.test(input)) {
            return 'toast://请输入完整网址(https://开头)';
        }
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
        // 注意：这里没有 return，setResult 会正常执行
    } else {
        // ==================== 一、分类导航 ====================
        d.push({ col_type: 'line' });
        d.push({ title: '📂 一、分类导航', col_type: 'text_center_1', extra: { textSize: 18, isBold: true } });
        d.push({ col_type: 'line' });

        var categories = [];
        var catSelector = '';

        // 直接用 stui 模板的标准选择器
        try {
            var navItems = pdfa(html, '.stui-header__menu&&li');
            for (var i = 0; i < navItems.length; i++) {
                var a = '';
                var title = '';
                var href = '';
                try { a = pdfa(navItems[i], 'a'); } catch(e) {}
                if (a && a.length > 0) {
                    try { title = pdfh(a[0], 'Text') || pdfh(navItems[i], 'a&&Text') || ''; } catch(e) {}
                    try { href = pd(a[0], 'a&&href') || pd(navItems[i], 'a&&href') || ''; } catch(e) {}
                    if (title && title.trim() && title.trim().length < 20) {
                        categories.push({ title: title.trim(), url: tools.fullUrl(siteUrl, href) });
                    }
                }
            }
            if (categories.length >= 2) {
                catSelector = '.stui-header__menu li a';
            }
        } catch(e) {}

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

        // 直接用 stui 模板的标准选择器
        try {
            var items = pdfa(html, 'ul.stui-vodlist&&li');
            if (items.length >= 3) {
                containerSelector = 'ul.stui-vodlist li';

                // 从每个 li 里提取 a.stui-vodlist__thumb
                for (var ii = 0; ii < Math.min(items.length, 3); ii++) {
                    var it = items[ii];
                    var thumb = {};
                    try { thumb = pdfa(it, '.stui-vodlist__thumb'); } catch(e) {}

                    var _title = '';
                    var _img = '';
                    var _link = '';

                    if (thumb && thumb.length > 0) {
                        try { _title = pdfh(thumb[0], 'a&&title') || ''; } catch(e) {}
                        try { _img = pd(thumb[0], 'a&&data-original') || ''; } catch(e) {}
                        try { _link = pd(thumb[0], 'a&&href') || ''; } catch(e) {}
                    }

                    // 备用：从 h4 a 取标题
                    if (!_title) {
                        try { _title = pdfh(it, '.stui-vodlist__detail h4 a&&Text') || pdfh(it, 'h4 a&&Text') || ''; } catch(e) {}
                    }

                    if (!_img) {
                        try { _img = pd(it, 'img&&data-original') || ''; } catch(e) {}
                    }

                    if (!_link) {
                        try { _link = pd(it, 'a&&href') || ''; } catch(e) {}
                    }

                    if (_title && _img && _link) {
                        titleSelector = '.stui-vodlist__thumb a&&title';
                        imgSelector = '.stui-vodlist__thumb a&&data-original';
                        linkSelector = 'a&&href';
                        listItems.push({ title: _title, img: _img, url: tools.fullUrl(siteUrl, _link) });
                    }
                }
            }
        } catch(e) {}

        if (listItems.length > 0) {
            d.push({ title: '列表容器: ' + containerSelector, desc: '✅ 有效', col_type: 'text_icon', url: 'hiker://empty' });
            d.push({ title: '标题选择器: ' + titleSelector, desc: '✅ 有效', col_type: 'text_icon', url: 'hiker://empty' });
            d.push({ title: '图片选择器: ' + imgSelector, desc: '✅ 有效', col_type: 'text_icon', url: 'hiker://empty' });
            d.push({ title: '链接选择器: ' + linkSelector, desc: '✅ 有效', col_type: 'text_icon', url: 'hiker://empty' });

            d.push({ col_type: 'blank_block' });
            d.push({ title: '预览:', col_type: 'text_1', url: 'hiker://empty', extra: { isBold: true } });
            for (var li = 0; li < listItems.length; li++) {
                d.push({ title: listItems[li].title, img: listItems[li].img, desc: listItems[li].url, url: listItems[li].url, col_type: 'movie_1_left_pic' });
            }

            putMyVar('container_selector', containerSelector);
            putMyVar('title_selector', titleSelector);
            putMyVar('img_selector', imgSelector);
            putMyVar('link_selector', linkSelector);
        } else {
            d.push({ title: '定位: 未找到', desc: '❌ 未发现列表容器', col_type: 'text_1', url: 'hiker://empty' });
        }

        putMyVar('step', 'done');
    }
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