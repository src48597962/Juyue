//本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
let rulepath = "hiker://files/rules/Src/Jiexi/"; //规则文件路径
let jxfile =  rulepath + 'jiexi.json';
// 主页
function home() {
    let dd = [];
    dd.push({
        title: '解析列表',
        url: $('#noLoading#').lazyRule(() => {
            putMyVar('主页显示内容', '1');
        }),
        img: 'http://123.56.105.145/tubiao/more/25.png',
        col_type: "icon_small_3"
    });
    dd.push({
        title: '解析设置',
        url: $('#noLoading#').lazyRule(() => {
            putMyVar('主页显示内容', '2');
        }),
        img: 'http://123.56.105.145/tubiao/more/25.png',
        col_type: "icon_small_3"
    });
    dd.push({
        title: '解析测试',
        url: $('#noLoading#').lazyRule(() => {
            putMyVar('主页显示内容', '3');
        }),
        img: 'http://123.56.105.145/tubiao/more/25.png',
        col_type: "icon_small_3"
    });
    setPreResult(dd);
    
    if(getMyVar('主页显示内容', '1')=='1'){
        jxItem();
    }else{
        setResult([]);
    }
}
// 接口管理页
function jxItem() {
    setPageTitle('解析管理');
    let d = [];
    d.push({
        title: '增加',
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            setPageTitle('增加 | 聚解接口');
            require(config.jxCodePath + 'SrcJiexi.js');
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
                    return $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
                        require(config.jxCodePath + 'SrcJiexi.js');
                        extImport();
                    })
                })
            }]
        }
    });
    let pastes = getPastes();
    let jxdatalist = getDatas();
    if(getMyVar('onlyStopJk')){
        jxdatalist = jxdatalist.filter(item => item.stop);
    }

    let yxdatalist = jxdatalist.filter(it=>{
        return !it.stop;
    });
    storage0.putMyVar("jxdatalist", jxdatalist);

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
                require(config.jxCodePath + 'SrcJiexi.js');
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
    d.push({
        title: "‘‘’’<small><font color=#f20c00>当前解析数：" + jxdatalist.length + "，总有效数：" + yxdatalist.length + "</font></small>",
        url: 'hiker://empty',
        col_type: 'text_center_1'
    });
    setResult(d);
}

function getDatas() {
    let datalist = [];
    let sourcedata = fetch(jxfile);
    if(sourcedata != ""){
        try{
            eval("datalist=" + sourcedata+ ";");
        }catch(e){ }
    }
    let withoutStop = datalist.filter(item => !item.stop);
    // 禁用的放到最后
    let withStop = datalist.filter(item => item.stop);
    // 合并数组
    let result = withoutStop.concat(withStop);

    return result;
}

// 文字上色
function colorTitle(title, Color) {
    return '<font color="' + Color + '">' + title + '</font>';
}
// 获取接口对应的显示标题
function getDataTitle(data, ide) {
    let dataTitle = (ide||(getMyVar('批量选择模式')?'○':''))+(data.stop?'Ⓓ':'')+data.name + '  ‘‘’’<small><font color=grey>'+(data.author?'  ['+data.author+']':'') + '</font></small>';
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
// 获取解析列表
function jxItemList(datalist) {
    let selectlist = storage0.getMyVar('duodatalist') || [];
    let d = [];
    datalist.forEach(it => {
        let selectmenu, datatitle;
        selectmenu = ["分享", "编辑", "删除", it.stop ? "启用" : "禁用", "置顶", "测试"];
        if (selectlist.some(item => it.id == item.id)) {
            datatitle = colorTitle(getDataTitle(it, '●'), '#3CB371');
        } else {
            datatitle = getDataTitle(it);
        }

        d.push({
            title: datatitle,
            url: getMyVar('批量选择模式') ? $('#noLoading#').lazyRule((data) => {
                data = JSON.parse(base64Decode(data));
                require(config.聚解.replace(/[^/]*$/, '') + 'SrcJiexi.js');
                duoselect(data);
                return "hiker://empty";
            }, base64Encode(JSON.stringify(it))) : $(selectmenu, 2).select((data) => {
                data = JSON.parse(base64Decode(data));
                if (input == "分享") {
                    if (getItem("sharePaste", "") == "") {
                        let pastes = getPastes();
                        pastes.push('云口令文件');
                        return $(pastes, 2).select((data) => {
                            require(config.聚解.replace(/[^/]*$/, '') + 'SrcJiexi.js');
                            return JYshare(input, data);
                        }, data)
                    } else {
                        require(config.聚解.replace(/[^/]*$/, '') + 'SrcJiexi.js');
                        return JYshare(getItem("sharePaste", ""), data);
                    }
                } else if (input == "编辑") {
                    return $('hiker://empty#noRecordHistory##noHistory#').rule((data) => {
                        require(config.聚解.replace(/[^/]*$/, '') + 'SrcJiexi.js');
                        jiekouapi(data);
                    }, data)
                } else if (input == "删除") {
                    return $("确定删除：" + data.name).confirm((data) => {
                        require(config.聚解.replace(/[^/]*$/, '') + 'SrcJiexi.js.js');
                        deleteData(data);
                        //refreshPage(false);
                        deleteItem(data.id);
                        return 'toast://已删除:' + data.name;
                    }, data)
                } else if (input == "测试") {
                    return $("hiker://empty#noRecordHistory##noHistory#").rule((data) => {
                        setPageTitle(data.name + "-接口测试");
                        require(config.聚解.replace(/[^/]*$/, '') + 'SrcJu.js');
                        yiji(data);
                    }, data);
                } else {//置顶、禁用、启用
                    if (input == "置顶" && getItem("sourceListSort", "更新时间") != "更新时间") {
                        return "toast://无效操作，接口列表排序方式为：" + getItem("sourceListSort");
                    }
                    require(config.聚解.replace(/[^/]*$/, '') + 'SrcJiexi.js');
                    let sm = dataHandle(data, input);
                    refreshPage(false);
                    return 'toast://' + sm;
                }
            }, base64Encode(JSON.stringify(it))),
            desc: '',
            col_type: "text_1",
            extra: {
                id: it.name,
                cls: 'jxItemLoadList'
            }
        });
    })
    return d;
}

//解析新增或编辑
function jiexiapi(data) {
    addListener("onClose", $.toString(() => {
        clearMyVar('parsename');
        clearMyVar('parseurl');
        clearMyVar('parsetype');
        clearMyVar('parseext');
        clearMyVar('isretain');
        clearMyVar('isload');
    }));
    let d = [];
    if(!data){
        setPageTitle("♥解析管理-新增");
    }else{
        if(getMyVar('isload', '0')=="0"){
            setPageTitle("♥解析管理-变更");
            putMyVar('isretain', data.retain||"");
            putMyVar('isload', '1');
        }
    }
    d.push({
        title:'parseurl',
        col_type: 'input',
        desc: "解析名称",
        extra: {
            titleVisible: false,
            defaultValue: getMyVar('parsename', data?data.name:""),
            onChange: 'putMyVar("parsename",input)'
        }
    });
    d.push({
        title:'parseurl',
        col_type: 'input',
        desc: "链接地址",
        extra: {
            highlight: true,
            type: "textarea",
            titleVisible: false,
            defaultValue: getMyVar('parseurl', data?data.url:""),
            onChange: 'putMyVar("parseurl",input)'
        }
    });
    d.push({
	        title: '是否为web嗅探解析：' + (getMyVar('parsetype', data?data.type.toString():'0')=="0"?"是":"否"),
        col_type: 'text_1',
        url:$().lazyRule(()=>{
            if(/^function/.test(getMyVar('parseurl',''))){
                putMyVar('parsetype','1');
            }else if(getMyVar('parsetype')=="1"){
                putMyVar('parsetype','0');
            }else{
                putMyVar('parsetype','1');
            }

            refreshPage(false);
            return "toast://是否为web解析，只用于判断进入video播放";
        })
    });
    d.push({
        title: getMyVar('isretain', '')!="1"?'强制保留：否':'强制保留：是',
        desc: getMyVar('isretain', '')!="1"?'':'全量更新时保留此接口',
        col_type:'text_1',
        url:$('#noLoading#').lazyRule(()=>{
            if(getMyVar('isretain', '')!="1"){
                putMyVar('isretain', '1');
            }else{
                clearMyVar('isretain');
            }
            refreshPage(false);
            return 'toast://已切换';
        })
    });
    d.push({
        title: 'ext数据',
        col_type: 'input',
        desc: "ext对象数据{}，如headers、flag, 可以留空",
        extra: {
            defaultValue: storage0.getMyVar('parseext', data?data.ext:"") || "",
            titleVisible: false,
            type: "textarea",
            highlight: true,
            height: 3,
            onChange: $.toString(() => {
                if (/{|}/.test(input)) {
                    try{
                        storage0.putMyVar("parseext", JSON.parse(input));
                    }catch(e){}
                }
            })
        }
    });
    if(data){
        d.push({
            title:'删除',
            col_type:'text_3',
            url: $("确定删除解析："+getMyVar('parsename',data.name)).confirm((data)=>{
                require(config.聚影.replace(/[^/]*$/,'') + 'SrcJyPublic.js');
                deleteData('jx', data);
                back(true);
                return "toast://已删除";
            }, data)
        });    
    }else{
        d.push({
            title:'清空',
            col_type:'text_3',
            url:$("确定要清空上面填写的内容？").confirm(()=>{
                clearMyVar('parsename');
                clearMyVar('parseurl');
                clearMyVar('parseext');
                refreshPage(false);
                return "toast://已清空";
            })
        });
    } 
    d.push({
        title:'保存',
        col_type:'text_3',
        url: $().lazyRule((data)=>{
            if(!/^http|^functio/.test(getMyVar('parseurl',''))){
                return "toast://解析地址不正确"
            }
            let parseext = storage0.getMyVar('parseext');
            if(parseext && $.type(parseext)!="object"){
                return "toast://ext对象数据不正确"
            }
            require(config.聚影.replace(/[^/]*$/,'') + 'SrcJySet.js');
            let urls= [];
            let parseurl = getMyVar('parseurl');
            let parsename = getMyVar('parsename');
            let parsetype = getMyVar('parsetype','0');
            
            if(parseurl&&parsename){
                let arr  = { "name": parsename.trim(), "type": parseInt(parsetype),"url": parseurl.trim()};
                if(parseext){
                    arr['ext']=  parseext;
                }
                let isretain = getMyVar('isretain')=="1"?1:0;
                if(isretain){arr['retain'] = 1;}
                if(data){
                    arr['oldurl'] = data.url;
                }
                urls.push(arr);
                let num = jiexisave(urls);
                if(num==1){
                    back(true);
                    return "toast://已保存";
                }else if(num==0){
                    return "toast://已存在";
                }else{
                    return "toast://保存出错";
                }
            }else{
                return "toast://无法保存，检查项目填写完整性";
            }
                
        },data)
    });
    d.push({
        title:'测试',
        col_type:'text_3',
        url: $().lazyRule(()=>{
            let dataurl = getMyVar('parseurl');
            let dataname = getMyVar('parsename')||'测试';
            let datatype = getMyVar('parsetype','0');
            let dataext = storage0.getMyVar('parseext') || {};
            if(!dataurl||!/^http|^functio/.test(dataurl.trim())){
                return "toast://获取解析地址失败，无法测试";
            }

            addItemAfter('jxline',{
                title: '选择测试片源',
                col_type: "rich_text",
                extra:{
                    id: 'jxfrom',
                    cls: 'jxtest'
                }
            })
            addItemAfter('jxfrom',{
                col_type: "line",
                extra:{
                    id: 'jxline2',
                    cls: 'jxtest'
                }
            })
            let filepath = globalMap0.getVar('Src_Jy_gmParams').libspath + "testurls.json";
            let datafile = fetch(filepath);
            if(datafile != ""){
                eval("var urls=" + datafile+ ";");
            }else{
                var urls = {
                    "1905": "https://vip.1905.com/play/1659382.shtml",
                    "爱奇艺": "https://www.iqiyi.com/v_1e6upn2xiek.html",
                    "优酷": "https://v.youku.com/v_show/id_XNjQwMzkxNzU1Mg==.html",
                    "腾讯": "https://v.qq.com/x/cover/mzc002007n0xa7w/j4100ne9iw8.html",
                    "芒果": "https://www.mgtv.com/b/638338/21190020.html",
                    "哔哩哔哩": "https://www.bilibili.com/bangumi/play/ep828752",
                    "搜狐": "https://tv.sohu.com/v/MjAyMzA5MjEvbjYwMTMzNDI0Ni5zaHRtbA==.html",
                    "西瓜": "https://www.ixigua.com/6915270027096621576",
                    "PPTV": "https://v.pptv.com/show/UKm0M5sBca8SkPg.html",
                    "咪咕": "https://m.miguvideo.com/m/detail/919226692",
                    "乐视": "https://www.le.com/ptv/vplay/24093071.html"
                }
                writeFile(filepath, JSON.stringify(urls));
            }

            let dataObj = {};
            dataObj.parse = {name:dataname,url:dataurl,type:parseInt(datatype),ext:dataext};

            urls['自定义'] = "";
            for(let key in urls){
                addItemBefore('jxline2', {
                    title: key,
                    url: key!="自定义"?$('#noRecordHistory##noHistory#').lazyRule((vipUrl,dataObj)=>{
                        require(config.聚影.replace(/[^/]*$/,'') + 'SrcParseS.js');
                        return SrcParseS.聚影(vipUrl, dataObj);
                    },urls[key],dataObj):$("","输入自定义播放地址").input((dataObj) => {
                        if(input==""){
                            return "toast://未输入自定义地址，无法测试";
                        }else{
                            return $().lazyRule((vipUrl,dataObj)=>{
                                require(config.聚影.replace(/[^/]*$/,'') + 'SrcParseS.js');
                                return SrcParseS.聚影(vipUrl, dataObj);
                            }, input, dataObj)
                        }
                    }, dataObj),
                    col_type: "text_3",
                    extra:{
                        cls: 'jxtest',
                        jsLoadingInject: true,
                        blockRules: ['.m4a','.mp3','.gif','.jpeg','.png','.ico','hm.baidu.com','/ads/*.js'] 
                    }
                })
            }
            addItemBefore('jxline2', {
                title: '编辑测试',
                url: $('#noRecordHistory##noHistory#').lazyRule(()=>{
                    return "editFile://" + globalMap0.getVar('Src_Jy_gmParams').libspath + "testurls.json";
                }),
                col_type: "text_3",
                extra:{
                    cls: 'jxtest'
                }
            })
            updateItem('jxtest', {
                url: "hiker://empty"
            })
            return "hiker://empty";
        }),
        extra:{
            id: 'jxtest'
        }
    });
    
    d.push({
        col_type: "line",
        extra:{id:'jxline'}
    })
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