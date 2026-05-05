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

    function findCandidates(html, classKeywords, minLinks, scoreKeywords) {
        let candidates = [];
        for (let k = 0; k < classKeywords.length; k++) {
            let allEls = findAllByClass(html, classKeywords[k]);
            for (let i = 0; i < allEls.length; i++) {
                let el = allEls[i];
                let links = extractLinks(el.html);
                if (links.length < minLinks) continue;
                let score = 0;
                for (let j = 0; j < links.length; j++) {
                    if (hasKW(links[j].text, scoreKeywords)) score++;
                }
                if (score > 0) {
                    candidates.push({ el: el, score: score, links: links });
                }
            }
        }
        if (candidates.length > 0) {
            candidates.sort(function(a, b) { return b.score - a.score; });
            return candidates[0];
        }
        return null;
    }

    function getExcludeTexts(links, whiteList) {
        let exclude = [];
        for (let i = 0; i < links.length; i++) {
            if (!hasKW(links[i].text, whiteList)) {
                exclude.push(links[i].text);
            }
        }
        return exclude;
    }

    function buildSelector(cls, childType) {
        if (cls) return 'body&&.' + cls;
        return 'body&&' + childType;
    }

    // ========== 白名单配置 ==========
    let navWhiteList = ['电影', '电视剧', '剧集', '综艺', '动漫', '动画', '短剧', '影片', '连续剧', '纪录片', '国产剧', '港剧', '韩剧', '美剧', '日剧', '泰剧', '海外剧', '台剧'];
    let filterWhiteList = ['地区', '年代', '年份', '类型', '剧情', '分类', '语言', '状态', '排序', '字母', '首字母', '全部', '不限', '所有'];
    let sortWhiteList = ['最新', '最热', '热门', '热播', '推荐', '评分', '人气', '票房', '时间', '更新', '排行', '高分', '好评'];
    
    let navClassKeywords = ['nav', 'menu', 'header', 'top', 'navbar', 'pannel', 'list'];
    let filterClassKeywords = ['filter', 'screen', 'scre', 'select', 'type', 'category', 'classify', 'tag'];
    let sortClassKeywords = ['sort', 'order', 'tabs', 'head', 'title', 'rb'];

    // ========== 1. 大分类 ==========
    let navCandidate = findCandidates(html, navClassKeywords, 2, navWhiteList);
    if (navCandidate) {
        let cls = firstClass(navCandidate.el.cls);
        let childType = 'li';
        if (!/<li[\s>]/i.test(navCandidate.el.html)) childType = 'a';
        let excludeTexts = getExcludeTexts(navCandidate.links, navWhiteList);
        let subSelector = 'body&&' + childType;
        if (excludeTexts.length > 0) {
            subSelector += ':not(:matches(' + excludeTexts.join('|') + '))';
        }
        result.push({ 一级分类: buildSelector(cls, childType), 子分类: subSelector });
    } else {
        result.push({ 一级分类: 'body&&.nav', 子分类: 'body&&li:has(a[href*="type"])' });
    }

    // ========== 2. 小分类 ==========
    let filterCandidate = findCandidates(html, filterClassKeywords, 3, filterWhiteList);
    if (filterCandidate) {
        let cls = firstClass(filterCandidate.el.cls);
        let elHtml = filterCandidate.el.html;
        
        // 检查内部是否有多个分组（dl/ul）
        let innerGroups = [];
        let dlMatches = elHtml.match(/<dl[\s>]/gi) || [];
        let ulMatches = elHtml.match(/<ul[\s>]/gi) || [];
        
        if (dlMatches.length > 1) {
            // 多个 dl 分组，分别提取每个 dl 的 class
            let dlRe = /<dl[^>]*class=["']([^"']*)["'][^>]*>/gi;
            let dlMatch;
            while ((dlMatch = dlRe.exec(elHtml)) !== null) {
                let dlClass = dlMatch[1].split(/\s+/)[0];
                if (dlClass) innerGroups.push('body&&.' + dlClass);
            }
        } else if (ulMatches.length > 1) {
            // 多个 ul 分组
            let ulRe = /<ul[^>]*class=["']([^"']*)["'][^>]*>/gi;
            let ulMatch;
            while ((ulMatch = ulRe.exec(elHtml)) !== null) {
                let ulClass = ulMatch[1].split(/\s+/)[0];
                if (ulClass) innerGroups.push('body&&.' + ulClass);
            }
        }
        
        if (innerGroups.length > 0) {
            // 多个分组，用 || 连接
            result.push({ 一级分类: innerGroups.join(' || '), 子分类: 'body&&a:has(a)' });
        } else {
            // 单个分组
            let childType = 'li';
            if (/<dd[\s>]/i.test(elHtml)) childType = 'dd';
            else if (!/<li[\s>]/i.test(elHtml)) childType = 'a';
            result.push({ 一级分类: buildSelector(cls, childType), 子分类: 'body&&' + childType + ':has(a:not(:empty)):lt(20)' });
        }
    } else {
        result.push({ 一级分类: 'body&&.filter', 子分类: 'body&&a[href*="show"]' });
    }

    // ========== 3. 排序 ==========
    let sortCandidate = findCandidates(html, sortClassKeywords, 2, sortWhiteList);
    if (sortCandidate) {
        let cls = firstClass(sortCandidate.el.cls);
        let childType = 'a';
        result.push({ 一级分类: buildSelector(cls, childType), 子分类: 'body&&a' });
    } else {
        result.push({ 一级分类: 'body&&.sort', 子分类: 'body&&a' });
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