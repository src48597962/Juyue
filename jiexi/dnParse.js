let jxrulepath = "hiker://files/rules/Src/Jiexi/"; //规则文件路径
let jxcfgfile = jxrulepath + 'config.json';
let Juconfig = {};
let Jucfg = fetch(jxcfgfile);
if (Jucfg != "") {
    eval("Juconfig=" + Jucfg + ";");
}

function aytmParse(vipUrl) {
    let jxCodePath = Juconfig['jxCodePath'];
    if (!jxCodePath) {
        return "toast://jxCodePath获取失败";
    }
    
    let {lazy} = $.require(jxCodePath + 'SrcInvoke.js');
    return lazy(vipUrl);
}