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

    // ========== 工具函数 ==========
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

    // 从元素内部提取标签文本
    function extractLabelText(elHtml) {
        let m = elHtml.match(/<span[^>]*class="[^"]*text-muted[^"]*"[^>]*>([^<]*)<\/span>/i);
        if (!m) m = elHtml.match(/<dt[^>]*>([^<]*)<\/dt>/i);
        if (!m) m = elHtml.match(/<span[^>]*>([^<]*)<\/span>/i);
        return m ? m[1].trim() : '';
    }

    // 从元素前方的 HTML 中提取最近的标签文本（用于 stui 等模板，标签在兄弟元素中）
    function extractLabelFromBefore(fullHtml, elPos) {
        let before = fullHtml.substring(Math.max(0, elPos - 1000), elPos);
        let re = /<span[^>]*class="[^"]*text-muted[^"]*"[^>]*>([^<]*)<\/span>/gi;
        let lastLabel = '', m;
        while ((m = re.exec(before)) !== null) {
            lastLabel = m[1].trim();
        }
        if (!lastLabel) {
            re = /<dt[^>]*>([^<]*)<\/dt>/gi;
            while ((m = re.exec(before)) !== null) {
                lastLabel = m[1].trim();
            }
        }
        return lastLabel;
    }

    function isGenericContainer(cls) {
        let lower = cls.toLowerCase();
        return lower.indexOf('pannel') > -1 || lower.indexOf('panel') > -1 ||
               lower.indexOf('content') > -1 || lower.indexOf('wrapper') > -1 ||
               lower.indexOf('container') > -1;
    }

    // ========== 白名单 ==========
    let allowNavKWs = ['电影', '电视剧', '剧集', '综艺', '动漫', '短剧'];
    let allowFilterKWs = ['类型', '剧情', '地区', '分类', '年代', '年份', '状态'];

    let navScoreKWs = [
        '电影', '电视剧', '剧集', '连续剧', '综艺', '动漫', '动画',
        '纪录片', '短剧', '番剧', '影院', '动作片', '喜剧片', '爱情片',
        '科幻片', '恐怖片', '战争片', '国产剧', '港台剧', '日剧', '韩剧', '美剧',
        '大陆剧', '港剧', '台剧', '泰剧', '英美剧', '纪录', '教育', '漫剧', '同步课堂'
    ];
    let filterValueKWs = [
        '内地', '大陆', '中国', '香港', '台湾', '日本', '韩国', '美国',
        '欧美', '泰国', '印度', '英国', '法国', '新加坡', '马来西亚',
        '动作', '喜剧', '爱情', '科幻', '恐怖', '悬疑', '犯罪',
        '奇幻', '冒险', '古装', '武侠', '历史', '剧情', '惊悚',
        '国语', '英语', '粤语', '日语', '韩语', '普通话',
        '连载中', '已完结', '正片', '预告片', '院线', '福利', '伦理',
        '儿童', '农村', '青春', '文艺', '微电影', '网络电影', '枪战', '警匪', '运动', '经典'
    ];
    let sortKWs = [
        '最新', '最热', '热门', '热播', '推荐', '评分', '人气',
        '票房', '时间', '更新', '排行', '高分', '好评', '最近更新',
        '按最新', '按最热', '按评分', '按时间', '按热度'
    ];

    // ========== 第一步：找已知 class ==========

    let navEl = findElByClass(html, 'hl-nav') ||
                findElByClass(html, 'stui-header__menu') ||
                findElByClass(html, 'nav-list') ||
                findElByClass(html, 'hl-menus') ||
                findElByClass(html, 'type-nav');

    // 筛选
    let filterEl = null;
    let filterHasAll = false;
    let filterClassKeywords = ['filter-wrap', 'screen-item', 'filter-box', 'screen__list'];
    // 第一轮：白名单 + "全部"
    for (let k = 0; k < filterClassKeywords.length; k++) {
        let allFilters = findAllByClass(html, filterClassKeywords[k]);
        for (let i = 0; i < allFilters.length; i++) {
            let el = allFilters[i];
            let labelText = extractLabelText(el.html);
            if (!labelText) labelText = extractLabelFromBefore(html, el.pos);
            if (!hasKW(labelText, allowFilterKWs)) continue;
            let links = extractLinks(el.html);
            if (links.length > 0 && hasKW(links[0].text, ['全部', '不限', '所有'])) {
                filterEl = el; filterHasAll = true; break;
            }
        }
        if (filterEl) break;
    }
    // 第二轮：白名单，不要求"全部"
    if (!filterEl) {
        for (let k = 0; k < filterClassKeywords.length; k++) {
            let allFilters = findAllByClass(html, filterClassKeywords[k]);
            for (let i = 0; i < allFilters.length; i++) {
                let el = allFilters[i];
                let labelText = extractLabelText(el.html);
                if (!labelText) labelText = extractLabelFromBefore(html, el.pos);
                if (hasKW(labelText, allowFilterKWs)) { filterEl = el; break; }
            }
            if (filterEl) break;
        }
    }
    // 第三轮：任意 filter-wrap
    if (!filterEl) {
        for (let k = 0; k < filterClassKeywords.length; k++) {
            let allFilters = findAllByClass(html, filterClassKeywords[k]);
            if (allFilters.length > 0) { filterEl = allFilters[0]; break; }
        }
    }

    let sortEl = findElByClass(html, 'rb-title') ||
                 findElByClass(html, 'hl-rb-title') ||
                 findElByClass(html, 'sort') ||
                 findElByClass(html, 'order');

    // ========== 第二步：评分兜底 ==========

    if (!navEl) {
        let candidates = [];
        let navKeywords = ['header', 'nav', 'menu', 'top'];
        for (let k = 0; k < navKeywords.length; k++) {
            let allEls = findAllByClass(html, navKeywords[k]);
            for (let i = 0; i < allEls.length; i++) {
                let el = allEls[i];
                let cls = firstClass(el.cls);
                if (!cls) continue;
                let skip = false;
                for (let j = 0; j < candidates.length; j++) {
                    if (candidates[j].cls === el.cls) { skip = true; break; }
                }
                if (skip) continue;
                let links = extractLinks(el.html);
                if (links.length < 2 || links.length > 30) continue;
                let score = 0, matchCount = 0;
                for (let li = 0; li < links.length; li++) {
                    if (hasKW(links[li].text, navScoreKWs)) matchCount++;
                }
                score += Math.min(matchCount, 12) * 10;
                if (matchCount > 20) score -= 30;
                let tag = el.cls.match(/^<(\w+)/);
                if (tag && (tag[1] === 'nav' || tag[1] === 'header')) score += 15;
                let clsLower = cls.toLowerCase();
                if (clsLower.indexOf('nav') > -1) score += 20;
                if (clsLower.indexOf('menu') > -1) score += 18;
                if (clsLower.indexOf('header') > -1) score += 15;
                if (clsLower.indexOf('top') > -1) score += 8;
                if (clsLower.indexOf('filter') > -1) score -= 10;
                if (clsLower.indexOf('screen') > -1) score -= 10;
                if (clsLower.indexOf('sort') > -1) score -= 10;
                if (clsLower.indexOf('search') > -1) score -= 10;
                candidates.push({ el: el, score: score, cls: el.cls });
            }
        }
        if (candidates.length > 0) {
            candidates.sort(function(a, b) { return b.score - a.score; });
            if (candidates[0].score > 0) navEl = candidates[0].el;
        }
    }

    if (!filterEl) {
        let candidates = [];
        let filterKeywords = ['filter', 'screen', 'category', 'type-list', 'tag-list', 'classify'];
        for (let k = 0; k < filterKeywords.length; k++) {
            let allEls = findAllByClass(html, filterKeywords[k]);
            for (let i = 0; i < allEls.length; i++) {
                let el = allEls[i];
                let cls = firstClass(el.cls);
                if (!cls) continue;
                let skip = false;
                for (let j = 0; j < candidates.length; j++) {
                    if (candidates[j].cls === el.cls) { skip = true; break; }
                }
                if (skip) continue;
                let links = extractLinks(el.html);
                if (links.length < 2) continue;
                let score = 0, matchCount = 0;
                for (let li = 0; li < links.length; li++) {
                    if (hasKW(links[li].text, filterValueKWs)) matchCount++;
                }
                score += matchCount * 8;
                let clsLower = cls.toLowerCase();
                if (clsLower.indexOf('filter') > -1) score += 20;
                if (clsLower.indexOf('screen') > -1) score += 18;
                if (clsLower.indexOf('type') > -1) score += 8;
                if (clsLower.indexOf('tag') > -1) score += 5;
                if (clsLower.indexOf('category') > -1) score += 5;
                if (clsLower.indexOf('classify') > -1) score += 5;
                if (clsLower.indexOf('nav') > -1) score -= 10;
                if (clsLower.indexOf('header') > -1) score -= 10;
                if (clsLower.indexOf('sort') > -1) score -= 10;
                if (clsLower.indexOf('search') > -1) score -= 10;
                if (isGenericContainer(cls)) score -= 20;
                let labelText = extractLabelText(el.html);
                if (!labelText) labelText = extractLabelFromBefore(html, el.pos);
                if (hasKW(labelText, allowFilterKWs)) score += 25;
                candidates.push({ el: el, score: score, cls: el.cls });
            }
        }
        if (candidates.length > 0) {
            candidates.sort(function(a, b) { return b.score - a.score; });
            if (candidates[0].score > 0) {
                filterEl = candidates[0].el;
                let links = extractLinks(filterEl.html);
                filterHasAll = links.length > 0 && hasKW(links[0].text, ['全部', '不限', '所有']);
            }
        }
    }

    if (!sortEl) {
        let candidates = [];
        let sortKeywords = ['sort', 'order', 'rb', 'rank', 'tab'];
        for (let k = 0; k < sortKeywords.length; k++) {
            let allEls = findAllByClass(html, sortKeywords[k]);
            for (let i = 0; i < allEls.length; i++) {
                let el = allEls[i];
                let cls = firstClass(el.cls);
                if (!cls) continue;
                let skip = false;
                for (let j = 0; j < candidates.length; j++) {
                    if (candidates[j].cls === el.cls) { skip = true; break; }
                }
                if (skip) continue;
                let links = extractLinks(el.html);
                if (links.length < 2 || links.length > 10) continue;
                let score = 0, matchCount = 0;
                for (let li = 0; li < links.length; li++) {
                    if (hasKW(links[li].text, sortKWs)) matchCount++;
                }
                score += matchCount * 15;
                if (links.length >= 2 && links.length <= 6) score += 10;
                let clsLower = cls.toLowerCase();
                if (clsLower.indexOf('sort') > -1) score += 20;
                if (clsLower.indexOf('order') > -1) score += 18;
                if (clsLower.indexOf('rb') > -1) score += 10;
                if (clsLower.indexOf('rank') > -1) score += 8;
                if (clsLower.indexOf('tab') > -1) score += 5;
                if (clsLower.indexOf('nav') > -1) score -= 10;
                if (clsLower.indexOf('header') > -1) score -= 10;
                if (clsLower.indexOf('filter') > -1) score -= 10;
                if (clsLower.indexOf('screen') > -1) score -= 10;
                if (clsLower.indexOf('search') > -1) score -= 10;
                if (isGenericContainer(cls)) score -= 20;
                if (clsLower.indexOf('list') > -1) score -= 8;
                candidates.push({ el: el, score: score, cls: el.cls });
            }
        }
        if (candidates.length > 0) {
            candidates.sort(function(a, b) { return b.score - a.score; });
            if (candidates[0].score > 0) sortEl = candidates[0].el;
        }
    }

    // ========== 构建结果 ==========
    // 大分类没获取到 → 返回空数组
    if (!navEl) return result;

    // 导航
    let navSelector = '.' + firstClass(navEl.cls);
    let navLinks = extractLinks(navEl.html);
    let excludeTexts = [];
    for (let i = 0; i < navLinks.length; i++) {
        if (!hasKW(navLinks[i].text, allowNavKWs)) excludeTexts.push(navLinks[i].text);
    }
    let navSub = 'body&&li';
    if (excludeTexts.length > 0) {
        navSub += ':not(:matches(' + excludeTexts.join('|') + '))';
    }
    result.push({ 一级分类: 'body&&' + navSelector, 子分类: navSub });

    // 筛选
    if (filterEl) {
        let selector = '.' + firstClass(filterEl.cls) + ':not(:matches(字母))';
        let subSelector = filterHasAll
            ? 'body&&li:has(a:not(:empty)):lt(12)'
            : 'body&&li:has(a:not(:empty)):gt(0):lt(12)';
        result.push({ 一级分类: 'body&&' + selector, 子分类: subSelector });
    }

    // 排序
    if (sortEl) {
        let selector = '.' + firstClass(sortEl.cls);
        result.push({ 一级分类: 'body&&' + selector, 子分类: 'body&&a' });
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