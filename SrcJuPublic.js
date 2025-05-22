// 本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
let libspath = "hiker://files/data/聚阅/"; //依赖文件路径
let rulepath = "hiker://files/rules/Src/Juyue/"; //规则文件路径
let cachepath = "hiker://files/_cache/Juyue/"; //缓存文件路径
let jkfilespath = rulepath + "jiekou/"; //接口数据文件路径
let jkfile = rulepath + "jiekou.json";
let cfgfile = rulepath + "config.json";
let codepath = (config.聚阅||getPublicItem('聚阅','https://raw.gitcode.com/src48597962/juyue/raw/master/SrcJu.js')).replace(/[^/]*$/,'');
let gzip = $.require(codepath + "plugins/gzip.js");

if(!fileExist(jkfile) && fileExist("hiker://files/rules/Src/Ju/jiekou.json")){
    let olddatalist = JSON.parse(fetch("hiker://files/rules/Src/Ju/jiekou.json"));
    olddatalist.forEach(it=>{
        it.id = it.type+"_"+it.name;
        let newjkfile = Object.assign({}, it.public, it.parse, it.erparse);
        it.group = it.type=="听书"?"听书":it.group;
        it.type = it.type=="听书"?"音频":it.type;
        it.group = it.type=="影视"?"影视":it.group;
        it.type = it.type=="影视"?"视频":it.type;
        delete it.updatetime;
        delete it.public;
        delete it.parse;
        delete it.erparse;
        writeFile(jkfilespath+it.id+'.json', JSON.stringify(newjkfile));
    })
    writeFile(jkfile, JSON.stringify(olddatalist));
}

let Juconfig = {};
let Jucfg = fetch(cfgfile);
if (Jucfg != "") {
    eval("Juconfig=" + Jucfg + ";");
}

let runTypes = ["漫画", "小说", "图集", "视频", "音频", "聚合", "其它"];
let homeGroup = Juconfig["homeGroup"] || "";
let homeSourceId = Juconfig["homeSourceId"] || "";
let sourcename = homeSourceId.split('_').slice(1).join('_');//旧源名称

//获取接口列表数据
function getDatas(lx, isyx) {
    let datalist = [];
    let sourcedata = fetch(jkfile);
    if(sourcedata != ""){
        try{
            eval("datalist=" + sourcedata+ ";");
        }catch(e){ }
    }
     
    if (lx == "yi") {
        datalist = datalist.filter(it => it.parse);
    } else if (lx == "er") {
        datalist = datalist.filter(it => it.erparse);
    }
    
    if (getItem("sourceListSort") == "接口名称") {
        datalist = sortByPinyin(datalist);
    }else{
        datalist.reverse();
    }
    
    let withoutStop = datalist.filter(item => !item.stop);
    if(isyx){
        return withoutStop;
    }
    // 禁用的放到最后
    let withStop = datalist.filter(item => item.stop);
    // 合并数组
    let result = withoutStop.concat(withStop);

    return result;
}
// 获取分组接口列表
function getGroupLists(datas, k) {
    k = k=="全部"?"":k;
    datas = datas.filter(it=>{
        let group = it.group||it.type;
        return !k || (k==group);
    })

    return datas;
}
//获取接口分组名arry
function getJiekouGroups(datas) {
    let groupNams = [];
    datas.forEach(it => {
        let group = it.group||it.type;
        if (groupNams.indexOf(group)==-1){
            groupNams.push(group);
        }
    })
    return groupNams;
}
//获取类型名称数组
function getTypeNames(is) {
    let snames = [];
    if (is == "搜索页") {
        snames = ["漫画", "小说", "听书", "影视", "聚合"];
    } else {
        snames = runTypes;
    }
    return snames;
}
//获取分组名称数组
function getGroupNames() {
    let gnames = [];
    getDatas('all', true).forEach(it => {
        if (it.group && gnames.indexOf(it.group) == -1) {
            gnames.push(it.group);
        }
    })
    return gnames;
}
// 接口处理公共方法
function dataHandle(data, input) {
    let sourcedata = fetch(jkfile);
    eval("let datalist=" + sourcedata + ";");

    let waitlist= [];
    if($.type(data)=='object'){
        waitlist.push(data);
    }else if($.type(data)=='array'){
        waitlist = data;
    }
    
    waitlist.forEach(it => {
        let index = datalist.findIndex(item => item.id === it.id);
        if(input == "禁用"){
            datalist[index].stop = 1;
        }else if(input == "启用"){
            delete datalist[index].stop;
        }else if(input == "置顶"){
            const [target] = datalist.splice(index, 1);
            datalist.push(target);
        }
    })
    writeFile(jkfile, JSON.stringify(datalist));
    clearMyVar('SrcJu_searchMark');
    clearMyVar('duoSelectLists');
    return input + '：已处理' + waitlist.length + '个';
}
// 文字上色
function colorTitle(title, Color) {
    return '<font color="' + Color + '">' + title + '</font>';
}
// 获取接口对应的显示标题
function getDataTitle(data) {
    return data.name + '  <small><font color=grey>('+data.type+')' + (data.parse ? " [主页源]" : "") + (data.erparse ? " [搜索源]" : "") + '</font></small>';
}
// 接口多选处理方法
function duoselect(data){
    let waitlist= [];
    if($.type(data)=='object'){
        waitlist.push(data);
    }else if($.type(data)=='array'){
        waitlist = data;
    }

    let selectlist = storage0.getMyVar('duoSelectLists') || [];
    waitlist.forEach(data=>{
        if(!selectlist.some(item => data.id==item.id)){
            selectlist.push(data);
            updateItem(data.id, {title: colorTitle(getDataTitle(data),'#3CB371')});
        }else{
            let index = selectlist.indexOf(selectlist.filter(d => data.id==d.id )[0]);
            selectlist.splice(index, 1);
            updateItem(data.id, {title:data.stop?colorTitle(getDataTitle(data),'#f20c00'):getDataTitle(data)});
        }
    })
    storage0.putMyVar('duoSelectLists',selectlist);
}

//删除统一入口
function deleteData(data){
    let sourcedata = fetch(jkfile);
    eval("let datalist=" + sourcedata + ";");
    let dellist= [];
    if(!data){
        dellist = Object.assign(dellist, datalist);
    }else if($.type(data)=='object'){
        dellist.push(data);
    }else if($.type(data)=='array'){
        dellist = data;
    }

    dellist.forEach(it => {
        let index = datalist.indexOf(datalist.filter(d => it.id==d.id )[0]);
        datalist.splice(index, 1);
    })

    writeFile(jkfile, JSON.stringify(datalist));
    clearMyVar('SrcJu_searchMark');
    clearMyVar('duoSelectLists');
}
//执行切换源接口
function changeSource(sourceid) {
    if (homeSourceId==sourceid) {
        return 'toast://主页源：' + sourceid;
    }
    if (typeof (unRegisterTask) != "undefined") {
        unRegisterTask("juyue");
    } else {
        toast("软件版本过低，可能存在异常");
    }
    try {
        let listMyVar = listMyVarKeys();
        listMyVar.forEach(it => {
            if (!/^SrcJu_|initConfig|gmParams/.test(it)) {
                clearMyVar(it);
            }
        })
    } catch (e) {
        log("切源清理接口变量异常>" + e.message + " 错误行#" + e.lineNumber);
        toast('软件版本过低，请升级软件');
    }
    try {
        refreshX5WebView('about:blank');
    } catch (e) { }

    Juconfig['homeSourceId'] = sourceid;
    writeFile(cfgfile, JSON.stringify(Juconfig));
    refreshPage(false);
    return 'toast://主页源已设置为：' + sourceid;
}
//封装选择主页源方法
function selectSource(selectType) {
    const hikerPop = $.require(config.聚阅.replace(/[^/]*$/,'') + "plugins/hikerPop.js");
    let sourceList = getDatas("yi", true);
    if(selectType){
        sourceList = getGroupLists(sourceList, selectType);
    }
    let tmpList = sourceList;
    hikerPop.setUseStartActivity(false);

    function getitems(list) {
        let index = -1;
        let items = list.map((v,i) => {
            if(v.id==homeSourceId){
                index = i;
            }
            return {title:v.name, icon:v.img, url:v.id};
        });
        return {items:items, index:index};
    }

    let index_items = getitems(sourceList);
    let index = index_items.index;
    let items = index_items.items;
    let spen = 3;

    let pop = hikerPop.selectBottomResIcon({
        iconList: items,
        columns: spen,
        title: "当前源>" + (homeSourceId||"无"),
        noAutoDismiss: false,
        position: index,
        toPosition: index,
        extraInputBox: new hikerPop.ResExtraInputBox({
            hint: "源关键字",
            title: "ok",
            onChange(s, manage) {
                //log("onChange:"+s);
                putMyVar("SrcJu_sourceListFilter", s);
                tmpList = sourceList.filter(x => x.name.toLowerCase().includes(s.toLowerCase()));
                let flist = getitems(tmpList).items;
                manage.change(flist);
            },
            defaultValue: getMyVar("SrcJu_sourceListFilter", ""),
            click(s, manage) {
                //toast(s);
                //log(manage.iconList);
            },
            titleVisible: false
        }),
        longClick(s, i) {
            /*
            showSelectOptions({
                title: "分享视频源",
                options: ["JS文件分享"].concat(getPastes()),
                col: 2,
                js: $.toString(name => {
                    
                }, s.replace(/[’‘]/g, ""))
            });
            */
        },
        click(item, i, manage) {
            pop.dismiss();

            let sourceid = item.url;
            return changeSource(sourceid);
        },
        menuClick(manage) {
            hikerPop.selectCenter({
                options: ["改变样式", "排序:" + (getItem('sourceListSort') == '接口名称' ? "接口名称" : "更新时间"), "列表倒序"],
                columns: 2,
                title: "请选择",
                click(s, i) {
                    if (i === 0) {
                        spen = spen == 3 ? 2 : 3;
                        manage.changeColumns(spen);
                        manage.scrollToPosition(index, false);
                    } else if (i === 1) {
                        setItem("sourceListSort", getItem('sourceListSort') == '接口名称' ? "更新时间" : "接口名称");
                        let items = getDatas("yi", true).map(v => {
                            return {title:v.name,icon:v.img};
                        });
                        manage.change(items);
                        let index = items.indexOf(items.filter(d => d.title == sourcename)[0]);
                        manage.scrollToPosition(index, true);
                        manage.setSelectedIndex(index);
                    } else if (i === 2) {
                        items.reverse();
                        manage.change(items);
                        let index = items.indexOf(items.filter(d => d.title == sourcename)[0]);
                        manage.setSelectedIndex(index);
                        manage.scrollToPosition(index, true);
                    }
                }
            });
        }
    });
    return 'hiker://empty';
}
//打开指定类型的新页面
function rulePage(datatype, ispage) {
    return $("hiker://empty#noRecordHistory##noHistory#" + (ispage ? "?page=fypage" : "")).rule((datatype) => {
        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
        getYiData(datatype);
    }, datatype)
}
//获取一级数据
function getYiData(datatype, od) {
    addListener('onRefresh', $.toString(() => {
        clearMyVar('动态加载loading')
    }));
    addListener('onClose', $.toString(() => {
        clearMyVar('动态加载loading')
    }));

    let d = od || [];
    let sourcedata = getDatas('yi', true).filter(it => {
        return it.id==homeSourceId;
    });
    let parse;
    let 公共;
    try {
        if (sourcedata.length==1) {
            eval("let source = " + sourcedata[0].parse);
            parse = source;
        }
    } catch (e) {
        log("一级源代码加载异常>" + e.message + " 错误行#" + e.lineNumber);
    }
    if (parse) {
        try {
            eval("let gonggong = " + sourcedata[0].public);
            if (gonggong && gonggong.ext && /^http/.test(gonggong.ext)) {
                requireCache(gonggong.ext, 48);
                gonggong = ggdata;
            }
            公共 = gonggong || parse['公共'] || {};
            if (公共['预处理']) {
                try {
                    公共['预处理']();
                } catch (e) {
                    log('执行预处理报错，信息>' + e.message + " 错误行#" + e.lineNumber);
                }
            }
            let info = { type: sourcedata[0].type, name: sourcedata[0].name };
            let 标识 = info.type + "_" + info.name;
            let itemid = 标识 + "_" + datatype;
            let page = MY_PAGE || 1;
            let loading;
            if (page == 1 && typeof (setPreResult) != "undefined" && getMyVar('动态加载loading') != itemid) {
                loading = 1;
                d.push({
                    title: "",
                    url: "hiker://empty",
                    col_type: "text_1",
                    extra: {
                        lineVisible: false,
                        cls: "loading_gif"
                    }
                })
                d.push({
                    title: "",
                    url: "hiker://empty",
                    col_type: "text_1",
                    extra: {
                        lineVisible: false,
                        cls: "loading_gif"
                    }
                })
                d.push({
                    pic_url: "http://123.56.105.145/weisyr/img/Loading1.gif",
                    col_type: "pic_1_center",
                    url: "hiker://empty",
                    extra: {
                        cls: "loading_gif"
                    }
                })
                setPreResult(d);
                d = [];
                putMyVar('动态加载loading', itemid);
            }
            let 执行str = parse[datatype].toString();

            if (!执行str.includes('rule')) {
                执行str = replaceLast(执行str, 'setResult', 'return ')
            }

            let 页码 = parse["页码"] || {};
            let 转换 = parse["转换"] || {};
            let zz = 转换["排行"] || "排行";
            if(parse&&parse[zz]){
                d.push({
                    title: zz,
                    url: rulePage(zz,页码[zz]),
                    pic_url: "http://123.56.105.145/tubiao/more/229.png",
                    col_type: 'icon_small_3'
                })
            }
            zz = 转换["分类"] || "分类";
            if(parse&&parse[zz]){
                d.push({
                    title: zz,
                    url: rulePage(zz,页码[zz]),
                    pic_url: "http://123.56.105.145/tubiao/more/287.png",
                    col_type: 'icon_small_3'
                })
            }
            zz = 转换["更新"] || "更新";
            if(parse&&parse[zz]){
                d.push({
                    title: zz,
                    url: rulePage(zz,页码[zz]),
                    pic_url: "http://123.56.105.145/tubiao/more/288.png",
                    col_type: 'icon_small_3'
                })
            }

            let obj = parse.四大金刚 || {};
            if (obj.url && obj.type == datatype) {//四大金刚获取分类数据
                let class_name = (obj.class_name || "").split('&').filter(item => item != '');
                let class_url = (obj.class_url || "").split('&').filter(item => item != '');
                let area_name = (obj.area_name || "").split('&').filter(item => item != '');
                let area_url = (obj.area_url || "").split('&').filter(item => item != '');
                let year_name = (obj.year_name || "").split('&').filter(item => item != '');
                let year_url = (obj.year_url || "").split('&').filter(item => item != '');
                let sort_name = (obj.sort_name || "").split('&').filter(item => item != '');
                let sort_url = (obj.sort_url || "").split('&').filter(item => item != '');
                let isAll = (obj.url || "").includes('fyAll') ? 1 : 0;
                fyAll = getMyVar("fyAll_id", class_url.length > 0 ? class_url[0] : "");
                fyclass = isAll ? fyAll : getMyVar("fyclass_id", class_url.length > 0 ? class_url[0] : "");
                fyarea = isAll ? fyAll : getMyVar("fyarea_id", area_url.length > 0 ? area_url[0] : "");
                fyyear = isAll ? fyAll : getMyVar("fyyear_id", year_url.length > 0 ? year_url[0] : "");
                fysort = isAll ? fyAll : getMyVar("fysort_id", sort_url.length > 0 ? sort_url[0] : "");
                if (page == 1) {
                    class_url.forEach((it, i) => {
                        try {
                            d.push({
                                title: fyclass == it ? `““””<b><span style="color: #09c11b">` + class_name[i] + `</span></b>` : class_name[i],
                                url: $("#noLoading#").lazyRule((id_name, nowid, newid) => {
                                    if (nowid != newid) {
                                        putMyVar(id_name, newid);
                                        refreshPage(false);
                                    }
                                    return 'hiker://empty'
                                }, isAll ? "fyAll_id" : "fyclass_id", fyclass, it),
                                col_type: 'scroll_button'
                            })
                        } catch (e) { }
                    })
                    area_url.forEach((it, i) => {
                        if (i == 0) {
                            d.push({
                                col_type: "blank_block"
                            })
                        }
                        try {
                            d.push({
                                title: fyarea == it ? `““””<b><span style="color: #09c11b">` + area_name[i] + `</span></b>` : area_name[i],
                                url: $("#noLoading#").lazyRule((id_name, nowid, newid) => {
                                    if (nowid != newid) {
                                        putMyVar(id_name, newid);
                                        refreshPage(false);
                                    }
                                    return 'hiker://empty'
                                }, isAll ? "fyAll_id" : "fyarea_id", fyarea, it),
                                col_type: 'scroll_button'
                            })
                        } catch (e) { }
                    })
                    year_url.forEach((it, i) => {
                        if (i == 0) {
                            d.push({
                                col_type: "blank_block"
                            })
                        }
                        try {
                            d.push({
                                title: fyyear == it ? `““””<b><span style="color: #09c11b">` + year_name[i] + `</span></b>` : year_name[i],
                                url: $("#noLoading#").lazyRule((id_name, nowid, newid) => {
                                    if (nowid != newid) {
                                        putMyVar(id_name, newid);
                                        refreshPage(false);
                                    }
                                    return 'hiker://empty'
                                }, isAll ? "fyAll_id" : "fyyear_id", fyyear, it),
                                col_type: 'scroll_button'
                            })
                        } catch (e) { }
                    })
                    sort_url.forEach((it, i) => {
                        if (i == 0) {
                            d.push({
                                col_type: "blank_block"
                            })
                        }
                        try {
                            d.push({
                                title: fysort == it ? `““””<b><span style="color: #09c11b">` + sort_name[i] + `</span></b>` : sort_name[i],
                                url: $("#noLoading#").lazyRule((id_name, nowid, newid) => {
                                    if (nowid != newid) {
                                        putMyVar(id_name, newid);
                                        refreshPage(false);
                                    }
                                    return 'hiker://empty'
                                }, isAll ? "fyAll_id" : "fysort_id", fysort, it),
                                col_type: 'scroll_button'
                            })
                        } catch (e) { }
                    })
                    d.push({
                        col_type: "blank_block"
                    })
                }

                let fypage = page;
                MY_URL = obj.url.replace('fyAll', fyAll).replace('fyclass', fyclass).replace('fyarea', fyarea).replace('fyyear', fyyear).replace('fysort', fysort).replace('fypage', fypage);
                执行str = 执行str.replace('getResCode()', 'request(MY_URL)');
            }
            
            let error = "";
            let getData = [];
            try {
                eval("let 数据 = " + 执行str);
                getData = 数据() || [];
            } catch (e) {
                getData = [];
                error = e.message;
                log('执行获取数据报错，信息>' + e.message + " 错误行#" + e.lineNumber);
            }
            if (loading) {
                deleteItemByCls("loading_gif");
            }

            if (getData.length == 0 && page == 1) {
                d.push({
                    title: "未获取到数据",
                    desc: error,
                    url: "hiker://empty",
                    col_type: "text_center_1",
                })
            } else if (getData.length > 0) {
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuMethod.js');
                getData.forEach(item => {
                    try {
                        item = toerji(item, info);
                    } catch (e) {
                        //log(item);
                    }
                })
            }
            d = d.concat(getData);
        } catch (e) {
            toast(datatype + "代码报错，更换主页源或联系接口作者");
            log("报错信息>" + e.message + " 错误行#" + e.lineNumber);
        }
        setResult(d);
    } else {
        if (datatype == "主页") {
            d.push({
                title: homeGroup + " 主页源不存在\n需先选择配置主页源",
                desc: "点此或上面按钮皆可选择",
                url: $('#noLoading#').lazyRule((input) => {
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                    return selectSource(input);
                }, homeGroup),
                col_type: "text_center_1",
                extra: {
                    lineVisible: false
                }
            })
        }
        setResult(d);
    }
}
//读取源接口数据
function readSourceData(fileid){
    let cachefile = cachepath + `${fileid}.json`;
    let jkdata = {};
    try{
        let cachefiledata = fetch(cachefile);
        if(cachefiledata){
            eval("jkdata=" + cachefiledata);
        }else{
            let jklist = getDatas('all', true).filter(it=>{
                return it.id == fileid;
            });
            if(jklist.length==1){
                jkdata = jklist[0];
                writeFile(cachefile,JSON.stringify(jkdata));
            }
        }
    }catch(e){
        log("接口数据加载失败>"+fileid+">"+e.message + " 错误行#" + e.lineNumber);
    }
    return jkdata;
}

//重定义打印日志，只允许调试模式下打印
var xlog = log;
log = function (msg) {
    if (getMyVar("SrcJu_调试模式") || getItem("SrcJu_接口日志")) {
        xlog(msg);
    }
}
//聚影搜索调用
function JySearch(sskeyword, sstype) {
    if (sstype == "聚搜接口") {
        return $('hiker://empty#noRecordHistory##noHistory#').rule((name) => {
            require(config.聚阅.replace(/[^/]*$/,'').replace('/Ju/', '/master/') + 'SrcJyXunmi.js');
            xunmi(name);
        }, sskeyword);
    } else if (sstype == "云盘接口") {
        return $('hiker://empty#noRecordHistory##noHistory#').rule((name) => {
            let d = [];
            d.push({
                title: name + "-云盘聚合搜索",
                url: "hiker://empty",
                col_type: "text_center_1",
                extra: {
                    id: "listloading",
                    lineVisible: false
                }
            })
            setResult(d);
            require(config.聚阅.replace(/[^/]*$/,'').replace('/Ju/', '/master/') + 'SrcJyAliDisk.js');
            aliDiskSearch(name);
        }, sskeyword);
    } else if (sstype == "Alist接口") {
        return $('hiker://empty#noRecordHistory##noHistory#').rule((name) => {
            let d = [];
            d.push({
                title: name + "-Alist聚合搜索",
                url: "hiker://empty",
                col_type: "text_center_1",
                extra: {
                    id: "listloading",
                    lineVisible: false
                }
            })
            setResult(d);
            require(config.聚阅.replace(/[^/]*$/,'').replace('/Ju/', '/master/') + 'SrcJyAlist.js');
            alistSearch2(name, 1);
        }, sskeyword);
    } else {
        return "hiker://search?rule=聚影&s=" + sskeyword;
    }
}
// 按拼音排序
function sortByPinyin(arr) {
    var arrNew = arr.sort((a, b) => a.name.localeCompare(b.name));
    for (var m in arrNew) {
        var mm = /^[\u4e00-\u9fa5]/.test(arrNew[m].name) ? m : '-1';
        if (mm > -1) {
            break;
        }
    }
    for (var n = arrNew.length - 1; n >= 0; n--) {
        var nn = /^[\u4e00-\u9fa5]/.test(arrNew[n].name) ? n : '-1';
        if (nn > -1) {
            break;
        }
    }
    if (mm > -1) {
        var arrTmp = arrNew.splice(m, parseInt(n - m) + 1);
        arrNew = arrNew.concat(arrTmp);
    }
    return arrNew
}
// 替换最后一个指定字符串
function replaceLast(str, search, replacement) {
    const lastIndex = str.lastIndexOf(search);

    if (lastIndex !== -1) {
        return str.slice(0, lastIndex) + replacement + str.slice(lastIndex + search.length);
    }

    return str; // 如果没找到，返回原字符串
}
//修正按钮元素
function toerji(item,info) {
    info = info || storage0.getMyVar('一级源接口信息');
    if(item.url && !/js:|select:|=>|@|toast:|hiker:\/\/page|video:/.test(item.url) && item.col_type!="x5_webview_single" && item.url!='hiker://empty'){
        let extra = item.extra || {};
        extra.name = extra.name || extra.pageTitle || (item.title?item.title.replace(/‘|’|“|”|<[^>]+>/g,""):"");
        extra.img = extra.img || item.pic_url || item.img;
        extra.stype = info.type;
        extra.pageTitle = extra.pageTitle || extra.name;
        extra.surl = item.url.replace(/hiker:\/\/empty|#immersiveTheme#|#autoCache#|#noRecordHistory#|#noHistory#|#noLoading#|#/g,"");
        extra.sname = info.name;
        item.url = $("hiker://empty?type="+info.type+"#immersiveTheme##autoCache#").rule(() => {
            require(config.聚阅);
            erji();
        })
        item.extra = extra;
    }
    return item;
}
//简繁互转,x可不传，默认转成简体，传2则是转成繁体
function jianfan(str,x) {
    require(config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'SrcSimple.js');
    return PYStr(str,x);
}

//来自阿尔法大佬的主页幻灯片
function banner(start, arr, data, cfg){
    let id = 'juyue';
    let rnum = Math.floor(Math.random() * data.length);
    let item = data[rnum];
    putMyVar('rnum', rnum);
    let time = 5000;
    let col_type='pic_1_card';
    let desc='';
    if (cfg != undefined) {
        time = cfg.time ? cfg.time : time;
        col_type=cfg.col_type?cfg.col_type:col_type;
        desc=cfg.desc?cfg.desc:desc;
    }
    arr.push({
        col_type: col_type,
        img: item.img,
        desc:desc,
        title: item.title,
        url: item.url,
        extra: {
            id: 'bar',
        }
    })
    if (start == false || getMyVar('benstart', 'true') == 'false') {
        unRegisterTask(id)
        return
    }
    let obj = {
        data: data,
        method: config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'SrcJuMethod.js',
        info: storage0.getMyVar('一级源接口信息')
    };
    registerTask(id, time, $.toString((obj) => {
        var data = obj.data;
        var rum = getMyVar('rnum');
        var i = Number(getMyVar('banneri', '0'));
        if (rum != '') {
            i = Number(rum) + 1
            clearMyVar('rnum')
        } else {
            i = i + 1;
        }
        if (i > data.length - 1) {
            i = 0
        }
        var item = data[i];
        try {
            require(obj.method);
            updateItem('bar', toerji(item,obj.info));
        } catch (e) {
            log("幻灯片处理异常>" + e.message + " 错误行#" + e.lineNumber)
            unRegisterTask('juyue')
        }
        putMyVar('banneri', i);
    }, obj))
}