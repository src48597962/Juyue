//本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
//空壳小程序，接口分为主页源和搜索源
require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');

//一级
function yiji(testSource) {
    let jkdata = {};
    try {
        let yxdatalist = getDatas('yi', 1);
        let index = yxdatalist.findIndex(d => d.id === homeSourceId);
        jkdata = yxdatalist[index] || {};
        if(jkdata.name){
            storage0.putMyVar('一级源接口信息', jkdata);
        }
    } catch (e) {
        log("一级源接口加载异常>" + e.message + ' 错误行#' + e.lineNumber);
    }

    let d = [];
    if(MY_PAGE==1){
        /*
        d.push({
            title: jkdata.name || "切换站源",
            url: testSource?"toast://测试模式下不能更换站源":$('#noLoading#').lazyRule(() => {
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                return selectSource();
            }),
            pic_url: config.聚阅.replace(/[^/]*$/,'') + 'img/切源.svg',
            col_type: "icon_3_round_fill",
            extra: {
                longClick: []
            }
        })
        let searchModeS = (MY_NAME=="海阔视界"?["分组接口","当前接口","当前页面"]:["聚合搜索","当前页面"]).map(v=>{
            return v==getItem("接口搜索方式","当前页面")?`‘‘’’<strong><font color="`+getItem('主题颜色','#6dc9ff')+`">`+v+`√</front></strong>`:v+'  ';
        });

        d.push({
            title: getItem("接口搜索方式","当前接口"),
            url: $(searchModeS,1).select(()=>{
                input = input.replace(/[’‘]|<[^>]*>| |√/g, "");
                setItem("接口搜索方式",input);
                refreshPage();
                return "toast://搜索方式设置为："+input+(input=="当前页面"?"，只能搜索1页":"");
            }),
            pic_url: config.聚阅.replace(/[^/]*$/,'') + 'img/搜索.svg',
            col_type: "icon_3_round_fill"//icon_3_round_fill
        })

        d.push({
            title: "管理设置",
            url: testSource?"toast://测试模式下不能进入设置菜单":$(["本地接口管理"],1).select(()=>{
                if(input=="本地接口管理"){
                    return $("hiker://empty#noRecordHistory##noHistory##noRefresh#").rule(() => {
                        setPageTitle('本地接口管理');
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
                        SRCSet();
                    })
                }
            }),
            pic_url: config.聚阅.replace(/[^/]*$/,'') + 'img/设置.svg',
            col_type: "icon_3_round_fill",
            extra: {
                longClick: []
            }
        })
        */
        d.push({
            title: "管理",
            url: $("hiker://empty#noRecordHistory##noHistory##noRefresh#").rule(() => {
                setPageTitle('管理中心');
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
                manageSet();
            }),
            pic_url: "http://123.56.105.145/tubiao/more/129.png",
            col_type: "icon_5"
        })
        d.push({
            title: "收藏",
            url: "hiker://collection?rule="+MY_RULE.title,
            pic_url: "http://123.56.105.145/tubiao/more/109.png",
            col_type: 'icon_5'
        })
        d.push({
            title: "历史",
            url: "hiker://history?rule="+MY_RULE.title,
            pic_url: "http://123.56.105.145/tubiao/more/213.png",
            col_type: 'icon_5'
        })
        d.push({
            title: "聚影",
            url: "hiker://home@聚影",
            pic_url: "http://123.56.105.145/tubiao/more/101.png",
            col_type: 'icon_5'
        })
        d.push({
            title: "设置",
            url: testSource?"toast://测试模式下不能进入设置菜单":$(["接口列表"],1).select(()=>{
                if(input=="接口列表"){
                    return $("hiker://empty#noRecordHistory##noHistory##noRefresh#").rule(() => {
                        setPageTitle('本地接口管理');
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
                        SRCSet();
                    })
                }
            }),
            pic_url: "http://123.56.105.145/tubiao/more/129.png",
            col_type: "icon_5"
        })
        

        let typemenubtn = getTypeNames("主页");
        let Color = '#3399cc';
        typemenubtn.forEach((it) =>{
            let item = {
                title: homeGroup==it?`““””<b><span style="color: `+Color+`">`+it+`</span></b>`:it,
                url: homeGroup==it?$('#noLoading#').lazyRule((input) => {
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                    return selectSource(input);
                }, it):$('#noLoading#').lazyRule((cfgfile,Juconfig,input) => {
                    Juconfig["homeGroup"] = input;
                    writeFile(cfgfile, JSON.stringify(Juconfig));
                    refreshPage(false);
                    return 'toast://主页源分类分组已切换为：' + input;
                }, cfgfile, Juconfig ,it),
                col_type: "scroll_button"
            }
            if(homeGroup==it){
                item.extra = {
                    backgroundColor: homeGroup==it?"#20" + Color.replace('#',''):""
                }
            }
            d.push(item);
        })
        
        let searchurl = $('').lazyRule((jkdata) => {
            if(getItem('接口搜索方式','当前主页')=="当前接口"){
                if(jkdata){
                    storage0.putMyVar('Src_Jy_搜索临时搜索数据', jkdata);
                    return 'hiker://search?s='+input+'&rule='+MY_RULE.title;
                }else{
                    return 'toast://未找到接口数据'
                }
            }else if(getItem('接口搜索方式')=="分组接口"){
                putMyVar('Src_Jy_搜索临时搜索分组', jkdata.group||jkdata.type);
                return 'hiker://search?s='+input+'&rule='+MY_RULE.title;
            }else if(getItem('接口搜索方式')=="代理聚搜"){
                return 'hiker://search?s='+input+'&rule='+MY_RULE.title;
            }else if(getItem('接口搜索方式')=="聚合搜索"){
                return $('hiker://empty#noRecordHistory##noHistory##noRefresh#').rule((input) => {
                    require(config.聚影);
                    newSearch(input);
                },input);
            }else{
                require(config.聚阅); 
                let d = search(input, 'yiji' , jkdata);
                if(d.length>0){
                    deleteItemByCls('homesousuolist');
                    addItemAfter('homesousuoid', d);
                }else{
                    return 'toast://无结果';
                }
                return 'hiker://empty';
            }
        }, jkdata);
        
        //if(MY_NAME=="嗅觉浏览器"){
            d.push({
                title: "搜索",
                url: $.toString((searchurl) => {
                    input = input.trim();
                    if(input == ''){
                        return "hiker://empty"
                    }
                    return input + searchurl;
                },searchurl),
                desc: "搜你想要的...",
                col_type: "input",
                extra: {
                    id: 'homesousuoid',
                    titleVisible: true,
                    onChange: $.toString(() => {
                        if(input==""){
                            deleteItemByCls('homesousuolist');
                        }
                    })
                }
            });
        //}
        
        if(!jkdata.name){
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
    }
    
    //加载主页内容
    if(jkdata.name){
        try{
            let lists = [];

            let lockgroups = Juconfig["lockgroups"] || [];
            if((lockgroups.indexOf(homeGroup)>-1 || (parseInt(getMyVar('点播下滑num','0'))>1&&lockgroups.length>0)) && getMyVar('已验证指纹')!='1'){
                const hikerPop = $.require(config.聚阅.replace(/[^/]*$/,'') + 'plugins/hikerPop.js');
                if (hikerPop.canBiometric() !== 0) {
                    return "toast://调用生物学验证出错";
                }
                let pop = hikerPop.checkByBiometric(() => {
                    putMyVar('已验证指纹','1');
                    refreshPage(false);
                    if(parseInt(getMyVar('点播下滑num','0'))>1){
                        selectSource(homeGroup);
                    }
                });
            }else{
                log('开始获取一级数据');
                let t1 = new Date().getTime();
                lists = getYiData('主页', jkdata, d);
                let t2 = new Date().getTime();
                log('获取一级数据完成，耗时：' + (t2-t1) + 'ms');
            }

            d = lists;
        }catch(e){
            d.push({
                title: '加载主页源异常了，请更换',
                desc: jkdata.id + '>加载主页内容>' + e.message + ' 错误行#' + e.lineNumber,
                url: 'hiker://empty',
                col_type: 'text_center_1'
            });
            log(jkdata.id+'>调用一级数据异常>' + e.message + ' 错误行#' + e.lineNumber);
        }
    }
    setResult(d);
}

//二级+源搜索
function erji() {
    addListener("onClose", $.toString(() => {
        clearMyVar('二级详情临时对象');
        clearMyVar('二级附加临时对象');
        clearMyVar('二级简介打开标识');
        clearMyVar('换源变更列表id');
        clearMyVar('二级源接口信息');
        if(getMyVar('从书架进二级')){
            clearMyVar('从书架进二级');
            refreshPage(false);
        }
    }));

    clearMyVar('二级加载扩展列表');

    let name = MY_PARAMS.name.replace(/‘|’|“|”|<[^>]+>|全集|国语|粤语/g,"").trim();
    let erCacheFile = cachepath + "erdataCache.json";//二级加载完后的临时数据文件
    let oldMY_PARAMS = Object.assign({}, MY_PARAMS);//一级过来的附加信息先保留一份

    let erTempData = storage0.getMyVar('二级详情临时对象') || {};//二级海报等详情临时保存
    let erjiextra = storage0.getMyVar('二级附加临时对象') || MY_PARAMS;//二级换源时临时extra数据
    let jkdata = erjiextra.data;//接口数据
    let surl = erjiextra.url || erjiextra.surl;//二级请求url
    let sname = jkdata.name;//二级源名称
    let stype = jkdata.type;
    let sgroup = jkdata.group || jkdata.type;//二级源所在分组
    let sid = jkdata.id;//二级源id
    let smark = getMark(surl, sid);//足迹记录
    let lineid = smark.lineid || 0;//线路索引id
    let pageid = smark.pageid || 0;//分页索引id
    
    let d = [];
    let erLoadData = {};
    let isload;//是否正确加载
    let pic;
    let objCode = {};
    
    try {
        if (sid&&surl) {
            MY_URL = surl;
            let erdataCache;
            if(!getMyVar("SrcJu_调试模式")){
                let cacheData = fetch(erCacheFile);
                if (cacheData != "") {
                    try{
                        eval("let cacheJson=" + cacheData + ";");
                        if(cacheJson.sid==sid && cacheJson.surl==surl){
                            erdataCache = cacheJson;//本地缓存接口+链接对得上则取本地，用于切换排序和样式时加快
                        }
                    }catch(e){ }
                }
            }
            //方便换源时二级代码中使用MY_PARAMS
            MY_PARAMS = erjiextra;
            if(erdataCache){
                erLoadData = erdataCache;
            }else{
                log('开始获取二级数据');
                let t1 = new Date().getTime();
                objCode = getObjCode(jkdata);
                try {
                    if (objCode['预处理']) {
                        try {
                            objCode['预处理']();
                        } catch (e) {
                            log('执行预处理报错，信息>' + e.message + " 错误行#" + e.lineNumber);
                        }
                    }
                    if(objCode['二级']){
                        eval("let 二级获取 = " + objCode['二级'])
                        erLoadData = 二级获取(surl);
                    }else{
                        log("rule不存在二级方法");
                    }
                } catch (e) {
                    log('执行获取数据报错，信息>' + e.message + " 错误行#" + e.lineNumber);
                }
                erLoadData.author = objCode['作者'];
                let t2 = new Date().getTime();
                log('获取二级数据完成，耗时：' + (t2-t1) + 'ms');
            }
            
            pic = erLoadData.img || oldMY_PARAMS.img;// || "https://p1.ssl.qhimgs1.com/sdr/400__/t018d6e64991221597b.jpg";
            pic = pic&&pic.indexOf("@Referer=") == -1 ? pic + "@Referer=" : pic;
            erjiextra.img = pic;
            erTempData.img = erjiextra.img || erTempData.img;
            erTempData.detail1 = erLoadData.detail1 || erTempData.detail1;
            erTempData.detail2 =  erLoadData.detail2 || erTempData.detail2;
            erTempData.desc = erLoadData.desc || erTempData.desc;
            let detailextra = erLoadData.detailextra || {};
            detailextra.id = "detailid";
            detailextra.gradient = detailextra.gradient || true;
            d.push({
                title: erTempData.detail1 || "",
                desc: erTempData.detail2 || "",
                pic_url: erTempData.img,
                url: erLoadData.detailurl || (/^http/.test(surl)?surl+'#noRecordHistory##noHistory#':erTempData.img),
                col_type: 'movie_1_vertical_pic_blur',
                extra: detailextra
            })

            lineid = parseInt(getMyVar("SrcJu_"+surl+"_line", lineid.toString()));
            pageid = parseInt(getMyVar("SrcJu_"+surl+"_page", pageid.toString()));

            let 线路s = ["线路"];
            let 列表s = [[]];
            try{
                线路s = erLoadData.line?erLoadData.line:["线路"];
                列表s = erLoadData.line?erLoadData.list:[erLoadData.list];
                if(线路s.length != 列表s.length){
                    log(sname+'>源接口返回的线路数'+线路s.length+'和列表数'+列表s.length+'不相等');
                }
            }catch(e){
                log(sname+">线路或列表返回数据有误>"+e.message);
            }
            if(erLoadData.listparse){//选集列表需要动态解析获取
                let 线路选集 = erLoadData.listparse(lineid,线路s[lineid]) || [];
                if(线路选集.length>0){
                    列表s[lineid] = 线路选集;
                }
            }
            if(erLoadData.page && erLoadData.pageparse){//网站分页显示列表的，需要动态解析获取
                try{
                    if((erdataCache && pageid != erLoadData.pageid) || (!erdataCache && pageid>0)){
                        let 分页s = erLoadData.page;
                        if(pageid > 分页s.length){
                            pageid = 0;
                        }
                        let 分页选集 = erLoadData.pageparse(分页s[pageid].url);
                        if($.type(分页选集)=="array"){
                            列表s[lineid] = 分页选集;
                            erLoadData.list = erLoadData.line?列表s:分页选集;
                        }
                    }
                }catch(e){
                    log(sname+'分页选集处理失败>'+e.message);
                }
            }
            
            if(lineid > 列表s.length-1){
                toast('选择的线路无选集，将显示第1线路');
                lineid = 0;
            }

            let 列表 = 列表s[lineid] || [];
            if(列表.length>0){
                function checkAndReverseArray(arr) {
                    const numbers = [];
                    arr.slice(0, 50).forEach(it=>{
                        const digits = it.title.match(/\d+/);
                        if (digits) {
                            numbers.push(parseInt(digits[0]));
                        }
                    })

                    if (numbers.length < 3) {
                        return arr;
                    }
                    let increasingCount = 0;
                    let decreasingCount = 0;
                    for (let i = 1; i < numbers.length; i++) {
                        if (numbers[i] > numbers[i - 1]) {
                            increasingCount++;
                        } else if (numbers[i] < numbers[i - 1]) {
                            decreasingCount++;
                        }
                    }
                    if (increasingCount > decreasingCount) {
                        return arr;
                    } else {
                        return arr.reverse();
                    }
                }
                try{
                    列表 = checkAndReverseArray(列表);
                }catch(e){
                    //log('强制修正选集顺序失败>'+e.message)
                }
            }
            if (getMyVar(sname + 'sort') == '1') {
                列表.reverse();
            }
            stype = erLoadData.type || stype;
            let itype = stype=="漫画"?"comic":stype=="小说"?"novel":"";
            /*
            let 解析 = objCode['解析'] || function (url,objCode,参数) {
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcParseS.js');
                let stype = 参数.stype;
                return SrcParseS.聚阅(url, stype=="音频"?1:0);
            };
            let lazy = $("").lazyRule((解析,参数) => {
                let url = input.split("##")[1];
                let objCode = {};
                try{
                    objCode = $.require('jiekou?rule=聚阅').objCode(参数.标识);
                }catch(e){
                    //toast('未找到聚阅规则子页面');
                }
                let 标识 = 参数.标识;
                eval("let 解析2 = " + 解析);
                return 解析2(url,objCode,参数);
            }, 解析, {"规则名": MY_RULE._title || MY_RULE.title, "标识": 标识, stype:stype});
            
            let download = $.toString((解析,objCode,参数) => {
                eval("let 解析2 = " + 解析);
                let 标识 = 参数.标识;
                return 解析2(input,objCode,参数);
            }, 解析, objCode, {"规则名": MY_RULE._title || MY_RULE.title, "标识": 标识, stype:stype});
            */
            let dataObj = {
                data: jkdata
            }
            let lazy = $("").lazyRule((dataObj) => {
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuMethod.js');
                let objCode = getObjCode(dataObj.data);
                if(objCode.解析){
                    eval("let parse = " + objCode.解析);
                    return parse(input);
                }else{
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcParseS.js');
                    return SrcParseS.聚阅(input, dataObj);
                }
            }, dataObj);
            let download = '';
            d.push({
                title: "详情简介",
                url: $("#noLoading#").lazyRule((desc) => {
                    if(getMyVar('二级简介打开标识')=="1"){
                        clearMyVar('二级简介打开标识');
                        deleteItemByCls("SrcJudescload");
                    }else{
                        putMyVar('二级简介打开标识',"1");
                        addItemAfter('detailid', [{
                            title: `<font color="#098AC1">详情简介 </font><small><font color="#f47983"> ></font></small>`,
                            col_type: "avatar",
                            url: $("#noLoading#").lazyRule(() => {
                                clearMyVar('二级简介打开标识');
                                deleteItemByCls("SrcJudescload");
                                return "hiker://empty";
                            }),
                            pic_url: "http://123.56.105.145/tubiao/ke/91.png",
                            extra: {
                                cls: "SrcJudescload"
                            }
                        },{
                            title: desc,
                            col_type: "rich_text",
                            extra: {
                                cls: "SrcJudescload"
                            }
                        }]);
                    }
                    return "hiker://empty";
                }, erTempData.desc||""),
                pic_url: "http://123.56.105.145/tubiao/messy/32.svg",
                col_type: 'icon_small_3',
                extra: {
                    cls: "Juloadlist"
                }
            })
            let sskeyword = name.split('/')[0].trim();
            if(stype=="影视"){
                d.push({
                    title: "聚影搜索",
                    url: JySearch(sskeyword, getItem("juyingSeachType")),
                    pic_url: 'http://123.56.105.145/tubiao/messy/25.svg',
                    col_type: 'icon_small_3',
                    extra: {
                        cls: "Juloadlist",
                        longClick: [{
                            title: "搜索类型：" + getItem("juyingSeachType", "默认"),
                            js: $.toString(() => {
                                return $(["聚搜接口","云盘接口","Alist接口"], 3).select(() => {
                                    setItem("juyingSeachType",input);
                                    refreshPage(false);
                                })
                            })
                        }]
                    }
                })
            }else{
                d.push({
                    title: "书架/下载",
                    url: $("hiker://empty###noRecordHistory##noHistory#").rule(() => {
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcBookCase.js');
                        bookCase();
                    }),
                    pic_url: 'http://123.56.105.145/tubiao/messy/70.svg',
                    col_type: 'icon_small_3',
                    extra: {
                        cls: "Juloadlist",
                        inheritTitle: false,
                        longClick: [{
                            title: "下载本地📥",
                            js: $.toString((itype) => {
                                if(itype){
                                    return "hiker://page/download.view#noRecordHistory##noRefresh##noHistory#?rule=本地资源管理"
                                }else{
                                    return "toast://不支持下载的类型"
                                }
                            },itype)
                        }],
                        chapterList: 列表,
                        "defaultView": "1",
                        "info": {
                            "bookName": name,
                            "bookTopPic": pic,
                            "parseCode": download,
                            "ruleName": sname + " (聚阅)",
                            "type": itype,
                            "decode": objCode["imgdec"]?$.type(objCode["imgdec"])=="function"?$.toString((imgdec)=>{
                                let imgDecrypt = imgdec;
                                return imgDecrypt();
                            },objCode["imgdec"]):objCode["imgdec"]:""
                        }
                    }
                })
            }

            d.push({
                title: "切换站源",
                url: $("#noLoading#").lazyRule((name,group) => {
                    updateItem("erji_loading2", { 
                        extra: {
                            id: "erji_loading",
                            lineVisible: false
                        } 
                    });
                    deleteItemByCls('Juloadlist');

                    clearMyVar('换源变更列表id');
                    require(config.聚阅);
                    //showLoading('搜源中,请稍后.');
                    erjisousuo(name, group);
                    //hideLoading();
                    return  "hiker://empty";
                }, sskeyword, sgroup),
                pic_url: 'http://123.56.105.145/tubiao/messy/20.svg',
                col_type: 'icon_small_3',
                extra: {
                    cls: "Juloadlist"
                }
            })
            d.push({
                col_type: "line_blank"
            });
            let line_col_type = getItem('SrcJuLine_col_type', 'scroll_button');
            let addmoreitems = 0;
            if(getItem('extenditems','1')=="1" && erLoadData.moreitems && $.type(erLoadData.moreitems)=='array'){
                let moreitems = erLoadData.moreitems;
                if(moreitems.length>0){
                    moreitems.forEach(item => {
                        if(item.url!=surl){
                            item = toerji(item, jkdata);
                            item.extra = item.extra || {};
                            item.extra['back'] = 1;
                            item.extra['cls'] = "Juloadlist extendlist";
                            d.push(item);
                            addmoreitems = 1;
                        }
                    })
                }
            }
            if (line_col_type == 'scroll_button' && addmoreitems == 0) {
                for (let i = 0; i < 10; i++) {
                    d.push({
                        col_type: "blank_block"
                    })
                }
            }

            d.push({
                title: getMyVar(sname + 'sort') == '1' ? `““””<b><span style="color: #66CCEE">排序⇅</span></b>` : `““””<b><span style="color: #55AA44">排序⇅</span></b>`,
                url: $("#noLoading#").lazyRule((sname) => {
                    let 列表 = findItemsByCls('playlist') || [];
                    if(列表.length==0){
                        return 'toast://未获取到列表'
                    }
                    deleteItemByCls('playlist');
                    if (getMyVar(sname + 'sort') == '1') {
                        putMyVar(sname + 'sort', '0');
                        updateItem('listsort', {
                            title: `““””<b><span style="color: #55AA44">排序⇅</span></b>`
                        });
                    } else {
                        putMyVar(sname + 'sort', '1')
                        updateItem('listsort', {
                            title: `““””<b><span style="color: #66CCEE">排序⇅</span></b>`
                        });
                    };
                    列表.reverse();
                    列表.forEach(item => {
                        item.col_type = item.type;
                    })
                    
                    addItemBefore(getMyVar('二级加载扩展列表')?"extendlist":getMyVar('换源变更列表id')?"erji_loading2":"erji_loading", 列表);//排序和样式动态处理插入列表时查找id
                    return 'toast://切换排序成功'
                }, sname),
                col_type: line_col_type,
                extra: {
                    id: "listsort",
                    cls: "Juloadlist"
                }
            })
            let reviseLiTitle = getItem('reviseLiTitle','0');
            d.push({
                title: `““””<b><span style="color: #f47983">样式<small>🎨</small></span></b>`,
                url: $(["text_1","text_2","text_3","text_4","flex_button","text_2_left","text_3_left","分页设置"],2,"选集列表样式").select(() => {
                    if(input=="分页设置"){
                        return $(["开启分页","关闭分页","每页数量","分页阀值"],2).select(() => {
                            let partpage = storage0.getItem('partpage') || {};
                            if(input=="开启分页"){
                                partpage.ispage = 1;
                                storage0.setItem('partpage',partpage);
                            }else if(input=="关闭分页"){
                                partpage.ispage = 0;
                                storage0.setItem('partpage',partpage);
                            }else if(input=="每页数量"){
                                return $(partpage.pagenum||"40","每页选集数量").input((partpage) => {
                                    partpage.pagenum = parseInt(input);
                                    storage0.setItem('partpage',partpage);
                                    refreshPage(false);
                                    return 'hiker://empty'
                                },partpage)
                            }else if(input=="分页阀值"){
                                return $(partpage.partnum||"100","执行分页的选集数量下限").input((partpage) => {
                                    partpage.partnum = parseInt(input);
                                    storage0.setItem('partpage',partpage);
                                    refreshPage(false);
                                    return 'hiker://empty'
                                },partpage)
                            }
                            refreshPage(false);
                            return 'hiker://empty'
                        })
                    }else{
                        let 列表 = findItemsByCls('playlist') || [];
                        if(列表.length==0){
                            return 'toast://未获取到列表'
                        }
                        deleteItemByCls('playlist');
                        let list_col_type = input;
                        列表.forEach(item => {
                            item.col_type = list_col_type.replace("_left","");
                            if(list_col_type.indexOf("_left")>-1){
                                item.extra.textAlign = 'left';
                            }else{
                                delete item.extra.textAlign;
                            }
                        })
                        addItemBefore(getMyVar('二级加载扩展列表')?"extendlist":getMyVar('换源变更列表id')?"erji_loading2":"erji_loading", 列表);
                        setItem('SrcJuList_col_type', input);
                        return 'hiker://empty'
                    }
                }),
                col_type: line_col_type,
                extra: {
                    cls: "Juloadlist",
                    longClick: [{
                        title: "修正选集标题："+(reviseLiTitle=="1"?"是":"否"),
                        js: $.toString(() => {
                            let sm;
                            if(getItem('reviseLiTitle','0')=="1"){
                                clearItem('reviseLiTitle');
                                sm = "取消修正选集标题名称";
                            }else{
                                setItem('reviseLiTitle','1');
                                sm = "统一修正选集标题名称";
                            }
                            refreshPage(false);
                            return "toast://"+sm;
                        })
                    },{
                        title: "显示扩展项："+(getItem('extenditems','1')=="1"?"是":"否"),
                        js: $.toString(() => {
                            let sm;
                            if(getItem('extenditems','1')=="1"){
                                setItem('extenditems','0');
                                sm = "取消显示二级扩展项";
                            }else{
                                clearItem('extenditems');
                                sm = "显示二级扩展项";
                            }
                            refreshPage(false);
                            return "toast://"+sm;
                        })
                    },{
                        title: "线路样式："+getItem('SrcJuLine_col_type', 'scroll_button'),
                        js: $.toString(() => {
                            let sm;
                            if(getItem('SrcJuLine_col_type', 'scroll_button')=="flex_button"){
                                clearItem('SrcJuLine_col_type');
                                sm = "线路样式已切换为scroll_button";
                            }else{
                                setItem('SrcJuLine_col_type','flex_button');
                                sm = "线路样式已切换为flex_button";
                            }
                            refreshPage(false);
                            return "toast://"+sm;
                        })
                    }]
                }
            })
            
            if(线路s.length>0 && 线路s[0] !="线路"){
                线路s.forEach((it,i)=>{
                    d.push({
                        title: lineid==i?`““””<b><span style="color: #04B45F">`+it+`</span></b>`:it,
                        url: $("#noLoading#").lazyRule((lineurl,nowid,newid) => {
                            if(nowid != newid){
                                putMyVar(lineurl, newid);
                                refreshPage(false);
                            }
                            return 'hiker://empty'
                        }, "SrcJu_"+surl+"_line", lineid, i),
                        col_type: line_col_type,
                        extra: {
                            cls: "Juloadlist"
                        }
                    })
                })
            }
            //分页定义
            let partpage = storage0.getItem('partpage') || {};
            if(erLoadData.page && erLoadData.pageparse){//原网站有分页，不执行自定义分页
                let 分页s = erLoadData.page
                let 分页链接 = [];
                let 分页名 = [];
                分页s.forEach((it,i)=>{
                    分页链接.push($("#noLoading#").lazyRule((pageurl,nowid,newid) => {
                            if(nowid != newid){
                                putMyVar(pageurl, newid);
                                refreshPage(false);
                            }
                            return 'hiker://empty'
                        }, "SrcJu_"+surl+"_page", pageid, i)
                    )
                    分页名.push(pageid==i?'““””<span style="color: #87CEFA">'+it.title:it.title)
                })
                if(分页名.length>0){
                    d.push({
                        col_type: "blank_block",
                        extra: {
                            cls: "Juloadlist"
                        }
                    });
                        d.push({
                        title: pageid==0?"↪️尾页":"⏮️上页",
                        url: pageid==0?分页链接[分页名.length-1]:分页链接[pageid-1],
                        col_type: 'text_4',
                        extra: {
                            cls: "Juloadlist"
                        }
                    })
                    d.push({
                        title: 分页名[pageid],
                        url: $(分页名, 2).select((分页名,分页链接) => {
                            return 分页链接[分页名.indexOf(input)];
                        },分页名,分页链接),
                        col_type: 'text_2',
                        extra: {
                            cls: "Juloadlist"
                        }
                    })
                    d.push({
                        title: pageid==分页名.length-1?"首页↩️":"下页⏭️",
                        url: pageid==分页名.length-1?分页链接[0]:分页链接[pageid+1],
                        col_type: 'text_4',
                        extra: {
                            cls: "Juloadlist"
                        }
                    })
                }
            }else if(partpage.ispage){//启用分页
                let 每页数量 = partpage.pagenum || 40; // 分页的每页数量       
                let 翻页阀值 = partpage.partnum || 100; // 分页的翻页阀值，超过多少才显示翻页
                
                if (列表.length > 翻页阀值) { 
                    let 最大页数 = Math.ceil(列表.length / 每页数量);  
                    let 分页页码 = pageid + 1; //当前页数
                    if (分页页码 > 最大页数) { //防止切换线路导致页数数组越界
                        分页页码 = 最大页数;
                    }
                    let 分页链接 = [];
                    let 分页名 = [];
                    function getNewArray(array, subGroupLength) {
                        let index = 0;
                        let newArray = [];
                        while(index < array.length) {
                            newArray.push(array.slice(index, index += subGroupLength));
                        }
                        return newArray;
                    }
                    let 分页s = getNewArray(列表, 每页数量);//按每页数据切割成小数组

                    分页s.forEach((it,i)=>{
                        分页链接.push($("#noLoading#").lazyRule((pageurl,nowid,newid) => {
                                if(nowid != newid){
                                    putMyVar(pageurl, newid);
                                    refreshPage(false);
                                }
                                return 'hiker://empty'
                            }, "SrcJu_"+surl+"_page", pageid, i)
                        )
                        let start = i * 每页数量 + 1;
                        let end = i * 每页数量 + it.length;
                        let title = start + ' - ' + end;
                        分页名.push(pageid==i?'““””<span style="color: #87CEFA">'+title:title)
                    })
                    d.push({
                        col_type: "blank_block",
                        extra: {
                            cls: "Juloadlist"
                        }
                    });
                    d.push({
                        title: 分页页码==1?"↪️尾页":"⏮️上页",
                        url: 分页页码==1?分页链接[分页名.length-1]:分页链接[pageid-1],
                        col_type: 'text_4',
                        extra: {
                            cls: "Juloadlist"
                        }
                    })
                    d.push({
                        title: 分页名[pageid],
                        url: $(分页名, 2).select((分页名,分页链接) => {
                            return 分页链接[分页名.indexOf(input)];
                        },分页名,分页链接),
                        col_type: 'text_2',
                        extra: {
                            cls: "Juloadlist"
                        }
                    })
                    d.push({
                        title: 分页页码==分页名.length?"首页↩️":"下页⏭️",
                        url: 分页页码==分页名.length?分页链接[0]:分页链接[pageid+1],
                        col_type: 'text_4',
                        extra: {
                            cls: "Juloadlist"
                        }
                    })
                    列表 = 分页s[pageid];//取当前分页的选集列表
                }
            }

            let list_col_type = getItem('SrcJuList_col_type', 'text_2');//列表样式
            for(let i=0; i<列表.length; i++) {
                let extra = Object.assign({}, erLoadData["extra"] || {});//二级返回数据中的extra设为默认
                try{
                    extra = Object.assign(extra, 列表[i].extra || {});//优先用选集的extra
                }catch(e){}
                extra.id = name + "_选集_" + (pageid?pageid+"_":"") + i;
                extra.cls = "Juloadlist playlist";
                if(stype=="听书"||stype=="影视"||stype=="音乐"){
                    extra.jsLoadingInject = true;
                    if(!extra.blockRules){
                        extra.blockRules = ['.m4a', '.mp3', '.gif', '.jpeg', '.jpg', '.ico', '.png', 'hm.baidu.com', '/ads/*.js', 'cnzz.com', '51.la'];
                    }
                }
                if(list_col_type.indexOf("_left")>-1){
                    extra.textAlign = 'left';
                }
                if (stype=="小说" || erLoadData.rule || erLoadData.novel || 列表[i].rule) {
                    extra.url = 列表[i].url;
                    lazy = lazy.replace("@lazyRule=.",((stype=="小说"||erLoadData.novel)?"#readTheme##autoPage#":"#noRecordHistory#")+"@rule=").replace(`input.split("##")[1]`,`MY_PARAMS.url || ""`);
                }
                d.push({
                    title: reviseLiTitle=="1"?列表[i].title.replace(name,'').replace(/‘|’|“|”|<[^>]+>| |-|_|第|集|话|章|\</g,'').replace('（','(').replace('）',')'):列表[i].title,
                    url: 列表[i].url + lazy,
                    desc: 列表[i].desc,
                    img: 列表[i].img,
                    col_type: 列表[i].col_type || list_col_type.replace("_left",""),
                    extra: extra
                });
            }
            
            if(列表.length>0){
                isload = 1;
            }else if(列表.length==0){
                toast("选集列表为空，请更换其他源");
            }
        }
    } catch (e) {
        toast('有异常，看日志');
        log(sname + '>加载详情失败>' + e.message + ' 错误行#' + e.lineNumber);
    }

    if (isload) {
        if(getItem('extenditems','1')=="1" && erLoadData.extenditems && $.type(erLoadData.extenditems)=='array'){
            let extenditems = erLoadData.extenditems;
            if(extenditems.length>0){
                d.push({
                    col_type: "blank_block",
                    extra: {
                        cls: "Juloadlist extendlist",
                        id: "extendlist"
                    }
                })
                extenditems.forEach(item => {
                    if(item.url!=surl){
                        item = toerji(item, jkdata);
                        item.extra = item.extra || {};
                        item.extra['back'] = 1;
                        item.extra['cls'] = "Juloadlist extendlist";
                        d.push(item)
                    }
                })
            }
            putMyVar('二级加载扩展列表','1');
        }
        d.push({
            title: "‘‘’’<small><font color=#f20c00>当前数据源：" + sname + (erLoadData.author?", 作者：" + erLoadData.author:"") + "</font></small>",
            url: 'hiker://empty',
            col_type: 'text_center_1',
            extra: {
                id: getMyVar('换源变更列表id')?"erji_loading2":"erji_loading",
                lineVisible: false
            }
        });
        setResult(d);

        //更换收藏封面
        if(erTempData.img && oldMY_PARAMS.img!=erTempData.img){
            setPagePicUrl(erTempData.img);
        }
        //二级详情简介临时信息
        storage0.putMyVar('二级详情临时对象',erTempData);
        //二级源浏览记录保存
        let erjiMarkdata = { sid: jkdata.id, surl: surl, lineid: lineid, pageid: pageid };
        setMark(erjiMarkdata);
        //当前二级数据保存到缓存文件，避免二级重复请深圳市
        if(!getMyVar("SrcJu_调试模式")){
            erLoadData.sid = jkdata.id;
            erLoadData.surl = surl;
            erLoadData.pageid = pageid;
            writeFile(erCacheFile, $.stringify(erLoadData));
        }
        /*
        //收藏更新最新章节
        if (parse['最新']) {
            setLastChapterRule('js:' + $.toString((sname,surl,最新,objCode,参数) => {
                let 最新str = 最新.toString().replace('setResult','return ').replace('getResCode()','request(surl)');
                eval("let 最新2 = " + 最新str);
                let 标识 = 参数.标识;
                try{
                    let zx = 最新2(surl,objCode) || "";
                    setResult(sname + " | " + (zx||""));
                }catch(e){
                    最新2(surl,objCode);
                }
            }, sname, surl, parse['最新'], objCode, {"规则名": MY_RULE._title || MY_RULE.title, "标识": 标识}))
        }
        */
        //切换源时更新收藏数据，以及分享时附带接口
        if (typeof (setPageParams) != "undefined") {
            if ((surl && oldMY_PARAMS.surl!=surl) || !oldMY_PARAMS.data.extstr) {
                erjiextra.data.extstr = fetch(erjiextra.data.url);
                setPageParams(erjiextra);
            }
        }
    }
    clearMyVar('换源变更列表id');
}

//搜索页面
function sousuo() {
    let k = MY_URL.split('##')[1];
    let name = k.trim();

    setResult([{
        title: "点我一下，视界聚搜",
        url: "hiker://search?s=" + name,
        extra: {
            delegateOnlySearch: true,
            rules: $.toString((name) => {
                let ssdatalist = [];
                try{
                    if(storage0.getMyVar('SrcJu_搜索临时搜索数据')){
                        ssdatalist.push(storage0.getMyVar('SrcJu_搜索临时搜索数据'));
                        clearMyVar('SrcJu_搜索临时搜索数据');
                    }else{
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                        let group = getMyVar('SrcJu_搜索临时搜索分组','');
                        ssdatalist = getSearchLists(group);
                        clearMyVar('SrcJu_搜索临时搜索分组');
                    }
                }catch(e){
                    //log(e.message);
                }

                let judata = [];
                ssdatalist.forEach(it=>{
                    judata.push({
                        "title": it.name,
                        "search_url": "hiker://empty##fypage",
                        "searchFind": `js: require(config.聚阅); let d = search('` + name + `', 'hkjusou' ,` + JSON.stringify(it) + `); setResult(d);`
                    });
                })
                return JSON.stringify(judata);
            },name)
        }
    }])
}
//搜索逻辑代码
function search(name, sstype, jkdata) {
    let page = (sstype=="erji" || sstype=="yiji") ? 1 : MY_PAGE;
    let ssdata = [];

    getSsData(name, jkdata, page).vodlists.forEach(it => {
        it = toerji(it, jkdata);
        if(sstype=='erji'){
            if(it.extra && it.extra.url){
                it.url = "hiker://empty##"+ it.extra.url + $("#noLoading#").b64().lazyRule((extra) => {
                    if(getMyVar('换源变更列表id')){
                        return "toast://请勿重复点击，稍等...";
                    }else{
                        putMyVar('换源变更列表id','1');
                        storage0.putMyVar('二级附加临时对象', extra);
                        refreshPage(false);
                        return "toast://已切换源：" + extra.data.name;
                    }
                }, it.extra);
                it.title = it.extra.data.name;
                it.col_type = "avatar";
                if(it.extra.name.toLowerCase()==name.toLowerCase()){
                    ssdata.push(it);
                }
            }
        }else if(sstype=="yiji"){
            it.extra.cls = "homesousuolist";
            ssdata.push(it);
        }
    })

    return ssdata;
}

//二级切源搜索
function erjisousuo(name,group,datas,sstype) {
    sstype = sstype || "erji";
    let updateItemid = sstype=="erji"?"erji_loading":"newSearch_loading";
    let searchMark = storage0.getMyVar('SrcJu_searchMark') || {};//二级换源缓存
    let markId = group+'_'+name;
    if(!datas && searchMark[markId] && sstype=="erji"){
        addItemBefore(updateItemid, searchMark[markId]);
        updateItem(updateItemid, {
            title: "‘‘’’<small>当前搜索为缓存</small>",
            url: $("确定删除“"+name+"”搜索缓存吗？").confirm((markId)=>{
                let searchMark = storage0.getMyVar('SrcJu_searchMark') || {};
                delete searchMark[markId];
                storage0.putMyVar('SrcJu_searchMark', searchMark);
                refreshPage(true);
                return "toast://已清除";
            },markId)
        });
        let i = 0;
        let one = "";
        for (var k in searchMark) {
            i++;
            if (i == 1) { one = k }
        }
        if (i > 30) { delete searchMark[one]; }
        hideLoading();
    }else{
        showLoading('搜源中，请稍后...');
        updateItem(updateItemid, {
            title: "搜源中..."
        });
        
        let ssdatalist = datas || getSearchLists(group);
        let nosousuolist = storage0.getMyVar('SrcJu_nosousuolist') || [];
        if (nosousuolist.length>0){
            ssdatalist = ssdatalist.filter(it => {
                return nosousuolist.indexOf(it.url) == -1;
            })
        }

        let task = function (obj) {
            try {
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuMethod.js');
                let lists = obj.search(obj.name, obj.type, obj.data);
                return {result:lists, success:1};
            } catch (e) {
                log(obj.data.name + '>搜索失败>' + e.message);
                return {result:[], success:0};
            }
        }
        let list = ssdatalist.map((item) => {
            return {
                func: task,
                param: {"search":search,"name":name,"type":sstype,"data":item},
                id: item.id
            }
        });

        let beidlist = [];
        let success = 0;
        if (list.length > 0) {
            be(list, {
                func: function (obj, id, error, taskResult) {
                    beidlist.push(id);

                    if(getMyVar("SrcJu_停止搜索线程")=="1"){
                        return "break";
                    }else if(taskResult.success==1){
                        let data = taskResult.result;
                        if(data.length>0){
                            success++;
                            searchMark[markId] = searchMark[markId] || [];
                            searchMark[markId] = searchMark[markId].concat(data);
                            addItemBefore(updateItemid, data);
                            hideLoading();
                            if(success>=20){
                                return "break";
                            }
                        }
                    }else if(taskResult.success==0){
                        nosousuolist.push(id);
                        storage0.putMyVar('SrcJu_nosousuolist', nosousuolist);
                    }
                },
                param: {
                }
            });
            hideLoading();
            if(beidlist.length<ssdatalist.length){
                let pdatalist = ssdatalist.filter(v=>beidlist.indexOf(v.id)==-1);
                addItemBefore(updateItemid, {
                    title: "剩余"+(ssdatalist.length-beidlist.length)+"，点击继续",
                    url: $("#noLoading#").lazyRule((updateItemid,name,group,datas,sstype) => {
                        deleteItem(updateItemid + "_start");
                        require(config.聚阅);
                        erjisousuo(name, group, datas, sstype);
                        return "hiker://empty";
                    }, updateItemid, name, group, pdatalist, sstype),
                    col_type: 'text_center_1',
                    extra: {
                        id: updateItemid + "_start",
                        cls: "Juloadlist",
                        lineVisible: false
                    }
                });
            }
            if(getMyVar("SrcJu_停止搜索线程")!="1"){
                storage0.putMyVar('SrcJu_searchMark', searchMark);
            }
            clearMyVar("SrcJu_停止搜索线程");
            let sousuosm = "‘‘’’<small><font color=#f13b66a>" + success + "</font>/" + list.length + "，搜索完成</small>";
            updateItem(updateItemid, { title: sousuosm });
        } else {
            hideLoading();
            clearMyVar("SrcJu_停止搜索线程");
            updateItem(updateItemid, { title: '' });
            toast("无接口");
        }
    }
}

//取本地足迹记录
function getMark(surl, sid) {
    let marklist = [];
    let markfile = rulepath + "mark.json";
    let markdata = fetch(markfile);
    if (markdata != "") {
        eval("marklist=" + markdata + ";");
    }
    let mark = marklist.filter(it => {
        return it.surl==surl && it.sid==sid;
    })
    if (mark.length > 0) {
        return mark[0];
    } else {
        return {};
    }
}
//保存本地足迹记录
function setMark(data) {
    let marklist = [];
    let markfile = rulepath + "mark.json";
    let markdata = fetch(markfile);
    if (markdata != "") {
        eval("marklist=" + markdata + ";");
    }
    let mark = marklist.filter(it => {
        return it.surl==data.surl && it.sid==data.sid;
    })
    if (mark.length > 0) {
        let index = marklist.indexOf(mark[0]);
        marklist.splice(index, 1)
    }
    marklist.push(data);
    if (marklist.length > 100) {
        marklist.splice(0, 1);
    }
    writeFile(markfile, JSON.stringify(marklist));
    return 1;
}

//版本检测
function Version() {
    var nowVersion = getItem('Version', "0.1");//现在版本 
    var nowtime = Date.now();
    var oldtime = parseInt(getItem('VersionChecktime', '0').replace('time', ''));
    if (getMyVar('SrcJu_versionCheck', '0') == '0' && nowtime > (oldtime + 12 * 60 * 60 * 1000)) {
        try {
            eval(request(config.聚阅.replace(/[^/]*$/,'').replace('/Ju/', '/master/') + 'SrcTmplVersion.js'))
            if (parseFloat(newVersion.SrcJu) > parseFloat(nowVersion)) {
                confirm({
                    title: '发现新版本，是否更新？',
                    content: nowVersion + '=>' + newVersion.SrcJu + '\n' + newVersion.SrcJudesc[newVersion.SrcJu],
                    confirm: $.toString((nowtime,newVersion) => {
                        setItem('Version', newVersion);
                        setItem('VersionChecktime', nowtime + 'time');
                        deleteCache();
                        delete config.聚阅;
                        refreshPage();
                    }, nowtime, newVersion.SrcJu),
                    cancel: ''
                })
                log('检测到新版本！\nV' + newVersion.SrcJu + '版本》' + newVersion.SrcJudesc[newVersion.SrcJu]);
            }
            putMyVar('SrcJu_Version', '-V' + newVersion.SrcJu);
        } catch (e) { }
        putMyVar('SrcJu_versionCheck', '1');
    } else {
        putMyVar('SrcJu_Version', '-V' + nowVersion);
    }
}
//新搜索页
function newsousuopage(keyword,searchtype,relyfile) {
    addListener("onClose", $.toString(() => {
        if(getMyVar('SrcJu_rely')){
            initConfig({
                依赖: getMyVar('SrcJu_rely')
            });
            clearMyVar('SrcJu_rely');
        }
        clearMyVar('SrcJu_sousuoName');
        clearMyVar('SrcJu_sousuoType');
        putMyVar("SrcJu_停止搜索线程", "1");
    }));
    addListener('onRefresh', $.toString(() => {
        clearMyVar('SrcJu_sousuoName');
    }));
    setPageTitle("搜索|聚阅");
    if(relyfile){
        if(!getMyVar('SrcJu_rely') && config.聚阅){
            putMyVar('SrcJu_rely',config.聚阅);
        }
        initConfig({
            依赖: relyfile
        });
    }
    let name = getMyVar('SrcJu_sousuoName',keyword||'');
    let d = [];
    let descarr = ['可快速切换下面类型','关键字+2个空格，搜当前','关键字+2个空格+接口名','切换站源长按可进入这里','接口有分组，则搜索同分组'];
    if(MY_PAGE==1){
        d.push({
            title: "🔍",
            url: $.toString(() => {
                if(input){
                    putMyVar('SrcJu_sousuoName',input);
                    if(input){
                        let recordlist = storage0.getItem('searchrecord') || [];
                        if(recordlist.indexOf(input)>-1){
                            recordlist = recordlist.filter((item) => item !== input);
                        }
                        recordlist.unshift(input);
                        if(recordlist.length>20){
                            recordlist.splice(recordlist.length-1,1);
                        }
                        storage0.setItem('searchrecord', recordlist);
                    }
                    refreshPage(true);
                }
            }),
            desc: descarr[Math.floor(Math.random() * descarr.length)],
            col_type: "input",
            extra: {
                defaultValue: getMyVar('SrcJu_sousuoName',keyword||''),
                titleVisible: true
            }
        });
        let searchTypes = getTypeNames("搜索页");
        searchTypes.forEach((it) =>{
            let obj = {
                title: getMyVar("SrcJu_sousuoType",searchtype||runMode)==it?`““””<b><span style="color: #3399cc">`+it+`</span></b>`:it,
                url: $('#noLoading#').lazyRule((it) => {
                    putMyVar("SrcJu_sousuoType",it);
                    refreshPage(false);
                    return "hiker://empty";
                },it),
                col_type: 'text_5'
            }
            if(it=="影视" && name){
                obj.extra = {};
                obj["extra"].longClick = [{
                    title:"🔍聚影搜索",
                    js: $.toString((url)=>{
                        return url;
                    }, JySearch(name, getItem("juyingSeachType")))
                }];
            }
            d.push(obj);
        })

        let recordlist = storage0.getItem('searchrecord') || [];
        if(recordlist.length>0){
            d.push({
                title: '🗑清空',
                url: $('#noLoading#').lazyRule(() => {
                    clearItem('searchrecord');
                    deleteItemByCls('searchrecord');
                    return "toast://已清空";
                }),
                col_type: 'flex_button',//scroll_button
                extra: {
                    cls: 'searchrecord'
                }
            });
        }else{
            d.push({
                title: '↻无记录',
                url: "hiker://empty",
                col_type: 'flex_button',
                extra: {
                    cls: 'searchrecord'
                }
            });
        }
        recordlist.forEach(item=>{
            d.push({
                title: item,
                url: $().lazyRule((input) => {
                    putMyVar('SrcJu_sousuoName',input);
                    refreshPage(true);
                    return "hiker://empty";
                },item),
                col_type: 'flex_button',
                extra: {
                    cls: 'searchrecord'
                }
            });
        })
    }
    d.push({
        title: "",
        col_type: 'text_center_1',
        url: "hiker://empty",
        extra: {
            id: "sousuoloading"+getMyVar('SrcJu_sousuoType', searchtype||runMode),
            lineVisible: false
        }
    });
    setResult(d);
    
    if(name){
        deleteItemByCls('searchrecord');
        let info = storage0.getMyVar('一级源接口信息') || {};
        let type = getMyVar("SrcJu_sousuoType", searchtype||info.type);
        search(name,"sousuopage",false,info.group,type);
    }
}