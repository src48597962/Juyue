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
// 获取接口对应的显示标题
function getDataTitle(data, ide, i) {
    let dataTitle;
    if(data.word){
        dataTitle = (i?i+'-':'') + (ide||(getMyVar('批量选择模式2')?'○':'')) + (data.stop?'Ⓓ':"") + data.name;
    }else{
        dataTitle = (i?i+'-':'') + (ide||(getMyVar('批量选择模式')?'○':'')) + getJxIde(data) + data.name + (data.sort?'‘‘’’<small><font color=grey>  [' + data.sort + ']</font></small>':'');
        if(data.desc2){
            dataTitle = dataTitle + '  ' + data.desc2;
        }
        dataTitle = dataTitle + (data.type!=2?'\n‘‘’’<small><font color=grey>' + data.url + '</font></small>':'');
    }

    return dataTitle;
}
// 对应标识
function getJxIde(data){
    return data.stop?'Ⓓ':data.type==0?"Ⓦ":data.type==1?"Ⓙ":data.type==2?"Ⓕ":"";
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
            str = str.replace(/#feb833|#6dc9ff|#ccc/gi, color);
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

//云口令提取
function extractimport(str){
    showLoading('获取数据中，请稍后...');
    let importType = getMyVar('主页显示内容', '1');
    let strs = str.replace(/\\n|云口令：/g, '').split('@import=');
    if(importType=='1'){
        strs = strs.filter(v=>v&&v.includes('聚阅解析￥'));
    }else if(importType=='2'){
        strs = strs.filter(v=>v&&v.includes('聚阅调用￥'));
    }
    
    let datas = [];
    strs.forEach(it=>{
        try{
            let code = aesDecode(importType=='1'?'Jujiexi':'Jujiexi2', it.split('￥')[1]);
            let text;
            if(/^http|^云/.test(code)){//云分享
                text = parsePaste(code);
            }else{//文件分享
                text = code;
            }
            if(text && !/^error/.test(text)){
                let gzip = $.require(config.jxCodePath + "plugins/gzip.js");
                let sharetxt = gzip.unzip(text);
                let imports = JSON.parse(sharetxt); 
                imports.forEach(it=>{
                    if(!datas.some(v=>v.name==it.name && v.url==it.url)){
                        datas.push(it);
                    }
                })
            }
        } catch (e) {
            log("获取口令数据出错>" + e.message);
        }
    })
    hideLoading();
    return datas;
}
// 云口令导入确认页
function importConfirm(importStr) {
    let importfile = "hiker://files/_cache/Jujiexi/cloudimport.txt";
    addListener("onClose", $.toString((importfile) => {
        deleteFile(importfile);
        clearMyVar('importConfirm');
        clearMyVar("选择列表项");
        if(getMyVar('清除显示内容')){
            clearMyVar('主页显示内容');
        }else{
            refreshPage();
        }
    },importfile));

    let importType = '1';
    let importdatas = storage0.getMyVar('importConfirm', []);
    if(!getMyVar('importConfirm')){
        //云口令导入
        let input = importStr || fetch(importfile);
        if(!input){
            toast('未获取到云口令');
        }else{
            if(input.includes('聚阅调用')){
                importType = '2';
            }
            if(!getMyVar('主页显示内容')){
                putMyVar('清除显示内容', '1');
                putMyVar('主页显示内容', importType);
            }
            importdatas = extractimport(input);
            if(importdatas.length==0){
                toast('未获取到源接口，检查网络或口令');
            }
        }
        storage0.putMyVar('importConfirm', importdatas);
    }
    //获取现有接口
    let datalist = [];
    let sourcedata = fetch(importType=='1'?jxfile:jxcallfile);
    if(sourcedata != ""){
        try{
            eval("datalist = " + sourcedata+ ";");
        }catch(e){}
    }
    let newdatas = [];
    let olddatas = [];
    importdatas.forEach(it=>{
        if(!datalist.some(v=>v.name==it.name)){
            newdatas.push(it);
        }else{
            let olddata = datalist.filter(v=>v.name==it.name)[0];
            it.oldversion = olddata.version || "";
            olddatas.push(it);
        }
    })
    let oldnum = importdatas.length - newdatas.length;

    let d = [];
    if(isDarkMode() || getItem('不显示沉浸图')=='1'){
        for(let i=0;i<2;i++){
            d.push({
                title: "",
                url: "hiker://empty",
                col_type: "text_1",
                extra: {
                    lineVisible: false
                }
            })
        }
    }else{
        d.push({
            col_type: 'pic_1_full',
            img: "http://123.56.105.145/weisyr/img/TopImg0.png",
            url: 'hiker://empty',
        });
    }

    d.push({
        title: "““””<big><b><font color="+Color+">📲 "+(importType=="2"?"调用":"解析")+"云口令导入  </font></b></big>",
        desc: "共计" + importdatas.length + "/新增" + newdatas.length + "/存在" + oldnum ,
        url: $('', '支持多口令').input((extractimport)=>{
            if(!input){
                toast('未获取到云口令');
            }else{
                let importdatas = extractimport(input);
                if(importdatas.length==0){
                    toast('未获取到源接口，检查网络或口令');
                }else{
                    storage0.putMyVar('importConfirm', importdatas);
                    refreshPage();
                }
            }
            return 'hiker://empty';
        }, extractimport),
        col_type: 'text_center_1'
    });
    d.push({
        title: importdatas.length>0&&oldnum==0?"":"增量导入",
        url: importdatas.length>0&&oldnum==0?"hiker://empty":$("跳过已存在，只导入新增，确认？").confirm(()=>{
            require(config.jxCodePath + 'SrcPublic.js');
            let importlist = storage0.getMyVar('importConfirm', []);
            let num = jiexicallsave(importlist, 0);
            back(false);
            return "toast://增量导入"+(num<0?"失败":num);
        }),
        img: importdatas.length>0&&oldnum==0?"":getJxIcon('增量导入.svg'),
        col_type: 'icon_small_3'
    });
    d.push({
        title: "",
        url: "hiker://empty",
        col_type: 'icon_small_3'
    });
    d.push({
        title: "全量导入",
        url: importdatas.length>0&&oldnum==0?$().lazyRule(()=>{
            require(config.jxCodePath + 'SrcPublic.js');
            let importlist = storage0.getMyVar('importConfirm', []);
            let num = jiexicallsave(importlist, 1);
            back(false);
            return "toast://全量导入"+(num<0?"失败":num);
        }):$("全部覆盖导入，确认？").confirm(()=>{
            require(config.jxCodePath + 'SrcPublic.js');
            let importlist = storage0.getMyVar('importConfirm', []);
            let num = jiexicallsave(importlist, 1);
            back(false);
            return "toast://全量导入"+(num<0?"失败":num);
        }),
        img: getJxIcon('全量导入.svg'),
        col_type: 'icon_small_3'
    });
    if(newdatas.length>0 && olddatas.length>0){
        let listtype = ["全部列表", "新增加的", "已存在的"];
        listtype.forEach((it, i)=>{
            d.push({
                title: getMyVar("选择列表项","0")==i?`““””<b><span style="color: `+"#20" + Color.replace('#','')+`">`+it+`</span></b>`:it,
                url: $().lazyRule((i)=>{
                    putMyVar("选择列表项", i);
                    refreshPage();
                    return "hiker://empty";
                }, i),
                col_type: 'text_3'
            });
        })
        
        if(getMyVar("选择列表项", "0") == "1"){
            importdatas = newdatas;
        }else if(getMyVar("选择列表项", "0") == "2"){
            importdatas = olddatas;
        }
    }

    importdatas.forEach((it, i)=>{
        let isnew = newdatas.some(v=>v.name==it.name);
        let datamenu = ["确定导入", "修改名称"];
        if(importType=="1"){
            datamenu.push("解析测试");
        }
        let ext = it.ext || {};
        let flag = ext.flag || [];
        let tmpdata = extra = Object.assign({desc2: "‘‘’’<small><font color=grey>{" + (isnew?"新增加":"已存在") + "}</font></small>"}, it);

        d.push({
            title: getDataTitle(tmpdata, '', i+1),
            url: $(datamenu, 2).select((data, isnew) => {
                data = JSON.parse(base64Decode(data));
                if (input == "确定导入") {
                    function iConfirm(data) {
                        require(config.jxCodePath + 'SrcPublic.js');
                        let num = jiexicallsave([data], 1);
                        let importlist = storage0.getMyVar('importConfirm', []);
                        if(importlist.length==1){
                            back(false);
                        }else{
                            let index2 = importlist.findIndex(item => item.name === data.name);
                            importlist.splice(index2, 1);
                            storage0.putMyVar('importConfirm', importlist);
                            deleteItem(data.name);
                        }
                        return "toast://导入"+(num<0?"失败":num);
                    }
                    if(isnew){
                        return iConfirm(data);
                    }else{
                        return $("导入将覆盖本地，确认？").confirm((data,iConfirm)=>{
                            return iConfirm(data);
                        }, data, iConfirm);
                    }
                }else if (input == "修改名称") {
                    return $(data.name, "请输入新名称").input((data)=>{
                        if(!input.trim()){
                            return "toast://不能为空";
                        }

                        let importlist = storage0.getMyVar('importConfirm', []);
                        let index = importlist.findIndex(item => item.name == data.name);
                        importlist[index].name = input;
                        storage0.putMyVar('importConfirm', importlist);
                        refreshPage(false);
                        return "toast://已修改名称";
                    }, data);
                }else if (input == "解析测试") {
                    return $("hiker://empty#noRecordHistory##noHistory#").rule((data) => {
                        setPageTitle(data.name+"-解析测试");
                        require(config.jxCodePath + 'SrcPublic.js');
                        jiexiTest(data);
                    }, data)
                }
            }, base64Encode(JSON.stringify(it)), isnew),
            desc: importType=='2'?it.word:flag.join(','),
            col_type: "text_1",
            extra: {
                id: it.name
            }
        });
    })

    setResult(d);
}
//解析&调用保存
function jiexicallsave(urls, mode) {
    if(urls.length==0){return 0;}
    let type = getMyVar('主页显示内容', '1')=='2'?'2':'1';
    let savefile = type=='2'?jxcallfile:jxfile;
    let num = 0;
    try{
        let datalist = [];
        let sourcedata = fetch(savefile);
        if(sourcedata != ""){
            try{
                eval("datalist=" + sourcedata+ ";");
            }catch(e){}
        }
        if(mode==2){
            for(let i=0;i<datalist.length;i++){
                datalist.splice(i,1);
                i = i - 1;
            }
        }
        
        urls.reverse().forEach(it=>{
            if(it.oldname || mode==1){
                for(let i=0;i<datalist.length;i++){
                    if(datalist[i].name==it.name||datalist[i].name==it.oldname){
                        datalist.splice(i,1);
                        break;
                    }
                }
            }

            function checkitem(item) {
                return item.name==it.name || (type=='1'&&item.url==it.url);
            }

            if(!datalist.some(checkitem)&&it.name&&((type=='1'&&/^http|^functio/.test(it.url))||type=='2')){
                delete it['oldname'];
                delete it['sort'];
                datalist.unshift(it);
                num = num + 1;
            }
        })
        if(num>0){writeFile(savefile, JSON.stringify(datalist));}
    } catch (e) {
        log("导入失败：" + e.message + " 错误行#" + e.lineNumber); 
        num = -1;
    }
    return num;
}

// 外部解析导入
function importjiexi(obj){
    if($.type(obj) != 'object') return;
    let datalist = [];
    let sourcedata = fetch(jxfile);
    if(sourcedata != ""){
        try{
            eval("datalist=" + sourcedata+ ";");
        }catch(e){}
    }
    
    let index = datalist.findIndex(item => item.url == obj.url);
    if(index > -1){
        let newflag = (obj.ext||{}).flag;
        let ext = datalist[index].ext||{};
        let flag = ext.flag||[];
        if(newflag && !flag.includes(newflag)){
            ext['flag'] = flag.concat(newflag);
            datalist[index].ext = ext;
            const [target] = datalist.splice(index, 1);
            datalist.push(target);
            writeFile(jxfile, JSON.stringify(datalist));
            log('已更新解析flag：'+obj.name);
        }
    }else if(obj.name&&obj.url){
        obj.type = obj.type || '0';
        datalist.push(obj);
        writeFile(jxfile, JSON.stringify(datalist));
        log('已存入新解析：'+obj.name);
    }else{
        log('传入解析对象无效');
    }
}