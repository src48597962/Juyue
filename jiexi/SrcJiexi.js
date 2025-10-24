//本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
let rulepath = "hiker://files/rules/Src/jiexi/"; //规则文件路径
let jxfile =  rulepath + 'jiexi.json';
// 接口管理页
function jiexi() {
    setPageTitle('解析管理');
    let d = [];
    d.push({
        title: '增加',
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            setPageTitle('增加 | 聚解接口');
            require(config.聚解.replace(/[^/]*$/,'') + 'SrcJiexi.js');
            jiexiapi();
        }),
        img: 'http://123.56.105.145/tubiao/more/25.png',
        col_type: "icon_small_4"
    });
    d.push({
        title: '操作',
        url: $([getMyVar('批量选择模式')?"退出批量":"批量选择",getMyVar('onlyStopJk')?"退出禁用":"查看禁用","清空所有"], 2).select(() => {
            require(config.聚解.replace(/[^/]*$/,'') + 'SrcJiexi.js');
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
                    require(config.聚解.replace(/[^/]*$/,'') + 'SrcJiexi.js');
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
        col_type: "icon_small_4"
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
            require(config.聚解.replace(/[^/]*$/,'') + 'SrcJuSet.js');
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
                require(config.聚解.replace(/[^/]*$/,'') + 'SrcJiexi.js');
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
                    require(config.聚解.replace(/[^/]*$/,'') + 'SrcJiexi.js');
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