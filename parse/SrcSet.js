//变量独立定义
let jxfile = "hiker://files/rules/Src/Juying2/jiexi.json";
let codepath = module.modulePath.slice(0, module.modulePath.lastIndexOf("/") + 1); //(config.聚阅||getPublicItem('聚阅','')).replace(/[^/]*$/,'');
// 全局对象变量gmParams
if(!globalMap0.getVar('SrcJu_gmParams')){
    log("写入解析全局对象变量gmParams");
    globalMap0.putVar('SrcJu_gmParams', {
        codepath: codepath,
        jxfile: jxfile
    });
}

//解析页面
function jiexi() {
    addListener("onClose", $.toString(() => {

    }));

    let d = [];
    let jkIcons = getThemeList(true)['接口图标'];
    d.push({
        title: '增加',
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            setPageTitle('增加 | 聚阅接口');
            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
            jiekouapi();
        }),
        img: getIcon(jkIcons[0].img, false, jkIcons[0].color),
        col_type: "icon_small_4",
        extra: {
            longClick: []
        }
    });
    d.push({
        title: '操作',
        url: $([getMyVar('批量选择模式')?"退出批量":"批量选择",getMyVar('onlyStopJk')?"退出禁用":"查看禁用","清空所有","分组排序",getMyVar('similarTitles')?"退出相似":"查看相似",getMyVar('lookFailDatas')?"退出失败":"查看失败"], 2).select(() => {
            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
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
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
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
            }else if(input=="分组排序"){
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                let groupNames = getGroupNames();

                const hikerPop = $.require(libspath + 'plugins/hikerPop.js');
                hikerPop.setUseStartActivity(false);

                let inputBox;
                let pop = hikerPop.selectBottomRes({
                    options: groupNames,
                    columns: 3,
                    title: "长按调整，最后确定",
                    noAutoDismiss: true,
                    extraInputBox: (inputBox = new hikerPop.ResExtraInputBox({
                        title: '确定',
                        defaultValue: groupNames.join(',') || "",
                        click(s, manage) {
                            Juconfig['groupSort'] = s;
                            writeFile(cfgfile, JSON.stringify(Juconfig));
                            pop.dismiss();
                            refreshPage(false);
                        },
                        titleVisible: true
                    })),
                    longClick(s, i, manage) {
                        hikerPop.selectCenter({
                            options: ["进位", "退位", "置顶", "置底"],
                            columns: 2,
                            title: '选择调整动作',
                            click(input) {
                                if ((i == 0 && (input == "进位" || input == "置顶")) || (i == groupNames.length - 1 && (input == "退位" || input == "置底"))) {
                                    return 'toast://位置移动无效';
                                } else {
                                    if (input == "进位" || input == "退位") {
                                        let newindex = input == "进位" ? i - 1 : i + 1;
                                        groupNames.splice(newindex, 0, groupNames.splice(i, 1)[0]);
                                    } else {
                                        groupNames.splice(i, 1);
                                        if (input == "置顶") {
                                            groupNames.unshift(s);
                                        } else {
                                            groupNames.push(s);
                                        }
                                    }
                                    manage.list.length = 0;
                                    groupNames.forEach(x => {
                                        manage.list.push(x);
                                    });
                                    manage.change();
                                    inputBox.setDefaultValue(groupNames.join(','));
                                }
                            }
                        });
                    }
                });
                return 'hiker://empty';
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
                    return $(getMyVar('lookFailDatas','10'),"查看失败大于多少次的源").input(() => {
                        if(!parseInt(input)||parseInt(input)<0){return 'toast://输入有误，请输入大于1的数字'}
                        putMyVar('lookFailDatas', input);
                        refreshPage(false);
                        return "toast://进入仅显示指定失败次数列表，阀值"+input;
                    })
                }
            }
        }),
        img: getIcon(jkIcons[1].img, false, jkIcons[1].color),
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
            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
            return JYimport(input);
        }),
        img: getIcon(jkIcons[2].img, false, jkIcons[2].color),
        col_type: "icon_small_4"
    });
    let pastes = getPastes();
    pastes.push('云口令文件');
    
    let datalist = getDatas('all');
    if(getMyVar('similarTitles')){
        let t1 = new Date().getTime();
        datalist = similarTitles(datalist, getMyVar('similarTitles'));
        let t2 = new Date().getTime();
        xlog('查看相似耗时：' + (t2-t1) + 'ms');
    }else if(getMyVar('onlyStopJk')){
        datalist = datalist.filter(item => item.stop);
    }else if(getMyVar('lookFailDatas')){
        let sort = {};
        if(fetch(sortfile)){
            eval("sort = " + fetch(sortfile));
        }
        datalist = datalist.filter(item => (sort[item.id]?(sort[item.id].fail||0):0)>parseInt(getMyVar('lookFailDatas')));
    }
    
    let jkdatalist = getGroupLists(datalist, getMyVar("selectGroup","全部"));
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
        img: getIcon(jkIcons[3].img, false, jkIcons[3].color),
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
                deleteItemByCls('jkItemLoadList');
                putMyVar("seacrhJiekou", input);
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                let jkdatalist = storage0.getMyVar("jkdatalist");
                jkdatalist = outputSearchList(jkdatalist, input);
                addItemBefore('jkItemLoading', jkItemList(jkdatalist));
            }
            return 'hiker://empty';
        }),
        desc: "搜你想要的...",
        col_type: "input",
        extra: {
            defaultValue: getMyVar('seacrhJiekou',''),
            titleVisible: true,
            onChange: $.toString(() => {
                if(input=="" && getMyVar("seacrhJiekou")){
                    deleteItemByCls('jkItemLoadList');
                    clearMyVar('seacrhJiekou');
                    clearMyVar('seacrhDataList');
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                    let jkdatalist = storage0.getMyVar("jkdatalist");
                    addItemBefore('jkItemLoading', jkItemList(jkdatalist));
                }
            })
        }
    });

    let groupNames = getJkGroups(datalist);
    groupNames.unshift("全部");
    let Color = getItem('主题颜色','#3399cc');
    let groupColtype = getItem("groupColtype", "flex_button");
    let lockgroups = juItem2.get('lockgroups') || Juconfig["lockgroups"] || [];
    let hidegroups = juItem2.get('hidegroups') || [];
    groupNames.forEach(it =>{
        let obj = {
            title: (getMyVar("selectGroup","全部")==it?`““””<b><span style="color: `+Color+`">`+it+`</span></b>`:it) + (lockgroups.indexOf(it)>-1?"🔒":"") + (hidegroups.indexOf(it)>-1?"👁️‍🗨️":""),
            url: $('#noLoading#').lazyRule((it) => {
                if(getMyVar("selectGroup")!=it){
                    putMyVar("selectGroup",it);
                    refreshPage(false);
                }
                return "hiker://empty";
            },it),
            col_type: groupColtype,
            extra: {
                backgroundColor: getMyVar("selectGroup","全部")==it?"#20" + Color.replace('#',''):""
            }
        }
        
        if(it == "全部"){
            obj.extra.longClick = [{
                title: "分组样式:" + getItem("groupColtype", "flex_button"),
                js: $.toString(() => {
                    return $(["flex_button","scroll_button"], 1).select(() => {
                        setItem("groupColtype", input);
                        refreshPage(false);
                    })
                })
            },{
                title: "列表排序:" + getItem("sourceListSort", "更新时间"),
                js: $.toString(() => {
                    return $(["更新时间","接口名称","使用频率"], 1).select(() => {
                        setItem("sourceListSort", input);
                        refreshPage(false);
                    })
                })
            },{
                title: juItem2.get('noShowType')=='1'?"强制显示分类":"优先显示分组",
                js: $.toString(() => {
                    if(juItem2.get('noShowType')=='1'){
                        juItem2.clear('noShowType')
                    }else{
                        juItem2.set('noShowType', '1')
                    }
                    return 'toast://已切换，切源列表、快速分组、接口列表同时生效';
                })
            }]
        }else{
            obj.extra.longClick = [{
                title: lockgroups.indexOf(it)>-1?"解锁":"加锁",
                js: $.toString((it) => {
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');//先临时放着吧
                    let lockgroups = juItem2.get('lockgroups') || Juconfig["lockgroups"] || [];
                    if(lockgroups.indexOf(it)>-1){
                        const hikerPop = $.require(libspath + 'plugins/hikerPop.js');
                        if (hikerPop.canBiometric() !== 0) {
                            return "toast://无法调用生物学验证";
                        }
                        lockgroups = lockgroups.filter(item => item !== it);
                        let pop = hikerPop.checkByBiometric(() => {
                            juItem2.set('lockgroups', lockgroups);
                            refreshPage(false);
                        });
                    }else{
                        lockgroups.push(it);
                        juItem2.set('lockgroups', lockgroups);
                        refreshPage(false);
                    }
                },it)
            },{
                title: hidegroups.indexOf(it)>-1?"显示":"隐藏",
                js: $.toString((it) => {
                    let hidegroups = juItem2.get('hidegroups') || [];
                    if(hidegroups.indexOf(it)>-1){
                        hidegroups = hidegroups.filter(item => item !== it);
                    }else{
                        hidegroups.push(it);
                    }
                    juItem2.set('hidegroups', hidegroups);
                    refreshPage(false);
                },it)
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
                let jkdatalist = storage0.getMyVar("seacrhDataList") || storage0.getMyVar("jkdatalist") || [];
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
                    //refreshPage(false);
                    let ids = selectlist.map(v=>v.id);
                    deleteItem(ids);
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
                        return $("","选定的"+selectlist.length+"个接口新分组名，留空则清空").input((selectlist)=>{
                            input = input.trim();
                            if(input=="全部"){
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

        d.push({
            title: "批量检测",
            url: !config.聚阅.includes('000')?"toast://暂未上线":$('#noLoading#').lazyRule(() => {
                let duoselect = storage0.getMyVar('duodatalist') || [];
                duoselect = duoselect.filter(v=>!v.stop);
                if(duoselect.length==0){
                    return "toast://未选择";
                }
                storage0.putMyVar('批量检测_待检列表', duoselect);//写入待检测源
                
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                return batchTestSource();
            }),
            col_type: 'scroll_button',
            extra: {
                longClick: [{
                    title: "清除",
                    js: $.toString(() => {
                        clearItem('checkSourcetime');
                        return "toast://可以了"
                    })
                }]
            }
        })
    }
    if(getMyVar('seacrhJiekou')){
        jkdatalist = outputSearchList(jkdatalist, getMyVar('seacrhJiekou'));
    }
    
    d = d.concat(jkItemList(jkdatalist));
    
    d.push({
        title: "‘‘’’<small><font color=#f20c00>当前接口数：" + jkdatalist.length + "，总有效数："+yxdatalist.length+"</font></small>",
        url: 'hiker://empty',
        col_type: 'text_center_1',
        extra: {
            id: 'jkItemLoading'
        }
    });
    setResult(d);
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
                if(datalist[i].retain!=1){
                    datalist.splice(i,1);
                    i = i - 1;
                }
            }
        }
        
        urls.forEach(it=>{
            if(it.oldurl || mode==1){
                for(let i=0;i<datalist.length;i++){
                    if(datalist[i].url==it.url||datalist[i].url==it.oldurl){
                        datalist.splice(i,1);
                        break;
                    }
                }
            }

            function checkitem(item) {
                return item.url==it.url;
            }

            if(!datalist.some(checkitem)&&it.url&&it.name&&/^http|^functio/.test(it.url)){
                delete it['oldurl'];
                datalist.push(it);
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