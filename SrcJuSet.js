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

    setPageTitle("♥管理"+getMyVar('SrcJu_Version', ''));
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
                    clearMyVar('duoselect');
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
    for (let i = 0; i < 8; i++) {
        d.push({
            col_type: "blank_block"
        })
    }
    

    let typebtn = getTypeNames();
    typebtn.unshift("全部");
    typebtn.forEach(it =>{
        let obj = {
            title: getMyVar("selectGroup","全部")==it?`““””<b><span style="color: #3399cc">`+it+`</span></b>`:it,
            url: $('#noLoading#').lazyRule((it) => {
                if(getMyVar("selectGroup")!=it){
                    putMyVar("selectGroup",it);
                    refreshPage(false);
                }
                return "hiker://empty";
            },it),
            col_type: 'scroll_button'
        }
        
        if(it != "全部"){
            obj.extra = {};
            let longClick = [];
            if(getMyVar("selectGroup")==it){
                longClick.push()
            }
            if(longClick.length>0){obj["extra"].longClick = longClick;}
        }else{
            obj.extra = {
                longClick: [{
                    title: "列表排序：" + getItem("sourceListSort", "update"),
                    js: $.toString(() => {
                        return $(["更新时间","接口名称"], 1).select(() => {
                            if(input=='接口名称'){
                                setItem("sourceListSort","name");
                            }else{
                                clearItem("sourceListSort");
                            }
                            refreshPage(false);
                        })
                    })
                }]
            }
        }
        
        d.push(obj);
    })
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
    if(getMyVar('批量选择模式')){
        d.push({
            title: "反向选择",
            url: $('#noLoading#').lazyRule((jkdatalist) => {
                jkdatalist = JSON.parse(base64Decode(jkdatalist));
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuMethod.js');
                duoselect(jkdatalist);
                return "toast://已反选";
            },base64Encode(JSON.stringify(jkdatalist))),
            col_type: 'scroll_button'
        })
        d.push({
            title: "删除所选",
            url: $('#noLoading#').lazyRule((sourcefile) => {
                let duoselect = storage0.getMyVar('duoSelectLists')?storage0.getMyVar('duoSelectLists'):[];
                if(duoselect.length==0){
                    return "toast://未选择";
                }
                return $("确定要删除选择的"+duoselect.length+"个接口？").confirm((sourcefile,duoselect)=>{
                    let sourcedata = fetch(sourcefile);
                    eval("var datalist=" + sourcedata + ";");
                    for(let i = 0; i < datalist.length; i++) {
                        let id = datalist[i].type+"_"+datalist[i].name;
                        if(duoselect.some(item => item.name == datalist[i].name && item.type==datalist[i].type)){
                            deleteItem(id);
                            datalist.splice(i, 1);
                            i--;
                        }
                    }
                    writeFile(sourcefile, JSON.stringify(datalist));
                    clearMyVar('SrcJu_searchMark');
                    clearMyVar('duoSelectLists');
                    refreshPage(false);
                    return 'toast://已删除选择';
                },sourcefile,duoselect)
            },jkfile),
            col_type: 'scroll_button'
        })
        d.push({
            title: "禁用所选",
            url: $('#noLoading#').lazyRule((sourcefile) => {
                let duoselect = storage0.getMyVar('duoSelectLists')?storage0.getMyVar('duoSelectLists'):[];
                if(duoselect.length==0){
                    return "toast://未选择";
                }
                return $("确定要禁用选择的"+duoselect.length+"个接口？").confirm((sourcefile,duoselect)=>{
                    let sourcedata = fetch(sourcefile);
                    eval("var datalist=" + sourcedata + ";");
                    for(let i = 0; i < datalist.length; i++) {
                        if(duoselect.some(item => item.name == datalist[i].name && item.type==datalist[i].type)){
                            datalist[i].stop = 1;
                        }
                    }
                    writeFile(sourcefile, JSON.stringify(datalist));
                    clearMyVar('SrcJu_searchMark');
                    clearMyVar('duoSelectLists');
                    refreshPage(false);
                    return 'toast://已禁用选择';
                },sourcefile,duoselect)
            },jkfile),
            col_type: 'scroll_button'
        })
    }
    jkdatalist.forEach(it => {
        d.push({
            title: (it.stop?`<font color=#f20c00>`:"") + it.name + (it.parse ? " [主页源]" : "") + (it.erparse ? " [搜索源]" : "") + (it.stop?`</font>`:""),
            url: getMyVar('批量选择模式')?$('#noLoading#').lazyRule((data) => {
                data = JSON.parse(base64Decode(data));
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuMethod.js');
                duoselect(data);
                return "hiker://empty";
            },base64Encode(JSON.stringify(it))):$(["分享", "编辑", "删除", it.stop?"启用":"禁用","选择","改名"], 2).select((sourcefile,data,paste) => {
                data = JSON.parse(base64Decode(data));
                if (input == "分享") {
                    showLoading('分享上传中，请稍后...');
                    let oneshare = []
                    oneshare.push(data);
                    let pasteurl = sharePaste(aesEncode('SrcJu', JSON.stringify(oneshare)), paste||"");
                    hideLoading();
                    if (/^http|^云/.test(pasteurl) && pasteurl.includes('/')) {
                        pasteurl = pasteurl.replace('云6oooole', 'https://pasteme.tyrantg.com').replace('云5oooole', 'https://cmd.im').replace('云7oooole', 'https://note.ms').replace('云9oooole', 'https://txtpbbd.cn').replace('云10oooole', 'https://hassdtebin.com');   
                        log('剪贴板地址>'+pasteurl);
                        let code = '聚阅接口￥' + aesEncode('SrcJu', pasteurl) + '￥' + data.name;
                        copy('云口令：'+code+`@import=js:$.require("hiker://page/import?rule=`+MY_RULE.title+`");`);
                        return "toast://(单个)分享口令已生成";
                    } else {
                        return "toast://分享失败，剪粘板或网络异常>"+pasteurl;
                    }
                } else if (input == "编辑") {
                    return $('hiker://empty#noRecordHistory##noHistory#').rule((sourcefile, data) => {
                        setPageTitle('编辑 | 聚阅接口');
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
                        jiekouapi(sourcefile, JSON.parse(base64Decode(data)));
                    }, sourcefile, base64Encode(JSON.stringify(data)))
                } else if (input == "删除") {
                    return $("确定删除："+data.name).confirm((sourcefile,data)=>{
                        let sourcedata = fetch(sourcefile);
                        eval("var datalist=" + sourcedata + ";");
                        let index = datalist.indexOf(datalist.filter(d => d.name==data.name && d.type==data.type)[0]);
                        datalist.splice(index, 1);
                        writeFile(sourcefile, JSON.stringify(datalist));
                        clearMyVar('SrcJu_searchMark');
                        refreshPage(false);
                        return 'toast://已删除';
                    },sourcefile,data)
                } else if (input == "禁用" || input == "启用" ) {
                    let sourcedata = fetch(sourcefile);
                    eval("var datalist=" + sourcedata + ";");
                    let index = datalist.indexOf(datalist.filter(d => d.name==data.name && d.type==data.type)[0]);
                    let sm;
                    if(input == "禁用"){
                        datalist[index].stop = 1;
                        sm = data.name + "已禁用";
                    }else{
                        delete datalist[index].stop;
                        sm = data.name + "已启用";
                    }
                    writeFile(sourcefile, JSON.stringify(datalist));
                    clearMyVar('SrcJu_searchMark');
                    refreshPage(false);
                    return 'toast://' + sm;
                } else if (input=="选择") {
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuMethod.js');
                    duoselect(data);
                    return "hiker://empty";
                } else if (input == "改名") {
                    return $(data.name,"输入新名称").input((sourcefile,data)=>{
                        let sourcedata = fetch(sourcefile);
                        eval("var datalist=" + sourcedata + ";");
                        let index = datalist.indexOf(datalist.filter(d => d.name==data.name && d.type==data.type)[0]);
                        datalist[index].name = input;
                        writeFile(sourcefile, JSON.stringify(datalist));
                        clearMyVar('SrcJu_searchMark');
                        refreshPage(false);
                        return 'toast://已重命名';
                    },sourcefile,data)
                }
            }, jkfile, base64Encode(JSON.stringify(it)), Juconfig['sharePaste']),
            desc: (it.group?"["+it.group+"] ":"") + it.type,
            img: it.img || "http://123.56.105.145/tubiao/ke/31.png",
            col_type: "avatar",
            extra: {
                id: it.type+"_"+it.name
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

function jiekouapi(sourcefile, data, look) {
    addListener("onClose", $.toString(() => {
        clearMyVar('SrcJu_jiekoudata');
        clearMyVar('SrcJu_jiekouname');
        clearMyVar('SrcJu_jiekouimg');
        clearMyVar('SrcJu_jiekoutype');
        clearMyVar('SrcJu_jiekougroup');
        clearMyVar('SrcJu_jiekouparse');
        clearMyVar('SrcJu_jiekouerparse');
        clearMyVar('SrcJu_jiekoupublic');
        clearMyVar('SrcJu_jiekouedit');
    }));
    if (data&&getMyVar('SrcJu_jiekouedit')!="1") {
        storage0.putMyVar('SrcJu_jiekoudata', data);
        putMyVar('SrcJu_jiekouedit', '1');
        putMyVar('SrcJu_jiekouname', data.name);
        putMyVar('SrcJu_jiekouimg', data.img||"");
        putMyVar('SrcJu_jiekoutype', data.type||"");
        putMyVar('SrcJu_jiekougroup', data.group||"");
        storage0.putMyVar('SrcJu_jiekouparse', data.parse);
        storage0.putMyVar('SrcJu_jiekouerparse', data.erparse ? data.erparse : "");
        storage0.putMyVar('SrcJu_jiekoupublic', data.public ? data.public : "");
    }
    let d = [];
    d.push({
        title: '名称',
        col_type: 'input',
        desc: "接口名称",
        extra: {
            defaultValue: getMyVar('SrcJu_jiekouname') || "",
            titleVisible: false,
            onChange: $.toString(() => {
                putMyVar('SrcJu_jiekouname', input);
            })
        }
    });
    d.push({
        title: '接口类型：'+ getMyVar('SrcJu_jiekoutype',''),
        col_type: 'text_1',
        url: $(getTypeNames(),2,"接口类型").select(() => {
            putMyVar('SrcJu_jiekoutype',input);
            refreshPage(false);
            return 'toast://接口类型已设置为：' + input;
        }),
        extra: {
            lineVisible: false
        }
    });
    d.push({
        title: '接口图标',
        col_type: 'input',
        desc:"接口图标可留空",
        extra: {
            defaultValue: getMyVar('SrcJu_jiekouimg') || "",
            titleVisible: false,
            onChange: $.toString(() => {
                putMyVar('SrcJu_jiekouimg', input);
            })
        }
    });

    let groupNames = getGroupNames();
    groupNames.push("自定义");
    d.push({
        title: '搜索分组：'+ getMyVar('SrcJu_jiekougroup',''),
        col_type: 'text_1',
        url: $(groupNames,2,"搜索分组：").select(() => {
            if(input=="自定义"){
                return $("", "自定义搜索分组名称").input(() => {
                    putMyVar('SrcJu_jiekougroup',input);
                    refreshPage(false);
                    return 'toast://搜索分组已设置为：' + input;
                })
            }else{
                putMyVar('SrcJu_jiekougroup',input);
                refreshPage(false);
            }
            return 'toast://搜索分组已设置为：' + input;
        }),
        extra: {
            lineVisible: false
        }
    });
    d.push({
        title: '一级主页数据源',
        col_type: 'input',
        desc: "一级主页数据源, 可以留空",
        extra: {
            defaultValue: storage0.getMyVar('SrcJu_jiekouparse') || "",
            titleVisible: false,
            type: "textarea",
            highlight: true,
            height: 2,
            onChange: $.toString(() => {
                if (/{|}/.test(input) || !input) {
                    storage0.putMyVar("SrcJu_jiekouparse", input)
                }
            })
        }
    });
    d.push({
        title: '二级搜索数据源',
        col_type: 'input',
        desc: "二级搜索数据源, 可以留空",
        extra: {
            defaultValue: storage0.getMyVar('SrcJu_jiekouerparse') || "",
            titleVisible: false,
            type: "textarea",
            highlight: true,
            height: 2,
            onChange: $.toString(() => {
                if (/{|}/.test(input) || !input) {
                    storage0.putMyVar("SrcJu_jiekouerparse", input)
                }
            })
        }
    });
    d.push({
        title: '公共变量',
        col_type: 'input',
        desc: "公共变量, {}对象",
        extra: {
            defaultValue: storage0.getMyVar('SrcJu_jiekoupublic') || "",
            titleVisible: false,
            type: "textarea",
            highlight: true,
            height: 2,
            onChange: $.toString(() => {
                if (/{|}/.test(input) || !input) {
                    storage0.putMyVar("SrcJu_jiekoupublic", input)
                }
            })
        }
    });
    if(data&&data.updatetime){
        d.push({
            title: '更新时间：'+ data.updatetime,
            col_type: 'text_1',
            url: 'hiker://empty',
            extra: {
                lineVisible: false
            }
        });
    }
    if(!look){
        d.push({
            title: '测试搜索',
            col_type: 'text_2',
            url: $(getItem('searchtestkey', '斗罗大陆'),"输入测试搜索关键字").input(()=>{
                setItem("searchtestkey",input);
                let name = getMyVar('SrcJu_jiekouname');
                let type = getMyVar('SrcJu_jiekoutype','漫画');
                let erparse = getMyVar('SrcJu_jiekouerparse');
                let public = getMyVar('SrcJu_jiekoupublic');
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
                if (!getMyVar('SrcJu_jiekouname')) {
                    return "toast://名称不能为空";
                }
                if (!getMyVar('SrcJu_jiekouparse') && !getMyVar('SrcJu_jiekouerparse')) {
                    return "toast://主页源数据和搜索源数据不能同时为空";
                }
                if (!getMyVar('SrcJu_jiekoutype')) {
                    return "toast://接口类型不能为空";
                }
                try {
                    let name = getMyVar('SrcJu_jiekouname');
                    if (runTypes.indexOf(name)>-1) {
                        return "toast://接口名称不能属于类型名";
                    }
                    let img = getMyVar('SrcJu_jiekouimg');
                    let type = getMyVar('SrcJu_jiekoutype');
                    let group = getMyVar('SrcJu_jiekougroup');
                    let parse = getMyVar('SrcJu_jiekouparse');
                    let erparse = getMyVar('SrcJu_jiekouerparse');
                    let public = getMyVar('SrcJu_jiekoupublic');
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
