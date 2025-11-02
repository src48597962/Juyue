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
        clearMyVar('主页显示内容');
    }));

    let d = [];
    d.push({
        title: getMyVar('主页显示内容', '1')=="1"?`‘‘’’<b><span style="color: `+Color+`">解析列表</span></b>`:'解析列表',
        url: $('#noLoading#').lazyRule(() => {
            putMyVar('主页显示内容', '1');
            refreshPage();
            return "hiker://emtpy";
        }),
        img: 'http://123.56.105.145/tubiao/system/42.png',
        col_type: "icon_2"
    });
    d.push({
        title: getMyVar('主页显示内容', '1')=="2"?`‘‘’’<b><span style="color: `+Color+`">解析设置</span></b>`:'解析设置',
        url: $('#noLoading#').lazyRule(() => {
            putMyVar('主页显示内容', '2');
            refreshPage();
            return "hiker://emtpy";
        }),
        img: 'http://123.56.105.145/tubiao/system/43.png',
        col_type: "icon_2"
    });
    
    if(getMyVar('主页显示内容', '1')=='1'){
        jxItemPage(d);
    }else{
        jxSetPage(d);
    }
}
// 接口管理页
function jxItemPage(dd) {
    setPageTitle('解析列表');
    let d = dd || [];
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
            writeFile("hiker://files/_cache/Jujiexi/cloudimport.txt", input);
            return "hiker://page/importConfirm#immersiveTheme##noRecordHistory##noHistory#?rule=聚阅"
        }),
        img: 'http://123.56.105.145/tubiao/more/43.png',
        col_type: "icon_small_4",
        extra: {
            longClick: [{
                title: '外部导入',
                js: $.toString(() => {
                    return $(['聚影','断插'], 2).select(() => {
                        let addarr = [];
                        if(input=='聚影'){
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
                        }else if(input=='断插'){
                            let jxfile = 'hiker://files/rules/DuanNian/MyParse.json';
                            let jxstr = fetch(jxfile);
                            if(jxstr){
                                eval("let jxlist = " + jxstr);
                                addarr = jxlist.title.map(it=>{
                                    let itstr = jxlist.codes[it].toString();
                                    return {
                                        name: it,
                                        url: itstr,
                                        type: itstr.includes('function')?'2':/key=|json/.test(itstr)?'1':'0'
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
                            refreshPage(true);
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
        url: jxdatalist.length == 0 ? "hiker://empty" : $(pastes,2).select(()=>{
            require(config.jxCodePath + 'SrcPublic.js');
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
                addItemBefore('jxItemLoading', jxItemList(jxdatalist));
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
                    require(config.jxCodePath + 'SrcPublic.js');
                    let jxdatalist = storage0.getMyVar("jxdatalist");
                    addItemBefore('jxItemLoading', jxItemList(jxdatalist));
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


// 解析设置
function jxSetPage(dd) {
    addListener("onClose", $.toString(() => {
        clearMyVar('jxSetCfg');
    }));

    setPageTitle("解析设置");

    let jxSetCfg = storage0.getMyVar('jxSetCfg') || {};
    if(!getMyVar('jxSetCfg')){
        let parseRecord = {};
        if(fetch(jxrecordfile)){
            try{
                eval("parseRecord =" + fetch(jxrecordfile) + ";");
            }catch(e){}
        }
        jxSetCfg['parseRecord'] = parseRecord;
        jxSetCfg['playSet'] = Juconfig['playSet'] || {};
        storage0.putMyVar('jxSetCfg', jxSetCfg);
    }
    let playSet = jxSetCfg['playSet'] || {};

    let d = dd || [];
    let 箭头图标 = getJxIcon('箭头.svg');
    d.push({
        col_type: "line_blank"
    });
    d.push({
        title: '功能开关',
        pic_url: getJxIcon('功能开关.svg'),
        col_type: "avatar",
        url: "hiker://empty"
    });
    d.push({
        title: '解析日志打印',
        url: $('#noLoading#').lazyRule(() => {
            let jxSetCfg = storage0.getMyVar('jxSetCfg') || {};
            let playSet = jxSetCfg['playSet'] || {};
            playSet['printlog'] = playSet['printlog']!=1?1:0;
            jxSetCfg['playSet'] = playSet;
            storage0.putMyVar('jxSetCfg', jxSetCfg);
            refreshPage(false);
            return 'toast://切换成功';
        }),
        pic_url: playSet['printlog']?getJxIcon("开.svg"):getJxIcon("关.svg"),
        col_type: "text_icon"
    });
    d.push({
        title: 'm3u8索引文件缓存',
        url: $('#noLoading#').lazyRule(() => {
            let jxSetCfg = storage0.getMyVar('jxSetCfg') || {};
            let playSet = jxSetCfg['playSet'] || {};
            playSet['cachem3u8'] = playSet['cachem3u8']!=1?1:0;
            jxSetCfg['playSet'] = playSet;
            storage0.putMyVar('jxSetCfg', jxSetCfg);
            refreshPage(false);
            return 'toast://切换成功';
        }),
        pic_url: playSet['cachem3u8']?getJxIcon("开.svg"):getJxIcon("关.svg"),
        col_type: "text_icon"
    });
    d.push({
        title: '解析结果有效性检测',
        desc: "除video方式外，其他解析结果是否开启检测",
        url: $('#noLoading#').lazyRule(() => {
            let jxSetCfg = storage0.getMyVar('jxSetCfg') || {};
            let playSet = jxSetCfg['playSet'] || {};
            playSet['testvideo'] = playSet['testvideo']!=1?1:0;
            jxSetCfg['playSet'] = playSet;
            storage0.putMyVar('jxSetCfg', jxSetCfg);
            refreshPage(false);
            return 'toast://切换成功';
        }),
        pic_url: playSet['testvideo']?getJxIcon("开.svg"):getJxIcon("关.svg"),
        col_type: "text_icon"
    });
    d.push({
        title: '调用dm盒子弹幕',
        url: $('#noLoading#').lazyRule(() => {
            let jxSetCfg = storage0.getMyVar('jxSetCfg') || {};
            let playSet = jxSetCfg['playSet'] || {};
            let sm;
            if (playSet['danmu']) {
                playSet['danmu'] = 0;
                sm = '关闭dm盒子弹幕';
            } else {
                playSet['danmu'] = 1;
                sm = '仅针对官网地址有效，需要dm盒子小程序';
            }
            jxSetCfg['playSet'] = playSet;
            storage0.putMyVar('jxSetCfg', jxSetCfg);
            refreshPage(false);
            return 'toast://' + sm;
        }),
        pic_url: playSet['danmu']?getJxIcon("开.svg"):getJxIcon("关.svg"),
        col_type: "text_icon"
    });
    d.push({
        col_type: "line_blank"
    });
    d.push({
        title: '解析设置',
        pic_url: getJxIcon("解析设置.svg"),
        col_type: "avatar",
        url: "hiker://empty"
    });
    let parsemode = playSet["parsemode"] || 1;
    d.push({
        title: '智能解析',
        url: $('#noLoading#').lazyRule(() => {
            let jxSetCfg = storage0.getMyVar('jxSetCfg') || {};
            let playSet = jxSetCfg['playSet'] || {};
            playSet['parsemode'] = 1;
            jxSetCfg['playSet'] = playSet;
            storage0.putMyVar('jxSetCfg', jxSetCfg);
            refreshPage(false);
            return 'toast://智能解析 | 上次优先>接口自带+私有解析';
        }),
        pic_url: parsemode==1?getJxIcon("开.svg"):getJxIcon("关.svg"),
        col_type: "text_icon"
    });
    d.push({
        title: '强制嗅探',
        url: $('#noLoading#').lazyRule(() => {
            let jxSetCfg = storage0.getMyVar('jxSetCfg') || {};
            let playSet = jxSetCfg['playSet'] || {};
            playSet['parsemode'] = 2;
            jxSetCfg['playSet'] = playSet;
            storage0.putMyVar('jxSetCfg', jxSetCfg);
            refreshPage(false);
            return 'toast://强制嗅探 | 将web解析组线路进video播放器';
        }),
        pic_url: parsemode==2?getJxIcon("开.svg"):getJxIcon("关.svg"),
        col_type: "text_icon"
    });
    d.push({
        title: '手动切换',
        url: $('#noLoading#').lazyRule(() => {
            let jxSetCfg = storage0.getMyVar('jxSetCfg') || {};
            let playSet = jxSetCfg['playSet'] || {};
            playSet['parsemode'] = 3;
            jxSetCfg['playSet'] = playSet;
            storage0.putMyVar('jxSetCfg', jxSetCfg);
            refreshPage(false);
            return 'toast://手动切换 | 代理播放，在播放页手动选择解析';
        }),
        pic_url: parsemode==3?getJxIcon("开.svg"):getJxIcon("关.svg"),
        col_type: "text_icon"
    });
    d.push({
        col_type: "line"
    });
    d.push({
        title: '嗅探方式：'+(playSet['videoplay']==1?"video":"WebRule"),
        url: $('#noLoading#').lazyRule(() => {
            let jxSetCfg = storage0.getMyVar('jxSetCfg') || {};
            let playSet = jxSetCfg['playSet'] || {};
            playSet['videoplay'] = playSet['videoplay']!=1?1:0;
            jxSetCfg['playSet'] = playSet;
            storage0.putMyVar('jxSetCfg', jxSetCfg);
            refreshPage(false);
            return 'toast://已切换';
        }),
        pic_url: 箭头图标,
        col_type: "text_icon"
    });
    if(parsemode==1){
        d.push({
            title: '线路指定优先',
            url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
                addListener("onClose", $.toString(() => {
                    
                }));

                require(config.jxCodePath + 'SrcPublic.js');
                let flagParse = Juconfig['flagParse'] || {};
                let flags = {
                    "qq": "https://v.qq.com/favicon.ico",
                    "youku": "https://www.youku.com/favicon.ico",
                    "iqiyi": "https://www.iqiyi.com/favicon.ico",
                    "mgtv": "https://www.mgtv.com/favicon.ico",
                    "bilibili": "https://www.bilibili.com/favicon.ico",
                    "migu": "https://www.miguvideo.com/favicon.ico",
                    "souhu": "https://tv.sohu.com/favicon.ico"
                }
                let names = getDataNames();
                names.unshift('清除');

                let d = [];

                Object.keys(flags).forEach(key=>{
                    d.push({
                        title: key,
                        desc: flagParse[key] || '未指定',
                        url: $(names, 3, '选择<'+key+'>优先解析').select((key) => {
                            require(config.jxCodePath + 'SrcPublic.js');
                            let flagParse = Juconfig['flagParse'] || {};
                            if(input=='清除'){
                                delete flagParse[key];
                            }else{
                                flagParse[key] = input;
                            }
                            Juconfig['flagParse'] = flagParse;
                            writeFile(jxcfgfile, JSON.stringify(Juconfig));
                            refreshPage(false);
                            return 'toast://已设置';
                        },key),
                        pic_url: flags[key],
                        col_type: "avatar"
                    })
                })
                setResult(d);
            }),
            pic_url: 箭头图标,
            col_type: "text_icon"
        });
        d.push({
            title: '多线路数：'+(playSet['mulnum']||"1"),
            url: $(playSet['mulnum']||"1", "当多线路数大于1时可能会拖慢解析速度").input(() => {
                let jxSetCfg = storage0.getMyVar('jxSetCfg') || {};
                let playSet = jxSetCfg['playSet'] || {};
                let num = parseInt(input) || 1;
                playSet['mulnum'] = num;
                jxSetCfg['playSet'] = playSet;
                storage0.putMyVar('jxSetCfg', jxSetCfg);
                refreshPage(false);
                return 'toast://当优先上次解析失败后，实际多线路数：1~' + (num +2);
            }),
            pic_url: 箭头图标,
            col_type: "text_icon"
        });
        d.push({
            title: '无效播放地址',
            url: $("", "输入无法播放的地址进行屏蔽").input(() => {
                let jxSetCfg = storage0.getMyVar('jxSetCfg') || {};
                let parseRecord = jxSetCfg['parseRecord'] || {};
                parseRecord['excludeurl'] = parseRecord['excludeurl'] || [];
                let url = input.split(';{')[0].replace(/file.*video\.m3u8##/, '').replace('#isVideo=true#', '');
                if (parseRecord['excludeurl'].indexOf(url) == -1) {
                    parseRecord['excludeurl'].push(url);
                }
                jxSetCfg['parseRecord'] = parseRecord;
                storage0.putMyVar('jxSetCfg', jxSetCfg);
                refreshPage(false);
                return 'toast://对此播放地址将拦截';
            }),
            pic_url: 箭头图标,
            col_type: "text_icon",
            extra: {
                longClick: [{
                    title: '清空播放拦截记录',
                    js: $.toString(() => {
                        let jxSetCfg = storage0.getMyVar('jxSetCfg') || {};
                        let parseRecord = jxSetCfg['parseRecord'] || {};
                        delete parseRecord['excludeurl'];
                        jxSetCfg['parseRecord'] = parseRecord;
                        storage0.putMyVar('jxSetCfg', jxSetCfg);
                        refreshPage(false);
                        return 'toast://无清空';
                    })
                }]
            }
        });
    }
    

    
    /*
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
        pic_url: playSet['clearM3u8Ad']?getJxIcon("开.svg"):getJxIcon("关.svg"),
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
    */
    d.push({
        title: '<br>',
        col_type: 'rich_text'
    });
    setResult(d);
    Juconfig['playSet'] = playSet;
    writeFile(jxcfgfile, JSON.stringify(Juconfig));
    writeFile(jxrecordfile, JSON.stringify(jxSetCfg['parseRecord']))
}