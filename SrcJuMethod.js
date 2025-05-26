//重定义打印日志，只允许调试模式下打印
var xlog = log;
log = function (msg) {
    if (getMyVar("SrcJu_调试模式") || getItem("SrcJu_接口日志")) {
        xlog(msg);
    }
}
//打开指定类型的新页面
function rulePage(datatype, ispage) {
    return $("hiker://empty#noRecordHistory##noHistory#" + (ispage ? "?page=fypage" : "")).rule((datatype) => {
        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
        getYiData(datatype);
    }, datatype)
}
//获取接口对象规则内容
function getObjRule(jkdata, key) {
    eval(fetch(jkdata.url)||jkdata.extstr||"let objRule = {}");
    if(key){
        return objRule[key];
    }
    return objRule;
}
//修正按钮元素
function toerji(item, jkdata) {
    try{
        jkdata = jkdata || storage0.getMyVar('一级源接口信息');
        if(item.url && !/js:|select:|=>|@|toast:|hiker:\/\/page|video:/.test(item.url) && item.col_type!="x5_webview_single" && item.url!='hiker://empty'){
            let extra = item.extra || {};
            extra.name = extra.name || extra.pageTitle || (item.title?item.title.replace(/‘|’|“|”|<[^>]+>/g,""):"");
            extra.img = extra.img || item.pic_url || item.img;
            extra.pageTitle = extra.pageTitle || extra.name;
            extra.url = item.url.replace(/hiker:\/\/empty|#immersiveTheme#|#autoCache#|#noRecordHistory#|#noHistory#|#noLoading#|#/g,"");
            extra.data = jkdata;
            item.url = $("hiker://empty?type="+jkdata.type+"#immersiveTheme##autoCache#").rule(() => {
                require(config.聚阅);
                erji();
            })
            item.extra = extra;
        }
    }catch(e){
        log("一级元素转二级失败>" + e.message + " 错误行#" + e.lineNumber)
    }
    return item;
}
//简繁互转,x可不传，默认转成简体，传2则是转成繁体
function jianfan(str,x) {
    require(config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'SrcSimple.js');
    return PYStr(str,x);
}

//来自阿尔法大佬的主页幻灯片
function banner(start, arr, data, cfg){
    let id = 'juyue';
    let rnum = Math.floor(Math.random() * data.length);
    let item = data[rnum];
    putMyVar('rnum', rnum);
    let time = 5000;
    let col_type='pic_1_card';
    let desc='';
    if (cfg != undefined) {
        time = cfg.time ? cfg.time : time;
        col_type=cfg.col_type?cfg.col_type:col_type;
        desc=cfg.desc?cfg.desc:desc;
    }
    arr.push({
        col_type: col_type,
        img: item.img,
        desc:desc,
        title: item.title,
        url: item.url,
        extra: {
            id: 'bar',
        }
    })
    if (start == false || getMyVar('benstart', 'true') == 'false') {
        unRegisterTask(id)
        return
    }
    let obj = {
        data: data,
        method: config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'SrcJuMethod.js',
        info: storage0.getMyVar('一级源接口信息')
    };
    registerTask(id, time, $.toString((obj) => {
        var data = obj.data;
        var rum = getMyVar('rnum');
        var i = Number(getMyVar('banneri', '0'));
        if (rum != '') {
            i = Number(rum) + 1
            clearMyVar('rnum')
        } else {
            i = i + 1;
        }
        if (i > data.length - 1) {
            i = 0
        }
        var item = data[i];
        try {
            require(obj.method);
            updateItem('bar', toerji(item,obj.info));
        } catch (e) {
            log("幻灯片处理异常>" + e.message + " 错误行#" + e.lineNumber)
            unRegisterTask('juyue')
        }
        putMyVar('banneri', i);
    }, obj))
}