//本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明

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
            require(config.jxCodePath + 'SrcPublic.js');
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
            require(config.jxCodePath + 'SrcPublic.js');
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
                require(config.jxCodePath + 'SrcPublic.js');
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
                    require(config.jxCodePath + 'SrcPublic.js');
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
                    require(config.聚阅.jxCodePath + 'SrcPublic.js');
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
                    require(config.jxCodePath + 'SrcPublic.js');
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
                    require(config.jxCodePath + 'SrcPublic.js');
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
