// 解析设置
function jxSetPage(dd) {
    addListener("onClose", $.toString(() => {
        clearMyVar('jxSetCfg');
    }));

    setPageTitle("本地解析管理-设置");

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