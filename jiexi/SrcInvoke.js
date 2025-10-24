// 解析调用入口
const codePath = module.modulePath.slice(0, module.modulePath.lastIndexOf("/") + 1);

initConfig({
    jxCodePath: codePath
})

// 解析管理页面
function jxItem() {
    require(codePath + 'SrcJiexi.js');
    jiexi();
}
// 调用解析
function parse() {
    
}

$.exports = {
    jxItem: jxItem,
    parse: parse
}