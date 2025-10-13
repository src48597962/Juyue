//本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
//本地接口管理
function SRCSet() {
    addListener("onClose", $.toString(() => {
        clearMyVar('duodatalist');
        clearMyVar("seacrhJiekou");
        clearMyVar('jkdatalist');
        clearMyVar('seacrhDataList');
        clearMyVar('批量选择模式');
        clearMyVar('onlyStopJk');
        clearMyVar('similarTitles');
        clearMyVar('lookFailDatas');
        clearMyVar('selectGroup');
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
                            juItem2.set('groupSort', s);
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
            writeFile("hiker://files/_cache/Juyue/cloudimport.txt", input);
            return "hiker://page/importConfirm#immersiveTheme##noRecordHistory##noHistory#?rule=聚阅"
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
    let lockgroups = juItem2.get('lockgroups') || [];
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
                    let lockgroups = juItem2.get('lockgroups') || [];
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
            url: $('#noLoading#').lazyRule(() => {
                let duoselect = storage0.getMyVar('duodatalist') || [];
                duoselect = duoselect.filter(v=>!v.stop && ['1', '3'].includes(v.ilk));
                if(duoselect.length==0){
                    return "toast://未选择有效的待检源";
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

//接口新增/编辑入口
function jiekouapi(data, look) {
    addListener("onClose", $.toString(() => {
        clearMyVar('apiname');
        clearMyVar('apiauthor');
        clearMyVar('apiversion')
        clearMyVar('apiimg');
        clearMyVar('apitype');
        clearMyVar('apigroup');
        clearMyVar('apiilk');
        clearMyVar('apiruleurl');
        clearMyVar('apitmpl');
        clearMyVar('isload');
        clearMyVar('tmpldatas');
        clearMyVar('tmpldata');
    }));
    if(data){
        if(getMyVar('isload', '0')=="0"){
            putMyVar('apiname', data.name);
            putMyVar('apiauthor', data.author||"");
            putMyVar('apiversion', data.version||"");
            putMyVar('apiimg', data.img||"");
            putMyVar('apitype', data.type||"");
            putMyVar('apigroup', data.group||"");
            putMyVar('apiilk', data.ilk||"");
            putMyVar('apiruleurl', data.url||"");
            putMyVar('isload', '1');
            if(data.tmpl && data.tmpl.name){
                putMyVar('apitmpl', data.tmpl.name);
                storage0.putMyVar('tmpldata', data.tmpl);
            }
        }
    }

    let d = [];
    d.push({
        title: '源名称',
        col_type: 'input',
        desc: "输入源名称",
        extra: {
            defaultValue: getMyVar('apiname') || "",
            titleVisible: false,
            onChange: $.toString(() => {
                putMyVar('apiname', input);
            })
        }
    });
    d.push({
        title: '源作者：'+ getMyVar('apiauthor',''),
        col_type: 'text_1',
        url: $(getMyVar('apiauthor',''), "输入源作者").input(() => {
            putMyVar('apiauthor',input);
            refreshPage(false);
            return 'toast://源作者已设置为：' + input;
        }),
        extra: {
            //lineVisible: false
        }
    });
    d.push({
        title: '源版本号：'+ getMyVar('apiversion', $.dateFormat(new Date(),"yyyyMMdd").toString()),
        col_type: 'text_1',
        url: $(getMyVar('apiversion', $.dateFormat(new Date(),"yyyyMMdd").toString()), "输入源版本号").input(() => {
            putMyVar('apiversion',input);
            refreshPage(false);
            return 'toast://源版本号已设置为：' + input;
        })
    });
    d.push({
        title: '源大类型：'+ getMyVar('apitype',''),
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
    d.push({
        title: '源小分组：'+ getMyVar('apigroup',''),
        col_type: 'text_1',
        url: $('#noLoading#').lazyRule(()=>{
            let selectTag = getMyVar('apigroup','').split(',').filter(item => item !== '');

            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
            let groupNames = getGroupNames();
            selectTag.forEach(it=>{
                if(groupNames.indexOf(it)==-1 && runTypes.indexOf(it)==-1){
                    groupNames.push(it);
                }
            })
            groupNames = groupNames.filter(item => runTypes.indexOf(item)==-1).map(it=>{
                if(selectTag.indexOf(it)>-1){
                    it = '‘‘’’<span style="color:red">' + it;
                }
                return it;
            })
            
            const hikerPop = $.require(libspath + "plugins/hikerPop.js");
            let FlexSection = hikerPop.FlexMenuBottom.FlexSection;
            let inputBox;
            let pop = hikerPop.FlexMenuBottom({
                extraInputBox: (inputBox = new hikerPop.ResExtraInputBox({
                    hint: "已选择的分组标签",
                    title: "确定",
                    defaultValue: getMyVar('apigroup',''),
                    click(s, pop) {
                        s = s.replace(/，/g, ',');
                        putMyVar('apigroup', s.split(',').filter(item => item !== '' && runTypes.indexOf(item)==-1).join(','));
                        refreshPage();
                        pop.dismiss();
                    }
                })), 
                sections: [new FlexSection("", groupNames)], 
                title: "选择分组标签", 
                click(button, sectionIndex, i) {
                    if(button.title.includes('‘‘’’')){
                        let newtitle = button.title.replace('‘‘’’<span style="color:red">', '');
                        selectTag = selectTag.filter(x=>x!=newtitle);
                        pop.updateButtonTitle(sectionIndex, i, newtitle);
                    }else{
                        selectTag.push(button.title);
                        pop.updateButtonTitle(sectionIndex, i, '‘‘’’<span style="color:red">'+button.title);
                    }
                    inputBox.setDefaultValue(selectTag.join(','));
                }
            });
            return "hiker://empty";
        }),
        extra: {
            //lineVisible: false
        }
    });
    d.push({
        title: '源图标',
        col_type: 'input',
        desc:"源图标没有可留空",
        extra: {
            defaultValue: getMyVar('apiimg') || "",
            titleVisible: false,
            onChange: $.toString(() => {
                putMyVar('apiimg', input);
            })
        }
    });

    //let ilks = ["主页源","搜索源","完整源","模板源","依赖源"];
    let ilkindex = -1;
    if(getMyVar('apiilk')){
        ilkindex = parseInt(getMyVar('apiilk')) -1;
    }
    d.push({
        title: '选择源种类：'+ (ilkindex>-1?ilks[ilkindex]:''),
        col_type: 'text_1',
        url: $(ilks, 2, "选择源类型：").select(() => {
            putMyVar('apiilk', MY_INDEX+1);
            refreshPage(false);
            return 'hiker://empty';
        }),
        extra: {
            //lineVisible: false
        }
    });

    if(['1', '2', '3'].includes(getMyVar('apiilk',''))){
        let tmpldatas = storage0.getMyVar('tmpldatas');
        if(!tmpldatas){
            tmpldatas = getDatas('tmpl', true).map(it=>{
                return {
                    id: it.id,
                    name: it.name
                }
            });
            storage0.putMyVar('tmpldatas', tmpldatas);
        }
        let tmpllist = ['parseCode'];
        tmpldatas.forEach(it=>{
            tmpllist.push(it.name);
        })
        d.push({
            title: '选择模板：' + getMyVar('apitmpl', 'parseCode'),
            url: $(tmpllist, 2, '选择模板类型').select(()=>{
                putMyVar('apitmpl', input);
                
                let index = MY_INDEX - 1;
                if(index>-1){
                    let tmpldatas = storage0.getMyVar('tmpldatas');
                    let tmpldata = tmpldatas[index];
                    storage0.putMyVar('tmpldata', tmpldata);
                }else{
                    clearMyVar('tmpldata');
                }
                
                refreshPage(false);
                return 'hiker://empty';
            }),
            col_type: 'text_1'
        });
    }
    d.push({
        title: data||getMyVar('apiruleurl')?'查看':'新建',
        col_type: 'input',
        desc: "接口规则文件，不能为空",
        url: $.toString((isnew) => {
            let file = getMyVar('apiruleurl','');
            if(isnew && !file){
                let tmpl;
                let apitmpl = getMyVar('apitmpl', 'parseCode');
                if(getMyVar('apiilk') == '5'){
                    tmpl= '//依赖源，作者自定义调用，其他源接口请勿直接调用此模板';
                }else if(apitmpl=='parseCode'){
                    tmpl= fc(config.聚阅.replace(/[^/]*$/,'') + `template/parseCode.js`, 96);
                }else{
                    let tmplparse;
                    let tmpldata = storage0.getMyVar('tmpldata');
                    if(tmpldata){
                        // 读取模板源，查看是否有新建模板
                        function getSource(input) {
                            let rule = readFile(`${jkfilespath}${input.id}.txt`);
                            if(rule){
                                eval(rule);
                                return parse;
                            }else{
                                return {};
                            }
                        }
                        tmplparse = getSource(tmpldata).新建模板;
                    }
                    if(tmplparse){
                        tmpl = tmplparse;
                    }else{
                        try{
                            tmpl= fetch(libspath + `template/${apitmpl}.js`);
                        }catch(e){}
                    }
                }
                if(tmpl){
                    let codeTmpl = 'hiker://files/_cache/Juyue/parseCodeTmpl.txt';
                    writeFile(codeTmpl, tmpl);
                    file = codeTmpl;
                }
            }

            if(fileExist(file)){
                let jsstr = $.toString((file)=>{
                    try {
                        let filestr = fetch(file);
                        if(getMyVar('apiilk') == '5'){//依赖源
                            putMyVar('apiversion', $.dateFormat(new Date(),"yyyyMMdd").toString());
                        }else{
                            eval(filestr); 
                            let is;
                            if(parse['作者'] && parse['作者'] != getMyVar('apiauthor','')){
                                putMyVar('apiauthor', parse['作者']);
                                is = 1;
                            }
                            let version = parse['版本'] || parse['Ver'] || parse['ver'] || $.dateFormat(new Date(),"yyyyMMdd");
                            if(version != getMyVar('apiversion','')){
                                putMyVar('apiversion', version.toString());
                                is = 1;
                            }
                            if(is){
                                toast('作者、版本有变化，记得点保存');
                            }
                        }
                        putMyVar("apiruleurl", file);
                        refreshPage(false);
                    } catch (e) {
                        toast("文件存在错误>" + e.message + " 错误行#" + e.lineNumber);
                    }
                },file)
                return "editFile://" + file + `@js=` + jsstr;
            }else{
                return "toast://文件不存在，无法查看";
            }
        }, data?0:1),
        extra: {
            titleVisible: true,
            defaultValue: getMyVar('apiruleurl',''),
            onChange: data?'toast("不能修改文件地址");':'putMyVar("apiruleurl",input);'
        }
    });
    
    if(!look){
        if(data){
            d.push({
                title:'删除',
                col_type:'text_3',
                url: $("确定删除接口："+data.name).confirm((data)=>{
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                    deleteData(data);
                    back(false);
                    deleteItem(data.id);
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
            url: $().lazyRule((data) => {
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
                let newapi = outputNewData(data);
                if(typeof newapi == 'string'){
                    return newapi;
                }

                let urls = [];
                urls.push(newapi);
                let jknum = jiekousave(urls);
                if(jknum==-1){
                    return 'toast://内容异常';
                }else if(jknum==-2){
                    return 'toast://已存在';
                }else{
                    clearMyVar('SrcJu_searchMark');
                    clearMyVar('一级源接口信息');
                    back(true);
                    return "toast://保存成功";
                }
            }, data),
            extra: {
                longClick: [{
                    title: "分享代码文件",
                    js: $.toString(() => {
                        if(!getMyVar('apiruleurl') || !fetch(getMyVar('apiruleurl'))){
                            return 'toast://代码文件不存在';
                        }
                        return 'share://'+ getMyVar('apiruleurl');
                    })
                },{
                    title: "打开代码文件",
                    js: $.toString(() => {
                        if(!getMyVar('apiruleurl') || !fetch(getMyVar('apiruleurl'))){
                            return 'toast://代码文件不存在';
                        }
                        return 'openFile://'+ getMyVar('apiruleurl');
                    })
                }]
            }
        });
    }
    d.push({
        title:'测试',
        col_type:'text_3',
        url: $('#noLoading#').lazyRule((data)=>{
            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
            let newapi = outputNewData(data);
            if(typeof newapi == 'string'){
                return newapi;
            }
            
            return $("hiker://empty#noRecordHistory##noHistory#").rule((data) => {
                setPageTitle(data.name+"-接口测试");
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJu.js');
                yiji(data);
            }, newapi);
        }, data),
        extra: {
            longClick: [{
                title: "开发助手",
                js: $.toString(() => {
                    return 'hiker://debug';
                })
            }]
        }
    }); 
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
                        if(mode==1 && datalist[i].group){
                            it.group = datalist[i].group;
                        }
                        datalist.splice(i,1);
                        break;
                    }
                }
            }else if(!mode && datalist.some(checkitem)){
                return -2;//已存在
            }
            
            if(!datalist.some(checkitem)){
                if(it.url.startsWith(cachepath)){//缓存的数据文件转到jiekou目录
                    if(fetch(it.url)){
                        let newurl = jkfilespath + it.id + '.txt'
                        writeFile(newurl, fetch(it.url));
                        it.url = newurl;
                    }else{
                        xlog(it.name + '>接口规则文件为空');
                        delete it.url;
                    }
                }else if(it.extstr){//带数据内容的保存到data目录
                    writeFile(it.url, it.extstr);
                    delete it['extstr'];
                }

                //if(!it.oldurl && olddatanum>0){
                //    it.group = it.group || "新导入";
                //}
                
                delete it['oldid'];
                delete it['oldversion'];

                if(it.name&&it.url&&it.type){
                    datalist.push(it);
                    num = num + 1;
                }
            }
        })
        //setJkSort(datalist, {fail: 0});
        if(num>0){
            writeFile(jkfile, JSON.stringify(datalist));
            clearMyVar('SrcJu_searchMark');//接口变化，清搜索结果缓存
        }
    } catch (e) {
        xlog("导入失败：" + e.message + " 错误行#" + e.lineNumber); 
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
            sharelist = storage0.getMyVar("seacrhDataList") || storage0.getMyVar("jkdatalist", []);
        }
    }

    for(let i=0;i<sharelist.length;i++){
        let it = sharelist[i];
        if(it.url.startsWith(jkfilespath)){
            it.extstr = fetch(it.url);
            if(!it.extstr){
                xlog(it.name+">未获取到数据文件，剔除分享");
                sharelist.splice(i,1);
                i = i - 1;
            }
        }else if(!it.url.startsWith(jkfilespath) && (it.url.startsWith("hiker")||it.url.startsWith("file"))){
            xlog(it.name+">私有路径的数据文件，剔除分享");
            sharelist.splice(i,1);
            i = i - 1;
        }
    }

    if(sharelist.length==0){
        return "toast://有效接口数为0，无法分享";
    }
    let gzip = $.require(libspath + "plugins/gzip.js");
    let sharetxt = gzip.zip(JSON.stringify(sharelist));
    let sharetxtlength = sharetxt.length;
    if(sharetxtlength>200000 && /云剪贴板2|云剪贴板5|云剪贴板9|云剪贴板10/.test(input)){
        return "toast://超出字符最大限制，建议用云6或文件分享";
    }

    if(input=='云口令文件'){
        sm2 = sharelist.length==1?sharelist[0].name:sharelist.length;
        let code = sm + '￥' + aesEncode('Juyue', sharetxt) + '￥云口令文件';
        let sharefile = 'hiker://files/_cache/【聚阅源】_'+sm2+'_'+$.dateFormat(new Date(),"HHmmss")+'.hiker';
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
            xlog('剪贴板地址>'+pasteurl);
            let code = sm+'￥'+aesEncode('Juyue', pasteurl)+'￥' + sm2 + (input?'('+input.replace('剪贴板','')+')':'');
            copy('云口令：'+code+`@import=js:$.require("hiker://page/import?rule=聚阅");`);
            return "toast://聚阅分享口令已生成";
        }else{
            xlog('分享失败>'+pasteurl);
            return "toast://分享失败，剪粘板或网络异常>"+pasteurl;
        }
    }
}

//云口令提取
function extractimport(str){
    showLoading('获取数据中，请稍后...');
    let strs = str.replace(/\\n|云口令：/g, '').split('@import=');
    strs = strs.filter(v=>v&&v.includes('聚阅接口￥'));
    let datas = [];
    strs.forEach(it=>{
        try{
            let code = aesDecode('Juyue', it.split('￥')[1]);
            let text;
            if(/^http|^云/.test(code)){//云分享
                text = parsePaste(code);
            }else{//文件分享
                text = code;
            }
            if(text && !/^error/.test(text)){
                let gzip = $.require(libspath + "plugins/gzip.js");
                let sharetxt = gzip.unzip(text);
                let imports = JSON.parse(sharetxt); 
                imports.forEach(item=>{
                    if(!datas.some(v=>v.id==item.id)){
                        datas.push(item);
                    }
                })
            }
        } catch (e) {
            xlog("聚阅：获取口令数据出错>" + e.message);
        }
    })
    hideLoading();
    return datas;
}
// 云口令导入确认页
function importConfirm(importStr) {
    let importfile = "hiker://files/_cache/Juyue/cloudimport.txt";
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
    let sourcedata = fetch(jkfile);
    if(sourcedata != ""){
        try{
            eval("datalist = " + sourcedata+ ";");
        }catch(e){}
    }
    let newdatas = [];
    let olddatas = [];
    importdatas.forEach(it=>{
        it.id = it.id.toString();
        if(!datalist.some(v=>v.id==it.id)){
            newdatas.push(it);
        }else{
            let olddata = datalist.filter(v=>v.id==it.id)[0];
            it.oldversion = olddata.version || "";
            olddatas.push(it);
        }
    })
    const prop = 'oldversion';
    importdatas.sort((a, b) => {
        let hasA = prop in a;
        let hasB = prop in b;

        if (hasA && !hasB) return -1;
        if (!hasA && hasB) return 1;
        return 0;
    });
    let oldnum = importdatas.length - newdatas.length;
    let Color = getItem('主题颜色','#3399cc');

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
            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
            let importlist = storage0.getMyVar('importConfirm', []);
            let num = jiekousave(importlist, 0);
            back(false);
            return "toast://增量导入"+(num<0?"失败":num);
        }),
        img: importdatas.length>0&&oldnum==0?"":getIcon("管理-增量导入.svg"),
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
            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
            let importlist = storage0.getMyVar('importConfirm', []);
            let num = jiekousave(importlist, 1);
            back(false);
            return "toast://全量导入"+(num<0?"失败":num);
        }):$("全部覆盖导入，确认？").confirm(()=>{
            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
            let importlist = storage0.getMyVar('importConfirm', []);
            let num = jiekousave(importlist, 1);
            back(false);
            return "toast://全量导入"+(num<0?"失败":num);
        }),
        img: getIcon("管理-全量导入.svg"),
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

    importdatas.forEach(it=>{
        let isnew = newdatas.some(v=>v.id==it.id);
        let datamenu = ["确定导入", "修改名称", "设定分组", "接口测试"];
        if(!it.url.startsWith('http')){
            datamenu.push("查看文件");
        }
        let ittitle,itimg,itcol;
        if((MY_NAME=="海阔视界"&&getAppVersion()>=5566)||(MY_NAME=="嗅觉浏览器"&&getAppVersion()>=2305)){
            ittitle = it.name + "‘‘’’<small><font color=grey>(" + it.type + ")" + (it.author?"["+it.author+"]":"") + (it.oldversion?"-本V"+it.oldversion:"");
            itimg = it.img || "http://123.56.105.145/tubiao/ke/31.png";
            itcol = "icon_1_left_pic";
        }else{
            ittitle = it.name + "<small><font color=grey>(" + it.type + ")" + (it.author?"["+it.author+"]":"") + "{" + (isnew?"新增加":"已存在") + "}";
            itimg = getIcon("管理-箭头.svg");
            itcol = "text_icon";
        }
        d.push({
            title: ittitle,
            url: $(datamenu, 2).select((data, isnew) => {
                data = JSON.parse(base64Decode(data));

                if (input == "确定导入") {
                    function iConfirm(data) {
                        let dataid = data.id;
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuSet.js');
                        let num = jiekousave([data], 1);
                        let importlist = storage0.getMyVar('importConfirm', []);
                        if(importlist.length==1){
                            back(false);
                        }else{
                            let index2 = importlist.findIndex(item => item.id === dataid);
                            importlist.splice(index2, 1);
                            storage0.putMyVar('importConfirm', importlist);
                            deleteItem(dataid);
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
                        let dataid = data.id;
                        let importlist = storage0.getMyVar('importConfirm', []);
                        let index = importlist.findIndex(item => item.id === dataid);
                        importlist[index].name = input;
                        storage0.putMyVar('importConfirm', importlist);
                        refreshPage(false);
                        return "toast://已修改名称";
                    }, data);
                }else if (input == "设定分组") {
                    let dataid = data.id;
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                    let groupNames = getGroupNames();
                    groupNames.unshift("清除");
                    return $(groupNames, 2, "选择分组").select((dataid) => {
                        let importlist = storage0.getMyVar('importConfirm', []);
                        let index = importlist.findIndex(item => item.id === dataid);
                        if(input=="清除"){
                            delete importlist[index].group;
                        }else{
                            importlist[index].group = input;
                        }
                        storage0.putMyVar('importConfirm', importlist);
                        refreshPage(false);
                        return 'toast://已设置分组';
                    }, dataid)
                }else if (input == "接口测试") {
                    return $("hiker://empty#noRecordHistory##noHistory#").rule((data) => {
                        setPageTitle(data.name+"-接口测试");
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJu.js');
                        yiji(data);
                    }, data)
                }else if (input == "查看文件") {
                    writeFile('hiker://files/_cache/Juyue/lookimportfile.txt', data.extstr);
                    return "editFile://hiker://files/_cache/Juyue/lookimportfile.txt";
                }else if (input == "删除文件") {
                    return $("删除"+data.ext+"，确认？").confirm((data)=>{
                        deleteFile(data.ext);
                        clearMyVar('SrcJu_searchMark');
                        let importlist = storage0.getMyVar('importConfirm', []);
                        if(importlist.length==1){
                            back(false);
                        }else{
                            let index2 = importlist.findIndex(item => item.id === data.id);
                            importlist.splice(index2, 1);
                            storage0.putMyVar('importConfirm', importlist);
                            deleteItem(data.id);
                        }
                        return "toast://已删除";
                    }, data)
                }
            }, base64Encode(JSON.stringify(it)), isnew),
            desc: "““””<b><font color="+Color+">"+(isnew?"新增加":"已存在") + "</font></b>" + (it.version?(it.version==it.oldversion?"":"<font color="+Color+"0>")+"-云V"+it.version:""),
            img: itimg,
            col_type: itcol,
            extra: {
                id: it.id
            }
        });
    })

    setResult(d);
}
