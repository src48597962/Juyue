// 解析调用入口
const jxCodePath = module.modulePath.slice(0, module.modulePath.lastIndexOf("/") + 1);

initConfig({
    jxCodePath: jxCodePath
})
// 主界面
function home() {
    addListener("onClose", $.toString(() => {
        clearMyVar('主页显示内容');
    }));

    let d = [];
    d.push({
        title: getMyVar('主页显示内容', '1')=="1"?`‘‘’’<b><span style="color: `+Color+`">解析列表</span></b>`:'解析列表',
        url: $('#noLoading#').lazyRule(() => {
            putMyVar('主页显示内容', '1');
            refreshPage();
            return "hiker://emtpy";
        }),
        img: 'http://123.56.105.145/tubiao/system/42.png',
        col_type: "icon_3"
    });
    d.push({
        title: getMyVar('主页显示内容', '1')=="2"?`‘‘’’<b><span style="color: `+Color+`">调用管理</span></b>`:'调用管理',
        url: $('#noLoading#').lazyRule(() => {
            putMyVar('主页显示内容', '2');
            refreshPage();
            return "hiker://emtpy";
        }),
        img: 'http://123.56.105.145/tubiao/system/42.png',
        col_type: "icon_2"
    });
    d.push({
        title: getMyVar('主页显示内容', '1')=="3"?`‘‘’’<b><span style="color: `+Color+`">解析设置</span></b>`:'解析设置',
        url: $('#noLoading#').lazyRule(() => {
            putMyVar('主页显示内容', '3');
            refreshPage();
            return "hiker://emtpy";
        }),
        img: 'http://123.56.105.145/tubiao/system/43.png',
        col_type: "icon_3"
    });
    
    if(getMyVar('主页显示内容', '1')=='1'){
        require(jxCodePath + 'SrcJiexi.js');
        jxItemPage(d);
    }else if(getMyVar('主页显示内容', '1')=='2'){
        require(jxCodePath + 'SrcCall.js');
        jxCallPage(d);
    }else{
        jxSetPage(d);
    }
}
// 解析列表
function jxItem() {
    require(jxCodePath + 'SrcJiexi.js');
    jxItemPage();
}
// 解析列表
function jxSet() {
    require(jxCodePath + 'SrcJiexi.js');
    jxSetPage();
}
// 调用解析
function lazy(input, dataObj) {
    require(jxCodePath + 'SrcParse.js');
    return SrcParse(input, dataObj);
}

$.exports = {
    home: home,
    jxItem: jxItem,
    jxSet: jxSet,
    lazy: lazy
}