let parse = {
    作者: '聚阅',
    版本: '2026100101',
    页码: {
        主页: true
    },
    _readDir: function(input, pycache){
        if(!input.endsWith('/') || !input.startsWith('/')){
            return 'toast://文件夹路径不正确，以/开头结尾';
        }
        showLoading("正在扫描本地文件夹");
        let pyfiles = readDir(input).filter(v=>(v.endsWith('.py')));
        if(pyfiles.length>0){
            pyfiles = pyfiles.map(it=>input+it);
            writeFile(pycache, JSON.stringify(pyfiles));
            juItem.set('pypath', input);
        }
        hideLoading();
        return pyfiles;
    },
    主页: function(){
        let d = [];
        let pyConfig = juItem.getAll();
        let pypath = pyConfig.pypath || '';
        let pyurl = pyConfig.pyurl || '';
        let pycache = cachepath + 'pylist.json';
        if(!pypath || !fileExist('file://' + pypath)){
            d.push({
                title: '‘‘’’<font color="#FF4757">▐ </font><b>需先设置py文件所在目录</b>',
                url: "hiker://empty",
                col_type: "text_1"
            });
            d.push({
                title:'本地选择',
                col_type: 'input',
                desc: '手工输入目录路径',
                url: $.toString(() => {
                    return `fileSelect://`+$.toString(()=>{
                        if(!MY_PATH){
                            return "toast://获取文件真实路径失败：不支持通过文件管理器获取，可手工填写目录路径";
                        }
                        MY_PATH = MY_PATH.substr(0, MY_PATH.lastIndexOf('/')+1)
                        putMyVar("importinput",MY_PATH);
                        refreshPage();
                        return "hiker://empty";
                    })
                }),
                extra: {
                    titleVisible: true,
                    defaultValue: getMyVar('importinput', ''),
                    onChange: 'putMyVar("importinput",input);'
                }
            });
            d.push({
                title: '🆗 确定扫描',
                url: $('#noLoading#').lazyRule((_readDir, pycache) => {
                    let input = getMyVar('importinput', '').trim();
                    let pyfiles = _readDir(input, pycache);
                    clearMyVar('主页动态加载loading');
                    refreshPage();
                    return "toast://找到" + pyfiles.length + "个py文件";
                }, this._readDir, pycache),
                col_type: "text_center_1"
            });
        }else{
            let pyfiles = fileExist(pycache)?JSON.parse(fetch(pycache)):this._readDir(pypath, pycache);
            
            d.push({
                title: pyurl?pyurl.match(/[^\/]+(?=\.py$)/)[0]:'选择py源',
                url: $('#noLoading#').lazyRule((pyfiles, pyurl) => {
                    let sourceList = pyfiles.map((it, i)=>{
                        return {name: it.match(/[^\/]+(?=\.py$)/)[0], index: i};
                    });
                    let tmpList = [];
                    let tmpIndexs = {};

                    const hikerPop = $.require(libspath + "plugins/hikerPop.js");
                    hikerPop.setUseStartActivity(false);

                    let index = pyfiles.indexOf(pyurl);
                    let sourceName = "";
                    if(index>0){
                        sourceName = sourceList[index].name;
                        sourceList[index].name = `‘‘’’<strong><font color="`+getItem('主题颜色','#6dc9ff')+`">`+sourceList[index].name+`</front></strong>`;
                    }

                    let spen = 3;
                    let inputBox;
                    let pop = hikerPop.selectBottomRes({
                        options: [],
                        columns: spen,
                        title: "当前:" + (sourceName||"未选择") + "  合计:" + sourceList.length,
                        noAutoDismiss: true,
                        //position: index,
                        toPosition: index,
                        extraInputBox: (inputBox = new hikerPop.ResExtraInputBox({
                            hint: "输入py源关键字筛选",
                            onChange(s, manage) {
                                putMyVar("SrcJu_pysourceListFilter", s);
                                tmpList = sourceList.filter(x => x.name.toLowerCase().includes(s.toLowerCase()));
                                manage.list.length = 0;
                                tmpList.forEach((x, i) => {
                                    manage.list.push(x.name);
                                    tmpIndexs[i] = x.index;
                                });
                                manage.change();
                            },
                            defaultValue: getMyVar("SrcJu_pysourceListFilter", ""),
                            titleVisible: false
                        })),
                        longClick(s, i, manage) {

                        },
                        click(s, i, manage) {
                            pop.dismiss();
                            let input = s.replace(/[’‘]|<[^>]*>/g, "");
                            
                            clearMyVar('dianbo$分类');
                            clearMyVar('dianbo$fold');
                            clearMyVar('dianbo$classCache');
                            clearMyVar('dianbo$flCache');
                            juItem.set('pyurl', pyfiles[tmpIndexs[i]]);
                            clearMyVar('主页动态加载loading');
                            refreshPage(true);
                            
                            return 'toast://' + '主页源已设置为：' + input;
                        },
                        menuClick(manage) {
                            let menuarr = ["改变列表样式", "列表倒序排列", "选择排序方式"];
                            if(lockgroups.length>0){
                                menuarr.push("显示加锁分组");
                            }
                            hikerPop.selectCenter({
                                options: menuarr,
                                columns: 2,
                                title: "请选择",
                                click(s, i) {
                                    if (i === 0) {
                                        spen = spen == 3 ? 2 : 3;
                                        manage.changeColumns(spen);
                                        manage.scrollToPosition(index, false);
                                    } else if (i === 1) {
                                        manage.list.reverse();
                                        manage.change();
                                        manage.scrollToPosition(index, true);
                                    } else if (i === 2) {
                                        let sorttype = ["更新时间","接口名称","使用频率"].map(v=>v==getItem('sourceListSort','更新时间')?v+"√":v);
                                        showSelectOptions({
                                            "title": "选择排序方式", 
                                            "options" : sorttype, 
                                            "col": 1, 
                                            "js": `setItem('sourceListSort', input.replace("√",""));'toast://排序方式在下次生效：' + input.replace("√","")`
                                        })
                                    } else if (i === 3) {
                                        if (hikerPop.canBiometric() !== 0) {
                                            return "toast://调用生物学验证出错";
                                        }
                                        let pop = hikerPop.checkByBiometric(() => {
                                            putMyVar('Src_Jy_已验证指纹','1');
                                            toast("验证成功，重新点切换站源吧");
                                        });
                                    }
                                }
                            });
                        }
                    });
                    return 'hiker://empty';
                }, pyfiles, pyurl),
                col_type: 'text_3'
            })
            d.push({
                title: '上一个',
                url: '',
                col_type: 'text_3'
            })
            d.push({
                title: '下一个',
                url: '',
                col_type: 'text_3'
            })
            setPreResult(d);
            d = [];

            if(pyurl){
                if(!pyurl.startsWith('http') && !fileExist('file://'+pyurl)){
                    d.push({
                        title: pyurl + '文件不存在',
                        url: 'hiker://empty',
                        col_type: "text_center_1"
                    });
                }else{
                    let fold = getMyVar('dianbo$fold', "0");//是否展开小分类筛选
                    let cate_id = getMyVar('dianbo$分类', '');
                    let fl = storage0.getMyVar('dianbo$flCache') || {};
                    let vodlists = [];
                    let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
                    
                    if(page==1){
                        let 分类 = [];
                        let 推荐 = [];
                        let 筛选;
                        let classCache = storage0.getMyVar('dianbo$classCache');
                        if (classCache) {
                            推荐 = classCache.推荐;
                            分类 = classCache.分类;
                            筛选 = classCache.筛选;
                        } else {
                            let home = PythonHiker.runPyGetReuslt(pyurl, "homeContent", true);
                            let typelist = home['class'] || [];
                            typelist.forEach(v=>{
                                分类.push(v.type_name + '$' + v.type_id);
                            })
                            筛选 = home['filters'];
                            推荐 = home['list'] || [];
                            if (分类.length > 0) {
                                storage0.putMyVar('dianbo$classCache', { 分类: 分类, 筛选: 筛选, 推荐: 推荐 });
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
                    log('aaa');
                    if (cate_id!="tj") {
                        fl.cateId = fl.cateId || cate_id;
                        cate_id = fl.cateId;
                        delete fl.cateId;
                        fl.typeid = cate_id;
                        log('ccc');
                        let json = PythonHiker.runPyGetReuslt(pyurl, "categoryContent", cate_id, PythonHiker.toInt(page), true, PythonHiker.toPyJson(fl));
                        log('ddd');
                        vodlists = json.list || [];
                    }
                    vodlists.forEach(it=>{
                        d.push({
                            title: it.vod_name,
                            desc: it.vod_remarks || it.vod_year || '',
                            img: it.vod_pic,
                            url: it.vod_id.toString(),
                            col_type: 'movie_3',
                            extra: {
                                pyurl: pyurl
                            }
                        })
                    })
                    //log(vodlists);
                    log('bbb');
                }
            }else{
                d.push({
                    title: '请先选择py源',
                    url: 'hiker://empty',
                    col_type: "text_center_1"
                });
            }
        }
        return d;
    },
    二级: function(url){
        let pyurl = MY_PARAMS.pyurl;
        let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
        let html = PythonHiker.runPyGetReuslt(pyurl, "detailContent", [url]);
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
        let pyurl = juItem.get('pyurl');
        let d = [];
        let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
        let json = PythonHiker.runPyGetReuslt(pyurl, "searchContent", name, false, PythonHiker.toInt(page));
        let vodlist = json.list || [];
        vodlist.forEach(it=>{
            d.push({
                title: it.vod_name,
                desc: it.vod_remarks || it.vod_year || '',
                img: it.vod_pic,
                url: it.vod_id.toString(),
                col_type: 'movie_3',
                extra: {
                    pyurl: pyurl
                }
            });
        })
        return d;
    },
    解析: function(url){
        let pyurl = juItem.get('pyurl');
        let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
        let play = PythonHiker.runPyGetReuslt(pyurl, id, "playerContent", '', url, []);
        if($.type(play.url) == "array"){
            play.url = play.url[1];
        }
        if(play.jx='1'){
            return $.require("parseUrl").解析(play.url);
        }
        return play.url;
    },
    最新: function(url){
        let pyurl = juItem.get('pyurl');
        let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
        let html = PythonHiker.runPyGetReuslt(pyurl, "detailContent", [url]);
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