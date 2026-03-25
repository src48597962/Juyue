//本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
//空壳小程序，接口分为主页源和搜索源
require((config.聚阅||getPublicItem('聚阅','')).replace(/[^/]*$/,'') + 'SrcJuPublic.js');

//一级
function yiji(testSource) {
    if(MY_RULE.title=="聚阅✓"){
        toast("此小程序已停用，请重新导入聚阅");
    }
    if(getMyVar('SrcJu_RuleVersionCheck', '0') == '0'){
        let programversion = 0;
        try{
            programversion = $.require("config").version || MY_RULE.version || 0;
        }catch(e){}
        if(programversion<8){
            confirm({
                title: "温馨提示",
                content: "发现小程序新版本",
                confirm: $.toString(() => {
                    return fetch(config.聚阅.replace(/[^/]*$/,'') + "聚阅.hiker");
                }),
                cancel: $.toString(() => {
                    return "toast://不升级小程序，功能不全或有异常";
                })
            });
        }
        Version();
        putMyVar('SrcJu_RuleVersionCheck', '1');
    }
    
    let jkdata = testSource || storage0.getMyVar('一级源接口信息') || {};
    if((!jkdata.name || !fetch(jkdata.url)) && !testSource){
        clearMyVar('一级源接口信息');
        let yxdatalist = getDatas('yi', 1);
        let index = yxdatalist.findIndex(d => d.id === homeSourceId);
        jkdata = yxdatalist[index] || {};
        if(jkdata.name){
            storage0.putMyVar('一级源接口信息', jkdata);
        }
    }

    let d = [];
    if(MY_PAGE==1){
        let longClick = [{
            title: "分享",
            js: $.toString((data) => {
                if(!data.url){
                    return "toast://当前源无效，无法分享";
                }
                let pastes = getPastes();
                pastes.push('云口令文件');
                return $(pastes,2).select((data)=>{
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
                    return JYshare(input, data);
                }, data)
            },jkdata)
        }];
        if(!testSource){
            longClick.push({
                title: "编辑",
                js: $.toString((data) => {
                    return $('hiker://empty#noRecordHistory##noHistory#').rule((data) => {
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
                        return jiekouapi(data);
                    }, data)
                },jkdata)
            },{
                title: "代码",
                js: $.toString((ruleurl) => {
                    if(!ruleurl || !fetch(ruleurl)){
                        return 'toast://代码文件不存在';
                    }
                    return 'openFile://'+ ruleurl;
                }, jkdata.url)
            },{
                title: "删除",
                js: $.toString((data) => {
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                    deleteData(data);
                    return "toast://已处理";
                }, jkdata)
            },{
                title: "禁用",
                js: $.toString((data) => {
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                    dataHandle(data, '禁用');
                    return "toast://已处理";
                }, jkdata)
            })
            if(juItem.get('versionCheckTime', '', jkdata.id) !== ''){
                longClick.push({
                    title: "更新",
                    js: $.toString((jkdata) => {
                        clearMyVar('SrcJu_VersionCheck_'+jkdata.id);
                        juItem.clear('versionCheckTime');
                        refreshPage();
                        return "toast://获取更新，有新版本会弹窗提示";
                    }, jkdata)
                })
            }
        }
        let homeIcons = getThemeList(true)['主页图标'];
        let icon5_col = ((MY_NAME=="海阔视界"&&getAppVersion()>=5579)||(MY_NAME=="嗅觉浏览器"&&getAppVersion()>=2322)) ? 'icon_5_no_crop' : 'icon_5';
        d.push({
            title: jkdata.name || "切源",
            url: testSource?"toast://测试模式下不能更换站源":$('#noLoading#').lazyRule(() => {
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                return selectSource();
            }),
            pic_url: getIcon(homeIcons[0].img, false, homeIcons[0].color),
            col_type: icon5_col,
            extra: {
                newWindow: true, 
                windowId: '聚阅源编辑',
                longClick: longClick
            }
        })
        clearMyVar('频道展开');
        d.push({
            title: "频道",
            url: $("#noLoading#").lazyRule(()=>{
                if(getMyVar('频道展开')){
                    deleteItemByCls("sourcemenu");
                    clearMyVar('频道展开');
                    return "hiker://empty";
                }else{
                    let sourcemenu = storage0.getMyVar("sourcemenu") || [];
                    if(sourcemenu.length>0){
                        putMyVar('频道展开','1');
                        deleteItemByCls("sourcemenu");
                        addItemBefore("sourcemenuload", sourcemenu);
                        return "hiker://empty";
                    }else{
                        return "toast://作者没有写"
                    }
                }
            }),
            pic_url: getIcon(homeIcons[1].img, false, homeIcons[1].color),
            col_type: icon5_col,
            extra: {
                id: "sourcemenu"
            }
        })
        let Color = getItem('主题颜色','#3399cc');
        function modeSelect(v) {
            return `‘‘’’<strong><font color="`+Color+`">`+v+`√</front></strong>`;
        }
        let searchModeS = (MY_NAME=="海阔视界"?["主页界面","当前接口","分组接口","页面聚合"]:["主页界面","页面聚合"]).map(v=>{
            return v==juItem2.get('接口搜索方式','主页界面')?modeSelect(v):v+'  ';
        });
        searchModeS.push(getItem("搜索建议词","")=='1'?modeSelect('搜索建议词'):'搜索建议词');
        //searchModeS.push(getItem("记忆搜索词","")=='1'?modeSelect('记忆搜索词'):'记忆搜索词');
        searchModeS.push('显示搜索数');

        d.push({
            title: getItem('切换搜索按钮','搜索'),
            url: getItem('切换搜索按钮','搜索')==='搜索' ? $(searchModeS, 2, '主页搜索框设定').select(()=>{
                input = input.replace(/[’‘]|<[^>]*>| |√/g, "");

                if(input=='搜索建议词'||input=='记忆搜索词'){
                    if(getItem(input,"")=='1'){
                        clearItem(input);
                        return "toast://已取消" + input;
                    }else{
                        setItem(input, "1");
                        return "toast://已设置" + input;
                    }
                }else if(input=='显示搜索数'){
                    return $(getItem("显示搜索历史数量", "18"),"显示搜索历史数量").input(()=>{
                        if(!parseInt(input)||parseInt(input)<1||parseInt(input)>100){
                            return 'toast://输入有误，请输入1-100数字';
                        }
                        setItem("显示搜索历史数量", input);
                        return "hiker://empty";
                    })
                }else{
                    juItem2.set("接口搜索方式",input);
                    refreshPage();
                    return "toast://搜索方式设置为："+input;
                }
            }) : $("#noLoading#").lazyRule(() => {
                toast('三针科兴短剧，越看越有趣\n      顺佬出品，必属精品');
                return 'hiker://page/duanju#gameTheme##noRecordHistory##noHistory#?rule=聚阅';
            }),
            pic_url: getIcon(homeIcons[2].img, false, homeIcons[2].color),
            col_type: icon5_col,
            extra: {
                id: 'ssbtnid',
                longClick: [{
                    title: '新搜索页',
                    js: $.toString(()=>{
                        return `hiker://page/sousuopage#noRecordHistory##noHistory##immersiveTheme##noRefresh#?type=视频&page=fypage&keyword=`;
                    })
                },{
                    title: '切换为'+(getItem('切换搜索按钮','搜索')==='搜索'?'短剧':'搜索'),
                    js: $.toString(()=>{
                        if(getItem('切换搜索按钮')=='短剧'){
                            clearItem('切换搜索按钮');
                        }else{
                            setItem('切换搜索按钮', '短剧');
                        }
                        refreshPage();
                        return `toast://已切换为` + getItem('切换搜索按钮','搜索');
                    })
                }]
            }
        })
        d.push({
            title: "收藏",
            url: $("hiker://empty###noRecordHistory##noHistory##immersiveTheme#").rule(() => {
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcBookCase.js');
                bookCase();
            }),
            pic_url: getIcon(homeIcons[3].img, false, homeIcons[3].color),
            col_type: icon5_col
        })
        d.push({
            title: "管理",
            url: testSource?"toast://测试模式下不能进入设置菜单":$(["本地接口管理",juItem2.get('显示快速分组')=="1"?"关闭快速分组":"显示快速分组","切换选源插件","程序管理中心","本地解析管理"],1).select(()=>{
                if(MY_INDEX==0){
                    return $("hiker://empty#noRecordHistory##noHistory##noRefresh#").rule(() => {
                        setPageTitle('本地接口管理');
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
                        SRCSet();
                    })
                }else if(MY_INDEX==1){
                    return $("#noLoading#").lazyRule(() => {
                        if(juItem2.get('显示快速分组')=="1"){
                            juItem2.clear('显示快速分组');
                        }else{
                            juItem2.set('显示快速分组','1');
                        }
                        refreshPage();
                        return 'hiker://empty';
                    })
                }else if(MY_INDEX==2){
                    return $(['hikerPop', '原生组件'],2,"选择主页源插件").select(() => {
                        setItem('选择主页源插件', input);
                        return 'toast://接口类型已设置为：' + input;
                    })
                }else if(MY_INDEX==3){
                    return $("hiker://empty#noRecordHistory##noHistory##noRefresh#").rule(() => {
                        setPageTitle('管理中心');
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuManage.js');
                        manageSet();
                    })
                }else{
                    return $("hiker://empty#noRecordHistory##noHistory##noRefresh#").rule(() => {
                        setPageTitle('解析管理');
                        let {home} = $.require(config.聚阅.replace(/[^/]*$/,'') + 'jiexi/SrcInvoke.js');
                        home();
                    })
                }
            }),
            pic_url: getIcon(homeIcons[4].img, false, homeIcons[4].color),
            col_type: icon5_col
        })
        
        if(juItem2.get('显示快速分组')=="1" && !testSource){
            let typemenubtn = getTypeNames("主页");
            typemenubtn.forEach((it) =>{
                let item = {
                    title: homeGroup==it?`““””<b><span style="color: `+Color+`">`+it+`</span></b>`:it,
                    url: homeGroup==it?$('#noLoading#').lazyRule((input) => {
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                        return selectSource(input);
                    }, it):$('#noLoading#').lazyRule((input) => {
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                        Juconfig["homeGroup"] = input;
                        writeFile(cfgfile, JSON.stringify(Juconfig));
                        clearMyVar('一级源接口信息');
                        clearMyVar('主页动态加载loading');
                        refreshX5WebView('');//清x5
                        refreshPage(false);
                        return 'hiker://empty';
                    }, it),
                    col_type: "scroll_button"
                }
                if(homeGroup==it){
                    item.extra = {
                        backgroundColor: homeGroup==it?"#20" + Color.replace('#',''):""
                    }
                }
                d.push(item);
            })
        }
        let searchurl = $('#noLoading#').lazyRule((jkdata, homeGroup, isTest) => {
            deleteItemByCls('homesousuolist');
            searchRecord('put', input);
            putVar("keyword", input.split('  ')[0]);
            if(!jkdata.name){
                return 'toast://当前无接口数据';
            }else if(input.includes('  ') && !input.endsWith('  ')){//+2空格搜索指定源名或分组
                return 'hiker://search?s='+input+'&rule='+MY_RULE.title;
            }else if((juItem2.get('接口搜索方式','主页界面')=="主页界面" && !getMyVar('接口搜索方式互换')) || isTest){
                require(config.聚阅); 
                showLoading('搜索中');
                let d = search(input, 'yiji' , jkdata);
                hideLoading();
                if(d.length>0){
                    d.push({
                        title: "‘‘’’<small><small><font color=#bfbfbf>以上为当前源搜索结果</font></small></small>",
                        url: 'hiker://empty',
                        col_type: 'text_center_1',
                        extra: {
                            cls: 'homesousuolist',
                            lineVisible: false
                        }
                    });
                    d.push({
                        col_type: "line_blank",
                        extra: {
                            cls: 'homesousuolist'
                        }
                    })
                    d.push({
                        col_type: "big_blank_block",
                        extra: {
                            cls: 'homesousuolist'
                        }
                    })
                    addItemAfter('homesousuoid', d);
                }else{
                    return 'toast://无结果';
                }
                return 'hiker://empty';
            }else if(juItem2.get('接口搜索方式')=="页面聚合"){
                return `hiker://page/sousuopage#noRecordHistory##noHistory##immersiveTheme##noRefresh#?type=`+(homeGroup||jkdata.type)+`&page=fypage&keyword=`+input;
            }else{//分组接口/当前接口
                let ssmode = juItem2.get('接口搜索方式');
                if(getMyVar('接口搜索方式互换')){
                    ssmode = ssmode === "分组接口" ? "当前接口" : "分组接口";
                    clearMyVar('接口搜索方式互换');
                }
                if(ssmode=="分组接口"){
                    putMyVar('搜索临时搜索分组', homeGroup||jkdata.type);
                }else if(ssmode=="当前接口"){
                    storage0.putMyVar('搜索临时搜索数据', jkdata);
                }
                return 'hiker://search?s='+input+'&rule='+MY_RULE.title;
            }
        }, jkdata, Juconfig['homeGroup'], testSource?1:0);
        let descarr = ['搜你想要的...','1个空格显示搜索历史','结尾+2空格互换方式','+2空格+指定源名或分组'];
        d.push({
            title: getItem("搜索建议词","")=='1'?'搜索':'🔍',
            url: $.toString((searchurl) => {
                if(input.endsWith('  ')){
                    putMyVar('接口搜索方式互换', '1');
                }
                input = input.trim();
                if(input == ''){
                    return "hiker://empty"
                }
                return input + searchurl;
            },searchurl),
            desc: descarr[Math.floor(Math.random() * descarr.length)],
            col_type: "input",
            extra: {
                id: 'homesousuoid',
                titleVisible: true,
                defaultValue: getItem("记忆搜索词","")=='1'?getVar("keyword", ""):"",
                onChange: $.toString((searchurl) => {
                    if(input==""){
                        deleteItemByCls('homesousuolist');
                        deleteItemByCls('sousuorecordlist');
                        clearVar("keyword");
                    }else if(input==" "){
                        deleteItemByCls('sousuorecordlist');
                        let d = [];
                        if(getItem("搜索建议词","")=='1'){
                            d.push({
                                col_type: "line",
                                extra: {
                                    cls: 'sousuorecordlist'
                                }
                            })
                        }

                        function 背景色() {
                            function getSoftHexColor() {
                                // 随机色相（0-360），低饱和度（10-30%），高亮度（85-95%）
                                const h = Math.floor(Math.random() * 360);
                                const s = 10 + Math.floor(Math.random() * 20); // 10-30% 饱和度
                                const l = 85 + Math.floor(Math.random() * 10); // 85-95% 亮度

                                // 将HSL转换为十六进制
                                return hslToHex(h, s, l);
                            }
                            // HSL转十六进制辅助函数
                            function hslToHex(h, s, l) {
                                l /= 100;
                                const a = s * Math.min(l, 1 - l) / 100;
                                const f = n => {
                                    const k = (n + h / 30) % 12;
                                    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                                    return Math.round(255 * color).toString(16).padStart(2, '0');
                                };
                                return `#${f(0)}${f(8)}${f(4)}`;
                            }
                            return getSoftHexColor()
                        }
                        let recordlist = searchRecord('get');
                        recordlist.forEach(item=>{
                            let color = 背景色();
                            d.push({
                                title: item,
                                url: item + searchurl,
                                col_type: 'flex_button',
                                extra: {
                                    id: 'recordid_' + item,
                                    cls: 'sousuorecordlist',
                                    backgroundColor: color,
                                    longClick: [{
                                        title: "删除词条",
                                        js: $.toString((item) => {
                                            deleteItem('recordid_' + item);
                                            searchRecord('del', item);
                                        }, item)
                                    },{
                                        title: "清空记录",
                                        js: $.toString(() => {
                                            searchRecord('del', '');
                                            deleteItemByCls('sousuorecordlist');
                                        })
                                    }]
                                }
                            });
                        })
                        if(recordlist.length>0){
                            d.push({
                                col_type: "line_blank",
                                extra: {
                                    cls: 'sousuorecordlist'
                                }
                            })
                            d.push({
                                col_type: "big_blank_block",
                                extra: {
                                    cls: 'sousuorecordlist'
                                }
                            })
                        }
                        addItemAfter('homesousuoid', d);
                    }
                }, searchurl)
            }
        });

        d.push({
            col_type: "blank_block",
            extra: {
                id: "sourcemenuload"
            }
        })

        if(!jkdata.name){
            d.push({
                title: homeGroup + " 主页源不存在\n需先选择配置主页源",
                desc: "点此或上面切源按钮皆可",
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
            let lockgroups = juItem2.get('lockgroups') || Juconfig["lockgroups"] || [];
            if((isLockGroups(jkdata, lockgroups) || (parseInt(getMyVar('点播下滑num','0'))>1&&lockgroups.length>0)) && getMyVar('SrcJu_已验证指纹')!='1'){
                d.push({
                    title: "当前分组加锁，需要验证指纹",
                    url: 'hiker://empty',
                    col_type: "text_center_1"
                })
                setResult(d);
                const hikerPop = $.require(libspath + 'plugins/hikerPop.js');
                if (hikerPop.canBiometric() !== 0) {
                    return "toast://调用生物学验证出错";
                }
                let pop = hikerPop.checkByBiometric(() => {
                    putMyVar('SrcJu_已验证指纹','1');
                    refreshPage(false);
                    if(parseInt(getMyVar('点播下滑num','0'))>1){
                        selectSource(homeGroup);
                    }
                });
            }else{
                getYiData('主页', jkdata, d);
            }
        }catch(e){
            xlog(jkdata.name+'>加载主页异常>' + e.message + ' 错误行#' + e.lineNumber);
        }
    }else{
        setResult(d);
    }
    
    // 一些自动检查调用在主页加载后，间隔24小时
    let nowtime = Date.now();
    let oldstartChecktime = parseInt(getItem('startChecktime','0').replace('time',''));
    if (!getMyVar('SrcJu_startCheck') && nowtime > (oldstartChecktime+24*60*60*1000)) {
        setItem('startChecktime', nowtime+'time');//保存检查时间
        excludeLoadingItems(); 
        putMyVar('SrcJu_startCheck', 1);
        xlog('执行加载主页后扩展事项');
    }
}

//二级+源搜索
function erji() {
    addListener("onClose", $.toString(() => {
        clearMyVar('二级详情临时对象');
        clearMyVar('二级附加临时对象');
        clearMyVar('二级简介打开标识');
        clearMyVar('换源变更列表id');
        clearMyVar('二级源接口信息');
        clearMyVar('线路显示翻页内容');
        if(getMyVar('从书架进二级')){
            refreshPage(false);
        }
        clearMyVar('二级切换站源');
    }));

    clearMyVar('二级加载扩展列表');
    let erCacheFile = cachepath + "erdataCache.json";//二级加载完后的临时数据文件

    addListener('onRefresh', $.toString((erCacheFile) => {
        deleteFile(erCacheFile);
    }, erCacheFile));

    let oldMY_PARAMS = Object.assign({}, MY_PARAMS);//一级过来的附加信息先保留一份
    let erTempData = storage0.getMyVar('二级详情临时对象') || {};//二级海报等详情临时保存
    let erjiextra = storage0.getMyVar('二级附加临时对象') || MY_PARAMS || {};//二级换源时临时extra数据
    let name = (erjiextra.name||erjiextra.title||erjiextra.pageTitle||"").replace(/‘|’|“|”|<[^>]+>|全集|国语|粤语/g,"").trim();//二级换源关键字
    let jkdata = erjiextra.data;//接口数据
    let sname = jkdata.name;//二级源名称
    let stype = jkdata.type;
    let sgroup = jkdata.group || jkdata.type;//二级源所在分组
    let sid = jkdata.id;//二级源id
    MY_URL = erjiextra.url;//二级请求url
    delete erjiextra['longClick'];
    delete erjiextra['cls'];
    
    if(jkdata.extstr){
        if(!fileExist(jkdata.url) && !fileExist(jkdata.url.replace('rules/Src','_cache'))){
            writeFile(jkdata.url.replace('rules/Src','_cache'), jkdata.extstr);
        }
        delete jkdata.extstr;
    }
    let parse = getObjCode(jkdata, 'er');
    let d = [];

    if(MY_PAGE>1 && !parse['二级翻页']){
        MY_PAGE = 1;
        setResult(d);
        return;
    }
        
    let smark = getMark(MY_URL, sid);//足迹记录
    let lineid = smark.lineid || 0;//线路索引id
    let pageid = smark.pageid || 0;//分页索引id
    let isload;//是否正确加载
    let erdataCache;//是否加载缓存页面数据
    let noShow;//定义二级哪些项不显示
    let Color = getItem('主题颜色','#3399cc');
    let erLoadData,pic,linename;
    
    try{
        if (sid&&MY_URL) {
            if(!getMyVar("SrcJu_调试模式")){
                let cacheData = fetch(erCacheFile);
                if (cacheData != "") {
                    try{
                        eval("let cacheJson=" + cacheData + ";");
                        let nowtime = Date.now();
                        let oldtime = cacheJson.updatetime||0;
                        if(cacheJson.sid==sid && cacheJson.url==MY_URL && nowtime < (oldtime + 30 * 60 * 1000)){
                            erdataCache = cacheJson;//本地缓存接口+链接对得上则取本地，用于切换排序和线路时加快，缓存30分钟
                        }
                    }catch(e){
                        //xlog('读取二级缓存失败>' + e.message);
                    }
                }
            }

            storage0.putMyVar('二级源接口信息', jkdata);
            //方便换源时二级代码中使用MY_PARAMS
            MY_PARAMS = erjiextra;
            
            //二级调用执行公共加载代码，预处理等
            eval(evalPublicStr);

            if(erdataCache){
                erLoadData = erdataCache;
            }else{
                xlog('开始获取二级数据');
                let t1 = new Date().getTime();
                if(parse['二级']){
                    eval("let 二级获取 = " + parse['二级'])
                    erLoadData = 二级获取.call(parse, MY_URL);
                    if(erLoadData){
                        erLoadData.caseData = getCaseData();
                    }
                }else{
                    xlog("parse不存在二级方法");
                }
                let t2 = new Date().getTime();
                xlog('获取二级数据完成，耗时：' + (t2-t1) + 'ms');
            }
        }
    }catch(e){
        xlog('执行获取二级数据出错，信息>' + e.message + " 错误行#" + e.lineNumber);
        setJkSort(jkdata.id, {fail: 1});
    }

    erLoadData = erLoadData || {};
    erLoadData.author = jkdata.author || parse['作者'];
    noShow = erLoadData.noShow || {};//定义不显示的组件

    if(MY_PAGE==1){
        try {
            let detailObj = (isJuDetail(jkdata.id)&&erLoadData.detail1?{}:erLoadData.detailObj) || {}; //二级是否有传封面对象，有传就优先使用
            pic = erLoadData.img || oldMY_PARAMS.img;// || "https://p1.ssl.qhimgs1.com/sdr/400__/t018d6e64991221597b.jpg";

            erjiextra.img = pic;
            erTempData.img = detailObj.img || detailObj.pic_url || erjiextra.img || erTempData.img;
            erTempData.desc = erLoadData.desc || erTempData.desc;
            erTempData.detail1 = detailObj.title || erLoadData.detail1 || erTempData.detail1;
            erTempData.detail2 =  detailObj.desc || erLoadData.detail2 || erTempData.detail2;
            erTempData.url =  detailObj.url || erLoadData.detailurl || erTempData.url;
            erTempData.col_type =  detailObj.col_type || erTempData.col_type;
            erTempData.extra =  detailObj.extra || erTempData.detailextra;
            let detailextra = erTempData.extra || {};
            detailextra.id = "detailid";
            detailextra.gradient = detailextra.gradient || true;
            detailextra.longClick = detailextra.longClick || [];
            let addCaseObj = [];
            if(erLoadData.caseData){
                addCaseObj.push(getCaseClick(erLoadData.caseData, true));
            }

            if(!noShow.封面){
                detailextra.longClick = detailextra.longClick.concat(addCaseObj);
                d.push({
                    title: erTempData.detail1 || "",
                    desc: erTempData.detail2 || "",
                    pic_url: erTempData.img,
                    url: erTempData.url || (/^http/.test(MY_URL)?MY_URL+'#noRecordHistory##noHistory#':erTempData.img),
                    col_type: erTempData.col_type || 'movie_1_vertical_pic_blur',
                    extra: detailextra
                })
            }

            lineid = parseInt(getMyVar("SrcJu_"+MY_URL+"_line", lineid.toString()));
            pageid = parseInt(getMyVar("SrcJu_"+MY_URL+"_page", pageid.toString()));

            let 线路s = ["线路"];
            let 列表s = [[]];
            let 线路s_other;
            try{
                let 线路line = erLoadData.line;
                if(线路line && $.type(线路line)=='array' && 线路line.length>0 && $.type(线路line[0])=='object'){
                    线路s_other = erLoadData.line;
                    线路line = 线路line.map(v=>v.title);
                }
                线路s = erLoadData.line?线路line:["线路"];
                列表s = erLoadData.line?erLoadData.list:[erLoadData.list];
                if(线路s.length != 列表s.length){
                    xlog(sname+'>源接口返回的线路数'+线路s.length+'和列表数'+列表s.length+'不相等');
                }
                linename = 线路s[lineid];//当前线路名
            }catch(e){
                xlog(sname+">线路或列表返回数据有误>"+e.message);
            }
            if(erLoadData.listparse){//选集列表需要动态解析获取
                eval("let 列表动态解析 = " + erLoadData.listparse.toString())
                let 线路选集 = 列表动态解析.call(parse, lineid, 线路s[lineid]) || [];
                if(线路选集.length>0){
                    列表s[lineid] = 线路选集;
                }
            }
            
            let 列表 = [];
            let 自动页码; //当前线路是否自动下一页
            let 分页; //网站分页显示列表的
            if(!noShow.选集){
                let 分页s = $.type(erLoadData.page)=='array' && erLoadData.pageparse ? erLoadData.page.length>0&&$.type(erLoadData.page[0])=='object' ? [erLoadData.page] : erLoadData.page : undefined;
                if(分页s){
                    if(分页s.length==线路s.length){
                        分页 = 分页s[lineid];
                    }else{
                        xlog(sname+'>线路数'+线路s.length+'和分页数'+分页s.length+'不相等');
                    }
                }

                if(分页){//网站分页显示列表的，需要动态解析获取
                    try{
                        if(分页.length==1 && 分页[0].url.includes('fypage')){
                            自动页码 = 分页[0].url;
                        }
                        let pagelist = erLoadData.pagelist || [列表s[lineid]];//优先取本地缓存的分页数据，没有则取二级返回的
                        if(!pagelist[pageid]){//分页数组不存在，则走动态获取
                            eval("let 分页选集动态解析 = " + erLoadData.pageparse.toString());
                            let 分页选集 = [];

                            if(自动页码){
                                分页选集 = 分页选集动态解析.call(parse, 分页[0].url.replace(/fypage/g, pageid+1));
                            }else{
                                if(pageid > 分页.length){
                                    pageid = 0;
                                }
                                分页选集 = 分页选集动态解析.call(parse, 分页[pageid].url);
                            }

                            if($.type(分页选集)=="array"){
                                列表s[lineid] = 分页选集;
                                erLoadData.list = erLoadData.line?列表s:分页选集;

                                pagelist[pageid] = 分页选集;
                            }
                        }else{//分页数组存在，则赋值给当前列表
                            列表s[lineid] = pagelist[pageid];
                        }
                        erLoadData.pagelist = pagelist;//分页数组缓存本地
                    }catch(e){
                        xlog(sname+'分页选集处理失败>'+e.message);
                    }
                }
                
                if(lineid > 列表s.length-1){
                    toast('选择的线路无选集，将显示第1线路');
                    lineid = 0;
                }

                列表 = 列表s[lineid] || [];

                //线路名除评论的线路选集修正排序
                if(列表.length>0 && 线路s[lineid]!='评论'){
                    function checkAndReverseArray(arr) {
                        try {
                            let numbers = [];
                            arr.slice(0, 50).forEach(it => {
                                let digits = it.title.match(/\d+/g);
                                if (digits) {
                                    numbers.push(digits.map(numStr => parseInt(numStr, 10)));
                                }
                            });

                            // 至少需要5个有效数字序列
                            if (numbers.length < 5) {
                                return arr;
                            }

                            let decreasingCount = 0;
                            let totalComparisons = 0; // 记录有效比较的总数

                            for (let i = 1; i < numbers.length; i++) {
                                let prev = numbers[i - 1];
                                let curr = numbers[i];
                                let comparison = 0;
                                let minLen = Math.min(prev.length, curr.length);

                                // 逐位比较数字
                                for (let j = 0; j < minLen; j++) {
                                    if (curr[j] > prev[j]) {
                                        comparison = 1;
                                        break;
                                    } else if (curr[j] < prev[j]) {
                                        comparison = -1;
                                        break;
                                    }
                                }

                                // 只统计有明确增减关系的递减数量和总数
                                if (comparison !== 0) {
                                    if (comparison < 0) {
                                        decreasingCount++;
                                    }
                                    totalComparisons++;
                                }
                            }

                            // 如果没有足够的有效比较，不进行反转
                            if (totalComparisons < 3) {
                                return arr;
                            }

                            // 计算递减的比例
                            let decreasingRatio = decreasingCount / totalComparisons;
                            // 当递减比例超过60%时才反转，避免因个别大数字导致误判
                            if (decreasingRatio > 0.6) {
                                return arr.reverse();
                            } else {
                                return arr;
                            }
                        } catch (e) {
                            //xlog('强制修正选集顺序失败>'+e.message)
                        }
                        return arr;
                    }

                    
                    列表 = checkAndReverseArray(列表);
                    if (getMyVar(sname + 'sort') == '1') {
                        列表.reverse();
                    }
                }
            }
            
            stype = erLoadData.type || stype;
            let itype = stype=="漫画"?"comic":stype=="小说"?"novel":"";
            let dataObj = {
                data: jkdata,
                type: stype
            }
            let lazy = $("").lazyRule((dataObj) => {
                let url = input;
                let jkdata = dataObj.data;
                let parse = getObjCode(jkdata, 'jx');
                if(parse['解析']){
                    eval("let 解析2 = " + parse['解析']);
                    return 解析2.call(parse, url);
                }else{
                    //require(config.聚阅.replace(/[^/]*$/,'') + 'SrcParseS.js');
                    //return SrcParseS.聚阅(url, dataObj);
                    return $.require("parseUrl").解析(url);
                }
            }, dataObj);
            let download = $.toString((jkdata) => {
                let parse = $.require("jiekou?rule=聚阅").parse(jkdata);
                if(parse['解析']){
                    eval("let 解析2 = " + parse['解析']);
                    return 解析2.call(parse, input);
                }else{
                    return "toast://没找到解析方法";
                }
            }, jkdata);
            
            if(!noShow.简介){
                let erIcons = getThemeList(true)['二级图标'];
                let jjarr = [{
                    title: `<font color="`+getItem('主题颜色','#3399cc')+`">详情简介 </font>`,
                    col_type: "avatar",
                    url: $("#noLoading#").lazyRule(() => {
                        clearMyVar('二级简介打开标识');
                        deleteItemByCls("SrcJudescload");
                        if(juItem2.get('二级简介固化显示')){
                            juItem2.clear('二级简介固化显示')
                            return 'toast://取消简介固化显示';
                        }
                        return "hiker://empty";
                    }),
                    pic_url: getIcon(erIcons[3].img, false, erIcons[3].color),
                    extra: {
                        cls: "SrcJudescload",
                        longClick: [{
                            title: "固化显示简介",
                            js: $.toString(() => {
                                juItem2.set('二级简介固化显示', true);
                                return 'toast://已固化简介显示';
                            })
                        }]
                    }
                },{
                    title: erTempData.desc||"",
                    col_type: "rich_text",
                    extra: {
                        cls: "SrcJudescload"
                    }
                }]
                if(juItem2.get('二级简介固化显示')){
                    putMyVar('二级简介打开标识',"1");
                    d = d.concat(jjarr);;
                }
                d.push({
                    title: "详情简介",
                    url: $("#noLoading#").lazyRule((jjarr) => {
                        if(getMyVar('二级简介打开标识')=="1"){
                            clearMyVar('二级简介打开标识');
                            deleteItemByCls("SrcJudescload");
                        }else{
                            putMyVar('二级简介打开标识',"1");
                            addItemAfter('detailid', jjarr);
                        }
                        return "hiker://empty";
                    }, jjarr),
                    pic_url: getIcon(erIcons[0].img, false, erIcons[0].color),
                    col_type: 'icon_small_3',
                    extra: {
                        cls: "Juloadlist"
                    }
                })
                let sskeyword = name.split('/')[0].trim();
                if(stype=="视频"){
                    d.push({
                        title: "扩展搜索",
                        url: expandSearch(sskeyword),
                        pic_url: getIcon(erIcons[4].img, false, erIcons[4].color),
                        col_type: 'icon_small_3',
                        extra: {
                            cls: "Juloadlist",
                            longClick: addCaseObj
                        }
                    })
                }else{
                    let imgdecode = "";
                    if(parse["imgdec"]){
                        try{
                            if($.type(parse["imgdec"])=="function"){
                                imgdecode = parse["imgdec"]();
                                if($.type(imgdecode)=="function"){
                                    imgdecode = $.toString((imgdec)=>{
                                        let imgDecrypt = imgdec;
                                        return imgDecrypt();
                                    }, imgdecode)
                                }
                            }else if($.type(parse["imgdec"])=="string"){
                                imgdecode = parse["imgdec"];
                            }
                        }catch(e){
                            xlog('获取图片解密imgdec出错，信息>' + e.message + " 错误行#" + e.lineNumber);
                        }
                    }
                    d.push({
                        title: "收藏书架",
                        url: $("hiker://empty###noRecordHistory##noHistory##immersiveTheme#").rule(() => {
                            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcBookCase.js');
                            bookCase();
                        }),
                        pic_url: getIcon(erIcons[1].img, false, erIcons[1].color),
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
                            }].concat(addCaseObj),
                            chapterList: 列表,
                            "defaultView": "1",
                            "info": {
                                "bookName": name,
                                "bookTopPic": pic,
                                "parseCode": download,
                                "ruleName": sname + " (聚阅)",
                                "type": itype,
                                "decode": imgdecode
                            }
                        }
                    })
                }
                function processChineseText(input) {
                    // 1. 只保留汉字、字母、数字
                    let cleaned = input.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
                    if (!cleaned) return "（无）";

                    // 2. 计算显示宽度并截取前8宽度
                    let result = '';
                    let currentWidth = 0;
                    for (let char of cleaned) {
                        let charWidth = /[\u4e00-\u9fa5]/.test(char) ? 2 : 1;
                        if (currentWidth + charWidth > 8) break;
                        result += char;
                        currentWidth += charWidth;
                    }

                    // 3. 只有宽度 <8 时才补齐
                    if (currentWidth < 8) {
                        let isPureChinese = /^[\u4e00-\u9fa5]+$/.test(result);
                        let isPureEnglish = /^[a-zA-Z0-9]+$/.test(result);

                        if (isPureChinese) {
                            // 纯中文：1-2个字中间补，3个字末尾补
                            if (result.length <= 2) {
                                result = result.split('').join('\u3000') + '\u3000'.repeat(4 - result.length);
                            } else if (result.length === 3) {
                                result += '\u3000';
                            }
                        } else if (isPureEnglish) {
                            // 纯英文/数字：末尾补半角空格
                            result += ' '.repeat(8 - currentWidth);
                        }
                    }

                    return result;
                }
                d.push({
                    title: sname?processChineseText(sname):"切换站源",
                    url: $("#noLoading#").lazyRule((name,group) => {
                        updateItem("erji_loading2", { 
                            extra: {
                                id: "erji_loading",
                                lineVisible: false
                            } 
                        });
                        deleteItemByCls('Juloadlist');

                        clearMyVar('线路显示翻页内容');
                        clearMyVar('换源变更列表id');
                        putMyVar('二级切换站源', '1');
                        require(config.聚阅);
                        //showLoading('搜源中,请稍后.');
                        erjisousuo(name, group);
                        //hideLoading();
                        return  "hiker://empty";
                    }, sskeyword, juItem2.get('二级换源走分类')?stype:sgroup),
                    pic_url: getIcon(erIcons[2].img, false, erIcons[2].color),
                    col_type: 'icon_small_3',
                    extra: {
                        cls: "Juloadlist",
                        longClick: [{
                            title: "换源搜索范围：" + (juItem2.get('二级换源走分类')?'分类':'分组'),
                            js: $.toString(() => {
                                if(juItem2.get('二级换源走分类')){
                                    juItem2.clear('二级换源走分类');
                                }else{
                                    juItem2.set('二级换源走分类', 1);
                                }
                                refreshPage();
                            })
                        },{
                            title: "换源模糊匹配：" + (juItem2.get('二级换源模糊匹配')?'是':'否'),
                            js: $.toString(() => {
                                if(juItem2.get('二级换源模糊匹配')){
                                    juItem2.clear('二级换源模糊匹配');
                                }else{
                                    juItem2.set('二级换源模糊匹配', 1);
                                }
                                refreshPage();
                            })
                        }]
                    }
                })
                d.push({
                        col_type: "line"
                })
                for (let i = 0; i < 3; i++) {
                    d.push({
                        col_type: "blank_block"
                    })
                }
            }

            let reviseLiTitle = getItem('reviseLiTitle','0');
            let line_col_type = getItem('SrcJuLine_col_type', 'scroll_button');

            let addmoreitems = 0;
            if(getItem('extenditems','1')=="1" && erLoadData.moreitems && $.type(erLoadData.moreitems)=='array'){
                let moreitems = erLoadData.moreitems;
                if(moreitems.length>0){
                    moreitems.forEach(item => {
                        if(item.url!=MY_URL){
                            item = toerji(item, jkdata);
                            item.extra = item.extra || {};
                            //item.extra['back'] = 1;
                            item.extra['cls'] = "Juloadlist extendlist";
                            d.push(item);
                            addmoreitems = 1;
                        }
                    })
                }
            }
            if(!noShow.排序){
                if (line_col_type == 'scroll_button' && addmoreitems == 0) {
                    for (let i = 0; i < 10; i++) {
                        d.push({
                            col_type: "blank_block"
                        })
                    }
                }
                
                d.push({
                    title: getMyVar(sname + 'sort') == '1' ? `““””<span style="color: #66CCEE">`+(juItem2.get('二级简洁模式')?"":"排序")+`⇅</span>` : `““””<span style="color: #55AA44">`+(juItem2.get('二级简洁模式')?"":"排序")+`⇅</span>`,
                    url: $("#noLoading#").lazyRule((sname) => {
                        let 列表 = findItemsByCls('playlist') || [];
                        if(列表.length==0){
                            return 'toast://未获取到列表'
                        }
                        deleteItemByCls('playlist');
                        if (getMyVar(sname + 'sort') == '1') {
                            putMyVar(sname + 'sort', '0');
                            updateItem('listsort', {
                                title: `““””<b><span style="color: #55AA44">`+(juItem2.get('二级简洁模式')?"":"排序")+`⇅</span></b>`
                            });
                        } else {
                            putMyVar(sname + 'sort', '1')
                            updateItem('listsort', {
                                title: `““””<b><span style="color: #66CCEE">`+(juItem2.get('二级简洁模式')?"":"排序")+`⇅</span></b>`
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

                let morecols = ["选集分页设置","修整选集标题:"+(reviseLiTitle=="1"?"是":"否"),"显示扩展项:"+(getItem('extenditems','1')=="1"?"是":"否")];
                morecols.push("线路样式:"+getItem('SrcJuLine_col_type', 'scroll_button'))
                morecols.push("选集样式:"+getItem('SrcJuList_col_type', '自动'))
                morecols.push("二级简洁模式:"+(juItem2.get('二级简洁模式')?"是":"否"))
                if(erLoadData.detail1 && erLoadData.detailObj){
                    morecols.push("自定义封面样式:"+(isJuDetail(jkdata.id)?"否":"是"))
                }
                
                d.push({
                    title: `““””`+(juItem2.get('二级简洁模式')?"":`<span style="color: #f47983">样式</span>`)+`<small>🎨</small>`,
                    url: $(morecols, 1, "样式设置").select(() => {
                        if(input=="选集分页设置"){
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
                        }else if(input.includes('修整选集标题')){
                            let sm;
                            if(getItem('reviseLiTitle','0')=="1"){
                                clearItem('reviseLiTitle');
                                sm = "取消修整选集标题名称";
                            }else{
                                setItem('reviseLiTitle','1');
                                sm = "统一修整选集标题名称";
                            }
                            refreshPage(false);
                            return "toast://"+sm;
                        }else if(input.includes('显示扩展项')){
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
                        }else if(input.includes('线路样式')){
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
                        }else if(input.includes('选集样式')){
                            return $(["自动判断","text_1","text_2","text_3","text_4","flex_button"],2,"选集列表样式").select(() => {
                                if(input=='自动判断'){
                                    clearItem('SrcJuList_col_type');
                                }else{
                                    setItem('SrcJuList_col_type', input);
                                }
                                refreshPage();
                                return 'hiker://empty';
                            })
                        }else if(input.includes('二级简洁模式')){
                            let sm;
                            if(juItem2.get('二级简洁模式')){
                                juItem2.clear('二级简洁模式');
                                sm = "退出简洁模式，排序、样式等显示名称";
                            }else{
                                juItem2.set('二级简洁模式','1');
                                sm = "简洁模式，排序、样式等不显示名称";
                            }
                            refreshPage(false);
                            return "toast://"+sm;
                        }else if(input.includes('自定义封面样式')){
                            let list = [];
                            list.push('所有源:'+(juItem2.get('二级聚阅封面')?"关":"开"));
                            list.push('当前源:'+(juItem.get('二级聚阅封面')?"关":juItem.get('二级聚阅封面')===''?"未配置":"开"));
                            list.push('清除配置');
                            return $(list, 2, '自定义封面开关，关代表不显示').select(()=>{
                                let sm;
                                if(input.includes('当前源')){
                                    if(juItem.get('二级聚阅封面')){
                                        juItem.set('二级聚阅封面', false);
                                        sm = "当前源优先自定义封面样式";
                                    }else{
                                        juItem.set('二级聚阅封面', true);
                                        sm = "当前源强制聚阅原封面样式";
                                    }
                                }else if(input.includes('所有源')){
                                    if(juItem2.get('二级聚阅封面')){
                                        juItem2.clear('二级聚阅封面');
                                        sm = "所有源优先自定义封面样式";
                                    }else{
                                        juItem2.set('二级聚阅封面', true);
                                        sm = "所有源强制聚阅原封面样式";
                                    }
                                }else{
                                    juItem.clear('二级聚阅封面');
                                    juItem2.clear('二级聚阅封面');
                                    sm = "已清除配置";
                                }
                                refreshPage(false);
                                return "toast://"+sm;
                            })
                        }
                    }),
                    col_type: line_col_type,
                    extra: {
                        cls: "Juloadlist",
                        longClick: [{
                            title: "解析列表",
                            js: $.toString(() => {
                                return $("hiker://empty#noRecordHistory##noHistory##noRefresh#").rule(() => {
                                    let {jxItem} = $.require(codePath + 'jiexi/SrcInvoke.js');
                                    jxItem();
                                })
                            })
                        },{
                            title: "调用管理",
                            js: $.toString(() => {
                                return $("hiker://empty#noRecordHistory##noHistory##noRefresh#").rule(() => {
                                    let {dyItem} = $.require(codePath + 'jiexi/SrcInvoke.js');
                                    dyItem();
                                })
                            })
                        },{
                            title: "解析设置",
                            js: $.toString(() => {
                                return $.require("parseUrl").设置;
                            })
                        }]
                    }
                })
            }
            if(parse['二级翻页'] && $.type(erLoadData.pageParam)=='object' && erLoadData.pageParam.line){
                let linetitle = erLoadData.pageParam.title || '评论';
                d.push({
                    title: getMyVar('线路显示翻页内容')?`““””<span style="color: `+Color+`">`+linetitle+`</span>`:linetitle,
                    url: $("#noLoading#").lazyRule(() => {
                        if(!getMyVar('线路显示翻页内容')){
                            putMyVar('线路显示翻页内容', '1');
                            refreshPage(false);
                        }
                        return 'hiker://empty'
                    }),
                    col_type: line_col_type,
                    extra: {
                        cls: "Juloadlist",
                        backgroundColor: getMyVar('线路显示翻页内容')?"#20" + Color.replace('#',''):""
                    }
                })
            }
            if(线路s.length>0 && 线路s[0] !="线路"){
                线路s.forEach((it,i)=>{
                    let line_others = 线路s_other || [];
                    let line_other = line_others[i] || {};
                    let extra = line_other.extra || {};
                    extra.cls = "Juloadlist";
                    extra.backgroundColor = !getMyVar('线路显示翻页内容')&&lineid==i?(extra.backgroundColor||"#20" + Color.replace('#','')):"";
                    d.push({
                        title: !getMyVar('线路显示翻页内容')&&lineid==i?`““””<span style="color: `+Color+`">`+it+`</span>`:it,
                        url: $("#noLoading#").lazyRule((lineurl,nowid,newid) => {
                            if(nowid != newid || getMyVar('线路显示翻页内容')){
                                clearMyVar('线路显示翻页内容');
                                putMyVar(lineurl, newid);
                                refreshPage(false);
                            }
                            return 'hiker://empty'
                        }, "SrcJu_"+MY_URL+"_line", lineid, i),
                        desc: line_other.desc || '',
                        img: line_other.img || line_other.pic || line_other.pic_url || '',
                        col_type: line_other.col_type || line_col_type,
                        extra: extra
                    })
                })
            }

            if(!noShow.选集 && !getMyVar('线路显示翻页内容')){
                //分页定义
                let partpage = storage0.getItem('partpage') || {};
                if(分页){//原网站有分页，不执行自定义分页
                    let 分页链接 = [];
                    let 分页名 = [];
                    if(自动页码){
                        分页 = erLoadData.pagelist.map((it,i)=>{
                            return {title: (i+1).toString()}
                        });
                    }
                    分页.forEach((it,i)=>{
                        分页链接.push($("#noLoading#").lazyRule((pageurl,nowid,newid) => {
                                if(nowid != newid){
                                    putMyVar(pageurl, newid);
                                    refreshPage(false);
                                }
                                return 'hiker://empty'
                            }, "SrcJu_"+MY_URL+"_page", pageid, i)
                        )
                        分页名.push(pageid==i?'““””<span style="color: '+Color+'">'+it.title:it.title);
                    })
                    if(分页名.length>0){
                        d.push({
                            col_type: "blank_block",
                            extra: {
                                cls: "Juloadlist"
                            }
                        });
                        d.push({
                            title: !自动页码&&pageid==0?"尾页":"上页",
                            url: 自动页码?$("#noLoading#").lazyRule((pageurl,nowid,newid) => {
                                if(nowid==0){
                                    return 'toast://已经到顶了';
                                }
                                if(nowid != newid){
                                    putMyVar(pageurl, newid);
                                    refreshPage(false);
                                }
                                return 'hiker://empty'
                            }, "SrcJu_"+MY_URL+"_page", pageid, pageid-1):pageid==0?分页链接[分页名.length-1]:分页链接[pageid-1],
                            col_type: 'text_4',
                            extra: {
                                cls: "Juloadlist"
                            }
                        })
                        d.push({
                            title: 自动页码?('““””<span style="color: '+Color+'">'+"第"+(pageid+1)+"页"):分页名[pageid],
                            url: $(分页名, 自动页码&&分页名.length>10?3:2).select((分页名,分页链接) => {
                                return 分页链接[分页名.indexOf(input)];
                            },分页名,分页链接),
                            col_type: 'text_2',
                            extra: {
                                cls: "Juloadlist"
                            }
                        })
                        d.push({
                            title: 自动页码?"下页":pageid==分页名.length-1?"首页":"下页",
                            url: 自动页码?$("#noLoading#").lazyRule((pageurl,nowid,newid,listlength) => {
                                if(nowid>0 && listlength==0){
                                    return 'toast://到底了'
                                }
                                if(nowid != newid){
                                    putMyVar(pageurl, newid);
                                    refreshPage(false);
                                }
                                return 'hiker://empty'
                            }, "SrcJu_"+MY_URL+"_page", pageid, pageid+1, 列表.length):pageid==分页名.length-1?分页链接[0]:分页链接[pageid+1],
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
                            pageid = 最大页数-1;
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
                        分页 = getNewArray(列表, 每页数量);//按每页数据切割成小数组

                        分页.forEach((it,i)=>{
                            分页链接.push($("#noLoading#").lazyRule((pageurl,nowid,newid) => {
                                    if(nowid != newid){
                                        putMyVar(pageurl, newid);
                                        refreshPage(false);
                                    }
                                    return 'hiker://empty'
                                }, "SrcJu_"+MY_URL+"_page", pageid, i)
                            )
                            let start = i * 每页数量 + 1;
                            let end = i * 每页数量 + it.length;
                            let title = start + ' - ' + end;
                            分页名.push(pageid==i?'““””<span style="color: '+Color+'">'+title:title)
                        })
                        d.push({
                            col_type: "blank_block",
                            extra: {
                                cls: "Juloadlist"
                            }
                        });
                        d.push({
                            title: 分页页码==1?"尾页":"上页",
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
                            title: 分页页码==分页名.length?"首页":"下页",
                            url: 分页页码==分页名.length?分页链接[0]:分页链接[pageid+1],
                            col_type: 'text_4',
                            extra: {
                                cls: "Juloadlist"
                            }
                        })
                        列表 = 分页[pageid];//取当前分页的选集列表
                    }
                }
                // 修正列表选集标题
                function reviseTitle(str){
                    if(!str){
                        return '';
                    }
                    if(reviseLiTitle == "1"){
                        return str.replace(name,'').replace(/‘|’|“|”|<[^>]+>| |-|_|第|集|话|章|\</g,'').replace('（','(').replace('）',')').trim();
                    }
                    return str.trim();
                }
                let titlelen = 列表.slice(0, 10).concat(列表.slice(-10)).reduce((max, str) => Math.max(max, reviseTitle(str.title).length), 0);
                let list_col_type = getItem('SrcJuList_col_type', '自动')=='自动'?(列表.length > 4 && titlelen < 5 ? 'text_4' : titlelen > 10 ? 'text_1' : titlelen>4&&titlelen<7 ? 'text_3' :'text_2'):getItem('SrcJuList_col_type'); //列表默认样式
                
                for(let i=0; i<列表.length; i++) {
                    let extra = Object.assign({}, erLoadData["extra"] || {});//二级返回数据中的extra设为默认
                    try{
                        extra = Object.assign(extra, 列表[i].extra || {});//优先用选集的extra
                    }catch(e){}
                    extra.id = name + "_选集_" + (pageid?pageid+"_":"") + i;
                    extra.cls = "Juloadlist playlist";
                    if(stype=="视频"||stype=="音频"||stype=="聚合"){
                        extra.jsLoadingInject = true;
                        extra.blockRules = extra.blockRules || ['.m4a', '.mp3', '.gif', '.jpeg', '.jpg', '.ico', '.png', 'hm.baidu.com', '/ads/*.js', 'cnzz.com'];
                        extra.videoExcludeRules = extra.videoExcludeRules || ['m3u8.js','?url='];
                    }

                    let isrule;
                    if (stype=="小说" || erLoadData.rule || erLoadData.novel || 列表[i].rule) {
                        isrule = 1;
                        extra.url = 列表[i].url;
                        lazy = lazy.replace("@lazyRule=.",((stype=="小说"||erLoadData.novel)?"#readTheme##autoPage#":"#noRecordHistory#")+"@rule=").replace(`input`,`MY_PARAMS.url || ""`);
                    }

                    d.push({
                        title: reviseTitle(列表[i].title),
                        url: !列表[i].url?'toast://链接为空':(列表[i].url.includes('@lazyRule=')||列表[i].url.includes('@rule='))?列表[i].url:列表[i].url!="hiker://empty"?((isrule?"hiker://empty##":"") + 列表[i].url + lazy):列表[i].url,
                        desc: 列表[i].desc,
                        img: 列表[i].img,
                        col_type: 列表[i].col_type || list_col_type,
                        extra: extra
                    });
                }

                if(列表.length>0){
                    isload = 1;
                }else if(列表.length==0){
                    d.push({
                        title: "‘‘’’<font color=grey><small>"+(pageid==0?"线路列表为空":"分页到底了")+"</small></font>",
                        url: 'hiker://empty',
                        col_type: 'text_center_1',
                        extra: {
                            cls: 'Juloadlist',
                            lineVisible: false
                        }
                    });
                }
            }
            if(getItem('extenditems','1')=="1" && erLoadData.extenditems && $.type(erLoadData.extenditems)=='array' && !getMyVar('线路显示翻页内容')){
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
                        if(item.url!=MY_URL){
                            item = toerji(item, jkdata);
                            item.extra = item.extra || {};
                            //item.extra['back'] = 1;
                            item.extra['cls'] = "Juloadlist extendlist";
                            d.push(item)
                        }
                    })
                }
                putMyVar('二级加载扩展列表','1');
            }
        } catch (e) {
            toast('有异常，看日志');
            xlog(sname + '>加载二级页面失败>' + e.message + ' 错误行#' + e.lineNumber);
        }
        d.push({
            title: "‘‘’’<small><small><font color=#bfbfbf>当前数据源：" + sname + (erLoadData.author?", 作者：" + erLoadData.author:"") + (parse['模板名']?"，模板："+parse['模板名']:"") + "</font></small></small>",
            url: stype=="小说"?'hiker://empty':$('#noLoading#').lazyRule(()=>{
                const hikerPop = $.require("http://123.56.105.145/weisyr/js/hikerPop.js");
                hikerPop.scrollSmooth("detailid", true, 20);
                return 'toast://温馨提示：且用且珍惜！';
            }),
            col_type: getMyVar('线路显示翻页内容')?'blank_block':'text_center_1',
            extra: {
                id: getMyVar('换源变更列表id')?"erji_loading2":"erji_loading",
                lineVisible: false
            }
        });
    }
    if(parse['二级翻页'] && erLoadData.pageParam){
        if(($.type(erLoadData.pageParam)=='object'&&(!erLoadData.pageParam.line || getMyVar('线路显示翻页内容'))) || $.type(erLoadData.pageParam)!='object'){
            d.push({
                pic_url: config.聚阅.replace(/[^/]*$/,'') + "img/Loading.gif",
                col_type: "pic_1_center",
                url: "hiker://empty",
                extra: {
                    cls: 'Juloadlist',
                    cls: "loading_gif"
                }
            })
            setPreResult(d);
            try {
                xlog('获取二级翻页数据，当前页：' + MY_PAGE);
                let 执行str = parse['二级翻页'].toString();
                let getData = [];
                let resultd;
                let setResult = function(d) { resultd = d; };
                eval("let 数据 = " + 执行str);
                getData = 数据.call(parse, erLoadData.pageParam||MY_URL) || [];
                if(resultd&&getData.length==0){
                    getData = resultd;
                }

                if (getData.length > 0) {
                    jkdata['erjisign'] = parse['二级标识'];
                    getData.forEach(item => {
                        item = toerji(item, jkdata);
                        item.extra = item.extra || {};
                        item.extra['cls'] = item.extra['cls']?(item.extra['cls']+" Juloadlist"):"Juloadlist";
                    })
                }
                d = getData;
            } catch (e) {
                xlog('加载二级翻页内容异常>' + e.message + ' 错误行#' + e.lineNumber);
            }
            deleteItemByCls("loading_gif");
        }
    }
    setResult(d);
    if (MY_PAGE==1 && (isload || noShow.选集)) {
        //更换收藏封面
        if(erTempData.img && oldMY_PARAMS.img!=erTempData.img){
            setPagePicUrl(erTempData.img);
        }
        //二级海报等详情临时保存
        storage0.putMyVar('二级详情临时对象',erTempData);
        //当前二级数据保存到缓存文件，避免二级重复请求
        if(!getMyVar("SrcJu_调试模式")){
            let saveCache;
            if(smark.pageid != pageid || smark.lineid != lineid){
                saveCache = 1;
            }
            erLoadData.updatetime = Date.now();

            if(!erdataCache){
                erLoadData.sid = jkdata.id;
                erLoadData.url = MY_URL;
                writeFile(erCacheFile, $.stringify(erLoadData));//第一次打开页面保存缓存
                let caseObj = erLoadData.caseData;
                if(getItem("自动切换二级源接口")=="0" && !getMyVar('二级切换站源')){
                    caseObj = {id: erLoadData.caseData.id};
                }
                addBookCase(caseObj, true);//更新收藏书架数据
            }else if(saveCache){
                writeFile(erCacheFile, $.stringify(erLoadData));//线路或分页变化强制保存缓存
            }
        }
        //切换源时更新收藏数据，以及分享时附带接口
        if (typeof (setPageParams) != "undefined") {
            if ((MY_URL && oldMY_PARAMS.url!=MY_URL) || !oldMY_PARAMS.data.extstr) {
                erjiextra.data.extstr = objconvertjs(parse);
                setPageParams(erjiextra);
            }
        }
        
        if (isload) {//有选集的才保存或更新最新
            //二级源浏览记录保存
            if(linename != '评论'){
                let erjiMarkdata = { sid: jkdata.id, url: MY_URL, lineid: lineid, pageid: pageid };
                setMark(erjiMarkdata);
            }

            //收藏更新最新章节
            if (parse['最新']) {
                setLastChapterRule('js:' + $.toString((url,jkdata,参数) => {
                    MY_URL = url;
                    let parse = getObjCode(jkdata, 'zx');
                    let 最新str = parse['最新'].toString().replace('setResult','return ').replace('getResCode()','request(url)');
                    eval("let 最新2 = " + 最新str);
                    try{
                        eval(evalPublicStr);
                        let zx = 最新2.call(parse, url) || "";
                        setResult(jkdata.name + " | " + (zx||""));
                    }catch(e){
                        setResult(jkdata.name + " | 最新获取失败");
                    }
                }, MY_URL, jkdata, {}))
            }else if(parse['二级']){
                setLastChapterRule('js:' + $.toString((sname) => {
                    setResult(sname + " | 作者没写最新");
                }, sname))
            }
        }
    }
    clearMyVar('换源变更列表id');
}

//搜索页面
function sousuo() {
    let name = MY_URL.split('##')[1];
    
    setResult([{
        title: "点我一下，视界聚搜",
        url: "hiker://search?s=" + name.split('  ')[0].trim(),
        extra: {
            delegateOnlySearch: true,
            rules: $.toString((name) => {
                let info = storage0.getMyVar('一级源接口信息') || {};
                let keyword = name.split('  ')[0].trim();
                let keyword2;
                if(name.indexOf('  ')>-1){
                    if(name.split('  ')[1].trim()=='聚合搜索'){
                        let parse = getObjCode(info, 'ss');
                        return parse['聚合搜索'](keyword);
                    }
                    keyword2 = name.split('  ')[1].trim() || info.name;
                }

                let ssdatalist = [];
                try{
                    if(storage0.getMyVar('搜索临时搜索数据')){//主界面上搜索当前接口
                        ssdatalist.push(storage0.getMyVar('搜索临时搜索数据'));
                        clearMyVar('搜索临时搜索数据');
                    }else if(keyword2){//软件搜索有+2空格传指定
                        if(keyword2==info.name){//搜当前源
                            ssdatalist = [info];
                        }else{
                            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                            let lists = getSearchLists(keyword2);
                            if(lists.length>0){//搜指定分组
                                ssdatalist = lists;
                            }else{//搜指定源名
                                ssdatalist = getSearchLists().filter(it=>{
                                    return it.name.includes(keyword2);
                                });
                            }
                        }
                    }else if(getMyVar('搜索指定源列表')){//搜索指定源列表
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                        let lists = getSearchLists();
                        let idslist = storage0.getMyVar('搜索指定源列表') || [];
                        if(idslist.length>0){
                            if($.type(idslist[0])=='string'){
                                ssdatalist = lists.filter(it=>{
                                    return idslist.indexOf(it.id)>-1 || idslist.indexOf(it.name)>-1;
                                });
                            }else if($.type(idslist[0])=='object'){
                                ssdatalist = idslist;
                            }
                        }
                        clearMyVar('搜索指定源列表');
                    }else{//主界面上或软件搜索当前源所在分组
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                        let group = getMyVar('搜索临时搜索分组','') || homeGroup;
                        ssdatalist = getSearchLists(group);
                        clearMyVar('搜索临时搜索分组');
                    }
                }catch(e){
                    //xlog(e.message);
                }

                let judata = [];
                ssdatalist.forEach(it=>{
                    judata.push({
                        "title": it.name,
                        "search_url": "hiker://empty##**##fypage",
                        "searchFind": `js: require(config.聚阅); let d = search('` + keyword + `', 'hkjusou' ,` + JSON.stringify(it) + `); setResult(d);`
                    });
                })
                return JSON.stringify(judata);
            },name)
        }
    }])
}
//搜索逻辑代码
function search(name, sstype, jkdata, blurMatch) {
    let page = (sstype=="erji" || sstype=="yiji") ? 1 : MY_PAGE;
    let ssdata = [];

    function normalizeSearchText(text) {
        return text
            // 移除开头和结尾的标点符号
            .replace(/^[^\w\u4e00-\u9fa5]+|[^\w\u4e00-\u9fa5]+$/g, '')
            // 移除中间所有非文字字符（保留中文、英文、数字）
            .replace(/[^\w\u4e00-\u9fa5]/g, '')
            // 转换为小写（如果需要不区分大小写）
            .toLowerCase();
    }

    function isMatch(searchText, targetText) {
        const normalizedSearch = normalizeSearchText(searchText);
        const normalizedTarget = normalizeSearchText(targetText);

        return normalizedTarget.includes(normalizedSearch);
    }

    let isnewVer = ((MY_NAME=="海阔视界"&&getAppVersion()>=5566)||(MY_NAME=="嗅觉浏览器"&&getAppVersion()>=2305));
    getSsData(name, jkdata, page).vodlists.forEach(it => {
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
                it.desc = (isnewVer?it.extra.name+" ":"") + (it.extra.desc || it.desc || "源作者没写");
                it.col_type = isnewVer?"icon_1_left_pic":"avatar";
                
                if((blurMatch&&isMatch(name, it.extra.name)) || (it.extra.name.toLowerCase()==name.toLowerCase())){
                    ssdata.push(it);
                }
            }
        }else if(sstype=="yiji"){
            if(isMatch(name, it.title) || it.retain){
                delete it.retain;
                it.extra = it.extra || {};
                it.extra.cls = "homesousuolist";
                ssdata.push(it);
            }
        }else if(sstype=="newSearch"){
            if(isMatch(name, it.title)){
                it.title = it.title.replace(name, '‘‘’’<font color=red>' + name + '</font>');
                it.col_type = "movie_1_vertical_pic";
                it.desc = (it.desc||"") + '\n' + '‘‘’’<font color=#f13b66a>聚阅 · '+jkdata.name+'</font> ('+jkdata.type+')';
                ssdata.push(it);
            }
        }else if(isMatch(name, it.title) || !it.url.includes('erji();') || it.retain){
            delete it.retain;
            ssdata.push(it);
        }
    })
    return ssdata;
}

//二级切源搜索
function erjisousuo(name,group,datas,sstype) {
    sstype = sstype || "erji";
    let updateItemid = sstype=="erji"?"erji_loading":group+"_newSearch_loading";
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
        clearMyVar("SrcJu_停止搜索线程");
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
            return (function() {
                try {
                    let lists = obj.search(obj.name, obj.type, obj.data, obj.blurMatch);
                    return {result:lists, success:1, type: obj.type, name: obj.data.name};
                } catch (e) {
                    xlog(obj.data.name + '>搜索失败>' + e.message);
                    return {result:[], success:0, type: obj.type, name: obj.data.name};
                }
            })();
        }
        let list = ssdatalist.map((item) => {
            return {
                func: task,
                param: {"search":search,"name":name,"type":sstype,"data":item,"blurMatch":sstype=="erji"&&juItem2.get('二级换源模糊匹配')?1:0},
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
                            if(success>=20 && taskResult.type=="erji"){
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
            let pagesm = sstype=="newSearch"?"第"+MY_PAGE+"页":"";
            let sousuosm = "‘‘’’<small><font color=#f13b66a>" + success + "</font>/" + list.length + "，"+pagesm+"搜索完成</small>";
            updateItem(updateItemid, { title: sousuosm });
        } else {
            hideLoading();
            addItemBefore(updateItemid, [{
                title: "",
                url: "hiker://empty",
                col_type: 'text_center_1',
                extra: {
                    cls: "Juloadlist",
                    lineVisible: false
                }
            },{
                title: "",
                url: "hiker://empty",
                col_type: 'text_center_1',
                extra: {
                    cls: "Juloadlist",
                    lineVisible: false
                }
            }]);
            updateItem(updateItemid, { title: '‘‘’’<font color=#bfbfbf>当前分组无接口</font>' });
            toast("无接口");
        }
    }
}

//取本地足迹记录
function getMark(url, sid) {
    let marklist = [];
    let markfile = rulepath + "mark.json";
    let markdata = fetch(markfile);
    if (markdata != "") {
        try{
            eval("marklist=" + markdata + ";");
        }catch(e){
            toast('加载mark.json异常，详见日志');
            xlog(rulepath + "mark.json" + "文件无法加载>" + e.message);
        }
    }
    let mark = marklist.filter(it => {
        return it.url==url && it.sid==sid;
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
        return it.url==data.url && it.sid==data.sid;
    })
    if (mark.length > 0) {
        let index = marklist.indexOf(mark[0]);
        marklist.splice(index, 1)
    }
    marklist.push(data);
    if (marklist.length > 300) {
        marklist.splice(0, 1);
    }
    writeFile(markfile, $.stringify(marklist));
    return 1;
}
//新搜索页
function newSearchPage(keyword, searchtype) {
    addListener("onClose", $.toString(() => {
        clearMyVar('SrcJu_sousuoName');
        clearMyVar('SrcJu_sousuoType');
        clearVar('keyword');
    }));
    
    let name = getMyVar('SrcJu_sousuoName', keyword||'');
    let group = getMyVar('SrcJu_sousuoType', searchtype||homeGroup);
    setPageTitle("聚合搜索 | 聚阅");

    let keyword = name.split('  ')[0].trim();
    let keyword2;
    if(name.indexOf('  ')>-1){
        keyword2 = name.split('  ')[1].trim();
        group = keyword2;
    }

    let d = [];
    let descarr = ['可快速切换下面类型','1个空格显示搜索历史','+2空格+指定源名或分组','搜你想要的...'];
    if(MY_PAGE==1){
        if(getItem('不显示沉浸图')=='1'){
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
            require('http://123.56.105.145/weisyr/Top_H5.js');
            d.push(Top_H5(130));
        }
        let searchurl = $('#noLoading#').lazyRule(() => {
            putMyVar('SrcJu_sousuoName',input);
            putVar('keyword',input.split('  ')[0]);
            searchRecord('put', input);
            refreshPage(true);
            return 'hiker://empty';
        })
        d.push({
            title: getItem("搜索建议词","")=='1'?'搜索':'🔍',
            url: $.toString((searchurl) => {
                input = input.trim();
                if(input == ''){
                    return "hiker://empty"
                }
                return input + searchurl;
            },searchurl),
            desc: descarr[Math.floor(Math.random() * descarr.length)],
            col_type: "input",
            extra: {
                id: 'newSearchid',
                defaultValue: name,
                titleVisible: true,
                onChange: $.toString((searchurl) => {
                    if(input==""){
                        deleteItemByCls('searchrecord');
                    }else if(input==" "){
                        deleteItemByCls('searchrecord');
                        let d = [];
                        if(getItem("搜索建议词","")=='1'){
                            d.push({
                                col_type: "line",
                                extra: {
                                    cls: 'searchrecord'
                                }
                            })
                        }

                        function 背景色() {
                            function getSoftHexColor() {
                                // 随机色相（0-360），低饱和度（10-30%），高亮度（85-95%）
                                const h = Math.floor(Math.random() * 360);
                                const s = 10 + Math.floor(Math.random() * 20); // 10-30% 饱和度
                                const l = 85 + Math.floor(Math.random() * 10); // 85-95% 亮度

                                // 将HSL转换为十六进制
                                return hslToHex(h, s, l);
                            }
                            // HSL转十六进制辅助函数
                            function hslToHex(h, s, l) {
                                l /= 100;
                                const a = s * Math.min(l, 1 - l) / 100;
                                const f = n => {
                                    const k = (n + h / 30) % 12;
                                    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                                    return Math.round(255 * color).toString(16).padStart(2, '0');
                                };
                                return `#${f(0)}${f(8)}${f(4)}`;
                            }
                            return getSoftHexColor()
                        }
                        let recordlist = searchRecord('get');
                        recordlist.forEach(item=>{
                            let color = 背景色();
                            d.push({
                                title: item,
                                url: item + searchurl,
                                col_type: 'flex_button',
                                extra: {
                                    id: 'recordid_' + item,
                                    cls: 'searchrecord',
                                    backgroundColor: color,
                                    longClick: [{
                                        title: "删除词条",
                                        js: $.toString((item) => {
                                            deleteItem('recordid_' + item);
                                            searchRecord('del', item);
                                        }, item)
                                    },{
                                        title: "清空记录",
                                        js: $.toString(() => {
                                            searchRecord('del', '');
                                            deleteItemByCls('searchrecord');
                                        })
                                    }]
                                }
                            });
                        })
                        if(recordlist.length>0){
                            d.push({
                                col_type: "line_blank",
                                extra: {
                                    cls: 'searchrecord'
                                }
                            })
                            d.push({
                                col_type: "big_blank_block",
                                extra: {
                                    cls: 'searchrecord'
                                }
                            })
                        }
                        addItemAfter('newSearchid', d);
                    }
                }, searchurl)
            }
        });
        let searchTypes = getTypeNames("搜索页");
        let Color = getItem('主题颜色','#3399cc');
        searchTypes.forEach((it) =>{
            let obj = {
                title: group==it?`““””<b><span style="color: `+Color+`">`+it+`</span></b>`:it,
                url: $('#noLoading#').lazyRule((it) => {
                    putMyVar("SrcJu_sousuoType",it);
                    refreshPage(false);
                    return "hiker://empty";
                },it),
                col_type: 'text_5',
                extra: {
                    backgroundColor: group==it?"#20" + Color.replace('#',''):""
                }
            }
            d.push(obj);
        })
    }
    d.push({
        title: "",
        col_type: 'text_center_1',
        url: "hiker://empty",
        extra: {
            id: group+"_newSearch_loading",
            lineVisible: false
        }
    });
    setResult(d);
    
    if(keyword){
        deleteItemByCls('searchrecord');

        let ssdatas = [];
        try{
            if(keyword2){//搜索有+2空格传指定
                let lists = getSearchLists(keyword2);
                if(lists.length>0){//搜指定分组
                    ssdatas = lists;
                }else{//搜指定源名
                    ssdatas = getSearchLists().filter(it=>{
                        return it.name.includes(keyword2);
                    });
                }
            }
        }catch(e){
            //xlog(e.message);
        }
        erjisousuo(keyword,group,ssdatas.length==0?false:ssdatas,"newSearch");
    }
}
//版本检测
function Version() {
    var nowVersion = getItem('Version', "0");//现在版本 
    var nowtime = Date.now();
    var oldtime = parseInt(getItem('VersionChecktime', '0').replace('time', ''));
    if (getMyVar('SrcJu_CodeVersionCheck', '0') == '0' && nowtime > (oldtime + 12 * 60 * 60 * 1000)) {
        try {
            eval(request(config.聚阅.replace(/[^/]*$/,'') + 'SrcTmplVersion.js'))
            if (parseFloat(newVersion.SrcJu) > parseFloat(nowVersion)) {
                confirm({
                    title: '发现新版本，是否更新？',
                    content: nowVersion + '=>' + newVersion.SrcJu + '\n' + newVersion.hint,
                    confirm: $.toString((nowtime,newVersion,updateRecords) => {
                        downloadPlugins(true);//插件本地化文件更新
                        setItem('Version', newVersion);
                        setItem('VersionChecktime', nowtime + 'time');
                        deleteCache();
                        refreshPage();

                        const hikerPop = $.require(libspath + 'plugins/hikerPop.js');
                        hikerPop.updateRecordsBottom(updateRecords);
                        
                        return "hiker://empty";
                    }, nowtime, newVersion.SrcJu, (newVersion.JYUpdateRecords || []).slice(0, 3)),
                    cancel: ''
                })
                xlog('检测到新版本！\nV' + newVersion.SrcJu + '版本》' + newVersion.hint);
            }
            putMyVar('SrcJu_Version', '-V' + newVersion.SrcJu);
        } catch (e) { }
        putMyVar('SrcJu_CodeVersionCheck', '1');
    } else {
        putMyVar('SrcJu_Version', '-V' + nowVersion);
    }
}