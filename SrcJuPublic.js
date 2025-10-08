// 本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
// 检测依赖
if(!getMyVar('SrcJu_config')){
    if(!config.聚阅 && getPublicItem('聚阅','')){
        initConfig({
            聚阅: getPublicItem('聚阅','')
        });
    }

    xlog("当前依赖库>" + config.聚阅);
    downloadPlugins();//插件本地化执行
    putMyVar('SrcJu_config', '1');
}
// 对象转js文本
function objconvertjs(obj) {
    let str = 'let parse = {\n';

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            let value = obj[key];
            let valStr;

            if (typeof value === 'function') {
                // 函数直接保留原样
                valStr = decodeUnicodeEscapes(value.toString());
            } else {
                // 其他值用 JSON.stringify 美化
                valStr = JSON.stringify(value, null, 2);
            }

            str += `  ${JSON.stringify(key)}: ${valStr},\n`;
        }
    }

    str = str.replace(/,\n$/, '\n'); // 去掉最后一个逗号
    str += '};';

    return str;
}
// Unicode转中文
function decodeUnicodeEscapes(str) {
    return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
    });
}

let Juconfig = {};
let Jucfg = fetch(cfgfile);
if (Jucfg != "") {
    eval("Juconfig=" + Jucfg + ";");
}

let runTypes = ["漫画", "视频", "音频", "小说", "图集", "聚合", "其它"];
let homeGroup = Juconfig["homeGroup"] || "";
let homeSourceS = Juconfig["homeSourceS"] || {};
let homeSource = homeSourceS[homeGroup] || {};
let homeSourceId = homeSource.id || "";
let sourcename = homeSource.name || "";
let ilks = ["主页源","搜索源","完整源","模板源","依赖源"];
let Juconfig2 = juItem2.getAll();
//临时放着
delete Juconfig['groupSort'];
delete Juconfig['lockgroups'];

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
        datalist = datalist.filter(it => it.ilk == "1" || it.ilk == "3");
    } else if (lx == "er") {
        datalist = datalist.filter(it => it.ilk == "2" || it.ilk == "3");
    } else if (lx == "tmpl") {
        datalist = datalist.filter(it => it.ilk == "4");
    }
    
    if (getItem("sourceListSort") == "接口名称") {
        datalist = sortByPinyin(datalist);
    }else if (getItem("sourceListSort") == "使用频率") {
        let sort = {};
        if(fetch(sortfile)){
            eval("sort = " + fetch(sortfile));
        }
        datalist.forEach(it=>{
            try{
                let jksort = sort[it.id] || {};
                it.sort = jksort.use || 0;
            }catch(e){
                it.sort = 0;
            }
        })
        datalist.sort((a, b) => {
            return b.sort - a.sort
        })
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
    if(juItem2.get('noShowType')!='1'){//强制显示分类时输出列表，默认
        datas = datas.filter(it=>{
            return !k || k==it.type || (it.group||"").split(',').indexOf(k)>-1;
        })
    }else{
        datas = datas.filter(it=>{
            return !k || (k==it.type&&!it.group) || (it.group||"").split(',').indexOf(k)>-1;
        })
    }
    return datas;
}
//b数组参照a数组的顺序
function sortBWithNonAAtEnd(a, b) {
    // 创建a中元素的顺序映射
    var aOrder = {};
    for (var i = 0; i < a.length; i++) {
        aOrder[a[i]] = i;
    }

    // 分离存在于a和不存在于a的元素
    var elementsInA = [];
    var elementsNotInA = [];

    for (var j = 0; j < b.length; j++) {
        if (b[j] in aOrder) {
            elementsInA.push(b[j]);
        } else {
            elementsNotInA.push(b[j]);
        }
    }

    // 对存在于a的元素按a的顺序排序
    elementsInA.sort(function (x, y) {
        return aOrder[x] - aOrder[y];
    });

    // 合并结果：先放存在于a的元素，再放不存在于a的元素
    return elementsInA.concat(elementsNotInA);
}
//获取指定接口组的分组名arry
function getJkGroups(datas, isgroup) {
    let typeNames = [];
    let groupNames = [];
    let noShowType = juItem2.get('noShowType');
    datas.forEach(it => {
        if (typeNames.indexOf(it.type)==-1 && noShowType!='1'){
            typeNames.push(it.type);
        }
        if(noShowType=='1' && !it.group){
            typeNames.push(it.type);
        }
        (it.group || "").split(',').forEach(group=>{
            if (group && groupNames.indexOf(group)==-1 && typeNames.indexOf(group)==-1 && runTypes.indexOf(group)==-1){
                groupNames.push(group);
            }
        })
    })
    if(Juconfig2['groupSort']){
        groupNames = sortBWithNonAAtEnd(Juconfig2['groupSort'].split(','), groupNames);
    }else{
        groupNames.sort((a, b) =>
            a.localeCompare(b, 'zh-CN', {
                sensitivity: 'accent', // 忽略大小写但区分音调
                ignorePunctuation: true // 忽略标点符号
            })
        );
    }
    
    if(isgroup){
        return groupNames;
    }

    let yxTypes = [];
    runTypes.forEach(it=>{
        if (yxTypes.indexOf(it)==-1 && typeNames.indexOf(it)>-1){
            yxTypes.push(it);
        }
    })
    return yxTypes.concat(groupNames);
}
//获取不同场景分组分类名称arry
function getTypeNames(s, datas) {
    let snames = [];
    if (s == "搜索页") {
        snames = ["漫画", "小说", "音频", "视频", "聚合"];
    } else if (s == "主页") {
        snames = getJkGroups(datas || getDatas('yi', 1));
        let hidegroups = juItem2.get('hidegroups') || [];
        snames = snames.filter(item=>{
            return hidegroups.indexOf(item) == -1;//返回没有隐藏的分组s
        });
    } else {
        snames = runTypes;
    }
    return snames;
}
//获取所有分组名称arry
function getGroupNames() {
    return getJkGroups(getDatas('all', true), 1);
}
//获取搜索接口列表
function getSearchLists(group) {
    let datalist = getDatas('er', 1);
    /*
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
*/
    if(group){
        return datalist.filter(it=>{
            return group==it.type || (it.group||"").split(',').indexOf(group)>-1;
        });
    }
    /*
    else{
        let lockgroups = Juconfig2["lockgroups"] || [];
        datalist = datalist.filter(it=>{
            return lockgroups.indexOf(it.group||it.type)==-1;
        })
        return datalist;
    }
    */
    return datalist;
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
            setJkSort(it, {fail: 0});//重置失败
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
function getDataTitle(data, ide) {
    let dataTitle;
    if((MY_NAME=="海阔视界"&&getAppVersion()>=5566)||(MY_NAME=="嗅觉浏览器"&&getAppVersion()>=2305)){
        dataTitle = (ide||(getMyVar('批量选择模式')?'○':''))+(data.stop?'Ⓓ':'')+data.name + '  ‘‘’’<small><font color=grey>'+(data.author?'  ['+data.author+']':'') + (data.version?'\nV'+data.version:'') + '</font></small>';
    }else{
        dataTitle = (ide||(getMyVar('批量选择模式')?'○':''))+(data.stop?'Ⓓ':'')+data.name + '  <small><font color=grey>'+(data.author?' ('+data.author+')':'') + ' ['+ilks[parseInt(data.ilk||1)-1]+']</font></small>';
    }
    return dataTitle;
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
            updateItem(data.id, {title: colorTitle(getDataTitle(data, '●'),'#3CB371')});
        }else{
            let index = selectlist.indexOf(selectlist.filter(d => data.id==d.id)[0]);
            selectlist.splice(index, 1);
            updateItem(data.id, {title:data.stop?colorTitle(getDataTitle(data, '○'),'grey'):getDataTitle(data)});
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
    let juItemfile = `${libspath}juItem.json`;
    let items = {};
    let itemsstr = fetch(juItemfile);
    if (itemsstr != "") {
        eval("items=" + itemsstr + ";");
    }
    dellist.forEach(it => {
        if(it.url.includes(jkfilespath)){
            deleteFile(it.url);
        }
        delete items[it.id];
        let index = datalist.indexOf(datalist.filter(d => it.id==d.id)[0]);
        datalist.splice(index, 1);
    })
    writeFile(juItemfile, JSON.stringify(items));
    writeFile(jkfile, JSON.stringify(datalist));
    clearMyVar('SrcJu_searchMark');
    clearMyVar('duodatalist');
    // 删除接口搜索临时列表
    if(getMyVar("seacrhDataList")){
        let seacrhDataList = storage0.getMyVar("seacrhDataList");
        dellist.forEach(it => {
            let index = seacrhDataList.indexOf(seacrhDataList.filter(d => it.id==d.id)[0]);
            seacrhDataList.splice(index, 1);
        })
        storage0.putMyVar("seacrhDataList", seacrhDataList);
    }
}
//执行切换源接口
function changeSource(sourcedata) {
    // 设置源接口使用次数
    setJkSort(sourcedata.id, {use: 1});

    if (homeSourceId==sourcedata.id) {
        return 'toast://主页源：' + sourcedata.name;
    }
    
    if (typeof (unRegisterTask) != "undefined") {
        unRegisterTask("juyue");
        unRegisterTask("lunbo");
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
        xlog("切源清理接口变量异常>" + e.message + " 错误行#" + e.lineNumber);
    }
    try {
        refreshX5WebView('about:blank');
    } catch (e) { }
    let sourceGroup = sourcedata.selectGroup || ((sourcedata.type==homeGroup||(sourcedata.group||'').includes(homeGroup))?homeGroup:sourcedata.type);
    Juconfig["homeGroup"] = sourceGroup;
    homeSourceS[sourceGroup] = {id: sourcedata.id, name: sourcedata.name};
    Juconfig['homeSourceS'] = homeSourceS;
    writeFile(cfgfile, JSON.stringify(Juconfig));
    refreshPage(false);
    return 'hiker://empty';
}
//封装选择主页源方法-原生插件
function selectSource2(selectGroup) {
    let sourceList = getDatas("yi", true);
    if(selectGroup){
        sourceList = getGroupLists(sourceList, selectGroup);//快速分组所在分组源列表
    }
    function getitems(list) {
        let index = -1;
        let items = list.map((v,i) => {
            if(v.id==homeSourceId){
                index = i;
            }
            return {title:v.name, icon:v.img};
        });
        return {items:items, index:index};
    }
    let index_items = getitems(sourceList);
    let index = index_items.index;
    let items = index_items.items;
    let hometitle = index>-1?items[index].title:"无";

    showSelectOptions({
        title: "当前:" + hometitle + "  合计:" + items.length,
        options: items,
        selectedIndex: index,
        js: $.toString((sourceList)=>{
            let sourcedata = sourceList[MY_INDEX];
            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
            return changeSource(sourcedata);
        }, sourceList),
        bottom: true
    })
    return "hiker://empty";
}
// 判断源是否在加锁分组中，返回bool
function isLockGroups(jkdata, lockgroups) {
    lockgroups = lockgroups || Juconfig2('lockgroups') || [];
    if(juItem2.get('noShowType')!='1'){
        return lockgroups.indexOf(jkdata.type)>-1 || (jkdata.group||"").split(',').some(item => lockgroups.includes(item));
    }else{
        return (jkdata.group||jkdata.type).split(',').some(item => lockgroups.includes(item));
    }
}
// 封装选择主页源方法
function selectSource(selectGroup) {
    let nowtime = Date.now();
    let oldtime = parseInt(getMyVar('切源时间','0'))||0;
    if(nowtime < (oldtime + 1 * 1000)){
        return 'hiker://empty';//节流
    }
    putMyVar('切源时间', nowtime + '');
    if(getItem("选择主页源插件")=="原生组件"){
        return selectSource2(selectGroup);
    }
    //hikerPop插件
    const hikerPop = $.require(libspath + "plugins/hikerPop.js");
    let sourceList = getDatas("yi", true);
    let lockgroups = Juconfig2["lockgroups"] || [];
    if(getMyVar('SrcJu_已验证指纹')!='1'){
        sourceList = sourceList.filter(it=>{
            return !isLockGroups(it, lockgroups);
        })
    }

    let tmpList = sourceList;
    let changeGroup = juItem2.get('显示快速分组')?"全部":homeGroup;
    if(selectGroup){
        tmpList = getGroupLists(sourceList, selectGroup);//快速分组所在分组源列表
    }else if(changeGroup != "全部"){
        tmpList = getGroupLists(sourceList, changeGroup);//列表选择的分组源列表
        selectGroup = changeGroup; // 调用上一次主页分组
    }

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

    let index_items = getitems(tmpList);
    let index = index_items.index;
    let items = index_items.items;
    let spen = 3;
    let hometitle = index>-1?items[index].title:"无";

    let pop = hikerPop.selectBottomResIcon({
        iconList: items,
        columns: spen,
        title: "当前:" + hometitle + "  合计:" + items.length,
        noAutoDismiss: true,
        position: index,
        toPosition: index,
        extraInputBox: (inputBox = new hikerPop.ResExtraInputBox({
            hint: "源关键字筛选，右边切换分组",
            title: selectGroup||"全部",
            onChange(s, manage) {
                //xlog("onChange:"+s);
                putMyVar("SrcJu_sourceListFilter", s);
                items = index_items.items.filter(x => x.title.toLowerCase().includes(s.toLowerCase()));
                manage.change(items);
            },
            defaultValue: getMyVar("SrcJu_sourceListFilter", ""),
            click(s, manage) {
                let groupNames = getTypeNames('主页', sourceList);
                let selects = ['全部'].concat(groupNames);
                //inputBox.setHint("提示");
                hikerPop.selectCenter({
                    options: selects, 
                    columns: 3, 
                    title: "切换源分组", 
                    //position: groupNames.indexOf(sourcename),
                    click(s) {
                        selectGroup = s=='全部'?'':s;
                        inputBox.setTitle(s);
                        inputBox.setDefaultValue("");
                        
                        tmpList = getGroupLists(sourceList, s);
                        index_items = getitems(tmpList);
                        items = index_items.items;
                        manage.change(items);
                        manage.setTitle("当前:" + hometitle + "  合计:" + items.length);
                        index = index_items.index;
                        manage.setSelectedIndex(index);
                        manage.scrollToPosition(index, false);
                    }
                });
            },
            titleVisible: true
        })),
        longClick(s, i, manage) {
            let pastes = getPastes();
            pastes.push('云口令文件');
            showSelectOptions({
                title: '分享源:' + s.title,
                options: pastes,
                col: 2,
                js: $.toString((data) => {
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
                    return JYshare(input, data);
                }, items[i].data)
            });
            /*
            hikerPop.selectCenter({
                options: ["分享", "置顶", "禁用", "删除"],
                columns: 2,
                title: s.title,
                click(input) {
                    let data = items[i].data;
                    if(input=='分享'){
                        let pastes = getPastes();
                        pastes.push('云口令文件');
                        return $(pastes, 2).select((data)=>{
                            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
                            return JYshare(input, data);
                        }, data)
                    }else{
                        if(input=='置顶'){
                            if(getItem("sourceListSort", "更新时间") != "更新时间"){
                                return "toast://无效操作，接口列表排序方式为：" + getItem("sourceListSort");
                            }
                            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                            dataHandle(data, input);
                            index_items.items = index_items.items.filter(x=>x.data.id!=data.id);
                            const [target] = items.splice(i, 1);
                            items.unshift(target);
                            index_items.items.unshift(target);
                            manage.change(items);
                        }else if(input=='禁用'){
                            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                            dataHandle(data, input);
                            index_items.items = index_items.items.filter(x=>x.data.id!=data.id);
                            items.splice(i, 1);
                            manage.change(items);
                        }else if(input=='删除'){
                            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                            deleteData(data);
                            index_items.items = index_items.items.filter(x=>x.data.id!=data.id);
                            items.splice(i, 1);
                            manage.change(items);
                        }
                        hikerPop.runOnNewThread(() => {
                            sourceList = getDatas("yi", true);
                        });
                        return "toast://已" + input;
                    }
                }
            });
            */
        },
        click(item, i, manage) {
            pop.dismiss();

            let sourcedata = items[i].data;//JSON.parse(item.data);
            sourcedata['selectGroup'] = selectGroup;
            return changeSource(sourcedata);
        },
        menuClick(manage) {
            let menuarr = ["改变样式", "排序:" + getItem('sourceListSort','更新时间'), "列表倒序", juItem2.get('noShowType')=='1'?"强制显示分类":"优先显示分组"];
            if(lockgroups.length>0 && getMyVar('SrcJu_已验证指纹')!='1'){
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
                        let sorttype = ["更新时间","接口名称","使用频率"].map(v=>v==getItem('sourceListSort','更新时间')?v+"√":v);
                        showSelectOptions({
                            "title": "选择排序方式", 
                            "options" : sorttype, 
                            "col": 1, 
                            "js": `setItem('sourceListSort', input.replace("√",""));'toast://排序方式在下次生效：' + input.replace("√","")`
                        })
                    } else if (i === 2) {
                        items.reverse();
                        manage.change(items);
                        let index = items.indexOf(items.filter(d => d.title == sourcename)[0]);
                        if(index>-1){
                            manage.setSelectedIndex(index);
                            manage.scrollToPosition(index, true);
                        }
                    } else if (i === 3) {
                        if(juItem2.get('noShowType')=='1'){
                            juItem2.clear('noShowType')
                        }else{
                            juItem2.set('noShowType', '1')
                        }
                        toast('已切换，切源列表、快速分组、接口列表同时生效');
                    } else if (i === 4) {
                        if (hikerPop.canBiometric() !== 0) {
                            return "toast://调用生物学验证出错";
                        }
                        let pop = hikerPop.checkByBiometric(() => {
                            putMyVar('SrcJu_已验证指纹','1');
                            toast("验证成功，重新点切换站源吧");
                        });
                    }
                }
            });
        }
    });
    return 'hiker://empty';
}
//聚影搜索调用
function JySearch(sskeyword, sstype) {
    if(!config.聚影){
        let rely = getPublicItem('聚影','https://raw.gitcode.com/src48597962/juying/raw/master/SrcJuying.js');
        initConfig({
            聚影: rely
        });
    }
    if (sstype == "云盘接口") {
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
            require(config.聚影.replace(/[^/]*$/,'') + 'SrcJyAliDisk.js');
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
            require(config.聚影.replace(/[^/]*$/,'') + 'SrcJyAlist.js');
            alistSearch2(name, 1);
        }, sskeyword);
    } else if (sstype == "百度网盘") {
        putVar('keyword',sskeyword);
        return "hiker://page/search?fypage&rule=百度网盘";
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
function getIcon(icon, nochange, color2) {
    if(!icon){
        return '';
    }else if(!icon.includes('/')){
        icon = codePath + 'img/' + icon;
    }
    if(!icon.includes('.svg')){
        return icon;
    }
    let color = getItem('主题颜色','');
    return icon + ((!color||nochange)?'':'?s='+color+'@js=' + $.toString((color,color2) => {
        let javaImport = new JavaImporter();
        javaImport.importPackage(Packages.com.example.hikerview.utils);
        with(javaImport) {
            let bytes = FileUtil.toBytes(input);
            let str = new java.lang.String(bytes, "UTF-8") + "";
            str = str.replace(/#feb833/gi, color);
            if(color2){
                const regex = new RegExp(color2, 'gi');
                str = str.replace(regex, color);
            }
            bytes = new java.lang.String(str).getBytes();
            return FileUtil.toInputStream(bytes);
        }
    },color, color2))
}

// 获取主题图标列表
function getThemeList(isEnable) {
    let themefile = rulepath + 'themes.json';
    eval('let themelist = ' + (fetch(themefile) || '[]'));
    
    if(isEnable){
        let currentTheme = storage0.getItem('currentTheme', {
            名称: '原生主题',
            主页图标: ["http://123.56.105.145/tubiao/more/157.png","http://123.56.105.145/tubiao/more/287.png","http://123.56.105.145/tubiao/more/101.png","http://123.56.105.145/tubiao/more/286.png","http://123.56.105.145/tubiao/more/129.png"],
            二级图标: ['http://123.56.105.145/tubiao/messy/32.svg','http://123.56.105.145/tubiao/messy/70.svg','http://123.56.105.145/tubiao/messy/20.svg',"http://123.56.105.145/tubiao/ke/91.png",'http://123.56.105.145/tubiao/messy/25.svg'],
            接口图标: ["http://123.56.105.145/tubiao/more/25.png","http://123.56.105.145/tubiao/more/290.png","http://123.56.105.145/tubiao/more/43.png","http://123.56.105.145/tubiao/more/3.png"],
            书架图标: ['http://123.56.105.145/tubiao/messy/70.svg','http://123.56.105.145/tubiao/messy/85.svg','http://123.56.105.145/tubiao/messy/151.svg']
        });
        function padArray(arr, length, fill) {
            fill = fill || '';
            return arr.concat(Array(length - arr.length).fill(fill)).slice(0, length);
        }
        let 图标数量 = {主页: 5, 二级: 5, 接口: 4, 书架: 3}
        currentTheme['主页图标'] = padArray(currentTheme['主页图标'] || [], 图标数量['主页']);
        currentTheme['二级图标'] = padArray(currentTheme['二级图标'] || [], 图标数量['二级']);
        currentTheme['接口图标'] = padArray(currentTheme['接口图标'] || [], 图标数量['接口']);
        currentTheme['书架图标'] = padArray(currentTheme['书架图标'] || [], 图标数量['书架']);

        Object.keys(currentTheme).forEach(it=>{
            if($.type(currentTheme[it])=='array'){
                currentTheme[it] = currentTheme[it].map((v)=>{
                    return {
                        img: $.type(v)=='object'?v.img:v,
                        color: $.type(v)=='object'?v.color||'':''
                    }
                })
            }
        })
        return currentTheme;
    }
    return themelist;
}
// 手机是否暗黑模式
function isDarkMode() {
  const Configuration = android.content.res.Configuration;
  let cx = getCurrentActivity();

  let theme = cx.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
  return theme == Configuration.UI_MODE_NIGHT_YES;
}
// 执行一些主页加载后的事项，间隔24小时
function excludeLoadingItems() {
    // 清理接口排序
    let datalist = [];
    let sourcedata = fetch(jkfile);
    if(sourcedata != ""){
        try{
            eval("datalist=" + sourcedata+ ";");
        }catch(e){ }
    }
    let sort = {};
    if(fetch(sortfile)){
        eval("sort = " + fetch(sortfile));
    }
    Object.keys(sort).forEach(it=>{
        if(!datalist.some(item => item.id==it)){
            delete sort[it];
        }
        if($.type(sort[it]) != "object"){
            delete sort[it];
        }
    })
    writeFile(sortfile, JSON.stringify(sort));
    if(getItem('自动禁用失败的源') == '1'){
        // 失败15以上的接口自动禁用
        datalist.forEach(it=>{
            if(!it.stop){
                try{
                    let jksort = sort[it.id] || {};
                    let fail = jksort.fail || 0;
                    if(fail>=15){
                        it.stop = 1;
                    }
                }catch(e){}
            }
        })
        writeFile(jkfile, JSON.stringify(datalist));
    }
    
    // 清理接口残留过期文件
    /*
    let names = readDir(jkfilespath);
    names.forEach(it=>{
        if(!datalist.some(item => item.url==jkfilespath+it)){
            deleteFile(jkfilespath+it);
        }
    })
    */
}
// 获取接口源列表元素
function jkItemList(jkdatalist){
    let selectlist = storage0.getMyVar('duodatalist') || [];
    let d = [];
    jkdatalist.forEach(it => {
        let selectmenu,datatitle;
        selectmenu = ["分享","编辑", "删除", it.stop?"启用":"禁用", "置顶", "测试"];
        if(selectlist.some(item => it.id==item.id)){
            datatitle = colorTitle(getDataTitle(it, '●'), '#3CB371');
        }else{
            datatitle = getDataTitle(it);
        }
        let itimg = it.img || "http://123.56.105.145/tubiao/ke/31.png";

        d.push({
            title: datatitle,
            url: getMyVar('批量选择模式')?$('#noLoading#').lazyRule((data) => {
                data = JSON.parse(base64Decode(data));
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                duoselect(data);
                return "hiker://empty";
            },base64Encode(JSON.stringify(it))):$(selectmenu, 2).select((data) => {
                data = JSON.parse(base64Decode(data));
                if (input == "分享") {
                    if(getItem("sharePaste","")==""){
                        let pastes = getPastes();
                        pastes.push('云口令文件');
                        return $(pastes,2).select((data)=>{
                            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
                            return JYshare(input, data);
                        }, data)
                    }else{
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
                        return JYshare(getItem("sharePaste",""), data);
                    }
                } else if (input == "编辑") {
                    return $('hiker://empty#noRecordHistory##noHistory#').rule((data) => {
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
                        jiekouapi(data);
                    }, data)
                } else if (input == "删除") {
                    return $("确定删除："+data.name).confirm((data)=>{
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                        deleteData(data);
                        //refreshPage(false);
                        deleteItem(data.id);
                        return 'toast://已删除:'+data.name;
                    }, data)
                } else if (input == "测试") {
                    return $("hiker://empty#noRecordHistory##noHistory#").rule((data) => {
                        setPageTitle(data.name+"-接口测试");
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJu.js');
                        yiji(data);
                    }, data);
                } else {//置顶、禁用、启用
                    if(input == "置顶" && getItem("sourceListSort", "更新时间") != "更新时间"){
                        return "toast://无效操作，接口列表排序方式为：" + getItem("sourceListSort");
                    }
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                    let sm = dataHandle(data, input);
                    refreshPage(false);
                    return 'toast://' + sm;
                }
            }, base64Encode(JSON.stringify(it))),
            desc: (it.group||it.type) + (it.group?"("+it.type+")":"") + "  ["+ilks[parseInt(it.ilk||1)-1]+"]" + (it.tmpl?("  模板:"+it.tmpl.name):""),
            img: it.stop?itimg+'?t=stop' + $().image(() => $.require("jiekou?rule=" + MY_TITLE).toGrayscale()):itimg,
            col_type: ((MY_NAME=="海阔视界"&&getAppVersion()>=5566)||(MY_NAME=="嗅觉浏览器"&&getAppVersion()>=2305))?"icon_1_left_pic":"avatar",
            extra: {
                id: it.id,
                cls: 'jkItemLoadList',
                longClick: [{
                    title: "打开代码文件",
                    js: $.toString((url) => {
                        return 'openFile://'+ url;
                    },it.url)
                }]
            }
        });
    })
    return d;
}
// 源接口编辑保存输出data
function outputNewData(data){
    let apiname = getMyVar('apiname') || undefined;
    let apiauthor = getMyVar('apiauthor') || undefined;
    let apiversion = getMyVar('apiversion', $.dateFormat(new Date(),"yyyyMMdd").toString());
    let apitype = getMyVar('apitype') || undefined;
    let apigroup = getMyVar('apigroup') || undefined;
    let apiruleurl = getMyVar('apiruleurl') || undefined;
    let apiimg = getMyVar('apiimg') || undefined;
    let apiilk = getMyVar('apiilk') || undefined;
    let apitmpldata = storage0.getMyVar('tmpldata') || undefined;
    if (!apiname) {
        return "toast://名称不能为空";
    }
    if (!apitype) {
        return "toast://大类没有选择";
    }
    if (!apiruleurl || !fetch(apiruleurl)) {
        return "toast://规则文件不存在";
    }
    if (!apiilk) {
        return "toast://源种类没有选择";
    }
    
    let newid = Date.now().toString();
    let newapi = {
        id: data?data.id:newid,
        name: apiname,
        author: apiauthor,
        version: apiversion,
        type: apitype,
        group: apigroup,
        url: apiruleurl,
        img: apiimg,
        ilk: apiilk,
        tmpl: apitmpldata
    }
    if(data){
        newapi['oldid'] = data.id;
    }
    return newapi;
}
// 输出检索接口列表
function outputSearchList(jkdatalist, input){
    let PinyinMatch = $.require(libspath + "plugins/pinyin-match.js");
    jkdatalist = jkdatalist.filter(it=>{
        return it.name.toLowerCase().includes(input.toLowerCase()) || (it.author||"").includes(input) || it.id==input || (/^[a-zA-Z]+$/.test(input) && PinyinMatch.match(it.name, input));
    })
    storage0.putMyVar("seacrhDataList", jkdatalist);
    return jkdatalist;
}
// 批量检测源方法
function batchTestSource(){
    return $("hiker://empty#noRecordHistory##noHistory##noRefresh#").rule((ilks) => {
        addListener("onClose", $.toString(() => {
            clearMyVar("批量检测_待检列表");
            clearMyVar("批量检测_待检列表2");
            clearMyVar('批量选择模式');
            clearMyVar('duodatalist');
            refreshPage(true);
        }));
        
        let d = [];
        d.push({
            title: '开始检测',
            col_type: 'text_3',
            url: $().lazyRule(()=>{
                
                return "hiker://empty";
            })
        });
        d.push({
            title: '开始检测',
            col_type: 'text_3',
            url: $().lazyRule(()=>{
                
                return "hiker://empty";
            })
        });
        d.push({
            title: '开始检测',
            col_type: 'text_3',
            url: $().lazyRule(()=>{
                
                return "hiker://empty";
            })
        });

        let checkSourceList = storage0.getMyVar("批量检测_待检列表2");
        if(!checkSourceList){
            let sourceList = storage0.getMyVar("批量检测_待检列表") || [];
            checkSourceList = []; 
            sourceList.filter(v=>['1', '2', '3'].includes(v.ilk)).forEach(it => {
                let selectmenu = ["删除", "测试"];
                let itimg = it.img || "http://123.56.105.145/tubiao/ke/31.png";

                checkSourceList.push({
                    title: it.name + '  ‘‘’’<small><font color=grey>'+(data.author?'  ['+data.author+']':'') + '\n' + (it.group||it.type) + ' ['+ilks[parseInt(it.ilk||1)-1] + ']</font></small>',
                    url: $(selectmenu, 2).select((data) => {
                        data = JSON.parse(base64Decode(data));
                        if (input == "删除") {
                            return $("确定删除："+data.name).confirm((data)=>{
                                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                                deleteData(data);
                                deleteItem('test-' + data.id);
                                return 'toast://已删除:'+data.name;
                            }, data)
                        } else if (input == "测试") {
                            return $("hiker://empty#noRecordHistory##noHistory#").rule((data) => {
                                setPageTitle(data.name+"-接口测试");
                                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJu.js');
                                yiji(data);
                            }, data);
                        }
                    }, base64Encode(JSON.stringify(it))),
                    desc: '',
                    img: it.stop?itimg+'?t=stop' + $().image(() => $.require("jiekou?rule=" + MY_TITLE).toGrayscale()):itimg,
                    col_type: ((MY_NAME=="海阔视界"&&getAppVersion()>=5566)||(MY_NAME=="嗅觉浏览器"&&getAppVersion()>=2305))?"icon_1_left_pic":"avatar",
                    extra: {
                        id: 'test-' + it.id
                    }
                });
            })
            storage0.putMyVar("批量检测_待检列表2", checkSourceList);
        }
        checkSourceList.forEach(it=>{
            d.push(it);
        })

        setResult(d);
    }, ilks)
}
// 只显示名称相近的接口
function similarTitles(items, similarityThreshold) {
    // 设置默认相似度阈值
    similarityThreshold = similarityThreshold || 0.8;
    
    // 计算两个字符串的相似度（0~1）
    const StringUtil = Packages.com.example.hikerview.utils.StringUtil;
    function similarity(str1, str2) {
        let df = 0;
        df = StringUtil.levenshtein(str1, str2)
        return df;
    }

    // Levenshtein 距离计算
    function levenshteinDistance(s, t) {
        if (s === t) return 0;
        if (s.length === 0) return t.length;
        if (t.length === 0) return s.length;

        let dp = [];
        for (let i = 0; i <= s.length; i++) {
            dp[i] = [];
            dp[i][0] = i;
        }
        for (let j = 0; j <= t.length; j++) {
            dp[0][j] = j;
        }

        for (i = 1; i <= s.length; i++) {
            for (j = 1; j <= t.length; j++) {
                let cost = s[i - 1] === t[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,     // 删除
                    dp[i][j - 1] + 1,     // 插入
                    dp[i - 1][j - 1] + cost // 替换
                );
            }
        }
        return dp[s.length][t.length];
    }

    // 1. 先分组
    let groups = [];
    let visited = {};

    for (let i = 0; i < items.length; i++) {
        if (visited[i]) continue;

        let currentGroup = [items[i]];
        visited[i] = true;

        // 查找所有与当前对象相似的
        for (let j = 0; j < items.length; j++) {
            if (i === j || visited[j]) continue;

            let sim = similarity(
                items[i].name.toLowerCase(),
                items[j].name.toLowerCase()
            );

            if (sim >= similarityThreshold) {
                currentGroup.push(items[j]);
                visited[j] = true;
            }
        }

        // 只保留相似项≥2的组
        if (currentGroup.length >= 2) {
            groups.push(currentGroup);
        }
    }

    // 2. 扁平化分组
    let result = [];
    for (let g = 0; g < groups.length; g++) {
        for (let k = 0; k < groups[g].length; k++) {
            result.push(groups[g][k]);
        }
    }

    return result;
}