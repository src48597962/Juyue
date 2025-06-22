let parse = {
    作者: '',
    版本: '',
    host: '网站域名',//会写入MY_URL，也可以不写，只是方便this.host调用
    /*
    静态分类: {
        //可以用海阔的小程序静态分类方法，写成一个简单的原
    },
    */
    频道: {
        包含项: ["分类", "排行", "周表"]//基础用法
    },
    主页: function(){
        let d = [];
        //自行实现页面样式元素
        return d;
    },
    二级: function(url){
        //自行实现代码
        let detail1 = '';
        let detail2 = '';
        let 简介 = '';
        let 图片 = '';
        let html = fetch(url);
        let 选集 = pdfa(html, '.play-list&&li').map((data) => {
            let 选集列表 = {};
            选集列表.title = pdfh(data, 'a--span--i&&Text')
            选集列表.url = pd(data, 'a&&href');
            //选集列表.extra = {};
            return 选集列表;
        })
        return { //如果有多线路，则传line: 线路数组, 则list应为多线路合并后的数组[线路1选集列表，线路2选集列表]
            detail1: "‘‘’’<font color=#FA7298>"+detail1+"</font>", //封面上面，可自由组合，可用html样式
            detail2: "‘‘’’<font color=#f8ecc9>"+detail2+"</font>", //封面下部，可自由组合，可用html样式
            //"detailurl"：封面url自己写点击想执行的事件,//可不传
            //detailextra: {},//封面附加,可不传
            desc: 简介,
            img: 图片, //不传则用上一级的图片
            //"line": 线路,//单线路可不传
            list: 选集, //如果有多线路，则list应为多线路合并后的数组[线路1选集列表数组, 线路2选集列表数组]
            //rule:1,//当接口类型为漫画、影视、音乐等选集解析是lazyRule时，且这个接口又有文章类的内容，可传此值可选集变为rule事件
            //type:"漫画",//可以强制指定当前内容为漫画或小说，优先于接口类型
            //moreitems: [],//二级扩展项，可以传任意样式元素对象数组，如当前影片的一些更多信息，不传则不显示，或长按样式可关闭，显示在线路上面
            //extenditems: [],//二级扩展项，可以传任意样式元素对象数组，如猜你所想列表，不传则不显示，或长按样式可关闭，显示在选集底部
        }  
    },
    搜索: function(name){
        let d = [];
        /*
        if(page>1){
            return d;//如果本身没有第2页，应主动输出为空
        }
        */
        //实现逻辑
        return d;
    },
    解析: function(url){
        let play = url;//自行实现
        return play;
    },
    最新: function(url){
        //自行实现获取最新章节名
        return '更新至：';
    }
}