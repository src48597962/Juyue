//修正按钮元素
function toerji(item,info) {
    info = info || storage0.getMyVar('一级源接口信息');
    if(item.url && !/js:|select:|=>|@|toast:|hiker:\/\/page|video:/.test(item.url) && item.col_type!="x5_webview_single" && item.url!='hiker://empty'){
        let extra = item.extra || {};
        extra.name = extra.name || extra.pageTitle || (item.title?item.title.replace(/‘|’|“|”|<[^>]+>/g,""):"");
        extra.img = extra.img || item.pic_url || item.img;
        extra.stype = info.type;
        extra.pageTitle = extra.pageTitle || extra.name;
        extra.surl = item.url.replace(/hiker:\/\/empty|#immersiveTheme#|#autoCache#|#noRecordHistory#|#noHistory#|#noLoading#|#/g,"");
        extra.sname = info.name;
        item.url = $("hiker://empty?type="+info.type+"#immersiveTheme##autoCache#").rule(() => {
            require(config.聚阅);
            erji();
        })
        item.extra = extra;
    }
    return item;
}
//简繁互转,x可不传，默认转成简体，传2则是转成繁体
function jianfan(str,x) {
    require(config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'SrcSimple.js');
    return PYStr(str,x);
}
//写接口数据临时缓存
function cacheData(jkdata){
    let fileid = jkdata.type + '_'+ jkdata.name;
    let cachefile = `hiker://files/_cache/${fileid}.json`;
    if (!fileExist(cachefile)) {
        writeFile(cachefile,JSON.stringify(jkdata));
    }
}
//接口管理多选方法
function duoselect(datas){
    let datalist = [];
    if($.type(datas)=="array"){
        datalist = datas;
    }else if($.type(datas)=="object"){
        datalist.push(datas);
    }
    let duoselect = storage0.getMyVar('SrcJu_duoselect')?storage0.getMyVar('SrcJu_duoselect'):[];
    datalist.forEach(data=>{
        let id = data.type+"_"+data.name;
        if(!duoselect.some(item => item.name == data.name && item.type==data.type)){
            duoselect.push(data);
            updateItem(id, {title:'<font color=#3CB371>'+data.name + (data.parse ? " [主页源]" : "") + (data.erparse ? " [搜索源]" : "")});
        }else{
            for(var i = 0; i < duoselect.length; i++) {
                if(duoselect[i].type+"_"+duoselect[i].name == id) {
                    duoselect.splice(i, 1);
                    break;
                }
            }
            updateItem(id, {title:(data.stop?`<font color=#f20c00>`:"") + data.name + (data.parse ? " [主页源]" : "") + (data.erparse ? " [搜索源]" : "") + (data.stop?`</font>`:"")});
        }
    })
    storage0.putMyVar('SrcJu_duoselect',duoselect);
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
            log(e.message)
            unRegisterTask('juyue')
        }
        putMyVar('banneri', i);
    }, obj))
}