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
// 调用列表
function dyItem() {
    require(jxCodePath + 'SrcCall.js');
    jxCallPage();
}
// 解析设置
function jxSet() {
    require(jxCodePath + 'SrcSet.js');
    jxSetPage();
}
// 解析入口
function lazy(input, dataObj) {
    require(jxCodePath + 'SrcParse.js');
    return SrcParse(input, dataObj);
}
// 调用入口
function call(input, testarr) {
    // 判断字符是否包含
    function isMatch(str, namePattern) {
        // 如果name已经是正则表达式对象
        if (namePattern.startsWith('/')) {
            try {
                const secondSlashIndex = namePattern.indexOf('/', 1);
                if (secondSlashIndex === -1) {
                    // 没有第二个 /，整个作为模式
                    return new RegExp(namePattern.slice(1)).test(str);
                }
                // 提取模式和标志位
                const pattern = namePattern.slice(1, secondSlashIndex);
                const flags = namePattern.slice(secondSlashIndex + 1);
                return new RegExp(pattern, flags).test(str);
            } catch (e) {
                log('无效的正则表达式:', namePattern);
                return false;
            }
        }

        // 如果name包含通配符*
        if (namePattern.includes('*')) {
            const regexPattern = '^' + namePattern.replace(/\*/g, '.*') + '$';
            return new RegExp(regexPattern).test(str);
        }

        // 普通字符串匹配
        return str.includes(namePattern);
    }

    let calllist = testarr || [];
    if(calllist.length==0){
        let callstr = fetch("hiker://files/rules/Src/Jiexi/call.json");
        if(callstr != ""){
            try{
                eval("calllist= " + callstr+ ";");
            }catch(e){}
        }
    }

    let callcode;
    for (let i = 0; i < calllist.length; i++) {
        let call = calllist[i];
        if (isMatch(input, call.word)) {
            try{
                log(`调用解析匹配成功: ${call.name}>${call.word}`);
                eval('callcode = ' + call.code);
            }catch(e){
                log(`调用解析执行异常: ${call.name}>` + e.message + ' 错误行#' + e.lineNumber);
            }
            break;
        }
    }

    return callcode || (testarr?'toast://调用匹配失败':'');
}

$.exports = {
    home: home,
    jxItem: jxItem,
    dyItem: dyItem,
    jxSet: jxSet,
    lazy: lazy,
    call: call
}