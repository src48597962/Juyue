var d = [];
var tools = {
    request: function(url, options) {
        options = options || {};
        options.headers = options.headers || {};
        // 【修改点1】默认使用 PC 端 UA，对大部分影视站更友好
        if (!options.headers['User-Agent']) {
            options.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
        }
        // 【修改点2】如果没有明确设置 Referer，自动从 url 提取 host 作为 Referer
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
    extra: {
        defaultValue: getMyVar('site_url', ''),
        hint: 'https://www.example.com'
    }
});

var step = getMyVar('step', '');
var siteUrl = getMyVar('site_url', '');

if (step === 'analyze' && siteUrl) {
    d.push({ col_type: 'line_blank' });
    d.push({ title: '⏳ 正在分析: ' + siteUrl, col_type: 'text_center_1' });

    var host = tools.getHost(siteUrl);
    // 【修改点3】带上 Referer 请求首页
    var html = tools.request(siteUrl, { headers: { 'Referer': host + '/' } });

    // 【修改点4】如果请求失败，尝试不带 Referer 再试一次
    if (!html || html.length < 100) {
        html = fetch(siteUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            }
        });
    }

    if (!html || html.length < 100) {
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
    var catSelectors = [
        '.nav-item a', '.nav_menu li a', '.navbar-nav li a',
        '.header-nav a', '.menu-item a', '.nav a',
        '.module-tab-item a', '.stui-header__menu li a',
        '.myui-header__menu li a', '.hl-type-list a'
    ];

    for (var si = 0; si < catSelectors.length; si++) {
        try {
            var items = pdfa(html, catSelectors[si]);
            if (items.length >= 2 && items.length <= 50) {
                for (var ii = 0; ii < items.length; ii++) {
                    var title = '';
                    var href = '';
                    try { title = pdfh(items[ii], 'Text') || pdfh(items[ii], 'a&&Text') || ''; } catch(e) {}
                    try { href = pd(items[ii], 'a&&href') || ''; } catch(e) {}
                    if (title && title.trim() && title.trim().length < 20) {
                        categories.push({ title: title.trim(), url: tools.fullUrl(siteUrl, href) });
                    }
                }
                if (categories.length >= 2) {
                    catSelector = catSelectors[si];
                    break;
                } else {
                    categories = [];
                }
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
    d.push({ title: '🎬 二、一级列表(首页)', col_type: 'text_center_1', extra: { textSize: 18, isBold: true } });
    d.push({ col_type: 'line' });

    var listItems = [];
    var containerSelector = '';
    var titleSelector = '';
    var imgSelector = '';
    var linkSelector = '';
    var descSelector = '';

    var itemSelectors = [
        '.hl-vod-list .hl-list-item', '.module-item', '.stui-vodlist__thumb',
        '.video-item', '.movie-item', '.myui-vodlist__thumb', '.fed-list-item',
        '.vodlist_item', '.public-list-box .thumb', '.col-lg-2'
    ];

    for (var lsi = 0; lsi < itemSelectors.length; lsi++) {
        try {
            var items = pdfa(html, itemSelectors[lsi]);
            if (items.length >= 5 && items.length <= 100) {
                var testItem = items[0];

                // 标题
                var ts = ['a&&title', 'img&&alt', '.title&&Text', 'h4&&Text', 'h3&&Text', '.name&&Text', 'a&&Text'];
                for (var tsi = 0; tsi < ts.length; tsi++) {
                    try { var tt = pdfh(testItem, ts[tsi]); if (tt && tt.length > 1 && tt.length < 100) { titleSelector = ts[tsi]; break; } } catch(e) {}
                }

                // 图片
                var is = ['img&&data-original', 'img&&data-src', 'img&&src'];
                for (var isi = 0; isi < is.length; isi++) {
                    try { var ti = pd(testItem, is[isi]); if (ti && ti.indexOf('http') === 0) { imgSelector = is[isi]; break; } } catch(e) {}
                }

                // 链接
                try { var tl = pd(testItem, 'a&&href'); if (tl) linkSelector = 'a&&href'; } catch(e) {}

                // 描述
                try { var td = pdfh(testItem, '.hl-pic-text&&Text') || pdfh(testItem, '.module-item-text&&Text') || ''; if (td) descSelector = '.hl-pic-text&&Text'; } catch(e) {}

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

    // ==================== 三、二级页面 ====================
    var firstDetailUrl = '';
    if (listItems.length > 0 && listItems[0].url) {
        firstDetailUrl = listItems[0].url;
    }

    if (firstDetailUrl) {
        d.push({ col_type: 'line' });
        d.push({ title: '🔍 三、二级页面分析', col_type: 'text_center_1', extra: { textSize: 18, isBold: true } });
        d.push({ col_type: 'line' });

        try {
            // 【修改点5】二级页面同样带 Referer 请求
            var detailHtml = tools.request(firstDetailUrl, { headers: { 'Referer': siteUrl } });

            // 3.1 封面
            d.push({ title: '🖼️ 封面定位', col_type: 'text_icon', url: 'hiker://empty', extra: { isBold: true } });
            var coverSels = ['.hl-lazy&&data-original', '.module-item-pic&&img&&src', '.vod-pic&&img&&src', '.detail-pic&&img&&src', '.stui-content__thumb&&img&&data-original', '.myui-content__thumb&&img&&src', 'img.cover&&src'];
            var foundCover = false;
            for (var csi = 0; csi < coverSels.length; csi++) {
                try {
                    var cu = pd(detailHtml, coverSels[csi]);
                    if (cu && cu.indexOf('http') === 0) {
                        d.push({ title: '封面选择器: ' + coverSels[csi], desc: '✅ 有效', img: cu, col_type: 'movie_1_left_pic', url: cu });
                        putMyVar('cover_selector', coverSels[csi]);
                        foundCover = true;
                        break;
                    }
                } catch(e) {}
            }
            if (!foundCover) d.push({ title: '封面: 未找到', desc: '❌', col_type: 'text_1', url: 'hiker://empty' });

            // 3.2 标题
            d.push({ title: '📝 标题定位', col_type: 'text_icon', url: 'hiker://empty', extra: { isBold: true } });
            var titleSels = ['h2&&Text', 'h1&&Text', '.page-title&&Text', '.title&&Text', '.movie-title&&Text', '.vod-title&&Text'];
            var foundTitle2 = false;
            for (var tsi2 = 0; tsi2 < titleSels.length; tsi2++) {
                try {
                    var dt = pdfh(detailHtml, titleSels[tsi2]);
                    if (dt && dt.length > 1 && dt.length < 100) {
                        d.push({ title: '标题选择器: ' + titleSels[tsi2], desc: '✅ ' + dt, col_type: 'text_icon', url: 'hiker://empty' });
                        putMyVar('detail_title_selector', titleSels[tsi2]);
                        foundTitle2 = true;
                        break;
                    }
                } catch(e) {}
            }
            if (!foundTitle2) d.push({ title: '标题: 未找到', desc: '❌', col_type: 'text_1', url: 'hiker://empty' });

            // 3.3 简介
            d.push({ title: '📄 简介定位', col_type: 'text_icon', url: 'hiker://empty', extra: { isBold: true } });
            var descSels2 = ['.blurb&&Text', '.module-info-content&&Text', '.stui-content__detail&&Text', '.summary&&Text', '.description&&Text'];
            var foundDesc2 = false;
            for (var dsi = 0; dsi < descSels2.length; dsi++) {
                try {
                    var dd = pdfh(detailHtml, descSels2[dsi]);
                    if (dd && dd.length > 10) {
                        d.push({ title: '简介选择器: ' + descSels2[dsi], desc: '✅ ' + dd.substring(0, 60) + '...', col_type: 'text_icon', url: 'hiker://empty' });
                        putMyVar('desc_selector2', descSels2[dsi]);
                        foundDesc2 = true;
                        break;
                    }
                } catch(e) {}
            }
            if (!foundDesc2) d.push({ title: '简介: 未找到', desc: '❌', col_type: 'text_1', url: 'hiker://empty' });

            // 3.4 线路
            d.push({ title: '📺 线路定位', col_type: 'text_icon', url: 'hiker://empty', extra: { isBold: true } });
            var tabSels = ['.module-tab-item span', '.module-tab-item', '.nav-tabs li a', '.play_source_tab a', '.stui-pannel__head .tab', '.hl-tabs-btn'];
            var foundTabs = false;
            for (var tsi3 = 0; tsi3 < tabSels.length; tsi3++) {
                try {
                    var tabNodes = pdfa(detailHtml, tabSels[tsi3]);
                    if (tabNodes.length > 0 && tabNodes.length <= 20) {
                        var tabNames = [];
                        for (var tni = 0; tni < tabNodes.length; tni++) {
                            var tn = ''; try { tn = pdfh(tabNodes[tni], 'Text') || ''; } catch(e) {}
                            if (tn && tn.trim()) tabNames.push(tn.trim());
                        }
                        if (tabNames.length > 0) {
                            d.push({ title: '线路选择器: ' + tabSels[tsi3], desc: '✅ ' + tabNames.length + ' 条: ' + tabNames.join(', '), col_type: 'text_icon', url: 'hiker://empty' });
                            putMyVar('tab_selector', tabSels[tsi3]);
                            putMyVar('tab_count', String(tabNames.length));
                            foundTabs = true;
                            break;
                        }
                    }
                } catch(e) {}
            }
            if (!foundTabs) {
                d.push({ title: '线路: 未找到', desc: '❌ (单线路)', col_type: 'text_1', url: 'hiker://empty' });
                putMyVar('tab_count', '1');
            }

            // 3.5 选集
            d.push({ title: '📋 选集定位', col_type: 'text_icon', url: 'hiker://empty', extra: { isBold: true } });
            var epSels = ['.module-play-list-link a', '.module-play-list-link', '.play_list li a', '.stui-content__playlist li a', '.myui-content__list li a', '.hl-tabs-box a', '[class*="play"] li a', '[class*="episode"] a'];
            var foundEps = false;
            for (var esi = 0; esi < epSels.length; esi++) {
                try {
                    var epNodes = pdfa(detailHtml, epSels[esi]);
                    if (epNodes.length > 0 && epNodes.length <= 1000) {
                        var sampleEps = [];
                        for (var ei = 0; ei < Math.min(epNodes.length, 5); ei++) {
                            var et = ''; try { et = pdfh(epNodes[ei], 'Text') || ''; } catch(e) {}
                            if (et && et.trim()) sampleEps.push(et.trim());
                        }
                        if (sampleEps.length >= 1) {
                            d.push({ title: '选集选择器: ' + epSels[esi], desc: '✅ ' + epNodes.length + ' 集: ' + sampleEps.join(', '), col_type: 'text_icon', url: 'hiker://empty' });
                            for (var spi = 0; spi < Math.min(sampleEps.length, 3); spi++) {
                                d.push({ title: '📺 ' + sampleEps[spi], col_type: 'text_2', url: 'hiker://empty' });
                            }
                            putMyVar('ep_selector', epSels[esi]);
                            putMyVar('ep_count', String(epNodes.length));
                            foundEps = true;
                            break;
                        }
                    }
                } catch(e) {}
            }
            if (!foundEps) d.push({ title: '选集: 未找到', desc: '❌', col_type: 'text_1', url: 'hiker://empty' });

        } catch(e) {
            d.push({ title: '❌ 二级页面分析失败', desc: String(e), col_type: 'text_1', url: 'hiker://empty' });
        }
    } else {
        d.push({ col_type: 'line' });
        d.push({ title: '❌ 未找到详情页链接', col_type: 'text_center_1' });
    }

    putMyVar('step', 'done');
}

// 重新分析按钮
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