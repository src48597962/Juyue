////本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');

function SRCSet() {
    addListener("onClose", $.toString(() => {
        clearMyVar('duoSelectLists');
        clearMyVar("seacrhJiekou");
        clearMyVar('jkdatalist');
        clearMyVar('批量选择模式');
        clearMyVar('onlyStopJk');
        clearMyVar('selectGroup');
    }));

    let d = [];
    d.push({
        title: '增加',
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            setPageTitle('增加 | 聚阅接口');
            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
            jiekouapi();
        }),
        img: "http://123.56.105.145/tubiao/more/25.png",
        col_type: "icon_small_4",
        extra: {
            longClick: []
        }
    });
    d.push({
        title: '操作',
        url: $(["批量选择","查看禁用","清空所有"], 2).select(() => {
            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
            if(input=="批量选择"){
                let sm;
                if(getMyVar('批量选择模式')){
                    clearMyVar('批量选择模式');
                    clearMyVar('duoSelectLists');
                    sm = "退出批量选择模式";
                }else{
                    putMyVar('批量选择模式','1');
                    sm = "进入批量选择模式";
                }
                refreshPage(false);
                return "toast://"+sm;
            }else if(input=="清空所有"){
                return $("确定要删除本地所有的源接口吗？").confirm(()=>{
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                    deleteData();
                    refreshPage(false);
                    return 'toast://已全部清空';
                })
            }else if(input=="查看禁用"){
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
        img: "http://123.56.105.145/tubiao/more/290.png",
        col_type: "icon_small_4"
    });
    d.push({
        title: '导入',
        url: $("","聚阅口令").input(()=>{
            if(input==""){
                return 'toast://不能为空';
            }
            if(input.indexOf('@import=js:')>-1){
                input = input.split('@import=js:')[0].replace('云口令：','').trim();
            }
            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJySet.js');
            return JYimport(input);
        }),
        img: "http://123.56.105.145/tubiao/more/43.png",
        col_type: "icon_small_4"
    });
    let pastes = getPastes();
    pastes.push('云口令文件');
    
    let datalist = getDatas('all');
    if(getMyVar('onlyStopJk')){
        datalist = datalist.filter(item => item.stop);
    }

    let jkdatalist = getGroupLists(datalist, getMyVar("selectGroup","全部"));

    if(getMyVar("seacrhJiekou")){
        jkdatalist = jkdatalist.filter(it=>{
            return it.name.indexOf(getMyVar("seacrhJiekou"))>-1 || (it.author||"").indexOf(getMyVar("seacrhJiekou"))>-1;
        })
    }
    let yxdatalist = jkdatalist.filter(it=>{
        return !it.stop;
    });
    storage0.putMyVar("jkdatalist", jkdatalist);
    d.push({
        title: '分享',
        url: yxdatalist.length == 0 ? "toast://有效接口为0，无法分享" : $(pastes,2).select(()=>{
            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
            return JYshare(input);
        }),
        img: "http://123.56.105.145/tubiao/more/3.png",
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
            putMyVar("seacrhJiekou",input);
            refreshPage(false);
        }),
        desc: "搜你想要的...",
        col_type: "input",
        extra: {
            defaultValue: getMyVar('seacrhJiekou',''),
            titleVisible: true
        }
    });

    let groupNames = getJiekouGroups(datalist);
    groupNames.unshift("全部");
    let color = "#6dc9ff";
    groupNames.forEach(it =>{
        let obj = {
            title: getMyVar("selectGroup","全部")==it?`““””<b><span style="color: #`+color+`">`+it+`</span></b>`:it,
            url: $('#noLoading#').lazyRule((it) => {
                if(getMyVar("selectGroup")!=it){
                    putMyVar("selectGroup",it);
                    refreshPage(false);
                }
                return "hiker://empty";
            },it),
            col_type: 'scroll_button',
            extra: {
                backgroundColor: getMyVar("selectGroup","全部")==it?"#20" + color.replace('#',''):""
            }
        }
        
        if(it == "全部"){
            obj.extra.longClick = [{
                title: "列表排序：" + getItem("sourceListSort", "更新时间"),
                js: $.toString(() => {
                    return $(["更新时间","接口名称"], 1).select(() => {
                        setItem("sourceListSort", input);
                        refreshPage(false);
                    })
                })
            }]
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
                let jkdatalist = storage0.getMyVar("jkdatalist") || [];
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                duoselect(jkdatalist);
                return "toast://已反选";
            }),
            col_type: 'scroll_button'
        })
        d.push({
            title: "删除所选",
            url: $('#noLoading#').lazyRule(() => {
                let selectlist = storage0.getMyVar('duoSelectLists') || [];
                if(selectlist.length==0){
                    return "toast://未选择";
                }
                return $("确定要删除选择的"+selectlist.length+"个接口？").confirm((selectlist)=>{
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                    deleteData(selectlist);
                    refreshPage(false);
                    return 'toast://已删除选择';
                }, selectlist)
            }),
            col_type: 'scroll_button'
        })
        d.push({
            title: "调整分组",
            url: $('#noLoading#').lazyRule(()=>{
                    let selectlist = storage0.getMyVar('duoSelectLists') || [];
                    if(selectlist.length>0){
                        return $("","选定的"+selectlist.length+"个接口新分组名").input((selectlist)=>{
                            input = input.trim();
                            if(input==""){
                                return "hiker://empty";
                            }else if(input=="全部"){
                                return "toast://分组名不能为：全部";
                            }else if(input.includes('[') || input.includes(']')){
                                return "toast://分组名不能包含：[]";
                            }
                            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                            eval("var datalist=" + fetch(jkfile) + ";");
                            datalist.forEach(data=>{
                                if(selectlist.some(item => data.id==item.id)){
                                    if(input){
                                        data.group  = input;
                                    }else{
                                        delete data.group;
                                    }
                                }
                            })
                            writeFile(jkfile, JSON.stringify(datalist));
                            clearMyVar('duoSelectLists');
                            refreshPage(false);
                            return "toast://已批量调整接口分组";
                        }, selectlist)
                    }else{
                        return "toast://请选择";
                    }
                }),
            col_type: "scroll_button"
        });
        d.push({
            title: "禁用所选",
            url: $('#noLoading#').lazyRule(() => {
                let selectlist = storage0.getMyVar('duoSelectLists') || [];
                if(selectlist.length==0){
                    return "toast://未选择";
                }
                return $("确定要禁用选择的"+selectlist.length+"个接口？").confirm((selectlist)=>{
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
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
                let selectlist = storage0.getMyVar('duoSelectLists') || [];
                if(selectlist.length==0){
                    return "toast://未选择";
                }
                return $("确定要启用选择的"+selectlist.length+"个接口？").confirm((selectlist)=>{
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                    let sm = dataHandle(selectlist, '启用');
                    refreshPage(false);
                    return 'toast://' + sm;
                },selectlist)
            }),
            col_type: 'scroll_button'
        })
    }
    jkdatalist.forEach(it => {
        let selectmenu,datatitle;
        selectmenu = ["分享","编辑", "删除", it.stop?"启用":"禁用", "置顶", "测试"];
        datatitle = getDataTitle(it);

        d.push({
            title: it.stop?colorTitle(datatitle, '#f20c00'):datatitle,
            url: getMyVar('批量选择模式')?$('#noLoading#').lazyRule((data) => {
                data = JSON.parse(base64Decode(data));
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                duoselect(data);
                return "hiker://empty";
            },base64Encode(JSON.stringify(it))):$(selectmenu, 2).select((data) => {
                data = JSON.parse(base64Decode(data));
                if (input == "分享") {
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                    return JYshare(getItem("sharePaste",""), data);
                } else if (input == "编辑") {
                    return $('hiker://empty#noRecordHistory##noHistory#').rule((data) => {
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
                        jiekouapi(data);
                    }, data)
                } else if (input == "删除") {
                    return $("确定删除："+data.name).confirm((data)=>{
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                        deleteData(data);
                        refreshPage(false);
                        return 'toast://已删除:'+data.name;
                    }, data)
                } else if (input == "测试") {
                    return $("hiker://empty#noRecordHistory##noHistory#").rule((data) => {
                        setPageTitle(data.name+"-接口测试");
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJu.js');
                        yiji(data);
                    }, data);
                } else {//置顶、禁用、启用
                    if(input == "置顶" && getItem("sourceListSort", "更新时间") != "更新时间"){
                        return "toast://无效操作，接口列表排序方式为：" + getItem("sourceListSort");
                    }
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                    let sm = dataHandle(data, input);
                    refreshPage(false);
                    return 'toast://' + sm;
                }
            }, base64Encode(JSON.stringify(it))),
            desc: it.group||it.type,
            img: it.img || "http://123.56.105.145/tubiao/ke/31.png",
            col_type: "avatar",
            extra: {
                id: it.id
            }
        });
    })
    
    d.push({
        title: "‘‘’’<small><font color=#f20c00>当前接口数：" + jkdatalist.length + "，总有效数："+yxdatalist.length+"</font></small>",
        url: 'hiker://empty',
        col_type: 'text_center_1'
    });
    setResult(d);
}

function jiekouapi(data, look) {
    addListener("onClose", $.toString(() => {
        clearMyVar('apiname');
        clearMyVar('apiauthor');
        clearMyVar('apiversion');
        clearMyVar('apiimg');
        clearMyVar('apitype');
        clearMyVar('apigroup');
        clearMyVar('apiparse');
        clearMyVar('apierparse');
        clearMyVar('apipublic');
        clearMyVar('isload');
    }));
    if(data){
        if(getMyVar('isload', '0')=="0"){
            putMyVar('apiname', data.name);
            putMyVar('apiauthor', data.author||"");
            putMyVar('apiversion', data.version||"");
            putMyVar('apiimg', data.img||"");
            putMyVar('apitype', data.type||"");
            putMyVar('apigroup', data.group||"");
            storage0.putMyVar('apiparse', data.parse);
            storage0.putMyVar('apierparse', data.erparse ? data.erparse : "");
            storage0.putMyVar('apipublic', data.public ? data.public : "");
            putMyVar('isload', '1');
        }
    }

    let d = [];
    d.push({
        title: '名称',
        col_type: 'input',
        desc: "接口名称",
        extra: {
            defaultValue: getMyVar('apiname') || "",
            titleVisible: false,
            onChange: $.toString(() => {
                putMyVar('apiname', input);
            })
        }
    });
    d.push({
        title: '接口作者：'+ getMyVar('apiauthor',''),
        col_type: 'text_1',
        url: $(getMyVar('apiauthor',''), "接口作者").input(() => {
            putMyVar('apiauthor',input);
            refreshPage(false);
            return 'toast://接口作者已设置为：' + input;
        }),
        extra: {
            //lineVisible: false
        }
    });
    d.push({
        title: '接口版本号：'+ getMyVar('apiversion','1'),
        col_type: 'text_1',
        url: $(getMyVar('apiversion','1'), "接口版本号").input(() => {
            putMyVar('apiauthor',input);
            refreshPage(false);
            return 'toast://接口版本号已设置为：' + input;
        }),
        extra: {
            //lineVisible: false
        }
    });
    d.push({
        title: '接口类型：'+ getMyVar('apitype',''),
        col_type: 'text_1',
        url: $(getTypeNames(),2,"接口类型").select(() => {
            putMyVar('apitype',input);
            refreshPage(false);
            return 'toast://接口类型已设置为：' + input;
        }),
        extra: {
            //lineVisible: false
        }
    });

    let groupNames = getGroupNames();
    groupNames.push("自定义");
    d.push({
        title: '接口分组：'+ getMyVar('apigroup',''),
        col_type: 'text_1',
        url: $(groupNames,2,"接口分组：").select(() => {
            if(input=="自定义"){
                return $("", "自定义搜索分组名称").input(() => {
                    putMyVar('apigroup',input);
                    refreshPage(false);
                    return 'toast://接口分组已设置为：' + input;
                })
            }else{
                putMyVar('apigroup',input);
                refreshPage(false);
            }
            return 'toast://接口分组已设置为：' + input;
        }),
        extra: {
            //lineVisible: false
        }
    });
    d.push({
        title: '接口图标',
        col_type: 'input',
        desc:"接口图标可留空",
        extra: {
            defaultValue: getMyVar('apiimg') || "",
            titleVisible: false,
            onChange: $.toString(() => {
                putMyVar('apiimg', input);
            })
        }
    });
    d.push({
        title: '一级主页数据源',
        col_type: 'input',
        desc: "一级主页数据源, 可以留空",
        extra: {
            defaultValue: storage0.getMyVar('apiparse') || "",
            titleVisible: false,
            type: "textarea",
            highlight: true,
            height: 2,
            onChange: $.toString(() => {
                if (/{|}/.test(input) || !input) {
                    storage0.putMyVar("apiparse", input)
                }
            })
        }
    });
    d.push({
        title: '二级搜索数据源',
        col_type: 'input',
        desc: "二级搜索数据源, 可以留空",
        extra: {
            defaultValue: storage0.getMyVar('apierparse') || "",
            titleVisible: false,
            type: "textarea",
            highlight: true,
            height: 2,
            onChange: $.toString(() => {
                if (/{|}/.test(input) || !input) {
                    storage0.putMyVar("apierparse", input)
                }
            })
        }
    });
    d.push({
        title: '公共变量',
        col_type: 'input',
        desc: "公共变量, {}对象",
        extra: {
            defaultValue: storage0.getMyVar('apipublic') || "",
            titleVisible: false,
            type: "textarea",
            highlight: true,
            height: 1,
            onChange: $.toString(() => {
                if (/{|}/.test(input) || !input) {
                    storage0.putMyVar("apipublic", input)
                }
            })
        }
    });

    if(!look){
        d.push({
            title: '测试搜索',
            col_type: 'text_2',
            url: $(getItem('searchtestkey', '斗罗大陆'),"输入测试搜索关键字").input(()=>{
                setItem("searchtestkey",input);
                let name = getMyVar('apiname');
                let type = getMyVar('apitype','漫画');
                let erparse = getMyVar('apierparse');
                let public = getMyVar('apipublic');
                if(!name || !erparse){
                    return "toast://名称或搜索源接口不能为空";
                }
                try{
                    var source = {
                        name: name,
                        type: type,
                        erparse: erparse
                    }
                    if(public){
                        source.public = public;
                    }
                }catch(e){
                    log('√源接口异常>'+e.message);
                    return "toast://搜索源接口有异常，看日志"
                }
                if(source){
                    return $("hiker://empty#noRecordHistory##noHistory###fypage").rule((name,sdata) => {
                        addListener("onClose", $.toString(() => {
                            clearMyVar('SrcJu_sousuoTest');
                        }));
                        putMyVar('SrcJu_sousuoTest','1');
                        clearMyVar("SrcJu_停止搜索线程");
                        let d = [];
                        require(config.聚阅);
                        d = search(name,"sousuotest",sdata);
                        d.push({
                            title: "测试搜索第"+MY_PAGE+"页结束",
                            url: "hiker://empty",
                            col_type: 'text_center_1',
                            extra: {
                                lineVisible: false
                            }
                        });
                        setResult(d);
                    },input,source)
                }else{
                    return "toast://确认搜索源接口数据？"
                }
            })
        })
        d.push({
            title: '保存接口',
            col_type: 'text_2',
            url: $().lazyRule((sourcefile,oldtype,runTypes) => {
                if (!getMyVar('apiname')) {
                    return "toast://名称不能为空";
                }
                if (!getMyVar('apiparse') && !getMyVar('apierparse')) {
                    return "toast://主页源数据和搜索源数据不能同时为空";
                }
                if (!getMyVar('apitype')) {
                    return "toast://接口类型不能为空";
                }
                try {
                    let name = getMyVar('apiname');
                    if (runTypes.indexOf(name)>-1) {
                        return "toast://接口名称不能属于类型名";
                    }
                    let img = getMyVar('apiimg');
                    let type = getMyVar('apitype');
                    let group = getMyVar('apigroup');
                    let parse = getMyVar('apiparse');
                    let erparse = getMyVar('apierparse');
                    let public = getMyVar('apipublic');
                    let newapi = {
                        name: name,
                        type: type
                    }
                    if(group){
                        newapi['group'] = group;
                    }
                    if (parse) {
                        try{
                            eval("let yparse = " + parse);
                        }catch(e){
                            log('√一级主页源代码异常>'+e.message);
                            return "toast://一级主页源有错误，看日志"
                        }
                        newapi['parse'] = parse;
                    }
                    if (erparse) {
                        try{
                            eval("let eparse = " + erparse);
                        }catch(e){
                            log('√二级搜索源代码异常>'+e.message);
                            return "toast://二级搜索源有错误，看日志"
                        }
                        newapi['erparse'] = erparse;
                    }
                    if (public) {
                        try{
                            eval("let gparse = " + public);
                        }catch(e){
                            log('√公共代码异常>'+e.message);
                            return "toast://公共代码有错误，看日志"
                        }
                        newapi['public'] = public;
                    }
                    if (img) {
                        newapi['img'] = img;
                    }
                    newapi['updatetime'] = $.dateFormat(new Date(),"yyyy-MM-dd HH:mm:ss");
                    let sourcedata = fetch(sourcefile);
                    if (sourcedata != "") {
                        try {
                            eval("var datalist=" + sourcedata + ";");
                        } catch (e) {
                            var datalist = [];
                        }
                    } else {
                        var datalist = [];
                    }
                    let index = datalist.indexOf(datalist.filter(d => d.name==name && (d.type==type||!d.type))[0]);
                    if (index > -1 && getMyVar('SrcJu_jiekouedit') != "1") {
                        return "toast://已存在-" + name;
                    } else {
                        index = datalist.indexOf(datalist.filter(d => d.name==name && (d.type==oldtype||!d.type))[0]);
                        if (getMyVar('SrcJu_jiekouedit') == "1" && index > -1) {
                            datalist.splice(index, 1);
                        }
                        datalist.push(newapi);
                        writeFile(sourcefile, JSON.stringify(datalist));
                        clearMyVar('SrcJu_searchMark');
                        deleteFile('hiker://files/_cache/'+type+'_'+name+'.json');
                        back(true);
                        return "toast://已保存";
                    }
                } catch (e) {
                    return "toast://接口数据异常，请确认对象格式";
                }
            }, jkfile,data?data.type:"",runTypes)
        });
    }
    setResult(d);
}
