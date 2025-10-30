//本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
require(config.jxCodePath + 'SrcPublic.js');

// 主页
function homePage() {
    addListener("onClose", $.toString(() => {
        clearMyVar('duodatalist');
        clearMyVar("seacrhJiexi");
        clearMyVar('jxdatalist');
        clearMyVar('seacrhDataList');
        clearMyVar('批量选择模式');
        clearMyVar('onlyStopJk');
    }));

    let dd = [];
    dd.push({
        title: '解析列表',
        url: $('#noLoading#').lazyRule(() => {
            putMyVar('主页显示内容', '1');
        }),
        img: 'http://123.56.105.145/tubiao/system/42.png',
        col_type: "icon_2"
    });
    dd.push({
        title: '解析设置',
        url: $('#noLoading#').lazyRule(() => {
            putMyVar('主页显示内容', '2');
        }),
        img: 'http://123.56.105.145/tubiao/system/43.png',
        col_type: "icon_2"
    });
    setPreResult(dd);
    
    if(getMyVar('主页显示内容', '1')=='1'){
        jxItemPage();
    }else{
        setResult([]);
    }
}
// 接口管理页
function jxItemPage() {
    setPageTitle('解析管理');
    let d = [];
    d.push({
        title: '增加',
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            setPageTitle('增加 | 解析接口');
            require(config.jxCodePath + 'SrcPublic.js');
            jiexiapi();
        }),
        img: 'http://123.56.105.145/tubiao/more/25.png',
        col_type: "icon_small_4"
    });
    d.push({
        title: '操作',
        url: $([getMyVar('批量选择模式')?"退出批量":"批量选择",getMyVar('onlyStopJk')?"退出禁用":"查看禁用","清空所有"], 2).select(() => {
            require(config.jxCodePath + 'SrcJiexi.js');
            if(input=="批量选择" || input=="退出批量"){
                let sm;
                if(getMyVar('批量选择模式')){
                    clearMyVar('批量选择模式');
                    clearMyVar('duodatalist');
                    sm = "退出批量选择模式";
                }else{
                    putMyVar('批量选择模式','1');
                    sm = "进入批量选择模式";
                }
                refreshPage(false);
                return "toast://"+sm;
            }else if(input=="清空所有"){
                return $("确定要删除本地所有的源接口吗？").confirm(()=>{
                    require(config.jxCodePath + 'SrcJiexi.js');
                    deleteData();
                    refreshPage(false);
                    return 'toast://已全部清空';
                })
            }else if(input=="查看禁用"||input=="退出禁用"){
                let sm;
                if(getMyVar('onlyStopJk')){
                    clearMyVar('onlyStopJk');
                    sm = "退出仅显示禁用列表";
                }else{
                    putMyVar('onlyStopJk','1');
                    sm = "进入仅显示禁用列表";
                }
                refreshPage(false);
                return "toast://"+sm;
            }
        }),
        img: 'http://123.56.105.145/tubiao/more/290.png',
        col_type: "icon_small_4"
    });
    d.push({
        title: '导入',
        url: $("","聚解口令").input(()=>{
            if(input==""){
                return 'toast://不能为空';
            }
            writeFile("hiker://files/_cache/Juyue/cloudimport.txt", input);
            return "hiker://page/importConfirm#immersiveTheme##noRecordHistory##noHistory#?rule=聚解"
        }),
        img: 'http://123.56.105.145/tubiao/more/43.png',
        col_type: "icon_small_4",
        extra: {
            longClick: [{
                title: '外部导入',
                js: $.toString(() => {
                    return $(['聚影解析'], 2).select(() => {
                        let addarr = [];
                        if(input=='聚影解析'){
                            let jxfile = 'hiker://files/rules/Src/Juying2/jiexi.json';
                            let jxstr = fetch(jxfile);
                            if(jxstr){
                                addarr = JSON.parse(jxstr).map(it=>{
                                    return {
                                        name: it.name,
                                        url: it.url,
                                        type: it.url.includes('function')?'2':it.type+'',
                                        ext: it.ext
                                    }
                                })
                            }
                        }
                        let newadd = [];
                        if(addarr.length>0){
                            let jxlist = [];
                            let jxfile = 'hiker://files/rules/Src/Jiexi/jiexi.json';
                            try{
                                eval('jxlist = ' + fetch(jxfile));
                            }catch(e){}
                            newadd = addarr.filter(v=>!jxlist.some(it => v.name==it.name || v.url==it.url));
                            jxlist = jxlist.concat(newadd);
                            writeFile(jxfile, JSON.stringify(jxlist));
                        }
                        return 'toast://新增解析：' + newadd.length;
                    })
                })
            }]
        }
    });
    
    let jxdatalist = getDatas();
    if(getMyVar('onlyStopJk')){
        jxdatalist = jxdatalist.filter(item => item.stop);
    }
    let yxdatalist = jxdatalist.filter(it=>{
        return !it.stop;
    });
    storage0.putMyVar("jxdatalist", jxdatalist);

    let pastes = getPastes();
    d.push({
        title: '分享',
        url: yxdatalist.length == 0 ? "toast://有效接口为0，无法分享" : $(pastes,2).select(()=>{
            require(config.jxCodePath + 'SrcJuSet.js');
            return JYshare(input);
        }),
        img: 'http://123.56.105.145/tubiao/more/3.png',
        col_type: "icon_small_4",
        extra: {
            longClick: [{
                title: '单接口分享剪贴板：' + getItem("sharePaste","自动选择"),
                js: $.toString(() => {
                    let pastes = getPastes();
                    pastes.unshift('自动选择');
                    return $(pastes,2,'指定单接口分享时用哪个剪贴板').select(() => {
                        if(input=="自动选择"){
                            clearItem("sharePaste");
                        }else{
                            setItem("sharePaste", input);
                        }
                        refreshPage(false);
                        return 'toast://单接口分享剪贴板已设置为：' + input;
                    })
                })
            }]
        }
    });
    d.push({
        col_type: "line"
    });
    d.push({
        title: "🔍",
        url: $.toString(() => {
            if(input != ''){
                deleteItemByCls('jxItemLoadList');
                putMyVar("seacrhJiexi", input);
                require(config.jxCodePath + 'SrcPublic.js');
                let jxdatalist = storage0.getMyVar("jxdatalist");
                jxdatalist = outputSearchList(jxdatalist, input);
                addItemBefore('jkItemLoading', jxItemList(jxdatalist));
            }
            return 'hiker://empty';
        }),
        desc: "搜你想要的...",
        col_type: "input",
        extra: {
            defaultValue: getMyVar('seacrhJiexi',''),
            titleVisible: true,
            onChange: $.toString(() => {
                if(input=="" && getMyVar("seacrhJiexi")){
                    deleteItemByCls('jxItemLoadList');
                    clearMyVar('seacrhJiexi');
                    clearMyVar('seacrhDataList');
                    require(config.jxCodePath + 'SrcJiexi.js');
                    let jxdatalist = storage0.getMyVar("jxdatalist");
                    addItemBefore('jkItemLoading', jxItemList(jxdatalist));
                }
            })
        }
    });
    d = d.concat(jxItemList(jxdatalist));
    d.push({
        title: "‘‘’’<small><font color=#f20c00>当前解析数：" + jxdatalist.length + "，总有效数：" + yxdatalist.length + "</font></small>",
        url: 'hiker://empty',
        col_type: 'text_center_1',
        extra: {
            id: 'jxItemLoading',
            lineVisible: false
        }
    });
    setResult(d);
}


// 管理设置
function manageSet() {
    addListener("onClose", $.toString(() => {
        clearMyVar('playSet');
    }));

    setPageTitle("解析管理设置");
    let recordfile = rulepath + "record.json";//解析相关记录文件
    let parseRecord = {};
    if(fetch(recordfile)){
        try{
            eval("parseRecord =" + fetch(recordfile) + ";");
        }catch(e){}
    }

    let playSet = storage0.getMyVar('playSet') || Juconfig['playSet'] || {};

    let d = [];
    let 箭头图标 = getIcon("点播-箭头.svg");
    d.push({
        col_type: "line_blank"
    });
    d.push({
        title: '功能管理',
        pic_url: getIcon("点播-功能开关.svg"),
        col_type: "avatar",
        url: "hiker://empty"
    });
    d.push({
        title: '本地解析管理',
        url: $('#noLoading#').lazyRule(() => {
            putMyVar('guanli','jx');
            return $("hiker://empty#noRecordHistory##noHistory#").rule(() => {
                setPageTitle('解析管理');
                require(config.聚影.replace(/[^/]*$/,'') + 'SrcJySet.js');
                SRCSet();
            })
        }),
        pic_url: 箭头图标,
        col_type: "text_icon"
    });
    d.push({
        title: '解析日志打印',
        url: $('#noLoading#').lazyRule((playSet) => {
            if (playSet['printlog'] != 1) {
                playSet['printlog'] = 1;
            } else {
                playSet['printlog'] = 0;
            }
            storage0.putMyVar('playSet', playSet);
            refreshPage(false);
            return 'toast://切换成功';
        }, playSet),
        pic_url: playSet['printlog']?getIcon("点播-开.svg"):getIcon("关.svg"),
        col_type: "text_icon"
    });
    d.push({
        col_type: "line_blank"
    });
    d.push({
        title: '解析设置',
        pic_url: getIcon("点播-解析设置.svg"),
        col_type: "avatar",
        url: "hiker://empty"
    });
    let parsemode = playSet["parsemode"] || 1;
    d.push({
        title: '聚影智能',
        url: $('#noLoading#').lazyRule((playSet) => {
            playSet['parsemode'] = 1;
            storage0.putMyVar('playSet', playSet);
            refreshPage(false);
            return 'toast://聚影智能 | 上次优先>接口自带+私有解析';
        }, playSet),
        pic_url: parsemode==1?getIcon("点播-开.svg"):getIcon("关.svg"),
        col_type: "text_icon"
    });
    d.push({
        title: '强制嗅探',
        url: $('#noLoading#').lazyRule((playSet) => {
            playSet['parsemode'] = 2;
            storage0.putMyVar('playSet', playSet);
            refreshPage(false);
            return 'toast://强制嗅探 | 将web解析组线路进video播放器';
        }, playSet),
        pic_url: parsemode==2?getIcon("点播-开.svg"):getIcon("关.svg"),
        col_type: "text_icon"
    });
    d.push({
        title: '手动切换',
        url: $('#noLoading#').lazyRule((playSet) => {
            playSet['parsemode'] = 3;
            storage0.putMyVar('playSet', playSet);
            refreshPage(false);
            return 'toast://手动切换 | 代理播放，在播放页手动选择解析';
        }, playSet),
        pic_url: parsemode==3?getIcon("点播-开.svg"):getIcon("关.svg"),
        col_type: "text_icon"
    });
    d.push({
        col_type: "line"
    });
    d.push({
        title: '嗅探内核：'+(playSet['xiutannh']||"web"),
        url: $('#noLoading#').lazyRule((playSet) => {
            let sm;
            if(playSet['xiutannh'] == 'x5'){
                playSet['xiutannh'] = 'web';
                sm = 'web';
            }else{
                playSet['xiutannh'] = 'x5';
                sm = 'x5';
            }
            storage0.putMyVar('playSet', playSet);
            refreshPage(false);
            return 'toast://嗅探内核切换为：'+sm;
        }, playSet),
        pic_url: 箭头图标,
        col_type: "text_icon"
    });
    d.push({
        title: '嗅探方式：'+(playSet['video']!=0?"video":"WebRule"),
        url: $('#noLoading#').lazyRule((playSet) => {
            if (playSet['video'] != 0) {
                playSet['video'] = 0;
            } else {
                playSet['video'] = 1;
            }
            storage0.putMyVar('playSet', playSet);
            refreshPage(false);
            return 'toast://已切换';
        }, playSet),
        pic_url: 箭头图标,
        col_type: "text_icon"
    });
    d.push({
        col_type: "line"
    });
    d.push({
        title: '无效播放地址',
        url: $("", "输入无法播放的地址进行屏蔽").input((parseRecord, recordfile) => {
            parseRecord['excludeurl'] = parseRecord['excludeurl'] || [];
            let url = input.split(';{')[0].replace(/file.*video\.m3u8##/, '').replace('#isVideo=true#', '');
            if (parseRecord['excludeurl'].indexOf(url) == -1) {
                parseRecord['excludeurl'].push(url);
            }
            writeFile(recordfile, JSON.stringify(parseRecord));
            return 'toast://对此播放地址将拦截';
        }, parseRecord, recordfile),
        pic_url: 箭头图标,
        col_type: "text_icon"
    });
    d.push({
        title: '清空播放拦截记录',
        url: $("清空拦截无法播放地址记录？").confirm((parseRecord, recordfile) => {
            delete parseRecord['excludeurl'];
            writeFile(recordfile, JSON.stringify(parseRecord));
            return 'toast://无清空';
        }, parseRecord, recordfile),
        pic_url: 箭头图标,
        col_type: "text_icon"
    });
    d.push({
        col_type: "line"
    });
    d.push({
        title: 'm3u8索引文件缓存',
        url: $('#noLoading#').lazyRule((playSet) => {
            if (playSet['cachem3u8'] != 1) {
                playSet['cachem3u8'] = 1;
            } else {
                playSet['cachem3u8'] = 0;
            }
            storage0.putMyVar('playSet', playSet);
            refreshPage(false);
            return 'toast://切换成功';
        }, playSet),
        pic_url: playSet['cachem3u8']?getIcon("点播-开.svg"):getIcon("关.svg"),
        col_type: "text_icon"
    });
    d.push({
        title: '解析结果有效性检测',
        desc: "除video方式外，其他解析结果是否开启检测",
        url: $('#noLoading#').lazyRule((playSet) => {
            if (playSet['isTest']) {
                playSet['isTest'] = 0;
            } else {
                playSet['isTest'] = 1;
            }
            storage0.putMyVar('playSet', playSet);
            refreshPage(false);
            return 'toast://切换成功';
        }, playSet),
        pic_url: playSet['isTest']?getIcon("点播-开.svg"):getIcon("关.svg"),
        col_type: "text_icon"
    });
    d.push({
        title: '调用dm盒子弹幕',
        url: $('#noLoading#').lazyRule((playSet) => {
            let sm;
            if (playSet['dmRoute']) {
                playSet['dmRoute'] = 0;
                sm = '关闭dm盒子弹幕';
            } else {
                playSet['dmRoute'] = 1;
                sm = '仅针对官网地址有效，需要dm盒子小程序';
            }
            storage0.putMyVar('playSet', playSet);
            refreshPage(false);
            return 'toast://' + sm;
        }, playSet),
        pic_url: playSet['dmRoute']?getIcon("点播-开.svg"):getIcon("关.svg"),
        col_type: "text_icon"
    });
    d.push({
        col_type: "line"
    });
    d.push({
        title: 'M3U8广告清除规则',
        url: $('#noLoading#').lazyRule((playSet) => {
            if (playSet['clearM3u8Ad']) {
                delete playSet['clearM3u8Ad'];
                storage0.putMyVar('playSet', playSet);
                refreshPage(false);
                return 'toast://关闭订阅M3U8广告清除规则';
            } else {
                return $("确认要从聚影订阅M3U8广告清除规则来覆盖软件的？").confirm((playSet)=>{
                    playSet['clearM3u8Ad'] = 1;
                    storage0.putMyVar('playSet', playSet);
                    let m3u8Ad_file = config.聚影.replace(/[^/]*$/,'') + "plugins/m3u8_ad_rule.json";
                    let m3u8Ad = fetch(m3u8Ad_file);
                    if(m3u8Ad){
                        writeFile("hiker://files/rules/m3u8_ad_rule.json", m3u8Ad);
                        refreshPage(false);
                        return "toast://开启订阅并已替换软件播放器的M3U8广告清除规则，重启软件生效";
                    }else{
                        refreshPage(false);
                        return "toast://开启订阅";
                    }
                },playSet)
            }
        }, playSet),
        pic_url: playSet['clearM3u8Ad']?getIcon("点播-开.svg"):getIcon("关.svg"),
        col_type: "text_icon",
        extra: {
            longClick: [{
                title: "清除播放器规则",
                js: $.toString(() => {
                    writeFile("hiker://files/rules/m3u8_ad_rule.json", "");
                    return "toast://已清除软件播放器的M3U8广告清除规则，重启软件生效";
                })
            }]
        }
    });
    d.push({
        title: '<br>',
        col_type: 'rich_text'
    });
    setResult(d);
    Juconfig['playSet'] = playSet;
    writeFile(cfgfile, JSON.stringify(Juconfig));
}