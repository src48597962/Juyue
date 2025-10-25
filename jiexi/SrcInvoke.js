// 解析调用入口
const codePath = module.modulePath.slice(0, module.modulePath.lastIndexOf("/") + 1);

initConfig({
    jxCodePath: codePath
})
// 主界面
function home() {
    require(codePath + 'SrcJiexi.js');
    home();
}
// 解析列表
function jxItem() {
    require(codePath + 'SrcJiexi.js');
    jiexi();
}
// 调用解析
function parse() {
    
}

$.exports = {
    home: home,
    jxItem: jxItem,
    parse: parse
}