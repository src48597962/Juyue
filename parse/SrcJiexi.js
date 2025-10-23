// 接口管理页
function jiexi() {
    setPageTitle('接口管理 | 聚解');
    let d = [];
    d.push({
        title: '增加',
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            setPageTitle('增加 | 聚解接口');
            require(config.聚解.replace(/[^/]*$/,'') + 'SrcJiePublic.js');
            jiexiapi();
        }),
        img: 'http://123.56.105.145/tubiao/more/25.png',
        col_type: "icon_small_4"
    });
    d.push({
        title: '操作',
        url: $([getMyVar('批量选择模式')?"退出批量":"批量选择",getMyVar('onlyStopJk')?"退出禁用":"查看禁用","清空所有"], 2).select(() => {
            require(config.聚解.replace(/[^/]*$/,'') + 'SrcJiePublic.js');
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
                    require(config.聚解.replace(/[^/]*$/,'') + 'SrcJiePublic.js');
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
                require(config.聚解.replace(/[^/]*$/,'') + 'SrcJiePublic.js');
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
                    require(config.聚解.replace(/[^/]*$/,'') + 'SrcJiePublic.js');
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