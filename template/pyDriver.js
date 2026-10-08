let parse = {
    作者: '聚阅',
    版本: '2026100811',
    页码: {
        主页: true
    },
    获取更新: function(){
        return {
            url: (config.聚阅||getPublicItem('聚阅','')).replace(/[^/]*$/,'') + 'template/pyDriver.js',
            onlyCache: 1
        }
    },
    _readDir: function(input){
        showLoading("扫描目录py文件");
        input = input || juItem.get('pypath');
        let pyfiles = readDir(input).filter(v=>v.endsWith('.py'));
        let pylists = pyfiles.map(it=>{
            return {
                name: it.slice(0, -3),
                url: input+it
            }
        });
        storage0.putMyVar('pylists', pylists);
        hideLoading();
        return pylists;
    },
    主页预加载: function(){
        let pyConfig = juItem.getAll();
        let pypath = pyConfig.pypath || '';
        let pySource = pyConfig.pySource || {};
        let pyurl = pySource.url || '';
        let pyname = pySource.name || '';
        let pylists = storage0.getMyVar('pylists') || this._readDir(pypath);
        if((pyurl==''||pyname=='')&&pylists.length>0){
            let pydefault = pylists[0];
            pyurl = pydefault.url;
            pyname = pydefault.name;
            juItem.set('pySource', pydefault);
            toast('已默认第1个py为当前源');
        }
        
        let d = [];
        d.push({
            title: (pyname?'当前:'+pyname:'选择py源'),
            desc: '点击更换' + '(' + pylists.length+')',
            url: $('#noLoading#').lazyRule((_readDir) => {
                function getpylist() {
                    let pylists = storage0.getMyVar('pylists') || _readDir();
                    let sourceSort = juItem.get('sourceSort', 0);
                    if(sourceSort == 1){
                        function sortByPinyin(arr) {
                            let arrNew = arr.sort((a, b) => a.name.localeCompare(b.name));
                            for (let m in arrNew) {
                                let mm = /^[\u4e00-\u9fa5]/.test(arrNew[m].name) ? m : '-1';
                                if (mm > -1) {
                                    break;
                                }
                            }
                            for (let n = arrNew.length - 1; n >= 0; n--) {
                                let nn = /^[\u4e00-\u9fa5]/.test(arrNew[n].name) ? n : '-1';
                                if (nn > -1) {
                                    break;
                                }
                            }
                            if (mm > -1) {
                                let arrTmp = arrNew.splice(m, parseInt(n - m) + 1);
                                arrNew = arrNew.concat(arrTmp);
                            }
                            return arrNew
                        }
                        pylists = sortByPinyin(pylists);
                    }else if(sourceSort == 2){
                        pylists.forEach(it=>{
                            let pyset = sourceSet[it.name] || {};
                            it.sort = pyset['sort'] || 0;
                        })
                        pylists.sort((a, b) => {
                            return b.sort - a.sort
                        })
                    }
                    return pylists;
                }

                
                let sourceSet = juItem.get('sourceSet') || {};
                let sourceList = getpylist();
                let tmpList = [];

                const hikerPop = $.require(libspath + "plugins/hikerPop.js");
                hikerPop.setUseStartActivity(false);
                
                let sourceName = "";
                let pySource = juItem.get('pySource') || {};
                let index = sourceList.findIndex(v=>v.url==pySource.url);
                if(index>-1){
                    sourceName = pySource.name;
                    sourceList[index].name = `‘‘’’<strong><font color="`+getItem('主题颜色','#6dc9ff')+`">`+sourceList[index].name+`</front></strong>`;
                }

                let spen = 2;
                let inputBox;
                let pop = hikerPop.selectBottomRes({
                    options: [],
                    columns: spen,
                    title: "当前:" + (sourceName||"未选择") + "  合计:" + sourceList.length,
                    noAutoDismiss: true,
                    toPosition: index,
                    extraInputBox: (inputBox = new hikerPop.ResExtraInputBox({
                        hint: "输入py源关键字筛选",
                        onChange(s, manage) {
                            putMyVar("SrcJu_pysourceListFilter", s);
                            tmpList = sourceList.filter(x => x.name.toLowerCase().includes(s.toLowerCase()));
                            manage.list.length = 0;
                            tmpList.forEach((x) => {
                                manage.list.push(x.name);
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
                        let homeSource = sourceList.find(v=>v.name===input);
                        delete homeSource['sort'];
                        juItem.set('pySource', homeSource);
                        let pyset = sourceSet[input] || {};
                        pyset['sort'] = (pyset['sort'] || 0) + 1;
                        sourceSet[input] = pyset;
                        juItem.set('sourceSet', sourceSet);

                        clearMyVar('主页动态加载loading');
                        refreshPage(true);
                        
                        return 'toast://' + '主页源已设置为：' + input;
                    },
                    menuClick(manage) {
                        let menuarr = ["改变列表样式", "改变排序方式", "更新目录缓存", "更换目录路径"];
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
                                    let sortlist = ['按读取目录顺序', '按文件名称排序', '按使用频率排序'];
                                    let sourceSort = juItem.get('sourceSort', 0);
                                    hikerPop.selectCenter({
                                        options: sortlist,
                                        columns: 1,
                                        title: "选择排序方式",
                                        position: sourceSort,
                                        click(a, i) {
                                            pop.dismiss();
                                            juItem.set('sourceSort', i);
                                            hikerPop.runOnNewThread(() => {
                                                return 'toast://列表排序设置为:' + a;
                                            });
                                        }
                                    });
                                } else if (i === 2) {
                                    pop.dismiss();
                                    clearMyVar('pylists');
                                    return 'toast://已更新目录缓存';
                                } else if (i === 3) {
                                    pop.dismiss();
                                    clearMyVar('pylists');
                                    juItem.clear('pypath');
                                    juItem.clear('pySource');
                                    refreshPage(false);
                                }
                            }
                        });
                    }
                });
                return 'hiker://empty';
            }, this._readDir),
            img: 'https://pic.pngsucai.com/00/87/33/7cf2329520ab81fd.webp',
            col_type: 'avatar',
            extra: {
                longClick: [{
                    title: "删除",
                    js: $.toString((pyurl, pyname) => {
                        return $("确定要删除<"+pyname+">本地源文件？").confirm((pyurl, pyname)=>{
                            deleteFile('file://' + pyurl);
                            let pylists = storage0.getMyVar('pylists');
                            pylists = pylists.filter(it=>it.url!=pyurl);
                            storage0.putMyVar('pylists', pylists);
                            juItem.clear('pySource');
                            let sourceSet = juItem.get('sourceSet') || {};
                            delete sourceSet[pyname];
                            juItem.set('sourceSet', sourceSet);
                            
                            refreshPage(false);
                            return "toast://已删除当前py源";
                        }, pyurl, pyname)
                    }, pyurl, pyname)
                },{
                    title: "重载",
                    js: $.toString((pyurl) => {
                        GM.clear(pyurl);
                        refreshPage(false);
                        return "toast://已重新加载当前py源文件";
                    }, pyurl)
                },{
                    title: "分享",
                    js: $.toString((pyurl) => {
                        return 'share://file://'+ pyurl;
                    }, pyurl)
                },{
                    title: "编辑",
                    js: $.toString((pyurl) => {
                        return 'editFile://file://'+ pyurl + `@js=toast('需重载后才可以生效');`;
                    }, pyurl)
                },{
                    title: ((juItem.get('sourceSet')||{})[pyname]||{})['yiparse']?"二级播放":"一级播放",
                    js: $.toString((pyname) => {
                        let sourceSet = juItem.get('sourceSet') || {};
                        let pyset = sourceSet[pyname] || {};
                        let isyiparse = pyset['yiparse'] || 0;
                        let sm;
                        if(isyiparse){
                            delete pyset['yiparse'];
                            sm = '二级播放';
                        }else{
                            pyset['yiparse'] = 1;
                            sm = '一级播放';
                        }
                        sourceSet[pyname] = pyset;
                        juItem.set('sourceSet', sourceSet);
                        refreshPage(false);
                        return "toast://" + pyname + ">已切换为：" + sm;
                    }, pyname)
                }]
            }
        })
        return d;
    },
    主页: function(){
        let d = [];
        let pyConfig = juItem.getAll();
        let pypath = pyConfig.pypath || '';
        let pySource = pyConfig.pySource || {};
        let pyurl = pySource.url || '';
        let pyname = pySource.name || '';
        
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
                url: $('#noLoading#').lazyRule((_readDir) => {
                    let input = getMyVar('importinput', '').trim();
                    if(!input.endsWith('/') || !input.startsWith('/')){
                        return 'toast://文件夹路径不正确，以/开头结尾';
                    }
                    let pylists = _readDir(input);
                    
                    if(pylists.length>0){
                        clearMyVar('dianbo$分类');
                        clearMyVar('dianbo$fold');
                        clearMyVar('dianbo$classCache');
                        clearMyVar('dianbo$flCache');
                        clearMyVar('主页动态加载loading');

                        let importrecord = juItem.get('importrecord')||[];
                        if(importrecord.length>20){//保留20个记录
                            importrecord.shift();
                        }
                        if(!importrecord.some(item => item==input)){
                            importrecord.push(input);
                            juItem.set('importrecord', importrecord);
                        }

                        juItem.set('pypath', input);
                        refreshPage(true);
                    }

                    return "toast://发现" + pylists.length + "个py文件";
                }, this._readDir),
                col_type: "text_center_1"
            });
            d.push({
                col_type: "line_blank"
            });
            d.push({
                title: '🆖 历史记录',
                col_type: "rich_text"
            });
            let importrecord = juItem.get('importrecord')||[];
            let lists = importrecord;
            lists.reverse();
            
            if(lists.length>0){
                for(let i=0;i<lists.length;i++){
                    d.push({
                        title: lists[i],
                        url: $('#noLoading#').lazyRule((url) => {
                            putMyVar('importinput', url);
                            refreshPage(true);
                            return "toast://已选择，需确定扫描";
                        }, lists[i]),
                        col_type: "text_1",
                        extra: {
                            id: lists[i],
                            longClick: [{
                                title: "删除",
                                js: $.toString((url) => {
                                    let importrecord = juItem.get('importrecord')||[];
                                    importrecord = importrecord.filter(v=>v!=url);
                                    juItem.set('importrecord', importrecord);
                                    refreshPage(false);
                                    return "toast://已删除";
                                },lists[i])
                            }]
                        }
                    });
                }
            }else{
                d.push({
                    title: '↻无记录',
                    col_type: "rich_text"
                });
            }
            return d;
        }else{
            if(pyurl && pyname){
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
                            分类 = home['class'] || [];
                            筛选 = home['filters'];
                            推荐 = home['list'] || [];
                            if (分类.length > 0) {
                                storage0.putMyVar('dianbo$classCache', { 分类: 分类, 筛选: 筛选, 推荐: 推荐 });
                            }
                        }

                        if (分类.length > 0) {
                            let Color = getItem('主题颜色','#3399cc');
                            cate_id = cate_id || (推荐.length > 0 ? 'tj' : 分类[0].type_id);

                            if ($.type(筛选)=='object' && Object.keys(筛选).length>0 && cate_id != 'tj') {
                                d.push({
                                        title: fold === '1' ? '““””<b><span style="color: #F54343">∧</span></b>' : '““””<b><span style="color:' + Color + '">∨</span></b>',
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
                                let itname = it.type_name.replace(/|||/g, '').trim();
                                let itid = it.type_id;
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
                        let json = PythonHiker.runPyGetReuslt(pyurl, "categoryContent", cate_id, PythonHiker.toInt(page), true, PythonHiker.toPyJson(fl));
                        vodlists = json.list || [];
                    }
                    let sourceSet = juItem.get('sourceSet') || {};
                    let pyset = sourceSet[pyname] || {};
                    let isyiparse = pyset['yiparse'] || 0;
                    function yiparseF(url, MY_PARAMS) {
                        let parse = $.require("jiekou").parse();
                        eval("let 二级获取 = " + parse['二级'])
                        let erLoadData = 二级获取.call(parse, url);
                        let list = erLoadData.list[0];
                        let line = erLoadData.line[0];
                        let dataObj = {line: line};
                        eval("let 解析2 = " + parse['解析']);
                        let playUrl = 解析2.call(parse, list[0].url);
                        return playUrl;
                    }
                    vodlists.forEach(it=>{
                        let folderlistF = $("hiker://empty##fypage#noRecordHistory##noHistory#").rule((url, yiparseF) => {
                            let pySource = MY_PARAMS.pySource;
                            let pyurl = pySource.url;
                            let cate_id = url;
                            let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
                            let json = PythonHiker.runPyGetReuslt(pyurl, "categoryContent", cate_id, PythonHiker.toInt(MY_PAGE), true, PythonHiker.toPyJson({}));
                            let vodlists = json.list || [];
                            let d = [];
                            vodlists.forEach(it=>{
                                d.push(toerji({
                                    title: it.vod_name,
                                    desc: it.vod_remarks || it.vod_year || '',
                                    img: it.vod_pic,
                                    url: yiparseF?$('').lazyRule((url, params, yiparseF) => {
                                        return yiparseF(url, params);
                                    }, it.vod_id.toString(), {pySource: pySource}, yiparseF):it.vod_id.toString(),
                                    col_type: 'movie_3',
                                    extra: {
                                        pySource: pySource
                                    }
                                }, MY_PARAMS.data))
                            })
                            setResult(d);
                        }, it.vod_id.toString(), isyiparse?yiparseF:undefined)

                        d.push({
                            title: it.vod_name,
                            desc: it.vod_remarks || it.vod_year || '',
                            img: it.vod_pic,
                            url: it.vod_tag=='folder' ? folderlistF : isyiparse ? $('').lazyRule((url, params, yiparseF) => {
                                return yiparseF(url, params);
                            }, it.vod_id.toString(), {pySource: pySource}, yiparseF) : it.vod_id.toString(),
                            col_type: 'movie_3',
                            extra: {
                                pySource: pySource
                            }
                        })
                    })
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
        let pySource = MY_PARAMS.pySource;
        let pyurl = pySource.url;
        storage0.putMyVar('pySource', pySource);
        let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
        let html = PythonHiker.runPyGetReuslt(pyurl, "detailContent", PythonHiker.toPyJson([url]));
        let list = html.list || [];
        let json = list.length>0?list[0]:{};
        let detail1 = json.vod_actor || "";
        let detail2 = (json.vod_area || json.vod_year || "") + '\n' + (json.vod_remarks || json.vod_class || "") + '\n' + (json.type_name || '');
        let 简介 = json.vod_content || "";
        let 图片 = json.vod_pic || "";
        let 线路 = json.vod_play_from?json.vod_play_from.split('$$$'):[];
        let 选集 = json.vod_play_url?json.vod_play_url.split('$$$').map(it => {
            return it.split('#').map((data) => {
                let 选集列表 = {};
                let arr = data.split("$");
                选集列表.title = arr[0] || "";
                选集列表.url = arr[1] || "";
                return 选集列表;
            });
        }):[];

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
        let pySource = juItem.get('pySource') || {};
        let pyurl = pySource.url;
        let d = [];
        if(pyurl){
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
                        pySource: pySource
                    }
                });
            })
        }
        return d;
    },
    解析: function(url){
        let pySource = storage0.getMyVar('pySource') || {};
        let pyurl = pySource.url;
        let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
        let play = PythonHiker.runPyGetReuslt(pyurl, "playerContent", dataObj.line, url, PythonHiker.toPyJson([]));
        log(play);
        if(play.jx=='1' || play.parse=='1'){
            return $.require("parseUrl").解析(play.url||url);
        }
        play.url = play.url || play.playUrl;
        if(play.url){
            let urls, headers;
            if($.type(play.url) == "array"){
                urls = play.url;
            }
            if(play.header){
                if($.type(play.url) == "string"){
                    urls = [play.url+'#isVideo=true#'];
                }
                function parseHttpHeaders(input, refArr) {
                    const targetLen = refArr.length;
                    let baseVal = input;
                    let parseOk = true;
                    if (typeof baseVal === "string") {
                        try {
                            const parsed = JSON.parse(baseVal);
                            if ($.type(parsed) === "object") {
                                baseVal = parsed;
                            } else {
                                parseOk = false;
                            }
                        } catch (e) {
                            parseOk = false;

                        }
                        if (!parseOk) {
                            return undefined;
                        }
                    }

                    let baseArr = Array.isArray(baseVal) ? baseVal : [baseVal];
                    let result = [];
                    for(let i = 0; i < targetLen; i++){
                        result.push(baseArr[i % baseArr.length]);
                    }
                    return result;
                }

                headers = parseHttpHeaders(play.header, urls);
            }
            if(urls){
                return JSON.stringify({
                    urls: urls,
                    headers: headers
                }); 
            }
        }

        return play.url || url;
    },
    最新: function(url){
        try{
            let pySource = MY_PARAMS.pySource;
            let pyurl = pySource.url;
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
                let list1 = list[0].split('$')[0];
                let list2 = list[list.length-1].split('$')[0];
                if(parseInt(list1.match(/(\d+)/)[0])>parseInt(list2.match(/(\d+)/)[0])){
                    list.reverse();
                }
                return list[list.length-1].split('$')[0];
            }
        }catch(e){
            //log(e.message + " 错误行#" + e.lineNumber);
        }
        return '';
    }
}