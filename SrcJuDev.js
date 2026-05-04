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

var 分类颜色 = '#3399cc';
var page = MY_PAGE;
var true_url = getMyVar('header.url', MY_URL);
let 链接处理工具 = require(config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'plugins/UrlProcessor.js')
true_url = 链接处理工具
    .链接(true_url)
    .页码(page)
    .获取处理结果();
MY_URL = true_url;
log('请求地址>'+MY_URL);
var html = fetch(MY_URL);

//log('html源码>'+html);

var 定位列表 = ([
    {
        一级分类: 'body&&.hl-nav',
        子分类: 'body&&li:has(a[href*="type"])',
    },
    {
        一级分类: 'body&&.hl-filter-lis',
        子分类: 'body&&li:has(a[href*="show"]):gt(0):lt(20)',
    }
])


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