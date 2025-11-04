// 本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
// 加载公共部分
require(config.jxCodePath + 'SrcPublic.js');
// 解析列表页
function jxItemPage(dd) {
    addListener("onClose", $.toString(() => {
        clearMyVar('duodatalist');
        clearMyVar("seacrhJiexi");
        clearMyVar('jxdatalist');
        clearMyVar('seacrhDataList');
        clearMyVar('selectGroup');
        clearMyVar('批量选择模式');
        clearMyVar('onlyStopJk');
        clearMyVar('similarTitles');
        clearMyVar('lookFailDatas');
    }));

    setPageTitle('本地解析管理-解析');
    let d = dd || [];
    d.push({
        title: '增加',
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            setPageTitle('增加 | 解析接口');
            require(config.jxCodePath + 'SrcJiexi.js');
            jiexiapi();
        }),
        img: 'http://123.56.105.145/tubiao/more/25.png',
        col_type: "icon_small_4"
    });
    d.push({
        title: '操作',
        url: $([getMyVar('批量选择模式')?"退出批量":"批量选择",getMyVar('onlyStopJk')?"退出禁用":"查看禁用","清空所有",getMyVar('similarTitles')?"退出相似":"查看相似",getMyVar('lookFailDatas')?"退出失败":"查看失败"], 2).select(() => {
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
            }else if(input=="查看相似"||input=="退出相似"){
                if(getMyVar('similarTitles')){
                    clearMyVar('similarTitles');
                    refreshPage(false);
                    return "toast://退出仅显示相似列表";
                }else{
                    return $(getMyVar('similarTitles','0.8'),"源名相似度0-1").input(() => {
                        if(!parseFloat(input)||parseFloat(input)>1||parseFloat(input)<0){return 'toast://输入有误，请输入0-1之间1位小数'}
                        putMyVar('similarTitles', input);
                        refreshPage(false);
                        return "toast://进入仅显示相似列表，阀值"+input;
                    })
                }
            }else if(input=="查看失败"||input=="退出失败"){
                if(getMyVar('lookFailDatas')){
                    clearMyVar('lookFailDatas');
                    refreshPage(false);
                    return "toast://退出仅显示失败列表";
                }else{
                    return $(getMyVar('lookFailDatas','10'),"查看失败大于多少次的解析").input(() => {
                        if(!parseInt(input)||parseInt(input)<0){return 'toast://输入有误，请输入大于1的数字'}
                        putMyVar('lookFailDatas', input);
                        refreshPage(false);
                        return "toast://进入仅显示指定失败次数列表，阀值"+input;
                    })
                }
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
            
            return $("hiker://empty#noRecordHistory##noHistory#").rule((input) => {
                require(config.jxCodePath + 'SrcJiexi.js');
                importConfirm(input);
            }, input)
        }),
        img: 'http://123.56.105.145/tubiao/more/43.png',
        col_type: "icon_small_4",
        extra: {
            longClick: [{
                title: '外部导入',
                js: $.toString(() => {
                    return $(['聚影','断插'], 2).select(() => {
                        // Unicode转中文
                        function decodeUnicodeEscapes(str) {
                            return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, p1) => {
                                return String.fromCharCode(parseInt(p1, 16));
                            });
                        }
                        let addarr = [];
                        if(input=='聚影'){
                            let jxfile = 'hiker://files/rules/Src/Juying2/jiexi.json';
                            let jxstr = fetch(jxfile);
                            if(jxstr){
                                addarr = JSON.parse(jxstr).map(it=>{
                                    return {
                                        name: it.name,
                                        url: decodeUnicodeEscapes(it.url),
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
                                        url: decodeUnicodeEscapes(itstr),
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
    if(getMyVar('similarTitles')){
        let t1 = new Date().getTime();
        jxdatalist = similarTitles(jxdatalist, getMyVar('similarTitles'));
        let t2 = new Date().getTime();
        xlog('查看相似耗时：' + (t2-t1) + 'ms');
    }else if(getMyVar('onlyStopJk')){
        jxdatalist = jxdatalist.filter(item => item.stop);
    }else if(getMyVar('lookFailDatas')){
        jxdatalist = jxdatalist.filter(item => (item.sort||0)>parseInt(getMyVar('lookFailDatas')));
    }

    if(getMyVar("selectGroup")){
        jxdatalist = jxdatalist.filter(v=>v.type==parseTypes.indexOf(getMyVar("selectGroup")));
    }
    let yxdatalist = jxdatalist.filter(it=>{
        return !it.stop;
    });
    storage0.putMyVar("jxdatalist", jxdatalist);

    let pastes = getPastes();
    d.push({
        title: '分享',
        url: jxdatalist.length == 0 ? "hiker://empty" : $(pastes,2).select(()=>{
            require(config.jxCodePath + 'SrcJiexi.js');
            return JYshare(input);
        }),
        img: 'http://123.56.105.145/tubiao/more/3.png',
        col_type: "icon_small_4"
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
                    require(config.jxCodePath + 'SrcJiexi.js');
                    let jxdatalist = storage0.getMyVar("jxdatalist");
                    addItemBefore('jxItemLoading', jxItemList(jxdatalist));
                }
            })
        }
    });

    ['全部'].concat(parseTypes).forEach(it=>{
        let obj = {
            title: getMyVar("selectGroup","全部")==it?`““””<b><span style="color: `+Color+`">`+it+`</span></b>`:it,
            url: $('#noLoading#').lazyRule((it) => {
                if(getMyVar("selectGroup")!=it){
                    if(it=='全部'){
                        clearMyVar("selectGroup");
                    }else{
                        putMyVar("selectGroup",it);
                    }
                    refreshPage(false);
                }
                return "hiker://empty";
            },it),
            col_type: 'flex_button',
            extra: {
                backgroundColor: getMyVar("selectGroup","全部")==it?"#20" + Color.replace('#',''):""
            }
        }
        d.push(obj);
    })

    if(getMyVar('批量选择模式')){
        d.push({
            col_type: "blank_block"
        });
        d.push({
            title: "反向选择",
            url: $('#noLoading#').lazyRule(() => {
                let jxdatalist = storage0.getMyVar("seacrhDataList") || storage0.getMyVar("jxdatalist") || [];
                require(config.jxCodePath + 'SrcJiexi.js');
                duoselect(jxdatalist);
                return "toast://已反选";
            }),
            col_type: 'scroll_button'
        })
        d.push({
            title: "删除所选",
            url: $('#noLoading#').lazyRule(() => {
                let selectlist = storage0.getMyVar('duodatalist') || [];
                if(selectlist.length==0){
                    return "toast://未选择";
                }
                return $("确定要删除选择的"+selectlist.length+"个解析？").confirm((selectlist)=>{
                    require(config.jxCodePath + 'SrcJiexi.js');
                    deleteData(selectlist);
                    let ids = selectlist.map(v=>v.name);
                    deleteItem(ids);
                    return 'toast://已删除选择';
                }, selectlist)
            }),
            col_type: 'scroll_button'
        })
        d.push({
            title: "禁用所选",
            url: $('#noLoading#').lazyRule(() => {
                let selectlist = storage0.getMyVar('duodatalist') || [];
                if(selectlist.length==0){
                    return "toast://未选择";
                }
                return $("确定要禁用选择的"+selectlist.length+"个解析？").confirm((selectlist)=>{
                    require(config.聚阅.jxCodePath + 'SrcJiexi.js');
                    let sm = dataHandle(selectlist, '禁用');
                    refreshPage(false);
                    return 'toast://' + sm;
                },selectlist)
            }),
            col_type: 'scroll_button'
        })
        d.push({
            title: "启用所选",
            url: $('#noLoading#').lazyRule(() => {
                let selectlist = storage0.getMyVar('duodatalist') || [];
                if(selectlist.length==0){
                    return "toast://未选择";
                }
                return $("确定要启用选择的"+selectlist.length+"个解析？").confirm((selectlist)=>{
                    require(config.jxCodePath + 'SrcJiexi.js');
                    let sm = dataHandle(selectlist, '启用');
                    refreshPage(false);
                    return 'toast://' + sm;
                },selectlist)
            }),
            col_type: 'scroll_button'
        })

        d.push({
            title: "批量检测",
            url: $('#noLoading#').lazyRule(() => {
                let duoselect = storage0.getMyVar('duodatalist') || [];
                duoselect = duoselect.filter(v=>!v.stop);
                if(duoselect.length==0){
                    return "toast://未选择有效的待检解析";
                }

                return $("hiker://empty#noRecordHistory##noHistory#").rule((datas) => {
                    setPageTitle(datas.length + "个解析测试");
                    require(config.jxCodePath + 'SrcJiexi.js');
                    jiexiTest(datas);
                }, duoselect);
            }),
            col_type: 'scroll_button'
        })
    }

    if(getMyVar('seacrhJiexi')){
        jxdatalist = outputSearchList(jxdatalist, getMyVar('seacrhJiexi'));
    }
    
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
// 获取接口对应的显示标题
function getDataTitle(data, ide, i) {
    let dataTitle = (i?i+'-':'') + (ide||(getMyVar('批量选择模式')?'○':'')) + getJxIde(data) + data.name + (data.sort?' fail:'+data.sort:'');
    if(data.desc2){
        dataTitle = dataTitle + '  ' + data.desc2;
    }
    dataTitle = dataTitle + (data.type!=2?'\n‘‘’’<small><font color=grey>' + data.url + '</font></small>':'');

    return dataTitle;
}
// 对应标识
function getJxIde(data){
    return data.stop?'Ⓓ':data.type==0?"Ⓦ":data.type==1?"Ⓙ":data.type==2?"Ⓕ":"";
}
// 接口多选处理方法
function duoselect(data, i){
    let waitlist= [];
    if($.type(data)=='object'){
        waitlist.push(data);
    }else if($.type(data)=='array'){
        waitlist = data;
    }

    let selectlist = storage0.getMyVar('duodatalist') || [];
    waitlist.forEach(data=>{
        if(!selectlist.some(item => data.name==item.name)){
            selectlist.push(data);
            updateItem(data.name, {title: colorTitle(getDataTitle(data, '●', i),'#3CB371')});
        }else{
            let index = selectlist.indexOf(selectlist.filter(d => data.name==d.name)[0]);
            selectlist.splice(index, 1);
            updateItem(data.name, {title:data.stop?colorTitle(getDataTitle(data, '', i), 'red'):getDataTitle(data, '', i)});
        }
    })
    storage0.putMyVar('duodatalist',selectlist);
}
// 获取解析列表
function jxItemList(datalist) {
    let selectlist = storage0.getMyVar('duodatalist') || [];
    let d = [];
    datalist.forEach((it, i) => {
        let selectmenu, datatitle;
        selectmenu = ["分享", "编辑", "删除", it.stop ? "启用" : "禁用", "置顶", "测试"];
        if (selectlist.some(item => it.name == item.name)) {
            datatitle = colorTitle(getDataTitle(it, '●', i+1), '#3CB371');
        } else {
            datatitle = getDataTitle(it, '', i+1);
            if(it.stop){
                datatitle = '‘‘’’<font color=red>' + datatitle + '</font>';
            }
        }
        let ext = it.ext || {};
        let flag = ext.flag || [];

        d.push({
            title: datatitle,
            url: getMyVar('批量选择模式') ? $('#noLoading#').lazyRule((data, i) => {
                data = JSON.parse(base64Decode(data));
                require(config.jxCodePath + 'SrcJiexi.js');
                duoselect(data, i);
                return "hiker://empty";
            }, base64Encode(JSON.stringify(it)), i+1) : $(selectmenu, 2).select((data) => {
                data = JSON.parse(base64Decode(data));
                if (input == "分享") {
                    if (getItem("sharePaste", "") == "") {
                        let pastes = getPastes();
                        pastes.push('云口令文件');
                        return $(pastes, 2).select((data) => {
                            require(config.jxCodePath + 'SrcJiexi.js');
                            return JYshare(input, data);
                        }, data)
                    } else {
                        require(config.jxCodePath + 'SrcJiexi.js');
                        return JYshare(getItem("sharePaste", ""), data);
                    }
                } else if (input == "编辑") {
                    return $('hiker://empty#noRecordHistory##noHistory#').rule((data) => {
                        require(config.jxCodePath + 'SrcJiexi.js');
                        jiexiapi(data);
                    }, data)
                } else if (input == "删除") {
                    return $("确定删除：" + data.name).confirm((data) => {
                        require(config.jxCodePath + 'SrcJiexi.js');
                        deleteData(data);
                        deleteItem(data.name);
                        return 'toast://已删除:' + data.name;
                    }, data)
                } else if (input == "测试") {
                    return $("hiker://empty#noRecordHistory##noHistory#").rule((data) => {
                        setPageTitle(data.name + "-解析测试");
                        require(config.jxCodePath + 'SrcJiexi.js');
                        jiexiTest(data);
                    }, data);
                } else {//置顶、禁用、启用
                    require(config.jxCodePath + 'SrcJiexi.js');
                    let sm = dataHandle(data, input);
                    refreshPage(false);
                    return 'toast://' + sm;
                }
            }, base64Encode(JSON.stringify(it))),
            desc: flag.join(','),
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
        clearMyVar('isload');
    }));
    let d = [];
    if(!data){
        setPageTitle("解析管理-新增");
    }else{
        if(getMyVar('isload', '0')=="0"){
            setPageTitle("解析管理-变更");
            putMyVar('parsename', data.name);
            putMyVar('parseurl', data.url||"");
            putMyVar('parsetype', data.type||"");
            putMyVar('isload', '1');
        }
    }
    d.push({
        title:'parseurl',
        col_type: 'input',
        desc: "解析名称",
        extra: {
            titleVisible: false,
            defaultValue: getMyVar('parsename', ""),
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
            defaultValue: getMyVar('parseurl', ""),
            onChange: 'putMyVar("parseurl",input)'
        }
    });
    
    d.push({
	    title: '解析类型：' + (getMyVar('parsetype')?parseTypes[parseInt(getMyVar('parsetype'))]:'自动识别'),
        col_type: 'text_1',
        url: $(parseTypes, 1).select(() => {
            putMyVar('parsetype', MY_INDEX);

            if(getMyVar('parseurl','').includes('function') && MY_INDEX!=2){
                return "toast://选择的类型错误了";
            }

            refreshPage(false);
            return "toast://WEB解析，可用于进入video播放";
        }),
        extra: {
            lineVisible: false
        }
    });
    d.push({
        title: 'ext数据',
        col_type: 'input',
        desc: "ext对象数据{}，如header、flag、js, 可以留空",
        extra: {
            defaultValue: storage0.getMyVar('parseext', data?data.ext:"") || "",
            titleVisible: false,
            type: "textarea",
            highlight: true,
            height: 3,
            onChange: $.toString(() => {
                input = input.trim();
                if (input.startsWith('{') && input.endsWith('}')) {
                    try{
                        eval('let json = ' + input);
                        storage0.putMyVar("parseext", json);
                    }catch(e){}
                }else{
                    clearMyVar('parseext');
                }
            })
        }
    });
    if(data){
        d.push({
            title:'删除',
            col_type:'text_2',
            url: $("确定删除解析："+getMyVar('parsename')).confirm((data)=>{
                require(config.jxCodePath + 'SrcJiexi.js');
                deleteData(data);
                deleteItem(data.name);
                back(false);
                return 'toast://已删除:' + data.name;
            }, data)
        });    
    }else{
        d.push({
            title:'清空',
            col_type:'text_2',
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
        col_type:'text_2',
        url: $().lazyRule((data)=>{
            let parseurl = getMyVar('parseurl','').trim();
            if(!/^http|^functio/.test(parseurl)){
                return "toast://解析地址不正确"
            }
            let parseext = storage0.getMyVar('parseext');
            if(parseext && $.type(parseext)!="object"){
                return "toast://ext对象数据不正确"
            }

            let parsename = getMyVar('parsename');
            let parsetype = getMyVar('parsetype');
            if(!parsetype){
                if(/^functio/.test(parseurl)){
                    parsetype = '2';
                }else{
                    let testurl = 'https://www.iqiyi.com/v_20k2cdw6m4w.html';
                    let html = fetch(parseurl + testurl);
                    try{
                        let json = JSON.parse(html).url;
                        parsetype = '1';
                    }catch(e){
                        parsetype = '0';
                    }
                }
            }
            
            if(parseurl && parsename && parsetype){
                let urls= [];
                let arr  = { "name": parsename.trim(), "type": parsetype, "url": parseurl.trim()};
                if(parseext){
                    arr['ext']=  parseext;
                }

                if(data){
                    arr['oldname'] = data.name;
                }
                urls.push(arr);

                require(config.jxCodePath + 'SrcJiexi.js');
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
    setResult(d);
}
//解析保存
function jiexisave(urls, mode) {
    if(urls.length==0){return 0;}
    let num = 0;
    try{
        let datalist = [];
        let sourcedata = fetch(jxfile);
        if(sourcedata != ""){
            try{
                eval("datalist=" + sourcedata+ ";");
            }catch(e){}
        }
        if(mode==2){
            for(let i=0;i<datalist.length;i++){
                datalist.splice(i,1);
                i = i - 1;
            }
        }
        
        urls.reverse().forEach(it=>{
            if(it.oldname || mode==1){
                for(let i=0;i<datalist.length;i++){
                    if(datalist[i].name==it.name||datalist[i].name==it.oldname){
                        datalist.splice(i,1);
                        break;
                    }
                }
            }

            function checkitem(item) {
                return item.name==it.name || item.url==it.url;
            }

            if(!datalist.some(checkitem)&&it.url&&it.name&&/^http|^functio/.test(it.url)){
                delete it['oldname'];
                delete it['sort'];
                datalist.unshift(it);
                num = num + 1;
            }
        })
        if(num>0){writeFile(jxfile, JSON.stringify(datalist));}
    } catch (e) {
        log("导入失败：" + e.message + " 错误行#" + e.lineNumber); 
        num = -1;
    }
    return num;
}
//删除解析入口
function deleteData(data){
    let sourcedata = fetch(jxfile);
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
        let index = datalist.indexOf(datalist.filter(d => it.name==d.name)[0]);
        datalist.splice(index, 1);
    })

    writeFile(jxfile, JSON.stringify(datalist));
    clearMyVar('duodatalist');
    // 删除接口搜索临时列表
    if(getMyVar("seacrhDataList")){
        let seacrhDataList = storage0.getMyVar("seacrhDataList");
        dellist.forEach(it => {
            let index = seacrhDataList.indexOf(seacrhDataList.filter(d => it.name==d.name)[0]);
            seacrhDataList.splice(index, 1);
        })
        storage0.putMyVar("seacrhDataList", seacrhDataList);
    }
}
// 接口处理公共方法
function dataHandle(data, input) {
    let sourcedata = fetch(jxfile);
    eval("let datalist=" + sourcedata + ";");

    let waitlist= [];
    if($.type(data)=='object'){
        waitlist.push(data);
    }else if($.type(data)=='array'){
        waitlist = data;
    }
    
    waitlist.forEach(it => {
        let index = datalist.findIndex(item => item.name === it.name);
        if(input == "禁用"){
            datalist[index].stop = 1;
        }else if(input == "启用"){
            delete datalist[index].stop;
        }else if(input == "置顶"){
            const [target] = datalist.splice(index, 1);
            datalist.unshift(target);
        }
    })
    writeFile(jxfile, JSON.stringify(datalist));
    clearMyVar('duodatalist');
    return input + '：已处理' + waitlist.length + '个';
}
//资源分享
function JYshare(input,data) {
    let sharelist, sm, sm2;
    if(data){
        sharelist = [];
        sharelist.push(data);
    }else{
        let duoselect = storage0.getMyVar('duodatalist') || [];
        if(duoselect.length>0){
            sharelist = duoselect;
        }else{
            sharelist = storage0.getMyVar("seacrhDataList") || storage0.getMyVar("jxdatalist") || [];
        }
    }

    if(sharelist.length==0){
        return "toast://有效接口数为0，无法分享";
    }
    let gzip = $.require(config.jxCodePath + "plugins/gzip.js");
    let sharetxt = gzip.zip(JSON.stringify(sharelist));
    let sharetxtlength = sharetxt.length;
    if(sharetxtlength>200000 && /云剪贴板2|云剪贴板5|云剪贴板9|云剪贴板10/.test(input)){
        return "toast://超出字符最大限制，建议用云6或文件分享";
    }
    sm = '聚阅解析';

    if(input=='云口令文件'){
        sm2 = sharelist.length==1?sharelist[0].name:sharelist.length;
        let code = sm + '￥' + aesEncode('Jujiexi', sharetxt) + '￥云口令文件';
        let sharefile = 'hiker://files/_cache/Jujiexi_'+sm2+'_'+$.dateFormat(new Date(),"HHmmss")+'.hiker';
        writeFile(sharefile, '云口令：'+code+`@import=js:$.require("hiker://page/import?rule=聚阅");`);
        if(fileExist(sharefile)){
            return 'share://'+sharefile;
        }else{
            return 'toast://'+input+'分享生成失败';
        }
    }else{
        showLoading('分享生成中，请稍后...');
        sm2 = sharelist.length==1?sharelist[0].name:'共' + sharelist.length + '条';
        let pasteurl = sharePaste(sharetxt, input);
        hideLoading();
        if(/^http|^云/.test(pasteurl) && pasteurl.includes('/')){
            log('剪贴板地址>'+pasteurl);
            let code = sm+'￥'+aesEncode('Jujiexi', pasteurl)+'￥' + sm2 + '('+input+')';
            copy('云口令：'+code+`@import=js:$.require("hiker://page/import?rule=聚阅");`);
            return "toast://分享口令已生成";
        }else{
            log('分享失败>'+pasteurl);
            return "toast://分享失败，剪粘板或网络异常>"+pasteurl;
        }
    }
}

//云口令提取
function extractimport(str){
    showLoading('获取数据中，请稍后...');
    let strs = str.replace(/\\n|云口令：/g, '').split('@import=');
    strs = strs.filter(v=>v&&v.includes('聚阅解析￥'));
    let datas = [];
    strs.forEach(it=>{
        try{
            let code = aesDecode('Jujiexi', it.split('￥')[1]);
            let text;
            if(/^http|^云/.test(code)){//云分享
                text = parsePaste(code);
            }else{//文件分享
                text = code;
            }
            if(text && !/^error/.test(text)){
                let gzip = $.require(config.jxCodePath + "plugins/gzip.js");
                let sharetxt = gzip.unzip(text);
                let imports = JSON.parse(sharetxt); 
                imports.forEach(it=>{
                    if(!datas.some(v=>v.name==it.name && v.url==it.url)){
                        datas.unshift(it);
                    }
                })
            }
        } catch (e) {
            log("获取口令数据出错>" + e.message);
        }
    })
    hideLoading();
    return datas;
}
// 云口令导入确认页
function importConfirm(importStr) {
    let importfile = "hiker://files/_cache/Jujiexi/cloudimport.txt";
    addListener("onClose", $.toString((importfile) => {
        deleteFile(importfile);
        clearMyVar('importConfirm');
        clearMyVar("选择列表项");
    },importfile));

    let importdatas = storage0.getMyVar('importConfirm', []);
    if(!getMyVar('importConfirm')){
        //云口令导入
        let input = importStr || fetch(importfile);
        if(!input){
            toast('未获取到云口令');
        }else{
            importdatas = extractimport(input);
            if(importdatas.length==0){
                toast('未获取到源接口，检查网络或口令');
            }
        }
        storage0.putMyVar('importConfirm', importdatas);
    }
    //获取现有接口
    let datalist = [];
    let sourcedata = fetch(jxfile);
    if(sourcedata != ""){
        try{
            eval("datalist = " + sourcedata+ ";");
        }catch(e){}
    }
    let newdatas = [];
    let olddatas = [];
    importdatas.forEach(it=>{
        if(!datalist.some(v=>v.name==it.name)){
            newdatas.push(it);
        }else{
            let olddata = datalist.filter(v=>v.name==it.name)[0];
            it.oldversion = olddata.version || "";
            olddatas.push(it);
        }
    })
    let oldnum = importdatas.length - newdatas.length;

    let d = [];
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
        d.push({
            col_type: 'pic_1_full',
            img: "http://123.56.105.145/weisyr/img/TopImg0.png",
            url: 'hiker://empty',
        });
    }
    d.push({
        title: "““””<big><b><font color="+Color+">📲 云口令导入  </font></b></big>",
        desc: "共计" + importdatas.length + "/新增" + newdatas.length + "/存在" + oldnum ,
        url: $('', '支持多口令').input((extractimport)=>{
            if(!input){
                toast('未获取到云口令');
            }else{
                let importdatas = extractimport(input);
                if(importdatas.length==0){
                    toast('未获取到源接口，检查网络或口令');
                }else{
                    storage0.putMyVar('importConfirm', importdatas);
                    refreshPage();
                }
            }
            return 'hiker://empty';
        }, extractimport),
        col_type: 'text_center_1'
    });
    d.push({
        title: importdatas.length>0&&oldnum==0?"":"增量导入",
        url: importdatas.length>0&&oldnum==0?"hiker://empty":$("跳过已存在，只导入新增，确认？").confirm(()=>{
            require(config.jxCodePath + 'SrcPublic.js');
            let importlist = storage0.getMyVar('importConfirm', []);
            let num = jiexisave(importlist, 0);
            back(false);
            return "toast://增量导入"+(num<0?"失败":num);
        }),
        img: importdatas.length>0&&oldnum==0?"":getJxIcon('增量导入.svg'),
        col_type: 'icon_small_3'
    });
    d.push({
        title: "",
        url: "hiker://empty",
        col_type: 'icon_small_3'
    });
    d.push({
        title: "全量导入",
        url: importdatas.length>0&&oldnum==0?$().lazyRule(()=>{
            require(config.jxCodePath + 'SrcPublic.js');
            let importlist = storage0.getMyVar('importConfirm', []);
            let num = jiexisave(importlist, 1);
            back(false);
            return "toast://全量导入"+(num<0?"失败":num);
        }):$("全部覆盖导入，确认？").confirm(()=>{
            require(config.jxCodePath + 'SrcPublic.js');
            let importlist = storage0.getMyVar('importConfirm', []);
            let num = jiexisave(importlist, 1);
            back(false);
            return "toast://全量导入"+(num<0?"失败":num);
        }),
        img: getJxIcon('全量导入.svg'),
        col_type: 'icon_small_3'
    });
    if(newdatas.length>0 && olddatas.length>0){
        let listtype = ["全部列表", "新增加的", "已存在的"];
        listtype.forEach((it, i)=>{
            d.push({
                title: getMyVar("选择列表项","0")==i?`““””<b><span style="color: `+"#20" + Color.replace('#','')+`">`+it+`</span></b>`:it,
                url: $().lazyRule((i)=>{
                    putMyVar("选择列表项", i);
                    refreshPage();
                    return "hiker://empty";
                }, i),
                col_type: 'text_3'
            });
        })
        
        if(getMyVar("选择列表项", "0") == "1"){
            importdatas = newdatas;
        }else if(getMyVar("选择列表项", "0") == "2"){
            importdatas = olddatas;
        }
    }

    importdatas.forEach((it, i)=>{
        let isnew = newdatas.some(v=>v.name==it.name);
        let datamenu = ["确定导入", "修改名称", "接口测试"];
        let ext = it.ext || {};
        let flag = ext.flag || [];
        let tmpdata = extra = Object.assign({desc2: "‘‘’’<small><font color=grey>{" + (isnew?"新增加":"已存在") + "}</font></small>"}, it);

        d.push({
            title: getDataTitle(tmpdata, '', i+1),
            url: $(datamenu, 2).select((data, isnew) => {
                data = JSON.parse(base64Decode(data));
                if (input == "确定导入") {
                    function iConfirm(data) {
                        require(config.jxCodePath + 'SrcPublic.js');
                        let num = jiexisave([data], 1);
                        let importlist = storage0.getMyVar('importConfirm', []);
                        if(importlist.length==1){
                            back(false);
                        }else{
                            let index2 = importlist.findIndex(item => item.name === data.name);
                            importlist.splice(index2, 1);
                            storage0.putMyVar('importConfirm', importlist);
                            deleteItem(data.name);
                        }
                        return "toast://导入"+(num<0?"失败":num);
                    }
                    if(isnew){
                        return iConfirm(data);
                    }else{
                        return $("导入将覆盖本地，确认？").confirm((data,iConfirm)=>{
                            return iConfirm(data);
                        }, data, iConfirm);
                    }
                }else if (input == "修改名称") {
                    return $(data.name, "请输入新名称").input((data)=>{
                        if(!input.trim()){
                            return "toast://不能为空";
                        }

                        let importlist = storage0.getMyVar('importConfirm', []);
                        let index = importlist.findIndex(item => item.name == data.name);
                        importlist[index].name = input;
                        storage0.putMyVar('importConfirm', importlist);
                        refreshPage(false);
                        return "toast://已修改名称";
                    }, data);
                }else if (input == "接口测试") {
                    return $("hiker://empty#noRecordHistory##noHistory#").rule((data) => {
                        setPageTitle(data.name+"-接口测试");
                        require(config.jxCodePath + 'SrcPublic.js');
                        jiexiTest(data);
                    }, data)
                }
            }, base64Encode(JSON.stringify(it)), isnew),
            desc: flag.join(','),
            col_type: "text_1",
            extra: {
                id: it.name
            }
        });
    })

    setResult(d);
}
// 解析测试
function jiexiTest(data) {
    addListener("onClose", $.toString(() => {
        clearMyVar('当前测试解析');
        clearMyVar('待测试解析列表');
    }));

    let testlist= storage0.getMyVar('待测试解析列表') || [];
    if(!getMyVar('待测试解析列表')){
        if($.type(data)=='object'){
            testlist.push(data);
        }else if($.type(data)=='array'){
            testlist = data;
        }
        storage0.putMyVar('待测试解析列表', testlist);
    }

    let testData = storage0.getMyVar('当前测试解析');
    if(!testData && testlist.length>0){
        storage0.putMyVar('当前测试解析', testlist[0]);
        testData = testlist[0];
    }
    
    let d = [];
    d.push({
        col_type: "line_blank"
    })
    d.push({
        title: "待检测的解析，点击选择",
        col_type: 'rich_text'
    });
    testlist.forEach(it=>{
        d.push({
            title: testData.name==it.name?"““””<font color="+Color+">"+it.name+"</font>":it.name,
            url: $("#noLoading#").lazyRule((data)=>{
                storage0.putMyVar('当前测试解析', data);
                refreshPage();
                return "toast://当前测试解析：" + data.name;
            }, it),
            col_type: 'text_3',
            extra:{
                longClick: [{
                    title: "删除",
                    js: $.toString((data) => {
                        require(config.jxCodePath + 'SrcPublic.js');
                        deleteData(data);
                        let testDatas = storage0.getMyVar('待测试解析列表');
                        testDatas = testDatas.filter(v=>v.name!=data.name);
                        deleteItem(data.name);
                        storage0.putMyVar('待测试解析列表', testDatas);
                        if(testDatas.length==1){
                            back();
                        }else{
                            refreshPage();
                        }
                        return "toast://已删除"
                    }, it)
                }]
            }
        });
    })
    d.push({
        col_type: "line_blank"
    })
    d.push({
        title: "点击下面的站点测试解析",
        col_type: 'rich_text'
    });
    d.push({
        title: '添加站点',
        url: $('#noLoading#').lazyRule(()=>{
            const hikerPop = $.require(config.jxCodePath + "plugins/hikerPop.js");
            hikerPop.inputTwoRow({
                titleHint: "站点名称",
                titleDefault: "",
                urlHint: "播放地址",
                urlDefault: "",
                noAutoSoft: true,
                title: "添加站点",
                confirm(s1, s2) {
                    require(config.jxCodePath + 'SrcPublic.js');
                    let testUrls = Juconfig['testUrls'] || {};
                    if(testUrls[s1]){
                        return "toast://站点已存在";
                    }
                    testUrls[s1] = s2;
                    writeFile(jxcfgfile, JSON.stringify(Juconfig));
                    refreshPage();
                    return "toast://已添加："+s1;
                }
            });
            return "hiker://empty";
        }),
        col_type: "text_3"
    })

    let testUrls = Juconfig['testUrls'] || {};
    if(Object.keys(testUrls).length==0){
        Juconfig['testUrls'] = {
            "爱奇艺": "https://www.iqiyi.com/v_1e6upn2xiek.html",
            "优酷": "https://v.youku.com/v_show/id_XNjQwMzkxNzU1Mg==.html",
            "腾讯": "https://v.qq.com/x/cover/mzc002007n0xa7w/j4100ne9iw8.html",
            "芒果": "https://www.mgtv.com/b/638338/21190020.html",
            "哔哩哔哩": "https://www.bilibili.com/bangumi/play/ep828752",
            "搜狐": "https://tv.sohu.com/v/MjAyMzA5MjEvbjYwMTMzNDI0Ni5zaHRtbA==.html"
        }
        writeFile(jxcfgfile, JSON.stringify(Juconfig));
        testUrls = Juconfig['testUrls'];
    }
    
    Object.keys(testUrls).forEach(key=>{
        d.push({
            title: key,
            url: $().lazyRule((input)=>{
                let dataObj = {testParse: storage0.getMyVar('当前测试解析')}
                require(config.jxCodePath + 'SrcParse.js');
                return SrcParse(input, dataObj);
            }, testUrls[key]),
            col_type: "text_3",
            extra:{
                cls: "playlist",
                jsLoadingInject: true,
                blockRules: ['.m4a','.mp3','.gif','.jpeg','.png','.ico','hm.baidu.com','/ads/*.js'],
                longClick: [{
                    title: "修改",
                    js: $.toString((key) => {
                        require(config.jxCodePath + 'SrcPublic.js');
                        let testUrls = Juconfig['testUrls'] || {};
                        const hikerPop = $.require(config.jxCodePath + "plugins/hikerPop.js");
                        hikerPop.inputTwoRow({
                            titleHint: "站点名称",
                            titleDefault: key,
                            urlHint: "播放地址",
                            urlDefault: testUrls[key],
                            noAutoSoft: true,
                            title: "修改站点",
                            confirm(s1, s2) {
                                require(config.jxCodePath + 'SrcPublic.js');
                                let testUrls = Juconfig['testUrls'] || {};
                                delete testUrls[key];
                                if(testUrls[s1]){
                                    return "toast://站点已存在";
                                }
                                testUrls[s1] = s2;
                                writeFile(jxcfgfile, JSON.stringify(Juconfig));
                                refreshPage();
                                return "toast://已修改："+s1;
                            }
                        });
                        return "hiker://empty";
                    }, key)
                },{
                    title: "删除",
                    js: $.toString((key) => {
                        require(config.jxCodePath + 'SrcPublic.js');
                        let testUrls = Juconfig['testUrls'] || {};
                        delete testUrls[key];
                        writeFile(jxcfgfile, JSON.stringify(Juconfig));
                        refreshPage();
                        return "toast://已删除"
                    }, key)
                }]
            }
        })
    })
    setResult(d);
}
// 输出检索接口列表
function outputSearchList(jxdatalist, input){
    let PinyinMatch = $.require(libspath + "plugins/pinyin-match.js");
    jxdatalist = jxdatalist.filter(it=>{
        return it.name.toLowerCase().includes(input.toLowerCase()) || it.url.includes(input) || (/^[a-zA-Z]+$/.test(input) && PinyinMatch.match(it.name, input));
    })
    storage0.putMyVar("seacrhDataList", jxdatalist);
    return jxdatalist;
}