let parse = {
    作者: '聚阅',
    版本: '2026100101',
    页码: {
        主页: true,
        分类: true
    },
    频道: {
        包含项: ["分类"]
    },
    主页: function(){
        let d = [];
        let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
        let json = PythonHiker.runPyGetReuslt(this.pyurl, this.id, "homeVideoContent");
        if(json){
            d.push({
            title: '‘‘’’<font color="#FF4757">▐ </font><b>热门推荐</b>',
            url: "hiker://empty",
            col_type: "text_1"
            });
            let vodlists = json.list || [];
            vodlists.forEach(it=>{
                d.push({
                    title: it.vod_name,
                    desc: it.vod_remarks || it.vod_year || '',
                    img: it.vod_pic,
                    url: it.vod_id.toString(),
                    col_type: 'movie_3'
                })
            })
            return d;
        }else{
            return this.主页();
        }
    },
    分类: function(){
        let d = [];
        let fold = getMyVar('dianbo$fold', "0");//是否展开小分类筛选
        let cate_id = getMyVar('dianbo$分类', '');
        let fl = storage0.getMyVar('dianbo$flCache') || {};
        let vodlists = [];
        let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
        
        if(page==1){
            let 分类 = [];
            let 推荐 = [];
            let 筛选;
            let classCache = storage0.getMyVar(this.id+'$classCache');
            if (classCache) {
                推荐 = classCache.推荐;
                分类 = classCache.分类;
                筛选 = classCache.筛选;
            } else {
                let home = PythonHiker.runPyGetReuslt(this.pyurl, this.id, "homeContent", true);
                let typelist = home['class'] || [];
                typelist.forEach(v=>{
                    分类.push(v.type_name + '$' + v.type_id);
                })
                筛选 = home['filters'];
                推荐 = home['list'] || [];
                if (分类.length > 0) {
                    storage0.putMyVar(this.id+'$classCache', { 分类: 分类, 筛选: 筛选, 推荐: 推荐 });
                }
            }

            if (分类.length > 0) {
                let Color = getItem('主题颜色','#3399cc');
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
                        //log(`Key: ${key}, Value: ${value}`);
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
            }
        }
        
        if (cate_id!="tj") {
            fl.cateId = fl.cateId || cate_id;
            cate_id = fl.cateId;
            delete fl.cateId;
            fl.typeid = cate_id;

            let json = PythonHiker.runPyGetReuslt(this.pyurl, this.id, "categoryContent", cate_id, PythonHiker.toInt(page), true, PythonHiker.toPyJson(fl));
            vodlists = json.list || [];
        }
        vodlists.forEach(it=>{
            d.push({
                title: it.vod_name,
                desc: it.vod_remarks || it.vod_year || '',
                img: it.vod_pic,
                url: it.vod_id.toString(),
                col_type: 'movie_3'
            })
        })
        return d;
    },
    二级: function(url){
        let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
        let html = PythonHiker.runPyGetReuslt(this.pyurl, this.id, "detailContent", [url]);
        let json = html.list[0];
        let detail1 = json.vod_actor || '';
        let detail2 = (json.vod_area || json.vod_year || '') + '\n' + (json.vod_remarks || json.vod_class || '') + '\n' + (json.type_name || '');
        let 简介 = json.vod_content || "";
        let 图片 = json.vod_pic;
        let 线路 = json.vod_play_from.split('$$$');
        let 选集 = json.vod_play_url.split('$$$').map(it => {
            return it.split('#').map(data => {
                let 选集列表 = {};
                let arr = data.split("$");
                选集列表.title = arr[0] || "";
                选集列表.url = arr[1] || "";
                return 选集列表;
            });
        });

        return {
            detail1: "‘‘’’<font color=#FA7298>"+detail1+"</font>",
            detail2: "‘‘’’<font color=#336633>"+detail2+"</font>",
            desc: 简介,
            img: 图片,
            line: 线路,
            list: 选集
        }  
    },
    搜索: function(name){
        let d = [];
        let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
        let json = PythonHiker.runPyGetReuslt(this.pyurl, this.id, "searchContent", name, false, PythonHiker.toInt(page));
        let vodlist = json.list || [];
        vodlist.forEach(it=>{
            d.push({
                title: it.vod_name,
                desc: it.vod_remarks || it.vod_year || '',
                img: it.vod_pic,
                url: it.vod_id.toString(),
                col_type: 'movie_3'
            });
        })
        return d;
    },
    解析: function(url){
        let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
        let play = PythonHiker.runPyGetReuslt(this.pyurl, this.id, "playerContent", '', url, []);
        if($.type(play.url) == "array"){
            play.url = play.url[1];
        }
        if(play.jx='1'){
            return $.require("parseUrl").解析(play.url);
        }
        return play.url;
    },
    最新: function(url){
        let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
        let html = PythonHiker.runPyGetReuslt(this.pyurl, this.id, "detailContent", [url]);
        let json = html.list[0];
        let lists = json.vod_play_url.split('$$$').map(it => {
            return it.split('#');
        });
        if(lists.length>0){
            //取线路选集最多的索引
            let indexOfMax = 0;
            let tempMax = lists[0].length;
            for(let i = 0; i < lists.length; i ++){
                if(lists[i].length > tempMax){
                    tempMax = lists[i].length;
                    indexOfMax = i;
                }
            }
            let list = lists[indexOfMax];
            try{
                let list1 = list[0].split('$')[0];
                let list2 = list[list.length-1].split('$')[0];
                if(parseInt(list1.match(/(\d+)/)[0])>parseInt(list2.match(/(\d+)/)[0])){
                    list.reverse();
                }
            }catch(e){
            }
            return list[list.length-1].split('$')[0];
        }
        return '';
    },
    新建模板: `let parse = {
        pyurl: '' //py文件链接，可以是在线地址也可以是本地文件路径
    }
    `
}