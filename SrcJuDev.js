let d = [];
let tools = {
    request: function(url, options) {
        options = options || {};
        options.headers = Object.assign({}, {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
        }, options.headers || {});
        return fetch(url, options);
    },
    getHost: function(url) {
        let m = url.match(/^(https?:\/\/[^\/]+)/);
        return m ? m[1] : '';
    },
    fullUrl: function(baseUrl, relativeUrl) {
        if (!relativeUrl) return '';
        if (relativeUrl.indexOf('http') === 0) return relativeUrl;
        let host = this.getHost(baseUrl);
        if (relativeUrl.indexOf('/') === 0) return host + relativeUrl;
        let base = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
        return base + relativeUrl;
    },
    // 安全提取选择器结果
    safeExtract: function(html, selector, extractType) {
        try {
            if (extractType === 'text') {
                return pdfh(html, selector + '&&Text') || '';
            } else if (extractType === 'attr') {
                return pd(html, selector) || '';
            } else if (extractType === 'list') {
                return pdfa(html, selector);
            }
        } catch(e) {}
        return extractType === 'list' ? [] : '';
    },
    // 测试选择器并返回结果
    testSelector: function(html, selector, type) {
        type = type || 'text';
        let result = '';
        if (type === 'list') {
            let items = this.safeExtract(html, selector, 'list');
            return items.length > 0 ? '✅ 匹配 ' + items.length + ' 项' : '❌ 无匹配';
        } else if (type === 'text') {
            result = this.safeExtract(html, selector, 'text');
        } else if (type === 'attr') {
            result = this.safeExtract(html, selector, 'attr');
        }
        return result ? '✅ ' + result.substring(0, 40) + (result.length > 40 ? '...' : '') : '❌ 无匹配';
    }
};

// ============ 输入区 ============
d.push({
    title: '🔗 输入网站Url',
    desc: '输入目标网站的完整地址(https://开头)',
    url: $.toString(() => {
        input = input.trim();
        if(!input){
            return 'toast://网址不能为空';
        }
        if(!/^https?:\/\//.test(input)){
            return 'toast://请输入完整网址(https://开头)';
        }
        putMyVar('site_url', input);
        putMyVar('step', 'analyze');
        refreshPage();
        return 'hiker://empty';
    }),
    col_type: 'input',
    extra: {
        defaultValue: getMyVar('site_url', 'https://'),
        hint: 'https://www.example.com'
    }
});

let step = getMyVar('step', '');
let siteUrl = getMyVar('site_url', '');

if (step === 'analyze' && siteUrl) {
    let resultSections = [];
    
    try {
        let host = tools.getHost(siteUrl);
        let html = tools.request(siteUrl);
        
        if (!html || html.length < 100) {
            d.push({ col_type: 'line' });
            d.push({ title: '❌ 请求失败，请检查网站是否可以访问', col_type: 'text_center_1' });
            putMyVar('step', '');
            setResult(d);
            return;
        }
        
        // ============ 一、分类导航 ============
        let catSection = {
            title: '📂 分类导航',
            items: [],
            selectors: []
        };
        
        let catSelectors = [
            '.nav-item a', 
            '.nav_menu li a', 
            '.navbar-nav li a',
            '.header-nav a', 
            '.menu-item a', 
            '.nav a',
            '.module-tab-item a', 
            '.stui-header__menu li a',
            '.myui-header__menu li a',
            '[class*="nav"] a', 
            '[class*="menu"] a'
        ];
        
        for (let si = 0; si < catSelectors.length; si++) {
            let items = tools.safeExtract(html, catSelectors[si], 'list');
            if (items.length >= 2 && items.length <= 50) {
                let validItems = [];
                for (let ii = 0; ii < Math.min(items.length, 8); ii++) {
                    let title = tools.safeExtract(items[ii], 'self', 'text') || pdfh(items[ii], 'Text') || '';
                    let href = tools.safeExtract(items[ii], 'self&&href', 'attr') || pd(items[ii], 'a&&href') || '';
                    if (title && title.trim() && title.trim().length < 20) {
                        validItems.push({
                            title: title.trim(),
                            url: tools.fullUrl(siteUrl, href)
                        });
                    }
                }
                if (validItems.length >= 2) {
                    catSection.selectors.push({
                        selector: catSelectors[si],
                        type: '链接提取: self&&Text + self&&href',
                        result: '匹配 ' + items.length + ' 项，有效 ' + validItems.length + ' 项'
                    });
                    catSection.items = validItems;
                    break;
                }
            }
        }
        resultSections.push(catSection);
        
        // ============ 二、一级列表 ============
        let listSection = {
            title: '🎬 一级列表',
            items: [],
            selectors: []
        };
        
        let itemSelectors = [
            '.module-item', 
            '.stui-vodlist__thumb', 
            '.video-item',
            '.movie-item', 
            '.myui-vodlist__thumb', 
            '.fed-list-item',
            '.vodlist_item', 
            '.public-list-box .thumb', 
            '.col-lg-2',
            'li[class*="item"]', 
            '[class*="list"] li', 
            '.card'
        ];
        
        for (let si = 0; si < itemSelectors.length; si++) {
            let items = tools.safeExtract(html, itemSelectors[si], 'list');
            if (items.length >= 4 && items.length <= 100) {
                let sampleItems = [];
                for (let ii = 0; ii < Math.min(items.length, 3); ii++) {
                    let it = items[ii];
                    let titleSelectors = ['a&&title', 'img&&alt', '.title&&Text', 'h4&&Text', 'h3&&Text', '.name&&Text', 'a&&Text'];
                    let title = '';
                    for (let tsi = 0; tsi < titleSelectors.length; tsi++) {
                        title = tools.safeExtract(it, titleSelectors[tsi], 'text');
                        if (title && title.length > 1) break;
                    }
                    let img = tools.safeExtract(it, 'img&&data-original', 'attr') || tools.safeExtract(it, 'img&&data-src', 'attr') || tools.safeExtract(it, 'img&&src', 'attr') || '';
                    let link = tools.safeExtract(it, 'a&&href', 'attr') || pd(it, 'a&&href') || '';
                    if (link) link = tools.fullUrl(siteUrl, link);
                    
                    if (title) {
                        sampleItems.push({ title: title.trim(), img: img, link: link });
                    }
                }
                
                if (sampleItems.length >= 2) {
                    // 测试各选择器
                    let testItem = items[0];
                    listSection.selectors.push({
                        selector: itemSelectors[si],
                        type: '列表容器',
                        result: '匹配 ' + items.length + ' 项'
                    });
                    listSection.selectors.push({
                        selector: 'a&&title (标题)',
                        type: '选择器',
                        result: tools.testSelector(testItem, 'a&&title', 'text')
                    });
                    listSection.selectors.push({
                        selector: 'img&&data-src (图片)',
                        type: '选择器',
                        result: tools.testSelector(testItem, 'img&&data-src', 'attr')
                    });
                    listSection.selectors.push({
                        selector: 'img&&data-original (图片)',
                        type: '选择器',
                        result: tools.testSelector(testItem, 'img&&data-original', 'attr')
                    });
                    listSection.selectors.push({
                        selector: 'a&&href (链接)',
                        type: '选择器',
                        result: tools.testSelector(testItem, 'a&&href', 'attr')
                    });
                    listSection.items = sampleItems;
                    break;
                }
            }
        }
        resultSections.push(listSection);
        
        // ============ 三、二级页面 ============
        let firstDetailUrl = '';
        if (listSection.items.length > 0) {
            firstDetailUrl = listSection.items[0].link;
        }
        
        // 兜底：从页面提取第一个详情链接
        if (!firstDetailUrl) {
            try {
                let links = pdfa(html, 'a[href]');
                for (let li = 0; li < links.length; li++) {
                    let href = pd(links[li], 'a&&href') || '';
                    if (href && (href.indexOf('detail') > -1 || href.indexOf('/vod/') > -1)) {
                        firstDetailUrl = tools.fullUrl(siteUrl, href);
                        break;
                    }
                }
            } catch(e) {}
        }
        
        if (firstDetailUrl) {
            try {
                let detailHtml = tools.request(firstDetailUrl);
                
                // --- 3.1 封面 ---
                let coverSection = {
                    title: '🖼️ 二级封面',
                    selectors: []
                };
                
                let coverSelectors = [
                    '.module-item-pic&&img&&src',
                    '.vod-pic&&img&&src', 
                    '.detail-pic&&img&&src',
                    '.stui-content__thumb&&img&&data-original',
                    '.myui-content__thumb&&img&&src',
                    'img.cover&&src',
                    '.movie-pic&&img&&src'
                ];
                
                for (let csi = 0; csi < coverSelectors.length; csi++) {
                    let result = tools.testSelector(detailHtml, coverSelectors[csi], 'attr');
                    coverSection.selectors.push({ selector: coverSelectors[csi], type: 'attr', result: result });
                    if (result.indexOf('✅') === 0) break;
                }
                resultSections.push(coverSection);
                
                // --- 3.2 标题 ---
                let titleSection = {
                    title: '📝 二级标题/简介',
                    selectors: []
                };
                
                let titleSelectors = ['h1&&Text', '.page-title&&Text', '.title&&Text', '.movie-title&&Text', '.vod-title&&Text'];
                for (let tsi = 0; tsi < titleSelectors.length; tsi++) {
                    let result = tools.testSelector(detailHtml, titleSelectors[tsi], 'text');
                    titleSection.selectors.push({ selector: titleSelectors[tsi], type: 'text', result: result });
                }
                resultSections.push(titleSection);
                
                // --- 3.3 线路 ---
                let tabSection = {
                    title: '📺 播放线路',
                    items: [],
                    selectors: []
                };
                
                let tabSelectors = [
                    '.module-tab-item span',
                    '.module-tab-item',
                    '.nav-tabs li a',
                    '.play_source_tab a',
                    '.play-souce a',
                    '.stui-pannel__head .tab',
                    '.myui-panel__hd .nav-item'
                ];
                
                for (let tsi = 0; tsi < tabSelectors.length; tsi++) {
                    let tabNodes = tools.safeExtract(detailHtml, tabSelectors[tsi], 'list');
                    if (tabNodes.length > 0 && tabNodes.length <= 20) {
                        let tabs = [];
                        for (let ti = 0; ti < tabNodes.length; ti++) {
                            let name = tools.safeExtract(tabNodes[ti], 'self', 'text') || pdfh(tabNodes[ti], 'Text') || '';
                            if (name && name.trim()) tabs.push(name.trim());
                        }
                        if (tabs.length > 0) {
                            tabSection.selectors.push({
                                selector: tabSelectors[tsi],
                                type: 'text',
                                result: '匹配 ' + tabs.length + ' 条: ' + tabs.join(', ')
                            });
                            tabSection.items = tabs.map(function(t) { return { title: t }; });
                            break;
                        }
                    }
                }
                resultSections.push(tabSection);
                
                // --- 3.4 选集 ---
                let episodeSection = {
                    title: '📋 选集列表',
                    items: [],
                    selectors: []
                };
                
                let epSelectors = [
                    '.module-play-list-link a',
                    '.module-play-list-link',
                    '.play_list li a',
                    '.play_list li',
                    '.stui-content__playlist li a',
                    '.myui-content__list li a',
                    '.episode-list a',
                    '[class*="play"] li a',
                    '[class*="episode"] a'
                ];
                
                for (let esi = 0; esi < epSelectors.length; esi++) {
                    let epNodes = tools.safeExtract(detailHtml, epSelectors[esi], 'list');
                    if (epNodes.length > 0 && epNodes.length <= 1000) {
                        // 尝试提取 title 和 href
                        let validEps = 0;
                        for (let ei = 0; ei < Math.min(epNodes.length, 5); ei++) {
                            let epTitle = tools.safeExtract(epNodes[ei], 'self', 'text') || pdfh(epNodes[ei], 'Text') || '';
                            let epHref = tools.safeExtract(epNodes[ei], 'self&&href', 'attr') || pd(epNodes[ei], 'a&&href') || '';
                            if (epTitle && epTitle.trim()) {
                                validEps++;
                                episodeSection.items.push({
                                    title: epTitle.trim(),
                                    url: tools.fullUrl(firstDetailUrl, epHref)
                                });
                            }
                        }
                        if (validEps >= 2) {
                            episodeSection.selectors.push({
                                selector: epSelectors[esi],
                                type: '文本+链接',
                                result: '匹配 ' + epNodes.length + ' 项，有效 ' + validEps + ' 项'
                            });
                            break;
                        }
                    }
                }
                resultSections.push(episodeSection);
                
            } catch(e) {
                resultSections.push({
                    title: '❌ 二级页面',
                    selectors: [{ selector: '请求失败', type: '', result: e.toString() }]
                });
            }
        } else {
            resultSections.push({
                title: '❌ 未找到详情链接',
                selectors: [{ selector: '跳转失败', type: '', result: '无法自动进入二级页面' }]
            });
        }
        
        // ============ 渲染所有结果 ============
        for (let ri = 0; ri < resultSections.length; ri++) {
            let section = resultSections[ri];
            d.push({ col_type: 'line_blank' });
            d.push({
                title: section.title,
                col_type: 'text_center_1',
                extra: { textSize: 18, isBold: true }
            });
            d.push({ col_type: 'line' });
            
            // 显示选择器测试结果
            if (section.selectors && section.selectors.length > 0) {
                for (let si = 0; si < section.selectors.length; si++) {
                    let sel = section.selectors[si];
                    d.push({
                        title: sel.selector,
                        desc: sel.result,
                        col_type: 'text_icon',
                        url: 'hiker://empty'
                    });
                }
            }
            
            // 显示提取的样例数据
            if (section.items && section.items.length > 0) {
                d.push({ col_type: 'blank_block' });
                let showItems = Math.min(section.items.length, 3);
                for (let ii = 0; ii < showItems; ii++) {
                    let item = section.items[ii];
                    d.push({
                        title: item.title || '(无标题)',
                        desc: item.url || '',
                        img: item.img || '',
                        url: item.url || 'hiker://empty',
                        col_type: 'movie_1_left_pic'
                    });
                }
            }
        }
        
        putMyVar('step', 'done');
        
    } catch(e) {
        d.push({ col_type: 'line' });
        d.push({ title: '❌ 分析失败: ' + e, col_type: 'text_1' });
        putMyVar('step', '');
    }
}

// 重新分析按钮
if (getMyVar('step', '') === 'done') {
    d.push({ col_type: 'line_blank' });
    d.push({
        title: '🔄 重新分析',
        desc: '输入新网址重新开始',
        url: $('#noLoading#').lazyRule(() => {
            putMyVar('step', '');
            putMyVar('site_url', '');
            refreshPage();
            return 'hiker://empty';
        }),
        col_type: 'text_center_1'
    });
}

setResult(d);