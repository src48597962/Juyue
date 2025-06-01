海阔小程序-聚阅

本小程序为空壳小程序，代码为本人学习之用，仅提供聚合框架，不提供任何内容，不承担任何法律责任，特此声明！

一、主页源代码相关知识点
    
    公共代码可以直接调用，其他新开页面可以用传递参数的方式，或者用子页面调用的方法

    一级主页源的接口如果同时拥有二级接口代码，则一级的d.url需要传二级链接地址，这样进二级时会自动打开当前接口的二级数据，否则会进入搜源列表
    d结构相关说明如下：
        d.push({
            title: 标题,//轮播图等，标题为空时，则必需要传extra.name
            desc: 描述,
            pic_url: 图片,
            col_type: 样式,
            url: 链接//如果只有主页源，这里就可以不用传url
            extra:{//常规可不传extra
                pageTitle: 二级标题，可以不等于搜索关键字，//可不传
                name: 二级换源搜索关键字//可不传，默认取title，title为空时必传
            }
            //如果title不等于片名，则可以单独传extra.name
        });
    主页源（主页、分类、排行、更新），如果需要自己新开页面时，想默认进入当前接口的二级，可以通过内置方法toerji进行转换
        d.forEach(it=>{
            it = toerji(it);
        })
        return d;
    一级接口源信息获取：let info = storage0.getMyVar('一级源接口信息');
        对象：{name: 接口名, type: 类型, group: 分组}
    "页码": {"分类":1, "排行":0, "更新":0},//可不传，如果传1则会传fypage，用getParam('page')获取
    主页数据如果没有翻页时，应在接口中let d = [];下面写上
        if (MY_PAGE > 1) {
            return d;
        }
    "转换": {"排行":"主题"}//可不传，仅支持对排行、分类、更新三个按键转换名称
        可以将主页中间三大金刚模块名称转换成想要的，对应代码的属性名和页码中的属性名需使用转换后的新名称

二、搜索源代码相关知识点


    搜索关键字取:name，页码取:page
    搜索数据如果没有翻页时，应在接口中let d = [];下面写上
        if (page > 1) {
            return d;
        }
    二级页面如果需要变更搜索词，可直接赋值name
    搜索的desc如果要写其他内容，则在extra.sdesc传入最新章节名，d其他结构同主页
    二级数据返回格式如下
        return { //如果有多线路，则传line: 线路数组, 则list应为多线路合并后的数组[线路1选集列表，线路2选集列表]
            //"detailurl"：封面url自己写点击想执行的事件,//可不传
            detail1: "‘‘’’<font color=#FA7298>"+detail1+"</font>", //封面上面，可自由组合，可用html样式
            detail2: "‘‘’’<font color=#f8ecc9>"+detail2+"</font>", //封面下部，可自由组合，可用html样式
            //detailextra: {},//封面附加
            desc: 简介,
            img: 图片, //图片不传，则用上一级的图片
            //"line": 线路,//单线路可不传
            list: 选集, //如果有多线路，则list应为多线路合并后的数组[线路1选集列表，线路2选集列表]，选集参考下方的结构，可传单独extra
            //"listparse": function(线路索引,线路名){写列表解析代码，结后返回选集},//传值代表选集列表需解析，支持点线路时动态获取对应选集
            //"page": 分页,//原网站选集列表是分页的，这时需要用，参考下方分页获取逻辑代码
            //"pageparse": function (input) {//原网站选集列表是分页的，选集动态获取
                let html = request(input, {timeout:8000});
                let 选集 = pdfa(html, '.play-list&&li').map((data) => {
                    let 选集列表 = {};
                    选集列表.title = pdfh(data, 'a--span--i&&Text')
                    选集列表.url = pd(data, 'a&&href');
                    //选集列表.extra = {};
                    return 选集列表;
                })
                return 选集;
            },
            //"extra":{//选集统一附加，可不传
                "blockRules": ['.css']
            },
            //rule:1,//当接口类型为漫画、影视、音乐等选集解析是lazyRule时，且这个接口又有文章类的内容，可传此值可选集变为rule事件
            //type:"漫画",//可以强制指定当前内容为漫画或小说，优先于接口类型
            //moreitems: [],//二级扩展项，可以传任意样式元素对象数组，如当前影片的一些更多信息，不传则不显示，或长按样式可关闭，显示在线路上面
            //extenditems: [],//二级扩展项，可以传任意样式元素对象数组，如猜你所想列表，不传则不显示，或长按样式可关闭，显示在选集底部

        }   
        /*分页获取逻辑代码，仅参考
        let 分页 = pdfa(html, '.hd-sel&&option').map((data) => {
            let 分页列表 = {};
            分页列表.title = pdfh(data, 'option&&Text');
            分页列表.url = pd(data,"option&&value");
            return 分页列表;
        });
        */
        /*选集列表结构
        let 选集 = pdfa(html, '.play-list&&li').map((data) => {
            let 选集列表 = {};
            选集列表.title = pdfh(data, 'a--span--i&&Text');
            选集列表.url = pd(data, 'a&&href');
            //选集列表.desc = "描述";//可不传，这是单独传每个选集的desc
            //选集列表.col_type = "text_2";//可不传，这是单独传每个选集的样式，优先级高于样式设定
            //选集列表.extra = {test: 1};//可不传，这是单独传每个选集的附加，优先级高于二级返回的extra
            return 选集列表;
        })
        */

三、子页面调用方法说明

    当在新开的环境$工具下，一般要么是直接传参进去，或者就是通过子页面取得接口想要的代码
    取公共整个代码  let 公共 = $.require('jiekou').公共(标识);
    取一级整个代码  let 一级 = $.require('jiekou').一级();
    取二级整个代码  let 二级 = $.require('jiekou').二级();
    取一级的作者
        let 作者 = $.require('jiekou').属性(标识,"一级","作者");
    或者
        let 作者 = $.require('jiekou').一级().作者;

    标识为：类型_接口名
    标识在一级、二级、搜索、解析、最新均可直接用，但如需要在新开页面调用可通过此取得let info = storage0.getMyVar('一级源接口信息');let 标识 = info.type + "_" + info.name;

    新支持了自定义$.exports|$.require引用方法，如下
    内置了图片解密方法
    let imgfunc = $().image(() => $.require("jiekou?rule=" + MY_TITLE).imageDecrypt(key,iv,kiType,mode));这是一个方法需要传对应参数//key,iv,"Hex","AES/CBC/PKCS7Padding"
    图片链接 + 解密方法imgfunc

    需要在一级、二级或者公共内自己封装方法，然后又想在$工具下，以$.require方式直接使用的，可以将需要主动引用在子页面的属性名写在公共.exports，示例如下
    "exports" : [{type:"公共",key:"测试a"},{type:"一级",key:"测试b"},{type:"公共",key:"测试c"}],
    我会在子页面中自动加载指定的代码到$.exports中
    在需要使用的地方直接= $.require("jiekou").测试a;//如果在解析、下载等跨小程序的调用中记得加上规则名


四、其他技巧


    接口分组可以留空，如写上分组名则影响搜索，如留空则搜索时会调用留空+全全的接口，如国漫则搜索会调用分组为国漫+全全的接口
    搜索时可以在关键字后面加2个空格指定搜索接口，2个空格后留空则以当前主页源接口作为默认搜索接口
    简繁互换内置方法jianfan(str)转为简体，jianfan(str,2)转为繁体
    主页长按分类可进入新搜索页
    二级长按切换站源可进入搜索页，搜其他类型、切换二级换源列表是否精准匹配
    二级长按样式，可设置统一修正选集标题、是否显示扩展列表项
    二级收藏即加入书架，切源站源不影响收藏和书架
    二级样式菜单中可开启选集列表分页显示
    管理页长按增加可开启调试模式或开启接口日志，建议不开仅源佬需要
    管理页长按导入可以切换导入类型，覆盖、跳过、确认
    管理页分享时可选分类，或多选，再点右上角分享


五、部分开发示例


    云口令：聚阅接口￥vmrxQ4eCSrkg8KXfevYkimhuIwMhXyLIPB++pTiLy0wKeZltEsEWbHHQNGxprmcDa4TFJNbIowkqz2JLutWK8w==￥四大金刚测试@import=js:$.require("hiker://page/import?rule=聚阅√");
    云口令：聚阅接口￥vmrxQ4eCSrkg8KXfevYkimhuIwMhXyLIPB++pTiLy0xcrS+jZmVWyFKDvoudjI/qTJjO9JGWnve+nedjQBse2A==￥子页面测试@import=js:$.require("hiker://page/import?rule=聚阅√");
    云口令：聚阅接口￥vmrxQ4eCSrkg8KXfevYkimhuIwMhXyLIPB++pTiLy0w+uuMQ41jCi44EWWYXNOTDO5K6WrSjgCI0zHVxhWN63w==￥预处理测试@import=js:$.require("hiker://page/import?rule=聚阅√");
    云口令：聚阅接口￥vmrxQ4eCSrkg8KXfevYkimhuIwMhXyLIPB++pTiLy0zc6gIug8SwyUnbW8XW++OT1xsnrmXvw8iJz+y5ZGBysw==￥exports测试@import=js:$.require("hiker://page/import?rule=聚阅√");
