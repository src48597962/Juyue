let d = [];
let tools = {
    request: function(url, options) {
        options = options || {};
        options.headers = options.headers || {};
        if (!options.headers['User-Agent']) {
            options.headers['User-Agent'] = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
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
    d.push({
        title: '⏳ 正在分析: ' + siteUrl,
        col_type: 'text_center_1'
    });
    
    try {
        var host = tools.getHost(siteUrl);
        var html = tools.request(siteUrl);
        
        if (!html || html.length < 100) {
            d.push({ title: '❌ 请求失败，请检查网站是否可以访问', col_type: 'text_center_1' });
            putMyVar('step', '');
            setResult(d);
            return;
        }
        
        // ============ 一、分类导航 ============
        d.push({ col_type: 'line' });
        d.push({
            title: '📂 一、分类导航',
            col_type: 'text_center_1',
            extra: { textSize: 18, isBold: true }
        });
        d.push({ col_type: 'line' });
        
        var categories = [];
        var catSelector = '';
        var catSelectors = [
            '.nav-item a',
            '.nav_menu li a',
            '.navbar-nav li a',
            '.header-nav a',
            '.menu-item a',
            '.nav a',
            '.module-tab-item a',
            '.stui-header__menu li a',
            '.myui-header__menu li a'
        ];
        
        for (var si = 0; si < catSelectors.length; si++) {
            try {
                var items = pdfa(html, catSelectors[si]);
                if (items.length >= 2 && items.length <= 50) {
                    for (var ii = 0; ii < Math.min(items.length, 8); ii++) {
                        var title = '';
                        var href = '';
                        try { title = pdfh(items[ii], 'Text') || ''; } catch(e) {}
                        try { href = pd(items[ii], 'a&&href') || ''; } catch(e) {}
                        if (title && title.trim() && title.trim().length < 20) {
                            categories.push({
                                title: title.trim(),
                                url: tools.fullUrl(siteUrl, href)
                            });
                        }
                    }
                    if (categories.length >= 2) {
                        catSelector = catSelectors[si];
                        break;
                    }
                }
            } catch(e) {}
        }
        
        if (categories.length > 0) {
            d.push({
                title: '定位: ' + catSelector,
                desc: '✅ 发现 ' + categories.length + ' 个分类',
                col_type: 'text_icon',
                url: 'hiker://empty'
            });
            for (var ci = 0; ci < categories.length; ci++) {
                d.push({
                    title: categories[ci].title,
                    desc: categories[ci].url,
                    col_type: 'text_icon',
                    url: 'hiker://empty'
                });
            }
        } else {
            d.push({ title: '定位: 未找到', desc: '❌ 未发现分类导航', col_type: 'text_1', url: 'hiker://empty' });
        }
        
        // ============ 二、一级列表 ============
        d.push({ col_type: 'line' });
        d.push({
            title: '🎬 二、一级列表(首页)',
            col_type: 'text_center_1',
            extra: { textSize: 18, isBold: true }
        });
        d.push({ col_type: 'line' });
        
        var listItems = [];
        var listContainerSelector = '';
        var titleSelector = '';
        var imgSelector = '';
        var linkSelector = '';
        
        var itemSelectors = [
            '.module-item',
            '.stui-vodlist__thumb',
            '.video-item',
            '.movie-item',
            '.myui-vodlist__thumb',
            '.fed-list-item',
            '.vodlist_item',
            '.public-list-box .thumb',
            '.col-lg-2'
        ];
        
        for (var lsi = 0; lsi < itemSelectors.length; lsi++) {
            try {
                var items = pdfa(html, itemSelectors[lsi]);
                if (items.length >= 5 && items.length <= 100) {
                    listContainerSelector = itemSelectors[lsi];
                    var testItem = items[0];
                    
                    // 测试标题选择器
                    var titleSelectors = ['a&&title', 'img&&alt', '.title&&Text', 'h4&&Text', 'h3&&Text', '.name&&Text'];
                    for (var tsi = 0; tsi < titleSelectors.length; tsi++) {
                        try {
                            var t = pdfh(testItem, titleSelectors[tsi]);
                            if (t && t.length > 1 && t.length < 100) {
                                titleSelector = titleSelectors[tsi];
                                break;
                            }
                        } catch(e) {}
                    }
                    
                    // 测试图片选择器
                    try {
                        var img = pd(testItem, 'img&&data-original');
                        if (img && img.indexOf('http') === 0) { imgSelector = 'img&&data-original'; }
                    } catch(e) {}
                    if (!imgSelector) {
                        try {
                            var img = pd(testItem, 'img&&data-src');
                            if (img && img.indexOf('http') === 0) { imgSelector = 'img&&data-src'; }
                        } catch(e) {}
                    }
                    if (!imgSelector) {
                        try {
                            var img = pd(testItem, 'img&&src');
                            if (img && img.indexOf('http') === 0) { imgSelector = 'img&&src'; }
                        } catch(e) {}
                    }
                    
                    // 链接选择器
                    try {
                        var l = pd(testItem, 'a&&href');
                        if (l) { linkSelector = 'a&&href'; }
                    } catch(e) {}
                    
                    if (titleSelector && imgSelector && linkSelector) {
                        for (var ii = 0; ii < Math.min(items.length, 3); ii++) {
                            var it = items[ii];
                            var _title = '';
                            var _img = '';
                            var _link = '';
                            try { _title = pdfh(it, titleSelector) || ''; } catch(e) {}
                            try { _img = pd(it, imgSelector) || ''; } catch(e) {}
                            try { _link = pd(it, 'a&&href') || ''; } catch(e) {}
                            if (_title) {
                                listItems.push({
                                    title: _title,
                                    img: _img,
                                    url: tools.fullUrl(siteUrl, _link)
                                });
                            }
                        }
                        break;
                    }
                }
            } catch(e) {}
        }
        
        if (listItems.length > 0) {
            d.push({
                title: '列表容器: ' + listContainerSelector,
                desc: '✅ 发现列表 (共匹配)',
                col_type: 'text_icon',
                url: 'hiker://empty'
            });
            d.push({
                title: '标题选择器: ' + titleSelector,
                desc: '✅ 有效',
                col_type: 'text_icon',
                url: 'hiker://empty'
            });
            d.push({
                title: '图片选择器: ' + imgSelector,
                desc: '✅ 有效',
                col_type: 'text_icon',
                url: 'hiker://empty'
            });
            d.push({
                title: '链接选择器: ' + linkSelector,
                desc: '✅ 有效',
                col_type: 'text_icon',
                url: 'hiker://empty'
            });
            
            d.push({ col_type: 'blank_block' });
            d.push({ title: '预览:', col_type: 'text_1', url: 'hiker://empty', extra: { isBold: true } });
            for (var li = 0; li < listItems.length; li++) {
                d.push({
                    title: listItems[li].title,
                    img: listItems[li].img,
                    desc: listItems[li].url,
                    url: listItems[li].url,
                    col_type: 'movie_1_left_pic'
                });
            }
        } else {
            d.push({ title: '定位: 未找到', desc: '❌ 未发现列表容器', col_type: 'text_1', url: 'hiker://empty' });
        }
        
        // ============ 三、二级页面(封面+标题+线路+选集) ============
        var firstDetailUrl = '';
        if (listItems.length > 0 && listItems[0].url) {
            firstDetailUrl = listItems[0].url;
        }
        
        if (firstDetailUrl) {
            d.push({ col_type: 'line' });
            d.push({
                title: '🔍 三、二级页面分析',
                desc: '目标: ' + firstDetailUrl,
                col_type: 'text_center_1',
                extra: { textSize: 18, isBold: true }
            });
            d.push({ col_type: 'line' });
            
            try {
                var detailHtml = tools.request(firstDetailUrl);
                
                // 3.1 封面
                d.push({
                    title: '🖼️ 封面定位',
                    col_type: 'text_icon',
                    url: 'hiker://empty',
                    extra: { isBold: true, lineVisible: false }
                });
                
                var coverSelectors = [
                    '.module-item-pic&&img&&src',
                    '.vod-pic&&img&&src',
                    '.detail-pic&&img&&src',
                    '.stui-content__thumb&&img&&data-original',
                    '.myui-content__thumb&&img&&src',
                    'img.cover&&src'
                ];
                var foundCover = false;
                for (var csi = 0; csi < coverSelectors.length; csi++) {
                    try {
                        var coverUrl = pd(detailHtml, coverSelectors[csi]);
                        if (coverUrl && coverUrl.indexOf('http') === 0) {
                            d.push({
                                title: '封面选择器: ' + coverSelectors[csi],
                                desc: '✅ 有效',
                                img: coverUrl,
                                col_type: 'movie_1_left_pic',
                                url: coverUrl
                            });
                            foundCover = true;
                            break;
                        }
                    } catch(e) {}
                }
                if (!foundCover) {
                    d.push({ title: '封面: 未找到', desc: '❌', col_type: 'text_1', url: 'hiker://empty' });
                }
                
                // 3.2 标题
                d.push({
                    title: '📝 标题定位',
                    col_type: 'text_icon',
                    url: 'hiker://empty',
                    extra: { isBold: true, lineVisible: false }
                });
                
                var titleSelectors2 = ['h1&&Text', '.page-title&&Text', '.title&&Text', '.movie-title&&Text', '.vod-title&&Text'];
                var foundTitle = false;
                for (var tsi2 = 0; tsi2 < titleSelectors2.length; tsi2++) {
                    try {
                        var detailTitle = pdfh(detailHtml, titleSelectors2[tsi2]);
                        if (detailTitle && detailTitle.length > 1 && detailTitle.length < 100) {
                            d.push({
                                title: '标题选择器: ' + titleSelectors2[tsi2],
                                desc: '✅ ' + detailTitle,
                                col_type: 'text_icon',
                                url: 'hiker://empty'
                            });
                            foundTitle = true;
                            break;
                        }
                    } catch(e) {}
                }
                if (!foundTitle) {
                    d.push({ title: '标题: 未找到', desc: '❌', col_type: 'text_1', url: 'hiker://empty' });
                }
                
                // 3.3 线路
                d.push({
                    title: '📺 线路定位',
                    col_type: 'text_icon',
                    url: 'hiker://empty',
                    extra: { isBold: true, lineVisible: false }
                });
                
                var tabSelectors = [
                    '.module-tab-item span',
                    '.module-tab-item',
                    '.nav-tabs li a',
                    '.play_source_tab a',
                    '.stui-pannel__head .tab'
                ];
                var foundTabs = false;
                for (var tsi3 = 0; tsi3 < tabSelectors.length; tsi3++) {
                    try {
                        var tabNodes = pdfa(detailHtml, tabSelectors[tsi3]);
                        if (tabNodes.length > 0 && tabNodes.length <= 20) {
                            var tabNames = [];
                            for (var tni = 0; tni < tabNodes.length; tni++) {
                                var tn = '';
                                try { tn = pdfh(tabNodes[tni], 'Text') || ''; } catch(e) {}
                                if (tn && tn.trim()) tabNames.push(tn.trim());
                            }
                            if (tabNames.length > 0) {
                                d.push({
                                    title: '线路选择器: ' + tabSelectors[tsi3],
                                    desc: '✅ 发现 ' + tabNames.length + ' 条: ' + tabNames.join(', '),
                                    col_type: 'text_icon',
                                    url: 'hiker://empty'
                                });
                                foundTabs = true;
                                break;
                            }
                        }
                    } catch(e) {}
                }
                if (!foundTabs) {
                    d.push({ title: '线路: 未找到', desc: '❌ (单线路)', col_type: 'text_1', url: 'hiker://empty' });
                }
                
                // 3.4 选集
                d.push({
                    title: '📋 选集定位',
                    col_type: 'text_icon',
                    url: 'hiker://empty',
                    extra: { isBold: true, lineVisible: false }
                });
                
                var epSelectors = [
                    '.module-play-list-link a',
                    '.module-play-list-link',
                    '.play_list li a',
                    '.stui-content__playlist li a',
                    '.myui-content__list li a',
                    '[class*="play"] li a',
                    '[class*="episode"] a'
                ];
                var foundEps = false;
                for (var esi = 0; esi < epSelectors.length; esi++) {
                    try {
                        var epNodes = pdfa(detailHtml, epSelectors[esi]);
                        if (epNodes.length > 0 && epNodes.length <= 1000) {
                            var sampleEps = [];
                            for (var ei = 0; ei < Math.min(epNodes.length, 5); ei++) {
                                var et = '';
                                try { et = pdfh(epNodes[ei], 'Text') || ''; } catch(e) {}
                                if (et && et.trim()) {
                                    sampleEps.push(et.trim());
                                }
                            }
                            if (sampleEps.length >= 2) {
                                d.push({
                                    title: '选集选择器: ' + epSelectors[esi],
                                    desc: '✅ 发现 ' + epNodes.length + ' 集，预览: ' + sampleEps.join(', '),
                                    col_type: 'text_icon',
                                    url: 'hiker://empty'
                                });
                                
                                // 显示前几集预览
                                for (var spi = 0; spi < Math.min(sampleEps.length, 3); spi++) {
                                    d.push({
                                        title: '📺 ' + sampleEps[spi],
                                        col_type: 'text_2',
                                        url: 'hiker://empty'
                                    });
                                }
                                foundEps = true;
                                break;
                            }
                        }
                    } catch(e) {}
                }
                if (!foundEps) {
                    d.push({ title: '选集: 未找到', desc: '❌', col_type: 'text_1', url: 'hiker://empty' });
                }
                
            } catch(e) {
                d.push({ title: '❌ 二级页面分析失败', desc: String(e), col_type: 'text_1', url: 'hiker://empty' });
            }
        } else {
            d.push({ col_type: 'line' });
            d.push({ title: '❌ 未找到详情页链接', col_type: 'text_center_1' });
        }
        
        putMyVar('step', 'done');
        
    } catch(e) {
        d.push({ col_type: 'line' });
        d.push({ title: '❌ 分析失败: ' + String(e), col_type: 'text_1', url: 'hiker://empty' });
        putMyVar('step', '');
    }
}

// 重新分析按钮
if (getMyVar('step', '') === 'done') {
    d.push({ col_type: 'line_blank' });
    d.push({
        title: '🔄 重新分析',
        desc: '输入新网址重新开始',
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