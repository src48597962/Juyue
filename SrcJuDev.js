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

    function findElByClass(html, classKeyword) {
        let re = new RegExp('<(\\w+)[^>]*class=["\'][^"\']*' + classKeyword + '[^"\']*["\'][^>]*>', 'gi');
        let m = re.exec(html);
        if (!m) return null;
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
                    return { html: html.substring(start, nextClose + closeTag.length), cls: m[0], pos: start };
                }
                pos = nextClose + 1;
            }
        }
        return null;
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

    function detectChildSelector(elHtml) {
        if (/<li[\s>]/i.test(elHtml)) return 'li';
        if (/<dd[\s>]/i.test(elHtml)) return 'dd';
        return 'a';
    }

    let allowNavKWs = ['电影', '电视剧', '剧集', '综艺', '动漫', '短剧'];
    let sortKWs = ['最新', '最热', '热门', '热播', '推荐', '评分', '人气', '时间', '更新'];

    // ========== 1. 大分类 ==========
    let navEl = findElByClass(html, 'fed-navs-left') || findElByClass(html, 'hl-nav') || findElByClass(html, 'stui-header__menu');
    
    if (!navEl) {
        let candidates = [];
        let allEls = findAllByClass(html, 'nav');
        for (let i = 0; i < allEls.length; i++) {
            let el = allEls[i];
            let links = extractLinks(el.html);
            if (links.length < 2 || links.length > 30) continue;
            let matchCount = 0;
            for (let li = 0; li < links.length; li++) {
                if (hasKW(links[li].text, allowNavKWs)) matchCount++;
            }
            if (matchCount >= 2) {
                candidates.push({ el: el, score: matchCount });
            }
        }
        if (candidates.length > 0) {
            candidates.sort(function(a, b) { return b.score - a.score; });
            navEl = candidates[0].el;
        }
    }

    if (navEl) {
        let navSelector = '.' + firstClass(navEl.cls);
        let navChild = detectChildSelector(navEl.html);
        let navLinks = extractLinks(navEl.html);
        let excludeTexts = [];
        for (let i = 0; i < navLinks.length; i++) {
            if (!hasKW(navLinks[i].text, allowNavKWs)) {
                excludeTexts.push(navLinks[i].text);
            }
        }
        let navSub = 'body&&' + navChild;
        if (excludeTexts.length > 0) {
            navSub += ':not(:matches(' + excludeTexts.join('|') + '))';
        }
        result.push({ 一级分类: 'body&&' + navSelector, 子分类: navSub });
    } else {
        result.push({ 一级分类: 'body&&.fed-navs-left', 子分类: 'body&&a' });
    }

    // ========== 2. 小分类 - 直接遍历所有 dl 并返回合并后的选择器 ==========
    let allDLs = findAllByClass(html, 'fed-scre-list');
    if (allDLs.length > 0) {
        let dlSelector = '';
        let innerDLs = findAllByClass(allDLs[0].html, 'dl');
        
        if (innerDLs.length > 0) {
            // 有多个 dl，分别定位每个
            let selectors = [];
            for (let i = 0; i < innerDLs.length; i++) {
                let dlClass = firstClass(innerDLs[i].cls);
                if (dlClass) {
                    selectors.push('body&&.' + dlClass);
                } else {
                    selectors.push('body&&dl:eq(' + i + ')');
                }
            }
            dlSelector = selectors.join(' || ');
            result.push({ 一级分类: dlSelector, 子分类: 'body&&dd:has(a)' });
        } else {
            // 单个 dl
            let containerClass = firstClass(allDLs[0].cls);
            result.push({ 一级分类: 'body&&.' + containerClass, 子分类: 'body&&dd:has(a)' });
        }
    } else {
        result.push({ 一级分类: 'body&&.fed-scre-list dl', 子分类: 'body&&dd:has(a)' });
    }

    // ========== 3. 排序选项 ==========
    let sortEl = findElByClass(html, 'fed-list-head');
    if (!sortEl) {
        let allTabs = findAllByClass(html, 'tabs');
        for (let i = 0; i < allTabs.length; i++) {
            let links = extractLinks(allTabs[i].html);
            let matchCount = 0;
            for (let j = 0; j < links.length; j++) {
                if (hasKW(links[j].text, sortKWs)) matchCount++;
            }
            if (matchCount >= 2) {
                sortEl = allTabs[i];
                break;
            }
        }
    }
    
    if (sortEl) {
        let selector = '.' + firstClass(sortEl.cls);
        result.push({ 一级分类: 'body&&' + selector, 子分类: 'body&&a' });
    } else {
        result.push({ 一级分类: 'body&&.fed-list-head', 子分类: 'body&&a' });
    }

    return result;
}





if(html){
    // 使用
    let 定位列表 = autoGenerateLocationList(html);
    log(JSON.stringify(定位列表, null, 2));

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
    定位列表 = [
        {
            "一级分类": "body&&.fed-navs-left",
            "子分类": "body&&a:not(:matches(首页|导航))"
        },
        {
            "一级分类": "body&&.fed-scre-list",
            "子分类": "body&&dd:has(a)"
        },
        {
            "一级分类": "body&&.fed-list-head",
            "子分类": "body&&a"
        }
    ]

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