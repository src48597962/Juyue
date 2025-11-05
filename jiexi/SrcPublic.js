let jxrulepath = "hiker://files/rules/Src/Jiexi/"; //规则文件路径
let jxfile =  jxrulepath + 'jiexi.json';
let jxcfgfile = jxrulepath + 'config.json';
let jxrecordfile = jxrulepath + "record.json";//解析相关记录文件
let jxcallfile = jxrulepath + "call.json";//解析相关记录文件
let Color = getItem('主题颜色','#3399cc');
let parseTypes = ["WEB解析", "JSON解析", "免嗅解析"];

let Juconfig = {};
let Jucfg = fetch(jxcfgfile);
if (Jucfg != "") {
    eval("Juconfig=" + Jucfg + ";");
}
// 获取所有调用() 
function getCalls(isyx) {
    let datalist = [];
    let sourcedata = fetch(jxcallfile);
    if(sourcedata != ""){
        try{
            eval("datalist=" + sourcedata+ ";");
        }catch(e){ }
    }
    let withoutStop = datalist.filter(item => !item.stop);
    if(isyx){
        return withoutStop;
    }
    // 禁用的放到最后
    let withStop = datalist.filter(item => item.stop);
    // 合并数组
    let result = withoutStop.concat(withStop);

    return result;
}
// 获取所有解析
function getDatas(isyx) {
    let datalist = [];
    let sourcedata = fetch(jxfile);
    if(sourcedata != ""){
        try{
            eval("datalist=" + sourcedata+ ";");
        }catch(e){ }
    }
    let withoutStop = datalist.filter(item => !item.stop);
    if(isyx){
        return withoutStop;
    }
    // 禁用的放到最后
    let withStop = datalist.filter(item => item.stop);
    // 合并数组
    let result = withoutStop.concat(withStop);

    return result;
}
// 获取有效解析名数组
function getDataNames() {
    let list = getDatas(true);
    let result = list.map(it=>{
        return it.name;
    })
    return result;
}
// 文字上色
function colorTitle(title, Color) {
    return '‘‘’’<font color="' + Color + '">' + title + '</font>';
}

// 手机是否暗黑模式
function isDarkMode() {
  const Configuration = android.content.res.Configuration;
  let cx = getCurrentActivity();

  let theme = cx.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;
  return theme == Configuration.UI_MODE_NIGHT_YES;
}

// 获取图标地址
function getJxIcon(icon, nochange, color2) {
    if(!icon){
        return '';
    }else if(!icon.includes('/')){
        icon = config.jxCodePath + 'img/' + icon;
    }
    if(!icon.includes('.svg')){
        return icon;
    }
    let color = getItem('主题颜色','');
    return icon + ((!color||nochange)?'':'?s='+color+'@js=' + $.toString((color,color2) => {
        let javaImport = new JavaImporter();
        javaImport.importPackage(Packages.com.example.hikerview.utils);
        with(javaImport) {
            let bytes = FileUtil.toBytes(input);
            let str = new java.lang.String(bytes, "UTF-8") + "";
            str = str.replace(/#feb833|#6dc9ff/gi, color);
            if(color2){
                const regex = new RegExp(color2, 'gi');
                str = str.replace(regex, color);
            }
            bytes = new java.lang.String(str).getBytes();
            return FileUtil.toInputStream(bytes);
        }
    },color, color2))
}

// 只显示名称相近的接口
function similarTitles(items, similarityThreshold) {
    // 设置默认相似度阈值
    similarityThreshold = similarityThreshold || 0.8;
    
	    // 计算两个字符串的相似度（0~1）
    const StringUtil = Packages.com.example.hikerview.utils.StringUtil;
    function similarity(str1, str2) {
        let df = 0;
        df = StringUtil.levenshtein(str1, str2)
        return df;
    }

    // Levenshtein 距离计算
    function levenshteinDistance(s, t) {
        if (s === t) return 0;
        if (s.length === 0) return t.length;
        if (t.length === 0) return s.length;

        let dp = [];
        for (let i = 0; i <= s.length; i++) {
            dp[i] = [];
            dp[i][0] = i;
        }
        for (let j = 0; j <= t.length; j++) {
            dp[0][j] = j;
        }

        for (i = 1; i <= s.length; i++) {
            for (j = 1; j <= t.length; j++) {
                let cost = s[i - 1] === t[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,     // 删除
                    dp[i][j - 1] + 1,     // 插入
                    dp[i - 1][j - 1] + cost // 替换
                );
            }
        }
        return dp[s.length][t.length];
    }

    // 1. 先分组
    let groups = [];
    let visited = {};

    for (let i = 0; i < items.length; i++) {
        if (visited[i]) continue;

        let currentGroup = [items[i]];
        visited[i] = true;

        // 查找所有与当前对象相似的
        for (let j = 0; j < items.length; j++) {
            if (i === j || visited[j]) continue;

            let sim = similarity(
                items[i].name.toLowerCase(),
                items[j].name.toLowerCase()
            );

            if (sim >= similarityThreshold) {
                currentGroup.push(items[j]);
                visited[j] = true;
            }
        }

        // 只保留相似项≥2的组
        if (currentGroup.length >= 2) {
            groups.push(currentGroup);
        }
    }

    // 2. 扁平化分组
    let result = [];
    for (let g = 0; g < groups.length; g++) {
        for (let k = 0; k < groups[g].length; k++) {
            result.push(groups[g][k]);
        }
    }

    return result;
}
