let parse = {
    作者: '',
    版本: '',
    host: '',//会写入MY_URL
    页码: {
        主页: true,
        分类: true,
        排行: true,
        更新: true
    },
    频道: {
        包含项: ["分类", "排行", "周表"]//基础用法
    },
    callApi: function(apitype, ...arr){
        let sourcename = this.sourcename;
        let pyurl = this.pyurl;
        let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
        return PythonHiker.runPyReuslt(sourcename, pyurl, apitype, ...arr);
    },
    主页: function(){
        let 分类 = [];
        let 推荐 = [];
        let 筛选;
        let classCache = storage0.getMyVar(jkdata.id+'$classCache');
        if (classCache) {
            推荐 = classCache.推荐;
            分类 = classCache.分类;
            筛选 = classCache.筛选;
        } else {
            let home = this.callApi("homeContent", true);
            
            let typelist = home['class'] || [];
            typelist.forEach(v=>{
                分类.push(v.type_name + '$' + v.type_id);
            })
            筛选 = home['filters'];
            let homeVod = home['list'] || [];
            homeVod.forEach(it=>{
                推荐.push({ "vod_url": it.vod_id.toString(), "vod_name": it.vod_name, "vod_desc": it.vod_remarks, "vod_pic": it.vod_pic });
            })
            if (分类.length > 0) {
                storage0.putMyVar(jkdata.id+'$classCache', { 分类: 分类, 筛选: 筛选, 推荐: 推荐 });
            }
        }

        let fold = getMyVar('dianbo$fold', "0");//是否展开小分类筛选
        let cate_id = getMyVar('dianbo$分类', '');
        let fl = storage0.getMyVar('dianbo$flCache') || {};
        let d = [];
        let vodlists = [];
        if (分类.length > 0) {
            let Color = getItem('主题颜色','#3399cc');
            try {
                cate_id = cate_id || (推荐.length > 0 ? 'tj' : 分类[0].split('$')[1]);

                if ($.type(筛选)=='object' && cate_id != 'tj') {
                    d.push({
                            title: fold === '1' ? '““””<b><span style="color: #F54343">∨</span></b>' : '““””<b><span style="color:' + Color + '">∧</span></b>',
                        url: $('#noLoading#').lazyRule((fold) => {
                            putMyVar('dianbo$fold', fold === '1' ? '0' : '1');
                            clearMyVar('dianbo$flCache');
                            refreshPage(false);
                            return "hiker://empty";
                        }, fold),
                        col_type: 'scroll_button'
                    })
                }
                putMyVar('dianbo$分类', cate_id);

                if (推荐.length > 0) {
                    if (cate_id == 'tj') {
                        vodlists = 推荐;//当前分类为推荐，取推荐列表
                    }
                    d.push({
                        title: cate_id == 'tj' ? '““””<b><span style="color:' + Color + '">' + '推荐' + '</span></b>' : '推荐',
                        url: $('#noLoading#').lazyRule(() => {
                            putMyVar('dianbo$分类', 'tj');
                            refreshPage(true);
                            return "hiker://empty";
                        }),
                        col_type: 'scroll_button',
                        extra: {
                            backgroundColor: cate_id=='tj'?"#20" + Color.replace('#',''):undefined
                        }
                    });
                }

                分类.forEach((it, i) => {
                    let itname = it.split('$')[0].replace(/|||/g, '').trim();
                    let itid = it.split('$')[1];
                    d.push({
                        title: cate_id == itid ? '““””<b><span style="color:' + Color + '">' + itname + '</span></b>' : itname,
                        url: $('#noLoading#').lazyRule((itid) => {
                            putMyVar('dianbo$分类', itid);
                            clearMyVar('dianbo$flCache');
                            refreshPage(true);
                            return "hiker://empty";
                        }, itid),
                        col_type: 'scroll_button',
                        extra: {
                            backgroundColor: cate_id==itid?"#20" + Color.replace('#',''):undefined
                        }
                    });
                })
                d.push({
                    col_type: "blank_block"
                });

                if (筛选 && fold == '1') {
                    Object.entries(筛选).forEach(([key, value]) => {
                        //console.log(`Key: ${key}, Value: ${value}`);
                        if (key == cate_id) {
                            if($.type(value)=="object"){
                                value = [value];
                            }
                            value.forEach(it => {
                                if (it.value.length > 0) {
                                    fl[it.key] = fl[it.key] || (it.value[0].v=="全部"?it.value[0].v:undefined);
                                    it.value.forEach((itit) => {
                                        d.push({
                                            title: fl[it.key] == itit.v ? '““””<b><span style="color:' + Color + '">' + itit.n + '</span></b>' : itit.n,
                                            url: $('#noLoading#').lazyRule((flkey, itid) => {
                                                let fl = storage0.getMyVar('dianbo$flCache') || {};
                                                fl[flkey] = itid;
                                                storage0.putMyVar('dianbo$flCache', fl);
                                                refreshPage(true);
                                                return "hiker://empty";
                                            }, it.key, itit.v),
                                            col_type: 'scroll_button',
                                            extra: {
                                                backgroundColor: fl[it.key]==itit.v?"#20" + Color.replace('#',''):""
                                            }
                                        });
                                    })
                                    d.push({
                                        col_type: "blank_block"
                                    });
                                }
                            })
                        }
                    });
                }
                storage0.putMyVar('dianbo$flCache', fl);
            } catch (e) {
                log('生成分类数据异常>' + e.message + " 错误行#" + e.lineNumber);
            }
        }
         if (cate_id!="tj") {
            try {
                fl.cateId = fl.cateId || cate_id;
                cate_id = fl.cateId;
                delete fl.cateId;
                fl.typeid = cate_id;

                let formatJo = this.callApi("categoryContent", cate_id, page, true, fl);
                let vodlist = formatJo.list || [];
                vodlist.forEach(it=>{
                    vodlists.push({ "vod_url": it.vod_id.toString(), "vod_name": it.vod_name, "vod_desc": it.vod_remarks, "vod_pic": it.vod_pic });
                })
            } catch (e) {
                log('获取列表异常>' + e.message + ' 错误行#' + e.lineNumber);
            }
        }
        vodlists.forEach(it=>{
            d.push({
                title: it.vod_name,
                desc: it.vod_desc,
                img: it.vod_pic,
                url: it.vod_url,
                col_type: 'movie_3'
            })
        })
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
        if(page>1){
            return d;//如果本身没有第2页，应主动输出为空
        }
        
        //实现逻辑
        return d;
    },
    解析: function(url){
        let play = url;//自行实现
        return play;
    },
    最新: function(url){
        //自行实现获取最新章节名
        return '';
    },
    新建模板: `let parse = {
        pyurl: '' //py文件链接，可以是在线地址也可以是本地文件路径
    }
    `
}