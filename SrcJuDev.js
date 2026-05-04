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
    function parseElements(html, tag) {
        let regex = new RegExp('<' + tag + '[\\s>]([\\s\\S]*?)<\\/' + tag + '>', 'gi');
        let matches = [], m;
        while ((m = regex.exec(html)) !== null) {
            matches.push({ html: m[0], inner: m[1] });
        }
        return matches;
    }

    function extractLinks(block) {
        let links = [], re = /<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, m;
        while ((m = re.exec(block)) !== null) {
            let text = m[2].replace(/<[^>]+>/g, '').trim();
            if (text) links.push({ text: text, href: m[1] });
        }
        return links;
    }

    function getClass(block) {
        let m = block.match(/class=["']([^"']*)["']/i);
        return m ? m[1].toLowerCase() : '';
    }

    function getTag(block) {
        let m = block.match(/^<(\w+)/i);
        return m ? m[1].toLowerCase() : '';
    }

    function countKW(links, kws) {
        let c = 0;
        for (let i = 0; i < links.length; i++) {
            for (let j = 0; j < kws.length; j++) {
                if (links[i].text.indexOf(kws[j]) > -1) { c++; break; }
            }
        }
        return c;
    }

    function hasKW(text, kws) {
        for (let i = 0; i < kws.length; i++) {
            if (text.indexOf(kws[i]) > -1) return true;
        }
        return false;
    }

    function stripTags(s) {
        return s.replace(/<[^>]+>/g, '').trim();
    }

    function buildSelector(cls, tag, idx) {
        if (cls) {
            let parts = cls.split(/\s+/).filter(function(c) {
                return c.length > 0 && !/^\d/.test(c) && c.length < 30;
            });
            if (parts.length > 0) return '.' + parts[0];
        }
        return tag + ':eq(' + idx + ')';
    }

    // ========== 关键词库 ==========
    let navKWs = [
        '电影', '电视剧', '剧集', '连续剧', '综艺', '动漫', '动画',
        '纪录片', '短剧', '番剧', '影院', '动作片', '喜剧片', '爱情片',
        '科幻片', '恐怖片', '战争片', '国产剧', '港台剧', '日剧', '韩剧', '美剧',
        '大陆剧', '港剧', '台剧', '泰剧', '英美剧', '纪录', '教育', '漫剧', '同步课堂'
    ];

    let filterLabelKWs = ['类型', '地区', '年代', '年份', '语言', '状态', '版本', '画质', '分类', '字母'];

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

    let excludeNavKWs = [
        '首页', '主页', '登录', '注册', '搜索', '留言', '论坛',
        '资讯', '新闻', '公告', '专题', 'APP', '下载', '客户端',
        '关于', '联系', '帮助', '收藏', '历史', '播放记录', '短视频', '音乐', '排行', '最新'
    ];

    // ========== 收集候选容器 ==========
    let candidates = [];
    let tags = ['ul', 'dl', 'div', 'nav', 'section'];

    for (let t = 0; t < tags.length; t++) {
        let els = parseElements(html, tags[t]);
        for (let i = 0; i < els.length; i++) {
            let links = extractLinks(els[i].html);
            if (links.length >= 2 && links.length <= 60) {
                candidates.push({
                    html: els[i].html,
                    inner: els[i].inner,
                    links: links,
                    tag: tags[t],
                    cls: getClass(els[i].html),
                    idx: i
                });
            }
        }
    }

    // ========== 收集筛选容器（处理标签在兄弟元素中的情况）==========
    let filterCandidates = [];
    let filterWrapRe = /<div[^>]*class=["'][^"']*(?:filter-wrap|screen-item|filter-item-wrap|filter-box)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
    let wm;
    while ((wm = filterWrapRe.exec(html)) !== null) {
        let wrapHtml = wm[0];
        let labelMatch = wrapHtml.match(/<span[^>]*>([\s\S]*?)<\/span>/i);
        let labelText = labelMatch ? stripTags(labelMatch[1]) : '';
        if (!labelText) {
            let dtMatch = wrapHtml.match(/<dt[^>]*>([\s\S]*?)<\/dt>/i);
            labelText = dtMatch ? stripTags(dtMatch[1]) : '';
        }
        let links = extractLinks(wrapHtml);
        if (links.length >= 2) {
            filterCandidates.push({
                html: wrapHtml,
                label: labelText,
                links: links,
                cls: getClass(wrapHtml)
            });
        }
    }

    // ========== 评分函数 ==========

    function scoreNav(c) {
        let s = 0, links = c.links, cls = c.cls;
        s += countKW(links, navKWs) * 20;
        if (links.length >= 3 && links.length <= 15) s += 10;
        let avg = 0;
        for (let i = 0; i < links.length; i++) avg += links[i].text.length;
        avg /= links.length;
        if (avg >= 1 && avg <= 8) s += 10;
        if (avg <= 4) s += 5;
        if (hasKW(cls, ['nav', 'menu', 'header', 'head', 'top', 'category', 'type-nav'])) s += 15;
        s -= countKW(links, excludeNavKWs) * 5;
        let listCount = 0;
        for (let i = 0; i < links.length; i++) {
            let h = links[i].href;
            if (/\/(type|list|show|vod|category|class)\//.test(h) || /\/\d+[-._]/.test(h)) listCount++;
        }
        s += listCount * 3;
        return s;
    }

    function scoreFilter(c) {
        let s = 0, links = c.links, cls = c.cls, tag = c.tag;
        if (tag === 'dl') s += 15;
        if (hasKW(cls, ['filter', 'screen', 'tag', 'category', 'select', 'condition', '筛', 'type-list'])) s += 15;
        let dtMatch = c.html.match(/<dt[^>]*>([\s\S]*?)<\/dt>/i);
        let labelText = dtMatch ? stripTags(dtMatch[1]) : '';
        if (!labelText) {
            let prevMatch = html.substring(0, html.indexOf(c.html));
            if (prevMatch) {
                let lastSpan = prevMatch.match(/<span[^>]*>([^<]*)<\/span>\s*$/i);
                if (lastSpan) labelText = lastSpan[1].trim();
            }
        }
        s += countKW([{ text: labelText }], filterLabelKWs) * 15;
        s += countKW(links, filterValueKWs) * 5;
        let yearCount = 0;
        for (let i = 0; i < links.length; i++) {
            if (/^(20[12]\d|19[89]\d)$/.test(links[i].text.trim())) yearCount++;
        }
        if (yearCount >= 3) s += 20;
        else if (yearCount >= 1) s += 8;
        if (links.length >= 5 && links.length <= 30) s += 10;
        if (links.length > 0 && hasKW(links[0].text, ['全部', '不限', '所有'])) s += 15;
        let avg = 0;
        for (let i = 0; i < links.length; i++) avg += links[i].text.length;
        avg /= links.length;
        if (avg >= 1 && avg <= 6) s += 8;
        return s;
    }

    function scoreFilterWrap(fc) {
        let s = 0;
        s += countKW([{ text: fc.label }], filterLabelKWs) * 20;
        s += countKW(fc.links, filterValueKWs) * 5;
        let yearCount = 0;
        for (let i = 0; i < fc.links.length; i++) {
            if (/^(20[12]\d|19[89]\d)$/.test(fc.links[i].text.trim())) yearCount++;
        }
        if (yearCount >= 3) s += 25;
        if (fc.links.length > 0 && hasKW(fc.links[0].text, ['全部', '不限', '所有'])) s += 15;
        if (hasKW(fc.cls, ['filter', 'screen'])) s += 10;
        return s;
    }

    function scoreSort(c) {
        let s = 0, links = c.links, cls = c.cls;
        s += countKW(links, sortKWs) * 20;
        if (links.length >= 2 && links.length <= 6) s += 15;
        else if (links.length >= 2 && links.length <= 8) s += 8;
        if (hasKW(cls, ['sort', 'order', 'rank', '排序', '排行', 'rb-title'])) s += 15;
        let sortHref = 0;
        for (let i = 0; i < links.length; i++) {
            let h = links[i].href;
            if (/[?&](order|sort|by)=/i.test(h) || /[-_]time|[-_]hot|[-_]score|[-_]new/i.test(h)) sortHref++;
        }
        s += sortHref * 5;
        let avg = 0;
        for (let i = 0; i < links.length; i++) avg += links[i].text.length;
        avg /= links.length;
        if (avg >= 1 && avg <= 6) s += 10;
        return s;
    }

    // ========== 执行评分竞赛 ==========
    let bestNav = null, bestNavS = 0;
    let bestFilter = null, bestFilterS = 0;
    let bestSort = null, bestSortS = 0;

    for (let i = 0; i < candidates.length; i++) {
        let c = candidates[i];
        let ns = scoreNav(c);
        if (ns > bestNavS) { bestNavS = ns; bestNav = c; }
        let fs = scoreFilter(c);
        if (fs > bestFilterS) { bestFilterS = fs; bestFilter = c; }
        let ss = scoreSort(c);
        if (ss > bestSortS) { bestSortS = ss; bestSort = c; }
    }

    let bestFilterWrap = null, bestFilterWrapS = 0;
    for (let i = 0; i < filterCandidates.length; i++) {
        let fs = scoreFilterWrap(filterCandidates[i]);
        if (fs > bestFilterWrapS) { bestFilterWrapS = fs; bestFilterWrap = filterCandidates[i]; }
    }

    // ========== 构建结果 ==========

    // 一级分类（导航）
    if (bestNav && bestNavS >= 20) {
        let selector = buildSelector(bestNav.cls, bestNav.tag, bestNav.idx);
        let navTexts = [];
        for (let i = 0; i < bestNav.links.length; i++) {
            if (hasKW(bestNav.links[i].text, excludeNavKWs)) navTexts.push(bestNav.links[i].text);
        }
        let subSelector = 'body&&li';
        if (navTexts.length > 0) {
            subSelector += ':not(:matches(' + navTexts.join('|') + '))';
        }
        result.push({
            一级分类: 'body&&' + selector,
            子分类: subSelector
        });
    }

    // 小分类（筛选）
    if (bestFilterWrap && bestFilterWrapS >= 15 && bestFilterWrapS >= bestFilterS) {
        let selector = buildSelector(bestFilterWrap.cls, 'div', -1);
        let firstText = bestFilterWrap.links.length > 0 ? bestFilterWrap.links[0].text : '';
        let hasAll = hasKW(firstText, ['全部', '不限', '所有']);

        let subSelector = hasAll
            ? 'body&&li:has(a:not(:empty)):lt(12)'
            : 'body&&li:has(a:not(:empty)):gt(0):lt(12)';

        result.push({
            一级分类: 'body&&' + selector,
            子分类: subSelector
        });
    } else if (bestFilter && bestFilterS >= 15) {
        let selector = buildSelector(bestFilter.cls, bestFilter.tag, bestFilter.idx);
        let firstText = bestFilter.links.length > 0 ? bestFilter.links[0].text : '';
        let hasAll = hasKW(firstText, ['全部', '不限', '所有']);

        let subSelector;
        if (bestFilter.tag === 'dl') {
            subSelector = hasAll
                ? 'body&&dd:has(a:not(:empty)):lt(12)'
                : 'body&&dd:has(a:not(:empty)):gt(0):lt(12)';
        } else {
            subSelector = hasAll
                ? 'body&&li:has(a:not(:empty)):lt(12)'
                : 'body&&li:has(a:not(:empty)):gt(0):lt(12)';
        }

        result.push({
            一级分类: 'body&&' + selector,
            子分类: subSelector
        });
    }

    // 排序选项
    if (bestSort && bestSortS >= 15) {
        let selector = buildSelector(bestSort.cls, bestSort.tag, bestSort.idx);
        result.push({
            一级分类: 'body&&' + selector,
            子分类: 'body&&a'
        });
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