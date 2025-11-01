// 解析调用入口
const codePath = module.modulePath.slice(0, module.modulePath.lastIndexOf("/") + 1);

initConfig({
    jxCodePath: codePath
})
// 主界面
function home() {
    require(codePath + 'SrcJiexi.js');
    homePage();
}
// 解析列表
function jxItem() {
    require(codePath + 'SrcJiexi.js');
    jxItemPage();
}
// 解析列表
function jxSet() {
    require(codePath + 'SrcJiexi.js');
    jxItemPage();
}
// 调用解析
function aytmParse(input, dataObj) {
    require(codePath + 'SrcParse.js');
    return SrcParse(input, dataObj);
}

$.exports = {
    home: home,
    jxItem: jxItem,
    jxSet: jxSet,
    aytmParse: aytmParse
}