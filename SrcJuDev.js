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

    function firstClass(clsStr) {
        let m = clsStr.match(/class=["']([^"']*)["']/i);
        if (!m) return '';
        let parts = m[1].trim().split(/\s+/).filter(function(c) {
            return c.length > 0 && !/^\d/.test(c) && c.length < 30;
        });
        return parts.length > 0 ? parts[0] : '';
    }

    // 在html中查找class含指定关键词的元素，返回第一个匹配
    function findElByClass(html, classKeyword) {
        let re = new RegExp('<(\\w+)[^>]*class=["\'][^"\']*' + classKeyword + '[^"\']*["\'][^>]*>', 'gi');
        let m = re.exec(html);
        if (!m) return null;
        let tag = m[1].toLowerCase();
        let start = m.index;
        let innerStart = start + m[0].length;
        let closeTag = '</' + tag + '>';
        let closeIdx = html.indexOf(closeTag, innerStart);
        if (closeIdx === -1) return null;
        return {
            html: html.substring(start, closeIdx + closeTag.length),
            cls: m[0]
        };
    }

    // ========== 关键词库 ==========
    let navKWs = [
        '电影', '电视剧', '剧集', '连续剧', '综艺', '动漫', '动画',
        '纪录片', '短剧', '番剧', '影院', '动作片', '喜剧片', '爱情片',
        '科幻片', '恐怖片', '战争片', '国产剧', '港台剧', '日剧', '韩剧', '美剧',
        '大陆剧', '港剧', '台剧', '泰剧', '英美剧', '纪录', '教育', '漫剧', '同步课堂'
    ];

    let filterLabelKWs = ['类型', '地区', '年代', '年份', '语言', '状态', '版本', '画质', '分类'];

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

    // ========== 第一步：直接找已知 class 模式 ==========

    // 导航：找含 nav/menu 的元素
    let navEl = findElByClass(html, 'hl-nav') ||
                findElByClass(html, 'stui-header__menu') ||
                findElByClass(html, 'nav-list') ||
                findElByClass(html, 'hl-menus') ||
                findElByClass(html, 'type-nav');

    // 筛选：找含 filter-wrap/screen-item 的div，优先选第一个链接含"全部"的
    let filterEl = null;
    let filterClassKeywords = ['filter-wrap', 'screen-item', 'filter-box'];
    for (let k = 0; k < filterClassKeywords.length; k++) {
        let keyword = filterClassKeywords[k];
        let re = new RegExp('<(\\w+)[^>]*class=["\'][^"\']*' + keyword + '[^"\']*["\'][^>]*>', 'gi');
        let m;
        while ((m = re.exec(html)) !== null) {
            let tag = m[1].toLowerCase();
            let start = m.index;
            let innerStart = start + m[0].length;
            let closeTag = '</' + tag + '>';
            let closeIdx = html.indexOf(closeTag, innerStart);
            if (closeIdx === -1) continue;
            let elHtml = html.substring(start, closeIdx + closeTag.length);
            let elCls = m[0];
            // 检查第一个链接是否含"全部"
            let firstLinkMatch = elHtml.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
            let firstLinkText = firstLinkMatch ? stripTags(firstLinkMatch[1]) : '';
            if (hasKW(firstLinkText, ['全部', '不限', '所有'])) {
                filterEl = { html: elHtml, cls: elCls };
                break;
            }
        }
        if (filterEl) break;
    }
    // 兜底：第一个链接没有"全部"的也接受
    if (!filterEl) {
        for (let k = 0; k < filterClassKeywords.length; k++) {
            let keyword = filterClassKeywords[k];
            let re = new RegExp('<(\\w+)[^>]*class=["\'][^"\']*' + keyword + '[^"\']*["\'][^>]*>', 'gi');
            let m = re.exec(html);
            if (m) {
                let tag = m[1].toLowerCase();
                let start = m.index;
                let innerStart = start + m[0].length;
                let closeTag = '</' + tag + '>';
                let closeIdx = html.indexOf(closeTag, innerStart);
                if (closeIdx !== -1) {
                    filterEl = { html: html.substring(start, closeIdx + closeTag.length), cls: m[0] };
                    break;
                }
            }
        }
    }

    // 排序：找含 rb-title/sort 的 div
    let sortEl = findElByClass(html, 'rb-title') ||
                 findElByClass(html, 'hl-rb-title') ||
                 findElByClass(html, 'sort') ||
                 findElByClass(html, 'order');

    // ========== 第二步：找不到的用评分兜底 ==========

    if (!navEl || !filterEl || !sortEl) {
        let candidates = [];
        let tagRe = /<(ul|div|nav|section|dl)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi;
        let cm;
        while ((cm = tagRe.exec(html)) !== null) {
            let links = extractLinks(cm[0]);
            if (links.length >= 2 && links.length <= 60) {
                let cls = cm[2] || '';
                candidates.push({
                    html: cm[0],
                    tag: cm[1].toLowerCase(),
                    cls: cls.toLowerCase(),
                    links: links
                });
            }
        }

        if (!navEl) {
            let best = null, bestS = 0;
            for (let i = 0; i < candidates.length; i++) {
                let c = candidates[i], s = 0, links = c.links;
                s += Math.min(countKW(links, navKWs), 12) * 20;
                if (c.tag === 'nav') s += 25;
                if (links.length >= 3 && links.length <= 15) s += 15;
                else if (links.length > 20) s -= 10;
                if (hasKW(c.cls, ['nav', 'menu', 'header', 'head', 'top', 'category'])) s += 15;
                s -= countKW(links, excludeNavKWs) * 5;
                if (s > bestS) { bestS = s; best = c; }
            }
            if (best && bestS >= 20) navEl = { html: best.html, cls: best.cls };
        }

        if (!filterEl) {
            let best = null, bestS = 0;
            for (let i = 0; i < candidates.length; i++) {
                let c = candidates[i], s = 0, links = c.links;
                if (hasKW(c.cls, ['filter-wrap', 'screen-item'])) s += 25;
                else if (hasKW(c.cls, ['filter-list', 'screen-list'])) s -= 5;
                else if (hasKW(c.cls, ['filter', 'screen'])) s += 10;
                if (c.tag === 'dl') s += 15;
                s += countKW(links, filterValueKWs) * 5;
                let yearCount = 0;
                for (let j = 0; j < links.length; j++) {
                    if (/^(20[12]\d|19[89]\d)$/.test(links[j].text.trim())) yearCount++;
                }
                if (yearCount >= 3) s += 20;
                if (links.length > 0 && hasKW(links[0].text, ['全部', '不限', '所有'])) s += 15;
                if (s > bestS) { bestS = s; best = c; }
            }
            if (best && bestS >= 15) filterEl = { html: best.html, cls: best.cls };
        }

        if (!sortEl) {
            let best = null, bestS = 0;
            for (let i = 0; i < candidates.length; i++) {
                let c = candidates[i], s = 0, links = c.links;
                s += countKW(links, sortKWs) * 15;
                if (links.length > 8) s -= 15;
                if (links.length >= 2 && links.length <= 6) s += 15;
                if (hasKW(c.cls, ['sort', 'order', 'rank', 'rb-title'])) s += 15;
                if (s > bestS) { bestS = s; best = c; }
            }
            if (best && bestS >= 15) sortEl = { html: best.html, cls: best.cls };
        }
    }

    // ========== 构建结果 ==========

    // 一级分类（导航）
    if (navEl) {
        let selector = '.' + firstClass(navEl.cls);
        let links = extractLinks(navEl.html);
        let navTexts = [];
        for (let i = 0; i < links.length; i++) {
            if (hasKW(links[i].text, excludeNavKWs)) navTexts.push(links[i].text);
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
    if (filterEl) {
        let selector = '.' + firstClass(filterEl.cls) + ':not(:matches(字母))';
        let links = extractLinks(filterEl.html);
        let firstText = links.length > 0 ? links[0].text : '';
        let hasAll = hasKW(firstText, ['全部', '不限', '所有']);

        let subSelector = hasAll
            ? 'body&&li:has(a:not(:empty)):lt(12)'
            : 'body&&li:has(a:not(:empty)):gt(0):lt(12)';

        result.push({
            一级分类: 'body&&' + selector,
            子分类: subSelector
        });
    }

    // 排序选项
    if (sortEl) {
        let selector = '.' + firstClass(sortEl.cls);
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