var d = [];

d.push({
    title: '获取分类',
    desc: '输入网站分类页Url',
    url: $.toString(function() {
        input = (input || '').trim();
        if (!input) {
            return 'toast://网址不能为空';
        }
        if (!/^http/.test(input)) {
            return 'toast://请输入完整网址(http开头)';
        }
        
        putMyVar('header.url', input);
        refreshPage(false);
        return 'hiker://empty';
    }),
    col_type: 'input',
    extra: { defaultValue: getMyVar('header.url', ''), hint: 'https://www.example.com' }
});

var 分类颜色 = getItem('主题颜色','#3399cc');
var page = MY_PAGE || 1;
var true_url = getMyVar('header.url', MY_URL);
let 链接处理工具 = require(config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'plugins/UrlProcessor.js')
true_url = 链接处理工具
    .链接(true_url)
    .页码(page)
    .获取处理结果();
MY_URL = true_url;
log('请求地址>'+MY_URL);
var html = fetch(MY_URL);

function autoGenerateLocationList(html) {
    let result = [];
    if (!html || html.length < 100) return result;

    function extractLinks(block) {
        let links = [], re = /<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, m;
        while ((m = re.exec(block)) !== null) {
            let text = m[2].replace(/<[^>]+>/g, '').trim();
            if (text) links.push({ text: text, href: m[1] });
        }
        return links;
    }

    function hasKW(text, kws) {
        for (let i = 0; i < kws.length; i++) {
            if (text.indexOf(kws[i]) > -1) return true;
        }
        return false;
    }

    function firstClass(clsStr) {
        let m = clsStr.match(/class=["']([^"']*)["']/i);
        if (!m) return '';
        let parts = m[1].trim().split(/\s+/).filter(function(c) {
            return c.length > 0 && !/^\d/.test(c) && c.length < 30;
        });
        return parts.length > 0 ? parts[0] : '';
    }

    function findAllByClass(html, classKeyword) {
        let results = [];
        let re = new RegExp('<(\\w+)[^>]*class=["\'][^"\']*' + classKeyword + '[^"\']*["\'][^>]*>', 'gi');
        let m;
        while ((m = re.exec(html)) !== null) {
            let tag = m[1].toLowerCase();
            let start = m.index;
            let innerStart = start + m[0].length;
            let closeTag = '</' + tag + '>';
            let depth = 1, pos = innerStart;
            while (depth > 0 && pos < html.length) {
                let nextOpen = html.indexOf('<' + tag + ' ', pos);
                if (nextOpen === -1) nextOpen = html.indexOf('<' + tag + '>', pos);
                let nextClose = html.indexOf(closeTag, pos);
                if (nextClose === -1) break;
                if (nextOpen !== -1 && nextOpen < nextClose) {
                    depth++; pos = nextOpen + 1;
                } else {
                    depth--;
                    if (depth === 0) {
                        results.push({ html: html.substring(start, nextClose + closeTag.length), cls: m[0], pos: start });
                        re.lastIndex = nextClose + closeTag.length;
                    }
                    pos = nextClose + 1;
                }
            }
        }
        return results;
    }

    // 白名单配置
    let navWhiteList = ['电影', '电视剧', '剧集', '综艺', '动漫', '动画', '短剧', '影片', '连续剧', '纪录片'];
    let filterLabelWhiteList = ['地区', '年代', '年份', '类型', '剧情', '分类', '语言', '状态'];
    let sortWhiteList = ['最新', '最热', '热门', '热播', '推荐', '评分', '人气', '时间', '更新', '排行'];

    // ========== 1. 大分类 ==========
    let navCandidates = [];
    let navClassKeywords = ['nav', 'menu', 'header', 'top', 'navbar'];
    
    for (let k = 0; k < navClassKeywords.length; k++) {
        let allEls = findAllByClass(html, navClassKeywords[k]);
        for (let i = 0; i < allEls.length; i++) {
            let el = allEls[i];
            let links = extractLinks(el.html);
            if (links.length < 2 || links.length > 20) continue;
            let matchCount = 0;
            for (let j = 0; j < links.length; j++) {
                if (hasKW(links[j].text, navWhiteList)) matchCount++;
            }
            if (matchCount >= 2) {
                navCandidates.push({ el: el, score: matchCount, links: links });
            }
        }
    }
    
    if (navCandidates.length > 0) {
        navCandidates.sort(function(a, b) { return b.score - a.score; });
        let best = navCandidates[0];
        let cls = firstClass(best.el.cls);
        // 排除不在白名单的项
        let excludeTexts = [];
        for (let i = 0; i < best.links.length; i++) {
            let text = best.links[i].text;
            let inWhite = false;
            for (let j = 0; j < navWhiteList.length; j++) {
                if (text.indexOf(navWhiteList[j]) > -1) {
                    inWhite = true;
                    break;
                }
            }
            if (!inWhite && text.length > 0 && text.length < 10) {
                excludeTexts.push(text);
            }
        }
        let subSelector = 'body&&a';
        if (excludeTexts.length > 0) {
            subSelector += ':not(:matches(' + excludeTexts.join('|') + '))';
        }
        result.push({ 一级分类: 'body&&.' + cls, 子分类: subSelector });
    } else {
        result.push({ 一级分类: 'body&&.nav', 子分类: 'body&&a[href*="type"]' });
    }

    // ========== 2. 小分类 - 分别获取每个筛选区块 ==========
    let filterClassKeywords = ['filter', 'screen', 'scre', 'select', 'casc', 'list', 'pannel'];
    let allFilterBlocks = [];
    
    for (let k = 0; k < filterClassKeywords.length; k++) {
        let allEls = findAllByClass(html, filterClassKeywords[k]);
        for (let i = 0; i < allEls.length; i++) {
            let el = allEls[i];
            // 查找内部的 dl 或 ul 分组
            let innerDLs = el.html.match(/<dl[\s>]/gi) || [];
            let innerULs = el.html.match(/<ul[\s>]/gi) || [];
            
            if (innerDLs.length > 1) {
                // 多个 dl，分别提取每个
                let dlRe = /<dl[^>]*class=["']([^"']*)["'][^>]*>([\s\S]*?)<\/dl>/gi;
                let dlMatch;
                while ((dlMatch = dlRe.exec(el.html)) !== null) {
                    let dlClass = dlMatch[1].split(/\s+/)[0];
                    let dlHtml = dlMatch[2];
                    // 检查是否包含筛选标签
                    let hasLabel = false;
                    for (let j = 0; j < filterLabelWhiteList.length; j++) {
                        if (dlHtml.indexOf(filterLabelWhiteList[j]) > -1) {
                            hasLabel = true;
                            break;
                        }
                    }
                    if (hasLabel && dlClass) {
                        allFilterBlocks.push({ selector: 'body&&.' + dlClass, childType: 'dd', maxItems: 12 });
                    }
                }
            } else if (innerULs.length > 1) {
                // 多个 ul
                let ulRe = /<ul[^>]*class=["']([^"']*)["'][^>]*>([\s\S]*?)<\/ul>/gi;
                let ulMatch;
                while ((ulMatch = ulRe.exec(el.html)) !== null) {
                    let ulClass = ulMatch[1].split(/\s+/)[0];
                    let ulHtml = ulMatch[2];
                    let hasLabel = false;
                    for (let j = 0; j < filterLabelWhiteList.length; j++) {
                        if (ulHtml.indexOf(filterLabelWhiteList[j]) > -1) {
                            hasLabel = true;
                            break;
                        }
                    }
                    if (hasLabel && ulClass) {
                        allFilterBlocks.push({ selector: 'body&&.' + ulClass, childType: 'li', maxItems: 12 });
                    }
                }
            } else {
                // 单个分组
                let hasLabel = false;
                for (let j = 0; j < filterLabelWhiteList.length; j++) {
                    if (el.html.indexOf(filterLabelWhiteList[j]) > -1) {
                        hasLabel = true;
                        break;
                    }
                }
                if (hasLabel) {
                    let cls = firstClass(el.cls);
                    let childType = 'li';
                    if (/<dd[\s>]/i.test(el.html)) childType = 'dd';
                    if (cls) {
                        allFilterBlocks.push({ selector: 'body&&.' + cls, childType: childType, maxItems: 12 });
                    }
                }
            }
        }
    }
    
    // 去重并添加到结果（限制12项）
    if (allFilterBlocks.length > 0) {
        let seen = {};
        for (let i = 0; i < allFilterBlocks.length; i++) {
            let block = allFilterBlocks[i];
            if (!seen[block.selector]) {
                seen[block.selector] = true;
                let subSelector = 'body&&' + block.childType + ':has(a:not(:empty))';
                if (block.maxItems) {
                    subSelector += ':lt(' + block.maxItems + ')';
                }
                result.push({
                    一级分类: block.selector,
                    子分类: subSelector
                });
            }
        }
    } else {
        result.push({ 一级分类: 'body&&.filter', 子分类: 'body&&a[href*="show"]:lt(12)' });
    }

    // ========== 3. 排序 ==========
    let sortCandidates = [];
    let sortClassKeywords = ['sort', 'order', 'tabs', 'head', 'rb'];
    
    for (let k = 0; k < sortClassKeywords.length; k++) {
        let allEls = findAllByClass(html, sortClassKeywords[k]);
        for (let i = 0; i < allEls.length; i++) {
            let el = allEls[i];
            let links = extractLinks(el.html);
            if (links.length < 2 || links.length > 10) continue;
            let matchCount = 0;
            for (let j = 0; j < links.length; j++) {
                if (hasKW(links[j].text, sortWhiteList)) matchCount++;
            }
            if (matchCount >= 2) {
                sortCandidates.push({ el: el, score: matchCount });
            }
        }
    }
    
    if (sortCandidates.length > 0) {
        sortCandidates.sort(function(a, b) { return b.score - a.score; });
        let cls = firstClass(sortCandidates[0].el.cls);
        result.push({ 一级分类: 'body&&.' + cls, 子分类: 'body&&a' });
    } else {
        result.push({ 一级分类: 'body&&.sort', 子分类: 'body&&a' });
    }

    return result;
}

if(html){
    // 使用
    //let 定位列表 = autoGenerateLocationList(html);
    //log(JSON.stringify(定位列表, null, 2));

    //log('html源码>'+html);
    /*
    var 定位列表 = [{
        一级分类: 'body&&.stui-header__menu||.hl-nav',
        子分类: 'body&&li:not(:matches(首页|资讯|专题|短视频|APP下载|音乐|留言|最新|排行))'//:gt(0)
    },{
        一级分类: 'body&&.stui-screen__list||.hl-filter-wrap:not(:matches(字母))',
        子分类: 'body&&li:has(a:not(:empty)):lt(12)'//:gt(0)
    },{
        一级分类: 'body&&.hl-rb-title',
        子分类: 'body&&a'
    }]
    */
    var 定位列表 = [{
        一级分类: 'body&&.stui-header__menu||.hl-nav',
        子分类: 'body&&li:not(:matches(首页|资讯|专题|短视频|APP下载|音乐|留言|最新|排行))'//:gt(0)
    },{
        一级分类: 'body&&.stui-screen__list||.hl-filter-wrap:not(:matches(字母))',
        子分类: 'body&&li:has(a:not(:empty)):lt(12)'//:gt(0)
    },{
        一级分类: 'body&&.hl-rb-title',
        子分类: 'body&&a'
    }]

    // '0' 为默认不折叠，'1' 为默认折叠
    let 当前折叠状态 = getMyVar('header.fold', '1')

    // 引入动态分类依赖
    // 框架已经稳定，使用 require 更佳
    let htmlCategories = require(config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'plugins/categories-header.js')
    htmlCategories.界面(d)
        .分类链接(true_url)
        .源码(html)
        .页码(page)
        .添加分类定位(定位列表)
        .开启内置折叠功能() // 必须
        .折叠按钮样式({
            title: 当前折叠状态 == "1" ? "‘‘️▼’’" : "‘‘▲’’"
        }) // 可选
        .折叠(当前折叠状态) // 必须
        .选中的分类颜色(分类颜色)
        .开始打造分类();

}


setResult(d);