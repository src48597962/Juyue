////本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
//本地接口管理
function SRCSet() {
    addListener("onClose", $.toString(() => {
        clearMyVar('duodatalist');
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
                let selectlist = storage0.getMyVar('duodatalist') || [];
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
                    let selectlist = storage0.getMyVar('duodatalist') || [];
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
                            clearMyVar('duodatalist');
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
                let selectlist = storage0.getMyVar('duodatalist') || [];
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
                let selectlist = storage0.getMyVar('duodatalist') || [];
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
            desc: (it.group||it.type) + (it.group?"("+it.type+")":"") + (data.ilk=="1" ? "  [主页源]" : data.ilk=="2" ? "  [搜索源]" : "  [完整源]"),
            img: it.img || "http://123.56.105.145/tubiao/ke/31.png",
            col_type: ((MY_NAME=="海阔视界"&&getAppVersion()>=5566)||(MY_NAME=="嗅觉浏览器"&&getAppVersion()>=2305))?"icon_1_left_pic":"avatar",
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
//接口新增/编辑入口
function jiekouapi(data, look) {
    addListener("onClose", $.toString(() => {
        clearMyVar('apiname');
        clearMyVar('apiauthor');
        clearMyVar('apiversion');
        clearMyVar('apiimg');
        clearMyVar('apitype');
        clearMyVar('apigroup');
        clearMyVar('apiilk');
        clearMyVar('apiruleurl');
        clearMyVar('isload');
    }));
    if(data){
        if(getMyVar('isload', '0')=="0"){
            putMyVar('apiname', data.name);
            putMyVar('apiauthor', data.author||"");
            putMyVar('apiversion', data.version||"1");
            putMyVar('apiimg', data.img||"");
            putMyVar('apitype', data.type||"");
            putMyVar('apigroup', data.group||"");
            putMyVar('apiilk', data.ilk||"");
            putMyVar('apiruleurl', data.url||"");
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
        title: '源接口作者：'+ getMyVar('apiauthor',''),
        col_type: 'text_1',
        url: $(getMyVar('apiauthor',''), "源接口作者").input(() => {
            putMyVar('apiauthor',input);
            refreshPage(false);
            return 'toast://源接口作者已设置为：' + input;
        }),
        extra: {
            //lineVisible: false
        }
    });
    d.push({
        title: '接口版本号：'+ getMyVar('apiversion',''),
        col_type: 'text_1',
        url: $(getMyVar('apiversion',''), "接口版本号").input(() => {
            putMyVar('apiversion',input);
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
        url: $(runTypes,2,"接口类型").select(() => {
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
        title: data?'查看':'新建',
        col_type: 'input',
        desc: "接口规则文件，不能为空",
        url: data?$.toString(() => {
            let file = getMyVar('apiruleurl','');
            if(fileExist(file)){
                return "editFile://" + file;// + "@js=back();";
            }else{
                return "toast://文件不存在，无法查看";
            }
        }):$.toString(() => {
            let tmpl = fetch(config.聚阅.replace(/[^/]*$/,'') + 'plugins/objCodeTmpl.js');
            writeFile('hiker://files/_cache/Juyue/objCodeTmpl.txt', tmpl);
            return `editFile://hiker://files/_cache/Juyue/objCodeTmpl.txt@js=putMyVar("apiruleurl",input);`;
        }),
        extra: {
            titleVisible: true,
            defaultValue: getMyVar('apiruleurl',''),
            onChange: 'putMyVar("apiruleurl",input);'
        }
    });
    d.push({
        title: '选择源种类：'+ getMyVar('apiilk',''),
        col_type: 'text_1',
        url: $("完整源","主页源","搜索源", 2, "接口分组：").select(() => {
            if(input=="主页源"){
                putMyVar('apiilk','1');
            }else if(input=="搜索源"){
                putMyVar('apiilk','2');
            }else{
                putMyVar('apiilk','3');
            }
            refreshPage(false);
            return 'hiker://empty';
        }),
        extra: {
            //lineVisible: false
        }
    });
    if(!look){
        if(data){
            d.push({
                title:'删除',
                col_type:'text_3',
                url: $("确定删除接口："+data.name).confirm((data)=>{
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                    deleteData('data');
                    back(true);
                    return "toast://已删除";
                }, data)
            });   
        }else{
            d.push({
                title:'清空',
                col_type:'text_3',
                url:$("确定要清空上面填写的内容？").confirm(()=>{
                    clearMyVar('apiname');
                    clearMyVar('apiauthor');
                    clearMyVar('apiversion');
                    clearMyVar('apiimg');
                    clearMyVar('apitype');
                    clearMyVar('apigroup');
                    clearMyVar('apiilk');
                    clearMyVar('apiruleurl');
                    refreshPage(true);
                    return "toast://已清空";
                })
            });
        }
        d.push({
            title: '保存',
            col_type: 'text_3',
            url: $().lazyRule((jkfilespath,jkfile,oldid) => {
                if (!getMyVar('apiname')) {
                    return "toast://名称不能为空";
                }
                if (!getMyVar('apitype')) {
                    return "toast://类型没有选择";
                }
                if (!getMyVar('apiruleurl') || !fetch(getMyVar('apiruleurl'))) {
                    return "toast://规则文件不存在";
                }
                if (!getMyVar('apiilk')) {
                    return "toast://源种类没有选择";
                }
            
                let name = getMyVar('apiname');
                let author = getMyVar('apiauthor');
                let ruleurl = getMyVar('apiruleurl');
                let version = getMyVar('apiversion', '1');
                let img = getMyVar('apiimg');
                let type = getMyVar('apitype');
                let group = getMyVar('apigroup');
                let ilk = getMyVar('apiilk');
                
                let newid = type + '_' + name;
                let newapi = {
                    id: newid,
                    name: name,
                    version: version,
                    type: type,
                    url: ruleurl,
                    ilk: ilk
                }
                if(author){
                    newapi['author'] = author;
                }
                if(group){
                    newapi['group'] = group;
                }
                if(img){
                    newapi['img'] = img;
                }
                if(oldid){
                    newapi['oldid'] = oldid;
                }
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');

                let urls = [];
                urls.push(newapi);
                let jknum = jiekousave(urls);
                if(jknum==-1){
                    return 'toast://内容异常';
                }else if(jknum==-2){
                    return 'toast://已存在';
                }else{
                    clearMyVar('SrcJu_searchMark');
                    back(true);
                    return "toast://保存成功";
                }

                let datalist = [];
                let sourcedata = fetch(jkfile);
                if (sourcedata != "") {
                    try {
                        eval("datalist=" + sourcedata + ";");
                    } catch (e) {}
                }
                let index = datalist.indexOf(datalist.filter(d => d.id==newid)[0]);
                if (!oldid && index > -1) {
                    return "toast://已存在-" + newid;
                } else {
                    if(newapi.url=='hiker://files/_cache/Juyue/objCodeTmpl.txt'){
                        if(fetch(newapi.url)){
                            writeFile(jkfilespath + newapi + '.txt', fetch(newapi.url));
                            newapi.url = jkfilespath + newapi + '.txt';
                        }else{
                            return "toast://接口规则文件内容为空不能保存";
                        }
                    }
                    index = datalist.indexOf(datalist.filter(d =>  d.id==oldid)[0]);
                    if (oldid && index > -1) {
                        datalist.splice(index, 1);
                    }
                    
                    datalist.push(newapi);
                    writeFile(jkfile, JSON.stringify(datalist));
                    clearMyVar('SrcJu_searchMark');
                    back(true);
                    return "toast://已保存";
                }
            }, jkfilespath, jkfile, data?data.id:"")
        });
    }
    setResult(d);
}
//接口保存
function jiekousave(urls, mode) {
    if(urls.length==0){return 0;}
    let num = 0;
    try{
        let datalist = [];
        let sourcedata = fetch(jkfile);
        if(sourcedata != ""){
            try{
                eval("datalist=" + sourcedata+ ";");
            }catch(e){}
        }
        if(mode==2){//全量模式时，先删除本地
            for(let i=0;i<datalist.length;i++){
                if(datalist[i].retain!=1){
                    if(datalist[i].url.startsWith(jkfilespath)){
                        deleteFile(datalist[i].url);
                    }
                    datalist.splice(i,1);
                    i = i - 1;
                }
            }
        }
        let olddatanum = datalist.length;

        urls.forEach(it=>{
            function checkitem(item) {
                return item.id==it.id;
            }

            if(it.oldid || mode==1){//覆盖已存在接口
                for(let i=0;i<datalist.length;i++){
                    if(datalist[i].id==it.id || datalist[i].id==it.oldid){
                        datalist.splice(i,1);
                        break;
                    }
                }
            }else if(!mode && datalist.some(checkitem)){
                return -2;//已存在
            }
            if(it.url.startsWith(cachepath)){//缓存的数据文件转到jiekou目录
                if(fetch(it.url)){
                    writeFile(jkfilespath + it.id + '.txt', fetch(it.url));
                    it.url = jkfilespath + it.id + '.txt';
                }else{
                    log(it.id + '>接口规则文件为空');
                    delete it.url;
                }
            }
            if(!datalist.some(checkitem)&&it.name&&it.url&&it.type){
                //if(!it.oldurl && olddatanum>0){
                //    it.group = it.group || "新导入";
                //}
                
                if(it.extstr){//带数据内容的保存到data目录
                    writeFile(it.url, it.extstr);
                    delete it['extstr'];
                }
                delete it['oldid'];

                datalist.push(it);
                num = num + 1;
            }
        })
        //setJkSort(datalist, {fail: 0});
        if(num>0){writeFile(jkfile, JSON.stringify(datalist));}
    } catch (e) {
        log("导入失败：" + e.message + " 错误行#" + e.lineNumber); 
        return -1;
    }
    return num;
}
//资源分享
function JYshare(input,data) {
    let sharelist,sm,sm2;
    sm = '聚阅接口';
    if(data){
        sharelist = [];
        sharelist.push(data);
    }else{
        let duoselect = storage0.getMyVar('duodatalist') || [];
        if(duoselect.length>0){
            sharelist = duoselect;
        }else{
            sharelist = storage0.getMyVar("jkdatalist", []);
        }
    }

    for(let i=0;i<sharelist.length;i++){
        let it = sharelist[i];
        if(it.url.startsWith(jkfilespath)){
            it.extstr = fetch(it.url);
            if(!it.extstr){
                log(it.name+">未获取到数据文件，剔除分享");
                sharelist.splice(i,1);
                i = i - 1;
            }
        }else if(!it.url.startsWith(jkfilespath) && (it.url.startsWith("hiker")||it.url.startsWith("file"))){
            log(it.name+">私有路径的数据文件，剔除分享");
            sharelist.splice(i,1);
            i = i - 1;
        }
    }

    if(sharelist.length==0){
        return "toast://有效接口数为0，无法分享";
    }

    let sharetxt = gzip.zip(JSON.stringify(sharelist));
    let sharetxtlength = sharetxt.length;
    if(sharetxtlength>200000 && /云剪贴板2|云剪贴板5|云剪贴板9|云剪贴板10/.test(input)){
        return "toast://超出字符最大限制，建议用云6或文件分享";
    }

    if(input=='云口令文件'){
        sm2 = sharelist.length==1?sharelist[0].name:sharelist.length;
        let code = sm + '￥' + aesEncode('Juyue', sharetxt) + '￥云口令文件';
        let sharefile = 'hiker://files/_cache/Juyue_'+sm2+'_'+$.dateFormat(new Date(),"HHmmss")+'.hiker';
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
            let code = sm+'￥'+aesEncode('Juyue', pasteurl)+'￥' + sm2 + '('+input+')';
            copy('云口令：'+code+`@import=js:$.require("hiker://page/import?rule=聚阅");`);
            return "toast://聚影分享口令已生成";
        }else{
            log('分享失败>'+pasteurl);
            return "toast://分享失败，剪粘板或网络异常>"+pasteurl;
        }
    }
}
//资源导入
function JYimport(input) {
    let cloudimport;
    if(/^云口令：/.test(input)){
        input = input.replace('云口令：','').trim();
        cloudimport = 1;
    }

    let pasteurl,inputname,sm;
    let codelx = "share";
    try{
        pasteurl = aesDecode('Juyue', input.split('￥')[1]);
        inputname = input.split('￥')[0];
        if(inputname=="聚阅资源码"){
            codelx = "dingyue";
            if(input.split('￥')[2] != "文件分享"){
                pasteurl = '云6oooole/xxxxxx/' + pasteurl;
            }
            inputname = "聚阅接口";
        }
    }catch(e){
        return "toast://聚阅：口令有误>"+e.message + " 错误行#" + e.lineNumber;
    }
    try{
        if(inputname=="聚阅接口"){
            sm = "聚阅：接口";
        }else{
            return "toast://聚阅：无法识别的口令";
        }
        let text;
        if(/^http|^云/.test(pasteurl)){
            showLoading('获取数据中，请稍后...');
            text = parsePaste(pasteurl);
            hideLoading();
        }else{
            text = pasteurl;
        }
        if(pasteurl&&!/^error/.test(text)){
            let sharetxt = gzip.unzip(text);
            let pastedata = JSON.parse(sharetxt);           
            let urlnum = 0;
            if(inputname=="聚阅接口"){
                if(codelx=="share"){
                    var pastedatalist = pastedata;
                }else if(codelx=="dingyue"){
                    var pastedatalist = pastedata.接口;
                }
                urlnum = jiekousave(pastedatalist);
            }
            if(urlnum>0&&cloudimport!=1){
                refreshPage(false);
            }
            return "toast://"+sm+"合计："+pastedatalist.length+"，保存："+urlnum;
        }else{
            return "toast://聚阅：口令错误或已失效";
        }
    } catch (e) {
        return "toast://聚阅：无法识别的口令>" + e.message + " 错误行#" + e.lineNumber;
    }
}
//管理中心
function manageSet(){
    addListener("onClose", $.toString(() => {
        //refreshPage(false);
    }));
    setPageTitle("♥管理中心"+getMyVar('SrcJu_Version', ''));

    let d = [];
    d.push({
        col_type: "line_blank"
    });
    d.push({
        title: '依赖管理',
        img: getIcon("管理-依赖.svg"),
        col_type: 'avatar',
        url: 'hiker://empty'
    });
    d.push({
        title: 'github加速管理',
        img: getIcon("管理-箭头.svg"),
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            $.require('ghproxy').proxyPage();
        }),
        col_type: 'text_icon'
    });
    d.push({
        title: '指定聚阅代码库',
        img: getIcon("管理-箭头.svg"),
        url: $(getItem('依赖', ''),"手工指定聚阅代码库地址").input(()=>{
            return $("确定要指定聚阅代码库地址"+input).confirm((input)=>{
                if(input && (!input.startsWith("http") || !input.endsWith("SrcJu.js"))){
                    return "toast://输入有误"
                }
                input = input.trim();
                setItem('依赖', input);
                initConfig({
                    聚阅: input
                })
                deleteCache();
                return "toast://已设置，返回主页刷新";
            },input)
        }),
        col_type: 'text_icon'
    });
    d.push({
        col_type: "line_blank"
    });
    d.push({
        title: '规则配置',
        img: getIcon("管理-配置.svg"),
        col_type: 'avatar',
        url: 'toast://不清楚，可不动'
    });
    /*
    d.push({
        title: '资源码分享管理',
        img: getIcon("管理-箭头.svg"),
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            require(config.聚影.replace(/[^/]*$/,'') + 'SrcJyPublic.js');
            shareResource();
        }),
        col_type: 'text_icon'
    });
    d.push({
        title: '资源码订阅管理',
        img: getIcon("管理-箭头.svg"),
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            require(config.聚影.replace(/[^/]*$/,'') + 'SrcJyPublic.js');
            subResource();
        }),
        col_type: 'text_icon'
    });
    */
    d.push({
        title: '规则日志打印',
        img: getItem('规则日志打印')=="1"?getIcon("管理-开.svg"):getIcon("关.svg"),
        url: $("#noLoading#").lazyRule(() => {
            if(getItem('规则日志打印')=="1"){
                clearItem('规则日志打印');
            }else{
                setItem('规则日志打印','1');
            }
            refreshPage();
            return 'hiker://empty';
        }),
        col_type: 'text_icon'
    });
    d.push({
        title: '接口日志打印',
        img: getItem('接口日志打印')=="1"?getIcon("管理-开.svg"):getIcon("关.svg"),
        url: $("#noLoading#").lazyRule(() => {
            if(getItem('接口日志打印')=="1"){
                clearItem('接口日志打印');
            }else{
                setItem('接口日志打印','1');
            }
            refreshPage();
            return 'hiker://empty';
        }),
        col_type: 'text_icon'
    });
    d.push({
        col_type: "line_blank"
    });
    d.push({
        title: '关于聚阅',
        img: getIcon("聚阅.svg"),
        col_type: 'avatar',
        url: 'toast://哥就是帅'
    });
    d.push({
        title: '主页显示点播',
        img: getItem('主页显示点播')=="1"?getIcon("管理-开.svg"):getIcon("关.svg"),
        url: $("#noLoading#").lazyRule(() => {
            if(getItem('主页显示点播')=="1"){
                clearItem('主页显示点播');
            }else{
                setItem('主页显示点播','1');
            }
            refreshPage();
            return 'toast://设置成功，返回主页刷新';
        }),
        col_type: 'text_icon'
    });
    let colors = [{
        title: '绿意盎然',
        icon: "#4EAF7C"
    },{
        title: '蓝田生玉',
        icon: "#3498DB"
    },{
        title: '暗宝石绿',
        icon: "#00CED1"
    },{
        title: '橙黄橘绿',
        icon: "#F5AB34"
    },{
        title: '热情似火',
        icon: "#D64440"
    },{
        title: '粉装玉琢',
        icon: "#F0838D"
    },{
        title: '重斤球紫',
        icon: "#9B59B5"
    },{
        title: '深卡其色',
        icon: "#BDB76B"
    },{
        title: '亮天蓝色',
        icon: "#87CEFA"
    },{
        title: '泥牛入海',
        icon: "#BD7F45"
    },{
        title: '青出于黑',
        icon: "#336F7A"
    },{
        title: "自定义色",
        icon: getItem('自定义色', '1')
    },{
        title: "恢复初始",
        icon: ""
    }]
    
    colors.forEach(it=>{
        if(getItem('主题颜色','') == it.icon){
            it.title = it.title + '√';
        }
    })
    d.push({
        title: '主题颜色选择',
        img: getIcon("管理-箭头.svg"),
        url: $(colors, 3).select((colors) => {
            if(input=="自定义色"){
                return $(getItem('自定义色', ''), "输入自定义主题颜色代码").input(()=>{
                    if(!input.startsWith('#')){
                        return "toast://颜色代码错误，请以#开头";
                    }
                    setItem('主题颜色', input);
                    setItem('自定义色', input);
                    refreshPage(false);
                    return "hiker://empty";
                })
            }else{
                let color = colors.filter(d => d.title == input)[0].icon;
                if(color){
                    setItem('主题颜色', color);
                }else{
                    clearItem('主题颜色');
                }
                refreshPage();
                return "hiker://empty";
            } 
        }, colors),
        col_type: 'text_icon',
        extra: {
            longClick: [{
                title: "主页大图标不变化",
                js: $.toString(() => {
                    return $("#noLoading#").lazyRule(() => {
                        if(getItem('主页大图标不变化')=="1"){
                            clearItem('主页大图标不变化');
                        }else{
                            setItem('主页大图标不变化','1');
                        }
                        return 'toast://切换成功，返回主页刷新';
                    })
                })
            }]
        }
    });
    d.push({
        title: '查看更新日志',
        img: getIcon("管理-箭头.svg"),
        col_type: 'text_icon',
        url: $("#noLoading#").lazyRule(() => {
            eval(fetch(getItem("依赖","").replace(/[^/]*$/,'') + 'SrcTmplVersion.js'));
            let updateRecords = newVersion.JYUpdateRecords || [];

            const hikerPop = $.require(getItem("依赖","").replace(/[^/]*$/,'') + 'plugins/hikerPop.js');
            hikerPop.updateRecordsBottom(updateRecords);
            
            return "hiker://empty";
        })
    });
    d.push({
        title: '检测版本更新',
        img: getIcon("管理-箭头.svg"),
        col_type: 'text_icon',
        url: $("#noLoading#").lazyRule(() => {
            if(!getItem("依赖","")){
                return "toast://代码库获取异常，无法更新！";
            }
            if(!getItem("依赖","").startsWith("http")){
                return "toast://非在线代码库，无法在线更新！";
            }
            try{
                eval(request(getItem("依赖","").replace(/[^/]*$/,'') + 'SrcTmplVersion.js'))
                let nowVersion = getItem('Version', getMyVar('SrcJu_Version', '0.1').replace('-V',''));
                let nowtime = Date.now();
                if (parseFloat(newVersion.SrcJuying) > parseFloat(nowVersion)) {
                    confirm({
                        title: '发现新版本，是否更新？', 
                        content: '本地V'+nowVersion+' => 云端V'+newVersion.SrcJuying, 
                        confirm: $.toString((nowtime,newVersion) => {
                            setItem('Version', newVersion);
                            setItem('VersionChecktime', nowtime+'time');
                            deleteCache();
                            putMyVar('SrcJu_Version', '-V'+newVersion);
                            refreshPage();
                        },nowtime, newVersion.SrcJuying),
                        cancel:''
                    })
                }else{
                    toast('已经为最新版本');
                }
            }catch(e){
                toast('获取版本信息异常>'+e.message);
            }
            return "hiker://empty";
        })
    });
    d.push({
        title: '支持一下作者',
        img: getIcon("管理-箭头.svg"),
        col_type: 'text_icon',
        url: config.聚阅.replace(/[^/]*$/,'') + 'img/pay.jpg'
    });
    d.push({
        col_type: "line_blank"
    });
    d.push({
        title: '免责申明',
        img: getIcon("管理-免责.svg"),
        col_type: 'avatar',
        url: 'hiker://empty'
    })
    d.push({
        title: `<small>
                1. 本小程序是一个空壳小程序，无任何内置资源。<br>
                2. 本小程序开源<b>完全免费</b>，如果是付费购买的那你被骗了。<br>
                3. 本小程序用于部分b源接口测试，并非所有接口都支持。<br>
	            4. 本小程序仅用于个人学习研究，请于导入24小时内删除！<br>
                <b>开始使用本规则即代表遵守规则条例</b><br>
            </small>`,
        col_type: 'rich_text'
    });
    setResult(d);
}