//本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
let livepath = "hiker://files/rules/Src/Juying2/";
let livecfgfile = livepath + "liveconfig.json";
let JYlivefile = livepath + "live.json";
let color = getItem("主题颜色", "#19b89d");

// 读取config文件
function getLiveConfig() {
    let liveconfig = {};
    let livecfg = fetch(livecfgfile);
    if (livecfg != "") {
        eval("liveconfig = " + livecfg);
    }
    return liveconfig;
}
// 获取直播数据源
function getSourceData() {
    let liveconfig = getLiveConfig();
    let sourcedata = liveconfig['data'] || [];
    return sourcedata.filter(item => {
        return item.show != 0;
    })
}
// 主页入口
function Live() {
    addListener("onClose", $.toString(() => {
        clearMyVar('JYlivenum');
    }));

    var d = [];
    d.push({
        title: '⚙管理中心⚙',
        img: getLiveIcon('聚影.svg'),
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            require(config.SrcLiveRely);
            LiveSet();
        }),
        col_type: 'avatar'
    });
    
    let currentSource = storage0.getMyVar('currentSource') || {name: '收藏', url: 'juying'};
    let livedata = getSourceData();

    d.push({
        col_type: 'line'
    })
    for (let i = 0; i < 10; i++) {
        d.push({
            col_type: "blank_block"
        })
    }
    d.push({
        title: currentSource.url == "juying" ? `‘‘’’<b><span style="color:`+color+`">` + '收藏' : '收藏',
        url: $("#noLoading#").lazyRule(() => {
            clearMyVar('currentSource');
            refreshPage(false);
            return "toast://聚影直播收藏频道";
        }),
        col_type: 'scroll_button',
        extra: {
            backgroundColor: currentSource.url=="juying"?"#20" + color.replace('#',''):""
        }
    })
    for (let i = 0; i < livedata.length; i++) {
        let dyname = livedata[i].name;
        let dyurl = livedata[i].url;
        d.push({
            title: currentSource.url == dyurl ? `‘‘’’<b><span style="color:`+color+`">` + dyname : dyname,
            url: $("#noLoading#").lazyRule((source) => {
                storage0.putMyVar('currentSource', source);
                clearMyVar('selectgroup');
                refreshPage(false);
                return "toast://已切换远程订阅：" + source.name;
            }, livedata[i]),
            col_type: 'scroll_button',
            extra: {
                backgroundColor: currentSource.url==dyurl?"#20" + color.replace('#',''):""
            }
        })
    }
    d.push({
        col_type: 'line'
    })
    d.push({
        title: "🔍",
        url: $.toString((currentSource) => {
            require(config.SrcLiveRely);
            let groupname = getMyVar('selectgroup', getMyVar('firstgroup'));
            let datalist = getLiveList(currentSource, groupname);
            let loadingList = getLiveName(datalist);
            if(input !=''){
                loadingList = loadingList.filter(item => {
                    return item.title.toLowerCase().includes(input.toLowerCase());
                }); 
            }
            deleteItemByCls('livelist');
            addItemBefore('liveloading', loadingList);
            return "hiker://empty";
        }, currentSource),
        desc: "搜你想要的...",
        col_type: "input",
        extra: {
            titleVisible: true
        }
    });
    d.push({
        pic_url: config.SrcLiveRely.replace(/[^/]*$/,'') + "img/Loading.gif",
        col_type: "pic_1_center",
        url: "hiker://empty",
        extra: {
            cls: "loading_gif"
        }
    })
    setResult(d);

    // 构建分组和列表
    let datalist = getLiveList(currentSource); 
    if(datalist.length==0){
        deleteItemByCls('loading_gif');
        addItemBefore('liveloading', {
            title: '未获取到频道数据',
            col_type: 'rich_text'
        })
    }else{
        let loadingList = [];
        let datalist2 = [];
        let groupNames = getGroupName(datalist);
        let firstgroup = groupNames.length>0?groupNames[0]:'';
        groupNames.forEach((groupname)=>{
            loadingList.push({
                title: getMyVar('selectgroup', firstgroup)==groupname ? `‘‘’’<b><span style="color:`+color+`">` + groupname : groupname,
                url: $('#noLoading#').lazyRule((groupname) => {
                    if (getMyVar('selectgroup') != groupname) {
                        let lastgroup = getMyVar('selectgroup', getMyVar('firstgroup'));
                        putMyVar('selectgroup', groupname);

                        require(config.SrcLiveRely);
                        updateItem(lastgroup, { title: lastgroup });//取消上次分组颜色
                        updateItem(groupname, { title: `‘‘’’<b><span style="color:`+color+`">` + groupname });//更新当前分组颜色
                        
                        let currentSource = storage0.getMyVar('currentSource') || {name: '收藏', url: 'juying'};
                        let datalist = getLiveList(currentSource, groupname);
                        let loadingList = getLiveName(datalist); 
                        deleteItemByCls('livelist');
                        addItemBefore('liveloading', loadingList);
                    }
                    return "hiker://empty";
                }, groupname),
                col_type: "scroll_button",
                extra: {
                    id: groupname
                }
            });

            if(getMyVar('selectgroup', firstgroup) == groupname){
                let lists = datalist.filter(item => {
                    return item.group == groupname;
                })
                datalist2 = getLiveName(lists);
            }
        })

        loadingList = loadingList.concat(datalist2);
        deleteItemByCls('loading_gif');
        addItemBefore('liveloading', loadingList);
        putMyVar('firstgroup', firstgroup);
    }
}
// 获取所有频道明细清单
function getLiveList(source, selectgroup) {
    let datalist = [];
    if (source.url == "juying") {
        let liveStr = fetch(JYlivefile);
        if (liveStr != "") {
            datalist = JSON.parse(liveStr);
        }
    }else{
        let _livejson = "hiker://files/_cache/JYlive/" + md5(source.url) + ".json";
        if(fileExist(_livejson)){
            datalist = JSON.parse(fetch(_livejson));
        }else{
            showLoading('正在初始化获取中.');
            try {
                let YChtml = fetchCache(source.url, 48, { timeout: 3000 }).replace(/TV-/g, 'TV').replace(/\[.*\]/g, '');
                let shstr = YChtml.substr(0, YChtml.indexOf('\n'));
                if(shstr.includes(',http')){
                    //第一行直接就是播放地址的添加#genre#头
                    YChtml = "未分组,#genre#\n" + YChtml;
                }
                if (YChtml.indexOf('#genre#') > -1 || YChtml.indexOf('#EXTINF:-1') > -1) {
                    let JYlives = [];
                    if (YChtml.indexOf('#genre#') > -1) {
                        JYlives = YChtml.split('\n');
                    } else if (YChtml.indexOf('#EXTINF:-1') > -1) {
                        JYlives = YChtml.split('#EXTINF:-1');
                    }

                    let group = "";
                    for (let i = 0; i < JYlives.length; i++) {
                        try {
                            if (YChtml.indexOf('#genre#') > -1) {
                                if (JYlives[i].indexOf('#genre#') > -1) {
                                    group = JYlives[i].split(',')[0];
                                } else if (JYlives[i].indexOf(',') > -1 && JYlives[i].split(',')[1].startsWith('http')) {
                                    datalist.push({
                                        group: group,
                                        name: JYlives[i].split(',')[0].trim(),
                                        url: JYlives[i].split(',')[1].trim()
                                    });
                                }
                            } else if (JYlives[i].indexOf('group-title') > -1) {
                                if(JYlives[i].includes('\n') && JYlives[i].split('\n')[1].startsWith('http')){
                                    datalist.push({
                                        group: JYlives[i].match(/group-title="(.*?)"/)[1],
                                        name: JYlives[i].match(/",(.*?)\n/)[1].trim(),
                                        url: JYlives[i].split('\n')[1].trim()
                                    });
                                }
                            }
                        } catch (e) {
                            //log(e.message);
                        }
                    }
                    writeFile(_livejson, JSON.stringify(datalist));
                }
            } catch (e) {
                log(source.name +'>'+ e.message);
            }
            hideLoading();
        }
    }
    if(selectgroup){
        datalist = datalist.filter(item => {
            return item.group == selectgroup;
        })
    }
    return datalist;
}
// 获取不重复的分组名
function getGroupName(datalist) {
    datalist = datalist || [];
    let uniqueNames = datalist.reduce((obj, item) => {
        obj[item.group] = true;
        return obj;
    }, {});
    // 对象key转数组
    return Object.keys(uniqueNames);
}
// 获取不重复的频道名
function getLiveName(datalist) {
    datalist = datalist || [];
    let list = Object.values(
        datalist.reduce((map, item) => {
            if (!map[item.name]) map[item.name] = item;
            return map;
        }, {})
    );
    return list.map((it)=>{
        return {
            title: it.name,
            img: getLiveIcon('直播-tv.svg'),
            col_type: 'icon_2_round',
            url: $('#noLoading#').lazyRule((name) => {
                require(config.SrcLiveRely);
                return LivePlay(name);
            }, it.name),
            extra: {
                id: it.name,
                cls: 'livelist'
            }
        }
    })
}
// 播放输出
function LivePlay(name) {
    let currentSource = storage0.getMyVar('currentSource') || {name: '收藏', url: 'juying'};
    let datalist = getLiveList(currentSource);
    
    let urls = datalist.filter(v=>v.name==name).map(v=>v.url);
    if (urls.length == 0) {
        return "toast://无播放地址";
    } else if (urls.length == 1) {
        return urls[0];
    } else {
        return JSON.stringify({
            urls: urls
        });
    }
}
// 管理设置页
function LiveSet() {
    addListener("onClose", $.toString(() => {
        
    }));
    setPageTitle("⚙管理中心⚙");
    require(config.SrcLiveRely);

    let d = [];
    d.push({
        title: '👦哥就是帅，不接受反驳...',
        col_type: "rich_text"
    });
    d.push({
        col_type: "line_blank",
    });
    d.push({
        title: "直播管理",
        img: getLiveIcon("直播-管理.svg"),
        col_type: "avatar",
        url: "hiker://empty",
    });
    d.push({
        title: "订阅源管理",
        img: getLiveIcon("直播-箭头.svg"),
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            addListener("onClose", $.toString(() => {
                //refreshPage(false);
            }));
            require(config.SrcLiveRely);
            let liveconfig = getLiveConfig();

            var d = [];
            d.push({
                title: '‘‘’’<b>📺 订阅源管理</b> &nbsp &nbsp <small>添加自定义链接</small>',
                img: "https://img.vinua.cn/images/QqyC.png",
                url: $("", "输入通用格式的tv链接地址").input((livecfgfile, liveconfig) => {
                    if (input) {
                        if (/\/storage\/emulated\//.test(input)) { input = "file://" + input }
                        let livedata = liveconfig['data'] || [];
                        if (!livedata.some(item => item.url == input)) {
                            showLoading('正在验证链接有效性...');
                            let YChtml = request(input, { timeout: 3000 });
                            let shstr = YChtml.substr(0, YChtml.indexOf('\n'));
                            if(shstr.includes(',http')){
                                YChtml = "未分组,#genre#\n" + YChtml;
                            }
                            if (YChtml.indexOf('#genre#') > -1 || YChtml.indexOf('#EXTINF:-1') > -1) {
                                hideLoading();
                                return $("", "链接有效，起个名字保存").input((livedata, url, livecfgfile, liveconfig) => {
                                    if (input) {
                                        livedata.push({ name: input, url: url });
                                        liveconfig['data'] = livedata;
                                        writeFile(livecfgfile, JSON.stringify(liveconfig));
                                        refreshPage(false);
                                        return "toast://增加自定义tv链接地址成功";
                                    } else {
                                        return "toast://输入不能为空"
                                    }
                                }, livedata, input, livecfgfile, liveconfig)
                            } else {
                                hideLoading();
                                return "toast://无法识别";
                            }
                        } else {
                            return "toast://已存在";
                        }
                    } else {
                        return "toast://地址不能为空";
                    }
                }, livecfgfile, liveconfig),
                col_type: 'text_1'
            });

            let livedata = liveconfig['data'] || [];
            if (livedata.length > 0) {
                d.push({
                    title: '点击下方的订阅源条目，进行操作👇',
                    col_type: "rich_text"
                });
                d.push({
                    col_type: "line"
                });
                function getide(is) {
                    if (is == 1) {
                        return '‘‘’’<strong><font color="#f13b66a">◉ </front></strong>';
                    } else {
                        return '‘‘’’<strong><font color="#F54343">◉ </front></strong>';
                    }
                }
                for (let i = 0; i < livedata.length; i++) {
                    d.push({
                        title: (livedata[i].show != 0 ? getide(1) : getide(0)) + livedata[i].name,
                        desc: livedata[i].url,
                        url: $(["复制链接", "修改名称", "删除订阅", livedata[i].show != 0 ? "停用订阅" : "启用订阅", "列表置顶", "列表置底"], 2, "").select((livecfgfile, url, name) => {
                            try {
                                if (input == "删除订阅") {
                                    if (/^http/.test(url)) {
                                        deleteCache(url);
                                    }
                                    let livecfg = fetch(livecfgfile);
                                    if (livecfg != "") {
                                        eval("var liveconfig = " + livecfg);
                                        let livedata = liveconfig['data'] || [];
                                        for (let i = 0; i < livedata.length; i++) {
                                            if (livedata[i].url == url) {
                                                livedata.splice(i, 1);
                                                break;
                                            }
                                        }
                                        liveconfig['data'] = livedata;
                                        writeFile(livecfgfile, JSON.stringify(liveconfig));
                                        refreshPage(false);
                                    }
                                } else if (input == "修改名称") {
                                    return $(name, "修改新名称").input((livecfgfile,url)=>{
                                        if(input.trim()==""){
                                            return "toast://名称不能为空";
                                        }
                                        let livecfg = fetch(livecfgfile);
                                        if (livecfg != "") {
                                            eval("var liveconfig = " + livecfg);
                                            let livedata = liveconfig['data'] || [];
                                            for (let i = 0; i < livedata.length; i++) {
                                                if (livedata[i].url == url) {
                                                    livedata[i].name = input;
                                                    break;
                                                }
                                            }
                                            liveconfig['data'] = livedata;
                                            writeFile(livecfgfile, JSON.stringify(liveconfig));
                                            refreshPage(false);
                                        }
                                    }, livecfgfile, url)
                                }else if (input == "复制链接") {
                                    copy(url);
                                } else if (input == "停用订阅" || input == "启用订阅") {
                                    let livecfg = fetch(livecfgfile);
                                    if (livecfg != "") {
                                        eval("var liveconfig = " + livecfg);
                                        let livedata = liveconfig['data'] || [];
                                        for (let i = 0; i < livedata.length; i++) {
                                            if (livedata[i].url == url) {
                                                livedata[i].show = input == "停用订阅" ? 0 : 1;
                                                break;
                                            }
                                        }
                                        liveconfig['data'] = livedata;
                                        writeFile(livecfgfile, JSON.stringify(liveconfig));
                                        refreshPage(false);
                                    }
                                } else if (input == "列表置顶" || input == "列表置底") {
                                    let livecfg = fetch(livecfgfile);
                                    if (livecfg != "") {
                                        eval("var liveconfig = " + livecfg);
                                        let datalist = liveconfig['data'] || [];
                                        let index = datalist.findIndex(item => item.url === url);
                                        if ((index == 0 && input == "列表置顶") || (index == datalist.length - 1 && input == "列表置底")) {
                                            return 'toast://位置移动无效';
                                        } else {
                                            let data = datalist[index];
                                            datalist.splice(index, 1);
                                            if (input == "列表置顶") {
                                                datalist.unshift(data);
                                            } else {
                                                datalist.push(data);
                                            }
                                        }
                                        liveconfig['data'] = datalist;
                                        writeFile(livecfgfile, JSON.stringify(liveconfig));
                                        refreshPage(false);
                                    }
                                }
                                return "hiker://empty";
                            } catch (e) {
                                hideLoading();
                                log(e.message);
                                return "toast://操作异常，详情查看日志";
                            }
                        }, livecfgfile, livedata[i].url, livedata[i].name),
                        col_type: "text_1"
                    });
                }
            } else {
                d.push({
                    title: '↻无记录',
                    col_type: "rich_text"
                });
            }
            setHomeResult(d);
        }),
        col_type: "text_icon"
    });
    d.push({
        title: "box配置导入",
        img: getLiveIcon("直播-箭头.svg"),
        col_type: "text_icon",
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            addListener("onClose", $.toString(() => {
                clearMyVar('importinput');
            }));
            let cfgfile = "hiker://files/rules/Src/Juying2/config.json";
            let Juconfig = {};
            let Jucfg = fetch(cfgfile);
            if (Jucfg != "") {
                eval("Juconfig=" + Jucfg + ";");
            }
            let d = [];
            d.push({
                title: '本地',
                col_type: 'input',
                desc: '请输入链接地址',
                url: $.toString(() => {
                    return `fileSelect://` + $.toString(() => {
                        return "toast://" + input;
                    })
                }),
                extra: {
                    titleVisible: false,
                    defaultValue: getMyVar('importinput', ''),
                    onChange: 'putMyVar("importinput",input)'
                }
            });
            d.push({
                title: '⏏️ 本地文件',
                col_type: 'text_2',
                url: `fileSelect://` + $.toString(() => {
                    putMyVar("importinput", "file://" + input);
                    refreshPage();
                    return "toast://" + input;
                })
            })
            d.push({
                title: '🆗 确定订阅',
                col_type: 'text_2',
                url: $('#noLoading#').lazyRule((Juconfig, cfgfile) => {
                    let input = getMyVar('importinput', '');
                    if (input == "") {
                        return 'toast://请先输入链接地址'
                    }

                    let importrecord = Juconfig['importrecord'] || [];
                    if (importrecord.length > 20) {//保留20个记录
                        importrecord.shift();
                    }
                    if (!importrecord.some(item => item.url == input && item.type == '1')) {
                        importrecord.push({ type: '1', url: input });
                        Juconfig['importrecord'] = importrecord;
                        writeFile(cfgfile, JSON.stringify(Juconfig));
                    }

                    let data;
                    try {
                        showLoading('检测文件有效性');
                        if (/\/storage\/emulated\//.test(input)) { input = "file://" + input }
                        let html = request(input, { timeout: 2000 });
                        if (html.includes('LuUPraez**')) {
                            html = base64Decode(html.split('LuUPraez**')[1]);
                        }
                        eval('data = ' + html)
                    } catch (e) {
                        hideLoading();
                        log('TVBox文件检测失败>' + e.message);
	                        return "toast://TVBox导入失败：链接文件无效或内容有错";
                    }
                    hideLoading();
                    let lives = data.lives || [];
                    if (lives.length > 0) {
                        showLoading('正在导入');
                        try {
                            let urls = [];
                            for (let i = 0; i < lives.length; i++) {
                                if (lives[i].channels) {
                                    let channels = lives[i].channels;
                                    if (channels.length > 0) {
                                        for (let j = 0; j < channels.length; j++) {
                                            let live = channels[i].urls;
                                            for (let k = 0; k < live.length; k++) {
                                                let url = live[i].replace('proxy://do=live&type=txt&ext=', '');
                                                if (!/^http/.test(url)) {
                                                    url = base64Decode(url);
                                                }
                                                urls.push({ name: url.substr(url.lastIndexOf('/') + 1).split('.')[0], url: url });
                                            }
                                        }
                                    }
                                } else if (lives[i].url) {
                                    let url = lives[i].url;
                                    if (/^\./.test(url)) {
                                        url = input.match(/http(s)?:\/\/.*\//)[0] + url.replace("./", "");
                                    }
                                    urls.push({ name: lives[i].name || url.substr(url.lastIndexOf('/') + 1).split('.')[0], url: url });
                                }
                            }
                            if (urls.length > 0) {
                                livenum = 0;
                                require(config.SrcLiveRely);
                                let liveconfig = getLiveConfig();
                                let livedata = liveconfig['data'] || [];
                                for (let i = 0; i < urls.length; i++) {
                                    if (!livedata.some(item => item.url == urls[i].url)) {
                                        let YChtml = request(urls[i].url, { timeout: 5000 }).replace(/TV-/g, 'TV');
                                        let shstr = YChtml.substr(0, YChtml.indexOf('\n'));
                                        if(shstr.includes(',http')){
                                            YChtml = "未分组,#genre#\n" + YChtml;
                                        }
                                        if (YChtml.indexOf('#genre#') > -1 || YChtml.indexOf('#EXTINF:-1') > -1) {
                                            livedata.push(urls[i]);
                                            livenum++;
                                        }
                                    }
                                }
                                if (livenum > 0) {
                                    liveconfig['data'] = livedata;
                                    writeFile(livecfgfile, JSON.stringify(liveconfig));
                                }
                                hideLoading();
                                return 'toast://成功订阅：' + livenum;
                            }
                        } catch (e) {
                            log('TVBox导入live保存失败>' + e.message);
                        }
                    }
                    hideLoading();
                    return 'toast://失败';
                }, Juconfig, cfgfile)
            })

            d.push({
                title: '🆖 历史记录',
                col_type: "rich_text"
            });
            let importrecord = Juconfig['importrecord'] || [];
            let lists = importrecord.filter(item => {
                return item.type == '1';
            })
            if (lists.length > 0) {
                lists.reverse();
                for (let i = 0; i < lists.length; i++) {
                    d.push({
                        title: lists[i].url,
                        url: $('#noLoading#').lazyRule((url) => {
                            putMyVar('importinput', url);
                            refreshPage(true);
                            return "toast://已选择，需确认";
                        }, lists[i].url),
                        col_type: "text_1",
                        extra: {
                            id: lists[i].url,
                            longClick: [{
                                title: "删除",
                                js: $.toString((cfgfile, Juconfig, url) => {
                                    let importrecord = Juconfig['importrecord']||[];
                                    for(let j=0;j<importrecord.length;j++){
                                        if(importrecord[j].url==url&&importrecord[j].type=='1'){
                                            importrecord.splice(j,1);
                                            break;
                                        }
                                    }
                                    Juconfig['importrecord'] = importrecord; 
                                    writeFile(cfgfile, JSON.stringify(Juconfig));
                                    refreshPage(false);
                                    return "toast://已删除";
                                },cfgfile, Juconfig, lists[i].url)
                            }]
                        }
                    });
                }
            }
            setResult(d);
        })
    });

    setResult(d);
}
// 处理临时Live依赖文件地址
if(!config.SrcLiveRely){
    initConfig({
        SrcLiveRely: (config.聚阅||getPublicItem('聚阅','')).replace(/[^/]*$/,'') + 'SrcLive.js'
    });
}
// 获取图标地址
function getLiveIcon(icon) {
    if(!icon){
        return '';
    }else if(!icon.includes('/')){
        icon = config.SrcLiveRely.replace(/[^/]*$/,'') + 'img/' + icon;
    }
    if(!icon.includes('.svg')){
        return icon;
    }
    return icon + '?s='+color + '@js=' + $.toString((color) => {
        let javaImport = new JavaImporter();
        javaImport.importPackage(Packages.com.example.hikerview.utils);
        with(javaImport) {
            let bytes = FileUtil.toBytes(input);
            let str = new java.lang.String(bytes, "UTF-8") + "";
            str = str.replace(/#19b89d/gi, color);
            bytes = new java.lang.String(str).getBytes();
            return FileUtil.toInputStream(bytes);
        }
    }, color)
}