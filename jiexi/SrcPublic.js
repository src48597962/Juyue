let rulepath = "hiker://files/rules/Src/Jiexi/"; //规则文件路径
let jxfile =  rulepath + 'jiexi.json';

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
// 对应标识
function getJxIde(data){
    return data.stop?'Ⓓ':data.type==0?"Ⓦ":data.type==1?"Ⓙ":data.type==2?"Ⓕ":"";
}
// 文字上色
function colorTitle(title, Color) {
    return '<font color="' + Color + '">' + title + '</font>';
}
// 获取接口对应的显示标题
function getDataTitle(data, ide) {
    let dataTitle = (ide||(getMyVar('批量选择模式')?'○':'')) + getJxIde(data) + data.name + '  ‘‘’’<small><font color=grey>' + (data.type!=2?'  ['+data.url+']':'') + '</font></small>';
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
        if (selectlist.some(item => it.name == item.name)) {
            datatitle = colorTitle(getDataTitle(it, '●'), '#3CB371');
        } else {
            datatitle = getDataTitle(it);
        }

        d.push({
            title: datatitle,
            url: getMyVar('批量选择模式') ? $('#noLoading#').lazyRule((data) => {
                data = JSON.parse(base64Decode(data));
                require(config.jxCodePath + 'SrcPublic.js');
                duoselect(data);
                return "hiker://empty";
            }, base64Encode(JSON.stringify(it))) : $(selectmenu, 2).select((data) => {
                data = JSON.parse(base64Decode(data));
                if (input == "分享") {
                    if (getItem("sharePaste", "") == "") {
                        let pastes = getPastes();
                        pastes.push('云口令文件');
                        return $(pastes, 2).select((data) => {
                            require(config.jxCodePath + 'SrcPublic.js');
                            return JYshare(input, data);
                        }, data)
                    } else {
                        require(config.jxCodePath + 'SrcPublic.js');
                        return JYshare(getItem("sharePaste", ""), data);
                    }
                } else if (input == "编辑") {
                    return $('hiker://empty#noRecordHistory##noHistory#').rule((data) => {
                        require(config.jxCodePath + 'SrcPublic.js');
                        jiexiapi(data);
                    }, data)
                } else if (input == "删除") {
                    return $("确定删除：" + data.name).confirm((data) => {
                        require(config.jxCodePath + 'SrcPublic.js');
                        deleteData(data);
                        deleteItem(data.name);
                        return 'toast://已删除:' + data.name;
                    }, data)
                } else if (input == "测试") {
                    return $("hiker://empty#noRecordHistory##noHistory#").rule((data) => {
                        setPageTitle(data.name + "-接口测试");
                        require(config.聚解.replace(/[^/]*$/, '') + 'SrcJu.js');
                        yiji(data);
                    }, data);
                } else {//置顶、禁用、启用
                    require(config.jxCodePath + 'SrcPublic.js');
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

    writeFile(jkfile, JSON.stringify(datalist));
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
    let parseTypes = ["WEB解析", "JSON解析", "免嗅解析"];
    d.push({
	    title: '解析类型：' + parseTypes[parseInt(data?data.type:getMyVar('parsetype', '0'))],
        col_type: 'text_1',
        url: $(parseTypes, 1).select(() => {
            putMyVar('parsetype', MY_INDEX);

            if(getMyVar('parseurl','').includes('function') && MY_INDEX!=2){
                return "toast://选择的类型错误了";
            }

            refreshPage(false);
            return "toast://是否为web解析，只用于判断进入video播放";
        })
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
                require(config.jxCodePath + 'SrcPublic.js');
                deleteData(data);
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
            require(config.jxCodePath + 'SrcPublic.js');
            let urls= [];
            let parseurl = getMyVar('parseurl');
            let parsename = getMyVar('parsename');
            let parsetype = getMyVar('parsetype');
            
            if(parseurl && parsename && parsetype){
                let arr  = { "name": parsename.trim(), "type": parsetype, "url": parseurl.trim()};
                if(parseext){
                    arr['ext']=  parseext;
                }

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
    /*
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
    */
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
                datalist.splice(i,1);
                i = i - 1;
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