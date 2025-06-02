// 本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
let libspath = "hiker://files/data/聚阅/"; //依赖文件路径
let rulepath = "hiker://files/rules/Src/Juyue/"; //规则文件路径
let cachepath = "hiker://files/_cache/Juyue/"; //缓存文件路径
let jkfilespath = rulepath + "jiekou/"; //接口数据文件路径
let jkfile = rulepath + "jiekou.json";
let cfgfile = rulepath + "config.json";
let sortfile = rulepath + "jksort.json";
let codepath = (config.聚阅||getPublicItem('聚阅','')).replace(/[^/]*$/,'');
let gzip = $.require(codepath + "plugins/gzip.js");

if(!fileExist(jkfile) && fileExist("hiker://files/rules/Src/Ju/jiekou.json")){
    let olddatalist = JSON.parse(fetch("hiker://files/rules/Src/Ju/jiekou.json"));

    function objectToJsCode(obj) {
        let jsCode = `let objCode = {`;

        for (let key in obj) {
            if (typeof obj[key] === 'function') {
                // 处理函数
                jsCode += `  ${key}: ${obj[key].toString()},`;
            } else {
                // 处理普通属性
                jsCode += `  ${key}: ${JSON.stringify(obj[key])},`;
            }
        }

        // 移除最后一个逗号
        jsCode = jsCode.replace(/,$/, '');
        jsCode += '};\n';

        return jsCode;
    }

    function decodeUnicodeEscapes(str) {
        return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
        });
    }
/*
    olddatalist.forEach(it=>{

        if(it.parse&&it.erparse){
            it.ilk = '3';
        }else if(it.parse){
            it.ilk = '1';
        }else if(it.erparse){
            it.ilk = '2';
        }

        it.public = (it.public||"").replace(/公共/g, 'objCode');
        it.parse = (it.parse||"").replace(/公共/g, 'objCode');
        it.erparse = (it.erparse||"").replace(/公共/g, 'objCode');
        eval("let public = " + (it.public || '{}'));
        eval("let parse = " + (it.parse || '{}'));
        eval("let erparse = " + (it.erparse || '{}'));
        if(parse['作者']&&erparse['作者']&&parse['作者']!=erparse['作者']){
            erparse['作者'] = parse['作者'] + '&' +erparse['作者'];
        }

        let newjkjson = Object.assign({}, public, parse, erparse);
        it.author = erparse['作者'];
        it.group = it.type=="听书"?"听书":it.group;
        it.type = it.type=="听书"?"音频":it.type;
        it.group = it.type=="影视"?"影视":it.group;
        it.type = it.type=="影视"?"视频":it.type;
        it.id = Date.now().toString();
        it.url = jkfilespath + it.id + '.txt';
        delete it.updatetime;
        delete it.public;
        delete it.parse;
        delete it.erparse;
        //storage0.putMyVar('newjkjson', newjkjson);
        //writeFile(newjkurl, $.stringify(newjkjson, null, 2));
        writeFile(it.url, objectToJsCode(newjkjson));
        java.lang.Thread.sleep(10);
    })
    */
    function parseFunctionString(str) {
        try {
            // 1. 预处理函数定义
            const funcPattern = /(["']?)function\s*\(([^)]*)\)\s*\{([^]*?)\}\1/g;
            const funcReplacer = (match, quote, args, body) => {
                return `__func__:function(${args}){${body}}`;
            };

            // 2. 标记所有函数
            let processed = str.replace(funcPattern, funcReplacer);

            // 3. 解析为对象
            const obj = JSON.parse(processed);

            // 4. 恢复函数
            function restoreFunctions(obj) {
                for (let key in obj) {
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        restoreFunctions(obj[key]);
                    } else if (typeof obj[key] === 'string' && obj[key].startsWith('__func__:')) {
                        // 使用 Function 构造函数重建函数
                        const funcStr = obj[key].replace('__func__:', '');
                        obj[key] = new Function('return ' + funcStr)();
                    }
                }
                return obj;
            }

            return restoreFunctions(obj);
        } catch (e) {
            console.error('解析失败:', e);
            return {};
        }
    }


    olddatalist.splice(0,1).forEach(it=>{

        let public = parseFunctionString(it.public || '{}');
        let parse = parseFunctionString(it.parse || '{}');
        let erparse = parseFunctionString(it.erparse || '{}');
        storage0.putMyVar('parse', parse);
        log(getMyVar('parse'));
        let newjkjson = Object.assign({}, public, parse, erparse);
        storage0.putMyVar('newjkjson', newjkjson);
        log(getMyVar('newjkjson'));

        
    })
    //writeFile(jkfile, JSON.stringify(olddatalist));
    clearMyVar('newjkjson');
}

let Juconfig = {};
let Jucfg = fetch(cfgfile);
if (Jucfg != "") {
    eval("Juconfig=" + Jucfg + ";");
}

let runTypes = ["漫画", "小说", "图集", "视频", "音频", "聚合", "其它"];
let homeGroup = Juconfig["homeGroup"] || "";
let homeSourceId = Juconfig[homeGroup + "_SourceId"] || "";
let sourcename = (storage0.getMyVar('一级源接口信息')||{}).name || "";

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
        datalist = datalist.filter(it => it.ilk != "2");
    } else if (lx == "er") {
        datalist = datalist.filter(it => it.ilk != "1");
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
//获取不同场景分组分类名称数组
function getTypeNames(s) {
    let snames = [];
    if (s == "搜索页") {
        snames = ["漫画", "小说", "听书", "影视", "聚合"];
    } else if (s == "主页") {
        snames = getJiekouGroups(getDatas('yi', 1));
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
//获取搜索接口列表
function getSearchLists(group) {
    let datalist = getDatas('er', 1);

    let sort = {};
    if(fetch(sortfile)){
        eval("sort = " + fetch(sortfile));
    }
    datalist.forEach(it=>{
        try{
            let jksort = sort[it.id] || {};
            it.sort = jksort.fail || 0;
        }catch(e){
            it.sort = 0;
        }
    })
    datalist.sort((a, b) => {
        return a.sort - b.sort
    })

    if(group){
        return datalist.filter(it=>{
            return group==(it.group||it.type);
        });
    }else{
        let lockgroups = Juconfig["lockgroups"] || [];
        datalist = datalist.filter(it=>{
            return lockgroups.indexOf(it.group||it.type)==-1;
        })
        return datalist;
    }
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
    clearMyVar('duodatalist');
    return input + '：已处理' + waitlist.length + '个';
}
// 文字上色
function colorTitle(title, Color) {
    return '<font color="' + Color + '">' + title + '</font>';
}
// 获取接口对应的显示标题
function getDataTitle(data) {
    if((MY_NAME=="海阔视界"&&getAppVersion()>=5566)||(MY_NAME=="嗅觉浏览器"&&getAppVersion()>=2305)){
        return data.name + '  ‘‘’’<small><font color=grey>'+(data.author?'  ('+data.author+')':'') + '</font></small>';
    }else{
        return data.name + '  <small><font color=grey>'+(data.author?' ('+data.author+')':'') + (data.ilk=="1" ? " [主页源]" : data.ilk=="2" ? " [搜索源]" : " [完整源]") + '</font></small>';
    }
}
// 接口多选处理方法
function duoselect(data){
    let waitlist= [];
    if($.type(data)=='object'){
        waitlist.push(data);
    }else if($.type(data)=='array'){
        waitlist = data;
    }

    let selectlist = storage0.getMyVar('duodatalist') || [];
    waitlist.forEach(data=>{
        if(!selectlist.some(item => data.id==item.id)){
            selectlist.push(data);
            updateItem(data.id, {title: colorTitle(getDataTitle(data),'#3CB371')});
        }else{
            let index = selectlist.indexOf(selectlist.filter(d => data.id==d.id)[0]);
            selectlist.splice(index, 1);
            updateItem(data.id, {title:data.stop?colorTitle(getDataTitle(data),'#f20c00'):getDataTitle(data)});
        }
    })
    storage0.putMyVar('duodatalist',selectlist);
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
        if(it.url.includes(jkfilespath)){
            deleteFile(it.url);
        }
        let index = datalist.indexOf(datalist.filter(d => it.id==d.id)[0]);
        datalist.splice(index, 1);
    })

    writeFile(jkfile, JSON.stringify(datalist));
    clearMyVar('SrcJu_searchMark');
    clearMyVar('duodatalist');
}
//执行切换源接口
function changeSource(sourcedata) {
    if (homeSourceId==sourcedata.id) {
        return 'toast://主页源：' + homeSourceId;
    }
    if (typeof (unRegisterTask) != "undefined") {
        unRegisterTask("juyue");
    } else {
        toast("软件版本过低，可能存在异常");
    }
    try {
        let listMyVar = listMyVarKeys();
        listMyVar.forEach(it => {
            if (!/^SrcJu_|initConfig|proxyUrl/.test(it)) {
                clearMyVar(it);
            }
        })
        GM.clearAll();
    } catch (e) {
        log("切源清理接口变量异常>" + e.message + " 错误行#" + e.lineNumber);
    }
    try {
        refreshX5WebView('about:blank');
    } catch (e) { }
    let sourceGroup = sourcedata.group || sourcedata.type;
    Juconfig["homeGroup"] = sourceGroup;
    Juconfig[sourceGroup+'_SourceId'] = sourcedata.id;
    writeFile(cfgfile, JSON.stringify(Juconfig));
    refreshPage(false);
    return 'hiker://empty';
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
            return {title:v.name, icon:v.img, data:v};
        });
        return {items:items, index:index};
    }

    let index_items = getitems(sourceList);
    let index = index_items.index;
    let items = index_items.items;
    let spen = 3;
    let hometitle = index>-1?items[index].title:"";

    let pop = hikerPop.selectBottomResIcon({
        iconList: items,
        columns: spen,
        title: "当前源>" + (hometitle||"无"),
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

            let sourcedata = JSON.parse(item.data);
            return changeSource(sourcedata);
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
// 获取图标地址
function getIcon(icon, nochange) {
    if(!icon.includes('.svg')){
        return codepath + 'img/' + icon;
    }
    let color = getItem('主题颜色','');
    return codepath + 'img/' + icon + ((!color||nochange)?'':'?s='+color+'@js=' + $.toString((color) => {
        let javaImport = new JavaImporter();
        javaImport.importPackage(Packages.com.example.hikerview.utils);
        with(javaImport) {
            let bytes = FileUtil.toBytes(input);
            let str = new java.lang.String(bytes, "UTF-8") + "";
            str = str.replace(/#feb833|#6dc9ff|#2ec99d|#587bff|#ff7772|#a88efa|#FD9173/gi, color);
            bytes = new java.lang.String(str).getBytes();
            return FileUtil.toInputStream(bytes);
        }
    },color))
}
// 检测依赖
if(!getVar('SrcJu_config')){
    if(!config.聚阅 && getPublicItem('聚阅','')){
        initConfig({
            聚阅: getPublicItem('聚阅','')
        });
    }
    log("当前依赖库>" + config.聚阅);
    putVar('SrcJu_config', '1');
}