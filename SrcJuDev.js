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
    const result = [];
    
    // 1. 分析大分类（导航菜单）
    const navPatterns = [
        '.stui-header__menu li a[href*="vodtype"]',
        '.nav li a[href*="/type/"]',
        '.hl-nav li a[href*="type"]',
        '.menu li a[href*="vodtype"]'
    ];
    
    for (const pattern of navPatterns) {
        const hasNav = parseDomForArray(html, `body&&${pattern}`).length > 0;
        if (hasNav) {
            const selector = pattern.split(' li')[0];
            result[0] = {
                一级分类: `body&&${selector}`,
                子分类: `body&&li:has(a[href*="vodtype"]) || body&&li:has(a[href*="/type/"])`
            };
            break;
        }
    }
    
    // 如果没找到，尝试自动识别
    if (!result[0]) {
        const allUl = parseDomForArray(html, 'body&&ul');
        for (let i = 0; i < allUl.length; i++) {
            const links = parseDomForArray(allUl[i], 'a[href*="type"]');
            if (links.length >= 3) {
                result[0] = {
                    一级分类: `body&&ul:eq(${i})`,
                    子分类: `body&&li:has(a[href*="type"])`
                };
                break;
            }
        }
    }
    
    // 2. 分析小分类（筛选栏）
    const filterPatterns = [
        '.stui-screen__list li a[href*="vodshow"]',
        '.screen-list li a[href*="/show/"]',
        '.hl-filter-wrap li a[href*="show"]',
        '.filter-list li a[href*="vodshow"]'
    ];
    
    for (const pattern of filterPatterns) {
        const hasFilter = parseDomForArray(html, `body&&${pattern}`).length > 0;
        if (hasFilter) {
            const selector = pattern.split(' li')[0];
            result[1] = {
                一级分类: `body&&${selector}`,
                子分类: `body&&li:has(a:not(:empty)):gt(0):lt(20)`
            };
            break;
        }
    }
    
    // 如果没找到，尝试自动识别年份或地区筛选
    if (!result[1]) {
        const allUl = parseDomForArray(html, 'body&&ul');
        for (let i = 0; i < allUl.length; i++) {
            const yearLinks = parseDomForArray(allUl[i], 'a[href*="20"]').length;
            const areaLinks = parseDomForArray(allUl[i], 'a[href*="area"]').length;
            if (yearLinks >= 5 || areaLinks >= 3) {
                result[1] = {
                    一级分类: `body&&ul:eq(${i})`,
                    子分类: `body&&li:has(a:not(:empty)):gt(0):lt(20)`
                };
                break;
            }
        }
    }
    
    // 3. 分析排序选项
    const sortPatterns = [
        '.hl-rb-title a[href*="time"]',
        '.sort a[href*="hits"]',
        '.order a[href*="score"]',
        '.tabs a[href*="time"]'
    ];
    
    for (const pattern of sortPatterns) {
        const hasSort = parseDomForArray(html, `body&&${pattern}`).length > 0;
        if (hasSort) {
            const selector = pattern.split(' a')[0];
            result[2] = {
                一级分类: `body&&${selector}`,
                子分类: `body&&a`
            };
            break;
        }
    }
    
    // 如果没找到排序，尝试自动识别
    if (!result[2]) {
        const allDiv = parseDomForArray(html, 'body&&div:has(a[href*="time"]), body&&div:has(a[href*="hits"])');
        if (allDiv.length > 0) {
            result[2] = {
                一级分类: `body&&div:eq(0)`,
                子分类: `body&&a`
            };
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
const 当前折叠状态 = getMyVar('header.fold', '1')

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