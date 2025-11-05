// 本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
// 加载公共部分
require(config.jxCodePath + 'SrcPublic.js');
// 调用管理页
function jxCallPage(dd) {
    addListener("onClose", $.toString(() => {
        clearMyVar('duodatalist2');
        clearMyVar('批量选择模式2');
        clearMyVar('onlyStopJk2');
        clearMyVar('jxdatalist2');
    }));

    setPageTitle('本地解析管理-调用');

    let d = dd || [];
    d.push({
        title: '增加',
        url: callapi(),
        img: 'http://123.56.105.145/tubiao/more/25.png',
        col_type: "icon_small_4"
    });
    d.push({
        title: '操作',
        url: $([getMyVar('批量选择模式2')?"退出批量":"批量选择",getMyVar('onlyStopJk2')?"退出禁用":"查看禁用","清空所有"], 2).select(() => {
            require(config.jxCodePath + 'SrcJiexi.js');
            if(input=="批量选择" || input=="退出批量"){
                let sm;
                if(getMyVar('批量选择模式2')){
                    clearMyVar('批量选择模式2');
                    clearMyVar('duodatalist2');
                    sm = "退出批量选择模式2";
                }else{
                    putMyVar('批量选择模式2','1');
                    sm = "进入批量选择模式2";
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
                if(getMyVar('onlyStopJk2')){
                    clearMyVar('onlyStopJk2');
                    sm = "退出仅显示禁用列表";
                }else{
                    putMyVar('onlyStopJk2','1');
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
            input = input.trim();
            if(input==""){
                return 'toast://不能为空';
            }
            
            return $("hiker://empty#noRecordHistory##noHistory##immersiveTheme#").rule((input) => {
                require(config.jxCodePath + 'SrcPublic.js');
                importConfirm(input);
            }, input)
        }),
        img: 'http://123.56.105.145/tubiao/more/43.png',
        col_type: "icon_small_4"
    });
    
    let jxdatalist2 = getCalls();
    if(getMyVar('onlyStopJk2')){
        jxdatalist2 = jxdatalist2.filter(item => item.stop);
    }
    let yxdatalist = jxdatalist2.filter(it=>{
        return !it.stop;
    });
    storage0.putMyVar("jxdatalist2", jxdatalist2);
    
    let pastes = getPastes();
    d.push({
        title: '分享',
        url: jxdatalist2.length == 0 ? "hiker://empty" : $(pastes,2).select(()=>{
            require(config.jxCodePath + 'SrcCall.js');
            return JYshare(input);
        }),
        img: 'http://123.56.105.145/tubiao/more/3.png',
        col_type: "icon_small_4"
    });
    d.push({
        col_type: "line"
    });
    d = d.concat(dyItemList(jxdatalist2));
    d.push({
        title: "‘‘’’<small><font color=#f20c00>当前调用数：" + jxdatalist2.length + "，总有效数：" + yxdatalist.length + "</font></small>",
        url: 'hiker://empty',
        col_type: 'text_center_1',
        extra: {
            lineVisible: false
        }
    });
    setResult(d);
}
// 获取接口对应的显示标题
function getDataTitle(data, ide, i) {
    let dataTitle = (i?i+'-':'') + (ide||(getMyVar('批量选择模式2')?'○':'')) + (data.stop?'Ⓓ':"") + data.name;

    return dataTitle;
}
// 接口多选处理方法
function duoselect(data, i){
    let waitlist= [];
    if($.type(data)=='object'){
        waitlist.push(data);
    }else if($.type(data)=='array'){
        waitlist = data;
    }

    let selectlist = storage0.getMyVar('duodatalist2') || [];
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
// 获取调用列表
function dyItemList(datalist) {
    let selectlist = storage0.getMyVar('duodatalist2') || [];
    let d = [];
    datalist.forEach((it, i) => {
        let selectmenu, datatitle;
        selectmenu = ["分享", "编辑", "删除", it.stop ? "启用" : "禁用", "置顶"];
        if (selectlist.some(item => it.name == item.name)) {
            datatitle = colorTitle(getDataTitle(it, '●', i+1), '#3CB371');
        } else {
            datatitle = getDataTitle(it, '', i+1);
            if(it.stop){
                datatitle = '‘‘’’<font color=red>' + datatitle + '</font>';
            }
        }

        d.push({
            title: datatitle,
            url: getMyVar('批量选择模式2') ? $('#noLoading#').lazyRule((data, i) => {
                data = JSON.parse(base64Decode(data));
                require(config.jxCodePath + 'SrcCall.js');
                duoselect(data, i);
                return "hiker://empty";
            }, base64Encode(JSON.stringify(it)), i+1) : $(selectmenu, 2).select((data) => {
                data = JSON.parse(base64Decode(data));
                if (input == "分享") {
                    if (getItem("sharePaste", "") == "") {
                        let pastes = getPastes();
                        return $(pastes, 2).select((data) => {
                            require(config.jxCodePath + 'SrcCall.js');
                            return JYshare(input, data);
                        }, data)
                    } else {
                        require(config.jxCodePath + 'SrcCall.js');
                        return JYshare(getItem("sharePaste", ""), data);
                    }
                } else if (input == "编辑") {
                    require(config.jxCodePath + 'SrcCall.js');
                    return callapi(data);
                } else if (input == "删除") {
                    return $("确定删除：" + data.name).confirm((data) => {
                        require(config.jxCodePath + 'SrcCall.js');
                        deleteData(data);
                        deleteItem(data.name);
                        return 'toast://已删除:' + data.name;
                    }, data)
                } else {//置顶、禁用、启用
                    require(config.jxCodePath + 'SrcCall.js');
                    let sm = dataHandle(data, input);
                    refreshPage(false);
                    return 'toast://' + sm;
                }
            }, base64Encode(JSON.stringify(it))),
            desc: it.word,
            col_type: "text_1",
            extra: {
                id: it.name
            }
        });
    })
    return d;
}
//删除解析入口
function deleteData(data){
    let sourcedata = fetch(jxcallfile);
    eval("let datalist=" + sourcedata + ";");
    let dellist = [];
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

    writeFile(jxcallfile, JSON.stringify(datalist));
    clearMyVar('duodatalist2');
}
// 接口处理公共方法
function dataHandle(data, input) {
    let sourcedata = fetch(jxcallfile);
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
    clearMyVar('duodatalist2');
    return input + '：已处理' + waitlist.length + '个';
}
// 新增、编辑入口
function callapi(data) {
    return $('hiker://empty#noRecordHistory##noHistory##noRefresh#').rule((data) => {
        addListener("onClose", $.toString(() => {
            clearMyVar('apiname');
            clearMyVar('apiword');
            clearMyVar('apicode');
            clearMyVar('isload');
        }));
        
        if(!data){
            setPageTitle("解析调用管理-新增");
        }else{
            if(getMyVar('isload', '0')=="0"){
                setPageTitle("解析调用管理-变更");
                putMyVar('apiname', data.name);
                putMyVar('apiword', data.word||"");
                putMyVar('apicode', data.code||"");
                putMyVar('isload', '1');
            }
        }
        let d = [];
        d.push({
            title:'apiname',
            col_type: 'input',
            desc: "名称",
            extra: {
                titleVisible: false,
                defaultValue: getMyVar('apiname', ""),
                onChange: 'putMyVar("apiname",input)'
            }
        });
        d.push({
            title:'apiword',
            col_type: 'input',
            desc: "匹配关键词",
            extra: {
                titleVisible: false,
                defaultValue: getMyVar('apiword', ""),
                onChange: 'putMyVar("apiword",input)'
            }
        });
        d.push({
            title:'apicode',
            col_type: 'input',
                desc: "调用代码，不写return，地址变量：vipUrl",
            extra: {
                highlight: true,
                type: "textarea",
                titleVisible: false,
                defaultValue: getMyVar('apicode', ""),
                onChange: 'putMyVar("apicode", input)'
            }
        });
        d.push({
            title:'保存',
            col_type:'text_center_1',
            url:$().lazyRule((data)=>{
                let name = getMyVar('apiname');
                let word = getMyVar('apiword');
                let code = getMyVar('apicode');
                if(!name || !word || !code){
                    return "toast://信息不完整";
                }

                require(config.jxCodePath + 'SrcPublic.js');
                let lists = getCalls();

                if(data){
                    lists = lists.filter(v=>v.name!=data.name);
                }else if(lists.some(v=>v.name==name)){
                    return "toast://已存在";
                }
                lists.push({name: name, word: word, code: code})
                writeFile(jxcallfile, JSON.stringify(lists));
                back(true);
                return "toast://已保存";
            }, data)
        });
        setResult(d);
    }, data);
}
//资源分享
function JYshare(input,data) {
    let sharelist, sm, sm2;
    if(data){
        sharelist = [];
        sharelist.push(data);
    }else{
        let duoselect = storage0.getMyVar('duodatalist2') || [];
        if(duoselect.length>0){
            sharelist = duoselect;
        }else{
            sharelist = storage0.getMyVar("jxdatalist2") || [];
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
    sm = '聚阅调用';
    showLoading('分享生成中，请稍后...');
    sm2 = sharelist.length==1?sharelist[0].name:'共' + sharelist.length + '条';
    let pasteurl = sharePaste(sharetxt, input);
    hideLoading();
    if(/^http|^云/.test(pasteurl) && pasteurl.includes('/')){
        log('剪贴板地址>'+pasteurl);
        copy(sm+'￥'+aesEncode('Jujiexi2', pasteurl)+'￥' + sm2 + '('+input+')');
        return "toast://分享口令已生成";
    }else{
        log('分享失败>'+pasteurl);
        return "toast://分享失败，剪粘板或网络异常>"+pasteurl;
    }
}