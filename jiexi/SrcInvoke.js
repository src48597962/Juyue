// 本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
// 解析调用统一入口
const jxCodePath = module.modulePath.slice(0, module.modulePath.lastIndexOf("/") + 1);
// 写入config，方便调用
initConfig({
    jxCodePath: jxCodePath
})
let Color = getItem('主题颜色','#3399cc');

// 主界面
function home() {
    addListener("onClose", $.toString(() => {
        clearMyVar('主页显示内容');
    }));

    let d = [];
    d.push({
        title: getMyVar('主页显示内容', '1')=="1"?`<b><span style="color: `+Color+`">解析列表</span></b>`:'解析列表',
        url: $('#noLoading#').lazyRule(() => {
            putMyVar('主页显示内容', '1');
            refreshPage();
            return "hiker://emtpy";
        }),
        img: 'http://123.56.105.145/tubiao/system/42.png',
        col_type: "icon_small_3"
    });
    d.push({
        title: getMyVar('主页显示内容', '1')=="2"?`<b><span style="color: `+Color+`">调用管理</span></b>`:'调用管理',
        url: $('#noLoading#').lazyRule(() => {
            putMyVar('主页显示内容', '2');
            refreshPage();
            return "hiker://emtpy";
        }),
        img: 'http://123.56.105.145/tubiao/system/41.png',
        col_type: "icon_small_3"
    });
    d.push({
        title: getMyVar('主页显示内容', '1')=="3"?`<b><span style="color: `+Color+`">解析设置</span></b>`:'解析设置',
        url: $('#noLoading#').lazyRule(() => {
            putMyVar('主页显示内容', '3');
            refreshPage();
            return "hiker://emtpy";
        }),
        img: 'http://123.56.105.145/tubiao/system/43.png',
        col_type: "icon_small_3"
    });
    d.push({
        col_type: "line_blank"
    });
    if(getMyVar('主页显示内容', '1')=='1'){
        require(jxCodePath + 'SrcJiexi.js');
        jxItemPage(d);
    }else if(getMyVar('主页显示内容', '1')=='2'){
        require(jxCodePath + 'SrcCall.js');
        jxCallPage(d);
    }else{
        require(jxCodePath + 'SrcSet.js');
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