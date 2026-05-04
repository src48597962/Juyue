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
    
    // 1. 分析大分类（导航菜单）
    let navSelectors = [
        '.stui-header__menu',
        '.nav',
        '.hl-nav',
        '.menu',
        '.top-nav',
        '.header-menu'
    ];
    
    let foundNav = false;
    let navSelector = '';
    for (let i = 0; i < navSelectors.length; i++) {
        let selector = navSelectors[i];
        navSelector = 'body&&' + selector;
        if (parseDomForArray(html, navSelector).length > 0) {
            foundNav = true;
            break;
        }
    }
    
    if (foundNav) {
        result[0] = {
            一级分类: navSelector,
            子分类: 'body&&li:not(:matches(首页|资讯|专题|短视频|APP下载|音乐|留言|最新|排行))'
        };
    } else {
        // 查找包含“电影”、“电视剧”等关键词的容器
        let allContainers = parseDomForArray(html, 'body&&ul||div');
        let keywords = ['电影', '电视剧', '综艺', '动漫', '短剧'];
        let targetIndex = -1;
        for (let i = 0; i < allContainers.length; i++) {
            let containerHtml = allContainers[i] || '';
            for (let j = 0; j < keywords.length; j++) {
                if (containerHtml.indexOf(keywords[j]) > -1) {
                    targetIndex = i;
                    break;
                }
            }
        }
        
        if (targetIndex > -1) {
            result[0] = {
                一级分类: 'body&&ul||div:eq(' + targetIndex + ')',
                子分类: 'body&&li:not(:matches(首页|资讯|专题|短视频|APP下载|音乐|留言|最新|排行))'
            };
        }
    }
            
    
    // 2. 分析小分类（筛选栏）
    let filterSelectors = [
        '.stui-screen__list',
        '.screen-list',
        '.hl-filter-wrap',
        '.filter-list'
    ];
    
    let foundFilter = false;
    let filterSelector = '';
    let isFirstAll = false;
    
    for (let i = 0; i < filterSelectors.length; i++) {
        let selector = filterSelectors[i];
        filterSelector = 'body&&' + selector;
        if (parseDomForArray(html, filterSelector).length > 0) {
            foundFilter = true;
            // 检查第一个li是不是"全部"
            let firstLi = parseDomForArray(html, filterSelector + ' li:first');
            let firstLiText = (firstLi && firstLi[0]) ? firstLi[0] : '';
            isFirstAll = firstLiText.indexOf('全部') > -1 || firstLiText.indexOf('不限') > -1 || firstLiText.indexOf('所有') > -1;
            break;
        }
    }
    
    if (foundFilter) {
        if (isFirstAll) {
            result[1] = {
                一级分类: filterSelector,
                子分类: 'body&&li:has(a:not(:empty)):lt(25)'
            };
        } else {
            result[1] = {
                一级分类: filterSelector,
                子分类: 'body&&li:has(a:not(:empty)):gt(0):lt(25)'
            };
        }
    } else {
        // 查找包含年份或“地区”文字的ul
        let allUl = parseDomForArray(html, 'body&&ul');
        let targetUlIndex = -1;
        let isFirstAllUl = false;
        
        for (let i = 0; i < allUl.length; i++) {
            let yearMatch = parseDomForArray(allUl[i], 'a[href*="202"]').length;
            let hasArea = (allUl[i] || '').indexOf('地区') > -1;
            if (yearMatch >= 3 || hasArea) {
                targetUlIndex = i;
                let firstLi = parseDomForArray(allUl[i], 'li:first');
                let firstLiText = (firstLi && firstLi[0]) ? firstLi[0] : '';
                isFirstAllUl = firstLiText.indexOf('全部') > -1 || firstLiText.indexOf('不限') > -1;
                break;
            }
        }
        
        if (targetUlIndex > -1) {
            if (isFirstAllUl) {
                result[1] = {
                    一级分类: 'body&&ul:eq(' + targetUlIndex + ')',
                    子分类: 'body&&li:has(a:not(:empty)):lt(25)'
                };
            } else {
                result[1] = {
                    一级分类: 'body&&ul:eq(' + targetUlIndex + ')',
                    子分类: 'body&&li:has(a:not(:empty)):gt(0):lt(25)'
                };
            }
        }
    }
    
    // 3. 分析排序选项
    let sortSelectors = [
        '.hl-rb-title',
        '.sort'
    ];
    
    let foundSort = false;
    let sortSelector = '';
    for (let i = 0; i < sortSelectors.length; i++) {
        let selector = sortSelectors[i];
        sortSelector = 'body&&' + selector;
        if (parseDomForArray(html, sortSelector).length > 0) {
            foundSort = true;
            break;
        }
    }
    
    if (foundSort) {
        result[2] = {
            一级分类: sortSelector,
            子分类: 'body&&a'
        };
    } else {
        // 查找包含“最新”、“热门”等文字的div
        let allDiv = parseDomForArray(html, 'body&&div:has(a)');
        let targetDivIndex = -1;
        let sortKeywords = ['最新', '热门', '评分', '时间', '人气'];
        
        for (let i = 0; i < allDiv.length; i++) {
            let divText = allDiv[i] || '';
            for (let j = 0; j < sortKeywords.length; j++) {
                if (divText.indexOf(sortKeywords[j]) > -1) {
                    targetDivIndex = i;
                    break;
                }
            }
            if (targetDivIndex > -1) break;
        }
        
        if (targetDivIndex > -1) {
            result[2] = {
                一级分类: 'body&&div:eq(' + targetDivIndex + ')',
                子分类: 'body&&a'
            };
        }
    }
    
    return result;
}

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


setResult(d);