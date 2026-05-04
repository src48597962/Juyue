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
    let navPatterns = [
        '.stui-header__menu',
        '.nav',
        '.hl-nav',
        '.menu'
    ];
    
    let i = 0;
    let found = false;
    for (i = 0; i < navPatterns.length; i++) {
        let selector = navPatterns[i];
        let hasNav = parseDomForArray(html, `body&&${selector} li a[href*="type"]`).length > 0;
        if (hasNav) {
            result[0] = {
                一级分类: `body&&${selector}`,
                子分类: `body&&li:not(:matches(首页|资讯|专题|短视频|APP下载|音乐|留言|最新|排行))`
            };
            found = true;
            break;
        }
    }
    
    // 如果没找到，尝试自动识别
    if (!found) {
        let allUl = parseDomForArray(html, 'body&&ul');
        let j = 0;
        for (j = 0; j < allUl.length; j++) {
            let links = parseDomForArray(allUl[j], 'a[href*="type"]');
            if (links.length >= 3) {
                result[0] = {
                    一级分类: `body&&ul:eq(${j})`,
                    子分类: `body&&li:not(:matches(首页|资讯|专题|短视频|APP下载|音乐|留言|最新|排行))`
                };
                found = true;
                break;
            }
        }
    }
    
    // 2. 分析小分类（筛选栏）
    let filterPatterns = [
        '.stui-screen__list',
        '.screen-list',
        '.hl-filter-wrap',
        '.filter-list'
    ];
    
    let foundFilter = false;
    for (i = 0; i < filterPatterns.length; i++) {
        let selector = filterPatterns[i];
        let hasFilter = parseDomForArray(html, `body&&${selector} li a[href*="show"]`).length > 0;
        if (hasFilter) {
            // 检查第一个li是不是"全部"
            let firstLiText = parseDomForArray(html, `body&&${selector} li:first`)[0] || '';
            let isFirstAll = firstLiText.indexOf('全部') > -1 || firstLiText.indexOf('不限') > -1;
            
            if (isFirstAll) {
                // 第一个是"全部"，保留它，从第0个开始
                result[1] = {
                    一级分类: `body&&${selector}`,
                    子分类: `body&&li:has(a:not(:empty)):lt(20)`
                };
            } else {
                // 第一个不是"全部"，跳过第1个
                result[1] = {
                    一级分类: `body&&${selector}`,
                    子分类: `body&&li:has(a:not(:empty)):gt(0):lt(20)`
                };
            }
            foundFilter = true;
            break;
        }
    }
    
    // 如果没找到，尝试自动识别年份或地区筛选
    if (!foundFilter) {
        let allUl = parseDomForArray(html, 'body&&ul');
        let k = 0;
        for (k = 0; k < allUl.length; k++) {
            let yearLinks = parseDomForArray(allUl[k], 'a[href*="20"]').length;
            let areaLinks = parseDomForArray(allUl[k], 'a[href*="area"]').length;
            if (yearLinks >= 5 || areaLinks >= 3) {
                // 检查第一个li是不是"全部"
                let firstLiText = parseDomForArray(allUl[k], 'li:first')[0] || '';
                let isFirstAll = firstLiText.indexOf('全部') > -1 || firstLiText.indexOf('不限') > -1;
                
                if (isFirstAll) {
                    result[1] = {
                        一级分类: `body&&ul:eq(${k})`,
                        子分类: `body&&li:has(a:not(:empty)):lt(20)`
                    };
                } else {
                    result[1] = {
                        一级分类: `body&&ul:eq(${k})`,
                        子分类: `body&&li:has(a:not(:empty)):gt(0):lt(20)`
                    };
                }
                foundFilter = true;
                break;
            }
        }
    }
    
    // 3. 分析排序选项
    let sortPatterns = [
        '.hl-rb-title',
        '.sort',
        '.order',
        '.tabs'
    ];
    
    let foundSort = false;
    for (i = 0; i < sortPatterns.length; i++) {
        let selector = sortPatterns[i];
        let hasSort = parseDomForArray(html, `body&&${selector} a[href*="time"], body&&${selector} a[href*="hits"], body&&${selector} a[href*="score"]`).length > 0;
        if (hasSort) {
            result[2] = {
                一级分类: `body&&${selector}`,
                子分类: `body&&a`
            };
            foundSort = true;
            break;
        }
    }
    
    // 如果没找到排序，尝试自动识别
    if (!foundSort) {
        let allDiv = parseDomForArray(html, 'body&&div:has(a[href*="time"]), body&&div:has(a[href*="hits"])');
        if (allDiv.length > 0) {
            result[2] = {
                一级分类: `body&&div:eq(0)`,
                子分类: `body&&a`
            };
            foundSort = true;
        }
    }
    
    // 兜底：如果某个对象缺失，用默认值填充
    if (!result[0]) {
        result[0] = {
            一级分类: 'body&&body',
            子分类: 'body&&a[href*="vodtype"] || body&&a[href*="/type/"]'
        };
    }
    if (!result[1]) {
        result[1] = {
            一级分类: 'body&&body',
            子分类: 'body&&a[href*="vodshow"] || body&&a[href*="/show/"]'
        };
    }
    if (!result[2]) {
        result[2] = {
            一级分类: 'body&&.hl-rb-title',
            子分类: 'body&&a'
        };
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