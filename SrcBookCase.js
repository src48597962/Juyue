//本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
require((config.聚阅||getPublicItem('聚阅','')).replace(/[^/]*$/,'') + 'SrcJuPublic.js');
//书架
function bookCase() {
    addListener("onClose", $.toString(() => {
        clearMyVar('从书架进二级');
        clearMyVar('书架动态加载loading');
        if(getItem("退出重置收藏")=="1"){
            clearItem("切换收藏列表");
        }
        clearMyVar('收藏书架列表');
        clearMyVar('收藏书架搜索标识');
        clearMyVar('收藏书架搜索框');
        if(juItem2.get("bookCase_UpdateTiming")===0){
            clearMyVar('执行书架异步更新');
        }
    }));

    setPageTitle('收藏|书架');
    putMyVar('从书架进二级','1');
    if(juItem2.get("bookCase_UpdateTiming")===2){
        addListener("onRefresh", $.toString(() => {
            putMyVar('书架异步更新下滑', '1');
        }));
    }
    let d = [];
    if (typeof (setPreResult) != "undefined" && getMyVar('书架动态加载loading') != '1'){
        for(let i=0;i<4;i++){
            d.push({
                title: "",
                url: "hiker://empty",
                col_type: "text_1",
                extra: {
                    lineVisible: false,
                    cls: "loading_gif"
                }
            })
        }
        d.push({
            pic_url: config.聚阅.replace(/[^/]*$/,'') + "img/Loading.gif",
            col_type: "pic_1_center",
            url: "hiker://empty",
            extra: {
                cls: "loading_gif"
            }
        })
        setPreResult(d);
        d = [];
        putMyVar('书架动态加载loading', '1');
    }
    
    let sjType = MY_NAME=="海阔视界"?getItem("切换收藏列表", "软件收藏"):"聚阅收藏";
    let Julist = [];
    if(sjType=="软件收藏"){
        let collection = JSON.parse(fetch("hiker://collection?rule="+MY_RULE.title));
        collection.forEach(it => {
            try{
                if(it.params&& (JSON.parse(it.params).title==MY_RULE.title)){
                    let extraData = JSON.parse(it.extraData || '{}');
                    let params = JSON.parse(it.params);
                    let extra = JSON.parse(params['params'] || '{}');
                    extra['data'] = extra['data'] || {};
                    delete extra['data']['extstr'];
                    delete extra['longClick'];
                    let obj = {
                        type: it.mITitle,
                        title: it.mTitle,
                        picUrl: it.picUrl,
                        params: {
                            url: params.url.split(';')[0],
                            find_rule: params.find_rule,
                            params: extra
                        },
                        lastChapter: extraData.lastChapterStatus || "",
                        lastClick: it.lastClick?it.lastClick.split('@@')[0]:"",
                        group: it.group
                    }
                    obj.id = getCaseID(obj);
                    Julist.push(obj);
                }
            }catch(e){
                xlog("软件收藏列表加载异常>"+e.message + ' 错误行#' + e.lineNumber);
            }
        })
    }else{
        if(getItem("聚阅收藏加锁")=="1" && getMyVar('SrcJu_已验证指纹')!='1'){
            const hikerPop = $.require(libspath + 'plugins/hikerPop.js');
            if (hikerPop.canBiometric() !== 0) {
                toast("调用生物学验证出错");
            }
            let pop = hikerPop.checkByBiometric(() => {
                putMyVar('SrcJu_已验证指纹','1');
                refreshPage(false);
            });
        }else{
            let casefile = rulepath + 'case.json';
            eval('let caselist = ' + (fetch(casefile) || '[]'));
            let history = JSON.parse(fetch("hiker://history?rule=" + MY_RULE.title));
            history = history.filter(v => v.type == '二级列表');

            caselist.forEach(it => {
                try {
                    it.id = it.id || getCaseID(it);
                    let his = history.filter((v) => {
                        return v.title==it.title;
                    }).filter((v) => {
                        let obj = {
                            title: v.title,
                            params: {
                                url: MY_NAME=="海阔视界"?v.ruleBaseUrl:v.url.split('@')[1]
                            }
                        }
                        return getCaseID(obj)==it.id;
                    });
                    it.params.params = it.params.params || {};
                    it.lastChapter = it.lastChapter || "";
                    it.lastClick = it.lastClick || '';
                    if (his.length > 0) {
                        it.lastClick = his[0].lastClick ? his[0].lastClick.split('@@')[0] : "";
                    }
                    it.group = it.group || "";
                    Julist.push(it);
                } catch (e) {
                    xlog("聚阅收藏列表加载异常>" + e.message + ' 错误行#' + e.lineNumber);
                }
            })
        }
    }

    let listcol = juItem2.get("bookCase_col_type", "movie_1_vertical_pic");
    let datalist = [];
    let typebtn = [];
    Julist.forEach(item=>{
        let extra = item.params.params;
        let data = extra['data'] || {};
        let types = (data.group || data.type || '').split(',');
        types.forEach(type=>{
            if(type && typebtn.indexOf(type)==-1){
                typebtn.push(type);
            }
        })

        let obj = convertItem(item, listcol, sjType);
        if(obj){
            datalist.push(obj);
        }
    })
    storage0.putMyVar('收藏书架列表', datalist);

    datalist = datalist.filter(it=>{
        let data = it.extra['data'] || {};
        let types = (data.group || data.type || '').split(',');
        return getMyVar("SrcJu_bookCaseType","全部")=="全部" || types.indexOf(getMyVar("SrcJu_bookCaseType"))>-1;
    })

    if(isDarkMode() || getItem('不显示沉浸图')=='1'){
        for(let i=0;i<2;i++){
            d.push({
                title: "",
                url: "hiker://empty",
                col_type: "text_1",
                extra: {
                    lineVisible: false
                }
            })
        }
    }else{
        /*
        d.push({
            col_type: 'pic_1_full',
            img: "http://123.56.105.145/weisyr/img/TopImg0.png",
            url: 'hiker://empty',
        });
        */
        require('http://123.56.105.145/weisyr/Top_H5.js');
        let topimg;
        if(datalist.length>0){
            topimg = (datalist[0].pic_url||'').split('@Referer=')[0];
        }else{
            deleteFile('hiker://files/cache/Top_H5.jpg');
        }
        d.push(Top_H5("90", topimg));
    }

    let sjIcons = getThemeList(true)['书架图标'];
    d.push({
        title: '本地下载',
        url: "hiker://page/Main.view?rule=本地资源管理",
        img: getIcon(sjIcons[0].img, false, sjIcons[0].color),
        col_type: "icon_small_3"
    });
    let case_cols = ['movie_1_vertical_pic', 'movie_3_marquee'];
    if((MY_NAME=="海阔视界"&&getAppVersion()>=5566)||(MY_NAME=="嗅觉浏览器"&&getAppVersion()>=2305)){
        case_cols.push('icon_1_left_pic');
    }
    
    d.push({
        title: '设置菜单',
        url: $('#noLoading#').lazyRule((case_cols) => {
            let updatetiming = ["每次打开收藏都更新", "软件启动后只更新一次", "不自动更新只下拉更新"];
            const hikerPop = $.require(libspath + "plugins/hikerPop.js");
            let SettingItem = hikerPop.selectBottomSettingMenu.SettingItem;
            let setItems = [
                SettingItem("列表/书架样式", juItem2.get("bookCase_col_type", "movie_1_vertical_pic")), 
                SettingItem("自动获取更新时机", updatetiming[juItem2.get("bookCase_UpdateTiming", 1)]), 
                SettingItem("自动切换二级源接口", getItem("自动切换二级源接口")=="0"?false:true), 
                SettingItem(), 
                SettingItem("聚阅收藏需要生物锁", getItem("聚阅收藏加锁")=="1"?true:false)
            ]
            if(MY_NAME=="海阔视界"){
                setItems.push(SettingItem("退出重置为软件收藏", getItem("退出重置收藏")=="1"?true:false));
            }
            if(getItem("切换收藏列表")=="聚阅收藏"){
                setItems.push(SettingItem());
                setItems.push(SettingItem("清空收藏书架列表", "谨慎操作"));
            }
            
            hikerPop.selectBottomSettingMenu({options: setItems, click(s, officeItem, change) {
                if (s=="列表/书架样式") {
                    hikerPop.selectBottomMark({options: case_cols, position: case_cols.indexOf(juItem2.get("bookCase_col_type", "movie_1_vertical_pic")), click(a) {
                        officeItem.setDesc(a);
                        juItem2.set("bookCase_col_type", a);
                        change();
                        return "toast://选择了:" + a;
                    }});
                }else if (s=="自动获取更新时机") {
                    hikerPop.selectBottomMark({options: updatetiming, position: juItem2.get("bookCase_UpdateTiming", 1), click(a,i) {
                        officeItem.setDesc(a);
                        juItem2.set("bookCase_UpdateTiming", i);
                        change();
                        return "toast://选择了:" + a;
                    }});
                }else if (s=="自动切换二级源接口") {
                    if(getItem("自动切换二级源接口")=="0"){
                        clearItem("自动切换二级源接口");
                    }else{
                        setItem("自动切换二级源接口", "0");
                    }
                    officeItem.setSelected(officeItem.getSelected() === 1 ? -1 : 1);
                }else if (s=="退出重置为软件收藏") {
                    if(getItem("退出重置收藏")=="1"){
                        clearItem("退出重置收藏");
                    }else{
                        setItem("退出重置收藏", "1");
                    }
                    officeItem.setSelected(officeItem.getSelected() === 1 ? -1 : 1);
                }else if (s=="聚阅收藏需要生物锁") {
                    if(getItem("聚阅收藏加锁")=="1"){
                        if (hikerPop.canBiometric() !== 0) {
                            return "toast://调用生物学验证出错";
                        }
                        let pop = hikerPop.checkByBiometric(() => {
                            clearItem("聚阅收藏加锁");
                            officeItem.setSelected(-1);
                            change();
                        });
                    }else{
                        setItem("聚阅收藏加锁", "1");
                        officeItem.setSelected(1);
                    }
                }else if (s=="清空收藏书架列表") {
                    hikerPop.confirm({
                        content: "想好再操作哦，清空无法恢复",
                        title: "清空聚阅收藏",
                        okTitle: "确认清空",
                        cancelTitle: "我再想想",
                        hideCancel: false,
                        confirm() {
                            let caselist = [];
                            writeFile(casefile, $.stringify(caselist));
                            toast('已清空');
                        },
                        cancel() {
                            //return "hiker://empty";
                        }
                    });
                }
                change();
            }, onDismiss() {
                refreshPage();
            }});
            return "hiker://empty";
        }, case_cols),
        img: getIcon(sjIcons[1].img, false, sjIcons[1].color),
        col_type: "icon_small_3"
    });
    
    d.push({
        title: sjType,
        url: $('#noLoading#').lazyRule(() => {
            if(getItem("切换收藏列表")=="聚阅收藏"){
                clearItem("切换收藏列表");
            }else{
                setItem("切换收藏列表", "聚阅收藏");
            }
            refreshPage(false);
            return 'hiker://empty';
        }),
        img: getIcon(sjIcons[2].img, false, sjIcons[2].color),
        col_type: "icon_small_3"
    });

    let Color = getItem('主题颜色','#3399cc');
    typebtn.unshift("全部");
    typebtn.forEach(it =>{
        d.push({
            title: getMyVar("SrcJu_bookCaseType","全部")==it?`““””<b><span style="color: ` + Color + `">` + it + `</span></b>`:it,
            url: $('#noLoading#').lazyRule((typebtn,it,Color) => {
                deleteItemByCls("caselist");
                let casedatalist = storage0.getMyVar('收藏书架列表', []).filter(v=>{
                    let data = v.extra['data'] || {};
                    let types = (data.group || data.type || '').split(',');
                    return it=='全部' || types.indexOf(it)>-1;
                });
                deleteItem('casesearchinput');
                if(casedatalist.length>=20){
                    addItemBefore('caseloading', storage0.getMyVar('收藏书架搜索框', {}));
                }
                
                let listcol = juItem2.get("bookCase_col_type", "movie_1_vertical_pic");
                let adddatalist = [];
                casedatalist.forEach(it=>{
                    adddatalist.push(it);
                    if(listcol=='icon_1_left_pic' || listcol=='movie_1_vertical_pic'){
                        adddatalist.push({
                            col_type: listcol=='movie_1_vertical_pic'?'line':'line_blank',
                            extra: {
                                cls: 'caselist'
                            }
                        });
                    }
                })
                addItemBefore('caseloading', adddatalist);

                typebtn.forEach(t=>{
                    updateItem('typebtn-' + t, {
                        title: it==t?`““””<b><span style="color: ` + Color + `">` + t + `</span></b>`:t,
                        extra: {
                            id: 'typebtn-' + t,
                            backgroundColor: it==t?"#20" + Color.replace('#',''):""
                        }
                    })
                })
                putMyVar("SrcJu_bookCaseType", it);
                return "hiker://empty";
            },typebtn,it,Color),
            col_type: 'scroll_button',
            extra: {
                id: 'typebtn-' + it,
                backgroundColor: getMyVar("SrcJu_bookCaseType","全部")==it?"#20" + Color.replace('#',''):""
            }
        })
    })

    let 搜索框 = {
        title: '🔍',
        url: $.toString((casesousuo) => {
            putMyVar('收藏书架搜索标识','1');
            return casesousuo(input);
        }, casesousuo),
        desc: '',
        col_type: "input",
        extra: {
            id: 'casesearchinput',
            titleVisible: true,
            defaultValue: "",
            onChange: $.toString((casesousuo) => {
                if(input.length>1){
                    putMyVar('收藏书架搜索标识','1');
                    return casesousuo(input);
                }else if(getMyVar('收藏书架搜索标识')){
                    clearMyVar('收藏书架搜索标识');
                    return casesousuo();
                }
            }, casesousuo)
        }
    }
    storage0.putMyVar('收藏书架搜索框', 搜索框);
    if(datalist.length>=20){
        d.push(搜索框);
    }

    deleteItemByCls("loading_gif");

    datalist.forEach(item => {
        d.push(item);
        if(listcol=='icon_1_left_pic' || listcol=='movie_1_vertical_pic'){
            d.push({
                col_type: listcol=='movie_1_vertical_pic'?'line':'line_blank',
                extra: {
                    cls: 'caselist'
                }
            });
        }
    })
    d.push({
        title: datalist.length==0?"空空如也~~"+(sjType=="聚阅收藏"?"长按二级封面加入聚阅收藏":"二级右上角♥加入软件收藏"):"",
        url: "hiker://empty",
        col_type: "text_center_1",
        extra: {
            lineVisible: false,
            id: "caseloading"
        }
    })
    setResult(d);
    if((!getMyVar('执行书架异步更新') && juItem2.get("bookCase_UpdateTiming")!==2) || getMyVar('书架异步更新下滑')){
        putMyVar('执行书架异步更新', '1');
        clearMyVar('书架异步更新下滑');

        let task = function (item) {
            return (function() {
                //收藏更新最新章节
                let zx;
                let extra = item.params.params;
                let jkdata = extra['data'] || {};
                try{
                    let parse = getObjCode(jkdata, 'zx');
                    if (parse['最新']) {
                        MY_URL = extra.url;
                        MY_PARAMS = extra;

                        let 最新str = parse['最新'].toString().replace('setResult','return ').replace('getResCode()','request(MY_URL)');
                        eval("let 最新2 = " + 最新str);
                        eval(evalPublicStr);
                        zx = 最新2.call(parse, MY_URL) || "";
                    }else if(parse['二级']){
                        zx = "源没写最新"
                    }
                }catch(e){
                    xlog(jkdata.name + '|' + item.title + ">最新获取失败>" + e.message);
                }
                return {item:item, zx:zx};
            })();
        }
        let list = Julist.map((item) => {
            return {
                func: task,
                param: item,
                id: item.id
            }
        });

        if (list.length > 0) {
            let results = [];
            be(list, {
                func: function (obj, id, error, taskResult) {
                    let zx = taskResult.zx;
                    let item = taskResult.item;
                    if(zx && zx!=item.lastChapter){
                        item.lastChapter = zx;
                        let newitem = convertItem(item, listcol, sjType);
                        if(newitem){
                            updateItem(item.id, {
                                title: newitem.title,
                                desc: newitem.desc
                            });
                        }
                        results.push({id: item.id, lastChapter: zx, lastClick: item.lastClick});
                    }
                },
                param: {
                }
            });
            if(sjType=="聚阅收藏"){
                addBookCase(results.reverse(), true);
            }
            xlog('收藏书架列表最新、足迹更新完成');
        }
        /*
        // 收集所有异步操作的Promise
        let promises = [];
        // 异步更新最新
        Julist.forEach(item=>{
            const promise = Async(item)
                .then((zx) => {
                    if(zx && zx!=item.lastChapter){
                        item.lastChapter = zx;
                        let obj = convertItem(item, listcol, sjType);
                        if(obj){
                            updateItem(item.id, {
                                title: obj.title,
                                desc: obj.desc
                            });
                        }
                    }
                    // 返回当前结果，供Promise.all()收集
                    return {id: item.id, lastChapter: zx, lastClick: item.lastClick};
                })
            promises.push(promise);
        })  
        // 等待所有异步操作完成后再处理结果
        Promise.all(promises)
            .then((results) => {
                if(sjType=="聚阅收藏"){
                    addBookCase(results.filter(v=>v).reverse(), true);
                }
                xlog('收藏书架列表最新、足迹更新完成');
            })
        */
    }
}

// 异步更新书架列表最新
function Async(item) {
    return new Promise((resolve) => {
        //收藏更新最新章节
        let zx;
        try{
            let extra = item.params.params;
            let jkdata = extra['data'] || {};
            let parse = getObjCode(jkdata, 'zx');

            if (parse['最新']) {
                MY_URL = extra.url;
                MY_PARAMS = extra;

                let 最新str = parse['最新'].toString().replace('setResult','return ').replace('getResCode()','request(MY_URL)');
                eval("let 最新2 = " + 最新str);
                eval(evalPublicStr);
                zx = 最新2.call(parse, MY_URL) || "";
            }else if(parse['二级']){
                zx = "源没写最新"
            }
        }catch(e){
            xlog(jkdata.name + '|' + item.title + ">最新获取失败>" + e.message);
        }
        
        resolve(zx);
    });
}

// 书架搜索筛选
function casesousuo(input) {
    deleteItemByCls("caselist");
    let casedatalist = storage0.getMyVar('收藏书架列表', []).filter(v=>{
        let data = v.extra['data'] || {};
        let types = (data.group || data.type || '').split(',');
        let it = getMyVar("SrcJu_bookCaseType", "全部");
        if(input){
            return (it=='全部' || types.indexOf(it)>-1) && v.title.includes(input);
        }
        return it=='全部' || types.indexOf(it)>-1;
    });
    let listcol = juItem2.get("bookCase_col_type", "movie_1_vertical_pic");
    let adddatalist = [];
    casedatalist.forEach(it=>{
        adddatalist.push(it);
        if(listcol=='icon_1_left_pic' || listcol=='movie_1_vertical_pic'){
            adddatalist.push({
                col_type: listcol=='movie_1_vertical_pic'?'line':'line_blank',
                extra: {
                    cls: 'caselist'
                }
            });
        }
    })
    addItemBefore('caseloading', adddatalist);
    return 'hiker://emtpy';
}
// 书架列表循环转换d结构
function convertItem(item, listcol, sjType){
    try{
        let extra = item.params.params;
        extra['data'] = extra['data'] || {};
        extra['cls'] = "caselist";
        extra['lineVisible'] = false;
        extra['id'] = item.id;

        if(sjType=="聚阅收藏"){
            extra.longClick = [{
                title: "取消收藏",
                js: $.toString((caseid) => {
                    removeBookCase(caseid, true);
                }, item.id)
            },{
                title: "修改分组",
                js: $.toString((caseid, group) => {
                    return $(group, '输入新收藏分组').input((id) => {
                        modifyBookCase(id, {group: input});
                        refreshPage();
                        return 'hiker://emtpy';
                    }, caseid)
                }, item.id, item.group)
            }]
        }

        let stype = extra['data'].type;
        let sname = extra.data.name || "";
        let name = extra.name || item.title;
        let url = item.params.url+'' || '';
        if(!url.includes('@') && !url.startsWith('hiker://page/')){
            if(item.params.find_rule){
                url = url + (item.type=='一级列表'?'@lazyRule=.':item.type=='二级列表'?'@rule=':'') + item.params.find_rule;
            }else{
                let parse = $.require("jiekou").parse(extra.data);
                let 解析 = item.params.lazy||'解析';
                if(parse[解析]){
                    if(item.type=='一级列表'){
                        url = url + parse[解析].call(parse, url);
                    }else if(item.type=='二级列表'){
                        url = url + $('').rule(parse[解析]);
                    }
                }
            }
        }

        let itemtitle = name, itemdesc = '';
        if(listcol=='movie_1_vertical_pic'){
            itemtitle = name.substring(0,13) + "\n‘‘’’<small><font color=grey>"+(stype?stype+" | "+(sname||""):"")+"</font></small>"
            itemdesc = (item.type=='一级列表'?item.type:item.lastChapter+"\n足迹："+item.lastClick);
        }else if(listcol=='movie_3_marquee'){
            itemdesc = item.lastChapter.replace('更新至：','');
        }else if(listcol=='icon_1_left_pic'){
            let lastChapter = item.lastChapter.startsWith(sname)?item.lastChapter:(sname+(item.lastChapter?(" | "+item.lastChapter):""))
            itemtitle = name.substring(0,13) + "\n‘‘’’<small><font color=grey>"+lastChapter+"</font></small>";
            itemdesc = "足迹："+item.lastClick;
        }
        return {
            title: itemtitle,
            pic_url: item.picUrl,
            desc: itemdesc,
            url: url,
            col_type: listcol,
            extra: extra
        }
    }catch(e){
        xlog("书架列表生成异常>"+e.message + ' 错误行#' + e.lineNumber);
    }
    return;
}
