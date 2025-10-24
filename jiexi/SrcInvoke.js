// 解析调用入口
const codePath = module.modulePath.slice(0, module.modulePath.lastIndexOf("/") + 1);
// 解析管理页面
function jxItem() {
    require(codePath + 'SrcJiexi.js');
    jiexi();
}

$.exports = {
    jxItem: jxItem,
    parse: parse
}