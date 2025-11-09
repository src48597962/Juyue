//本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
let recordfile = "hiker://files/rules/Src/Jiexi/record.json";//取解析设置、上次成功、手工屏蔽的
let record = fetch(recordfile);
let parseRecord = {};
if(record != ""){
    try{
        eval("parseRecord = " + record + ";");
    }catch(e){}
}

let excludeurl = parseRecord.excludeurl || [];//屏蔽的播放地址
let excludeparse = parseRecord.excludeparse || [];//屏蔽的解析
let playSet = {
    printlog: 1,
    cachem3u8: 0,
    parsemode: 1,
    videoplay: 0,
    danmu: 0,
    testvideo: 0,
    mulnum: 1
};
let Juconfig = {};
let Jucfg = fetch("hiker://files/rules/Src/Jiexi/config.json");
if(Jucfg != ""){
    try{
        eval("Juconfig= " + Jucfg+ ";");
        let playSetCfg = Juconfig['playSet'] || {};
        playSet = Object.assign({}, playSet, playSetCfg);
    }catch(e){}
}
let log = typeof log2 == 'undefined' ? log :log2;
if(!playSet.printlog){
    log = function () {
        //未开启打印解析日志>不打印
        return;
    }
}
let exclude = /\/404\.m3u8|\/xiajia\.mp4|limilt\/limit|sx\.m3u8|\/余额不足\.m3u8/;//设置排除地址
let contain = /\.mp4|\.m3u8|qqBFdownload|mime=video%2F|video_mp4|\.ts\?|TG@UosVod|video\/tos\/|m3u8\?pt=m3u8|\.mpd/;//设置符合条件的正确地址
let needparse = /suoyo\.cc|fen\.laodi|ruifenglb/;//设置需要解析的视频地址

//数组去重
function uniq(array) {
    let temp = []; //一个新的临时数组
    for (let i = 0; i < array.length; i++) {
        if (temp.indexOf(array[i]) == -1) {
            temp.push(array[i]);
        }
    }
    return temp;
}
//去除指定数组元素
function removeByValue(arr, val) {
    for(let i = 0; i < arr.length; i++) {
        if(arr[i] == val) {
            arr.splice(i,1);
            break;
        }
    }
}
// 头信息对象转字符串
function headerObjToStr(obj) {
    if (!obj || typeof obj !== 'object') {
        return '{}'; // 如果 obj 不是对象，返回空对象字符串
    }
    const pairs = Object.keys(obj).map(key => `${key}@${obj[key].replace(/;/g,'；；')}`);
    return `{${pairs.join('&&')}}`;
}
// url编码处理
function decodeURI(input){
    if($.type(input)=="string" && input.includes("%2F%2F")){
        return decodeURIComponent(input);
    }
    return input;
}
// 是否为vip正版资源
function isVipVideo(url){
    if (/qq\.com|iqiyi\.com|youku\.com|mgtv\.com|bilibili\.com|sohu\.com|ixigua\.com|pptv\.com|miguvideo\.com|le\.com|1905\.com|fun\.tv|cctv\.com/.test(url)){
        return true;
    }
    return false;
}
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
// 调用解析
function callParse(input){
    let calllist = [];
    let callstr = fetch("hiker://files/rules/Src/Jiexi/call.json");
    if(callstr != ""){
        try{
            eval("calllist= " + callstr+ ";");
        }catch(e){}
    }

    let lazy;
    for (let i = 0; i < calllist.length; i++) {
        let call = calllist[i];
        if (isMatch(input, call.word)) {
            try{
                log(`调用解析匹配成功: ${call.name}>${call.word}`);
                eval('lazy = ' + call.code);
            }catch(e){
                log(`调用解析执行异常: ${call.name}>` + e.message + ' 错误行#' + e.lineNumber);
            }
            break;
        }
    }
    return lazy;
}
//解析入口
function SrcParse(vipUrl, dataObj) {
    vipUrl = decodeURI(vipUrl);
    vipUrl = vipUrl.startsWith('tvbox-xg:')?vipUrl.replace('tvbox-xg:',''):vipUrl.startsWith('push://')?vipUrl.replace('push://',''):vipUrl
    dataObj = dataObj || {};
    let isVip = 0;
    log("请求地址："+vipUrl); 

    let callParseUrl = callParse(vipUrl);
    if(callParseUrl){
        return callParseUrl;
    }else if(vipUrl.startsWith('ftp://') && vipUrl.includes('114s.com')){
        if(!fileExist("hiker://files/cache/bidi.dex") || !fileExist("hiker://files/cache/libp2p.so")){
            return "toast://缺少荐片插件，播放失败";
        }
        try{
            let s = loadJavaClass("hiker://files/cache/bidi.dex", "com.rule.jianpian", "hiker://files/cache/libp2p.so");
            s.init(getPath("hiker://files/_cache").replace("file://", ""));
            let url = s.JPUrlDec(vipUrl) + "#isVideo=true#";
            return url;
        } catch (e) {
            return "toast://荐片播放失败";
        }
    }else if(/(xunlei|magnet:|ed2k:|bt:|ftp:|\.torrent)/.test(vipUrl)){
        if(fetch("hiker://page/diaoyong?rule=迅雷")){
            log("优先偿试调用迅雷小程序解析"); 
            return "hiker://page/diaoyong?rule=迅雷&page=fypage#" + vipUrl
        }else if (/magnet|torrent/.test(vipUrl)) {
            log("磁力/BT视频地址，由海阔解析"); 
            return vipUrl;
        }else{
            log("暂不支持的播放链接"); 
            return "toast://暂不支持的播放链接"
        }
    }else if(contain.test(vipUrl)&&!exclude.test(vipUrl)&&!needparse.test(vipUrl)){
        log("直链视频地址，直接播放"); 
        if(vipUrl.includes('app.grelighting.cn')){vipUrl = vipUrl.replace('app.','ht.')}
        return vipUrl + '#isVideo=true#';
    }else if(/\.mp3|\.m4a/.test(vipUrl)){
        log("直链音乐地址，直接播放"); 
        return vipUrl + '#isMusic=true##checkMetadata=false#';
    }else if(vipUrl.includes('sa.sogou')){
        log("优看视频，直接明码解析"); 
        return unescape(request(vipUrl).match(/"url":"([^"]*)"/)[1].replace(/\\u/g, "%u"));
    }else if(/www\.aliyundrive\.com|www\.alipan\.com/.test(vipUrl)){
        return "hiker://page/aliyun?page=fypage&rule=云盘君.简&realurl=" + vipUrl;
    }else if(/pan\.quark\.cn|drive\.uc\.cn/.test(vipUrl)){
        return "hiker://page/quarkList?rule=Quark.简&realurl=" + encodeURIComponent(vipUrl) + "&sharePwd=";
    }else if(vipUrl.includes('pan.baidu.com')) {
        putVar('urlBaidu', vipUrl);
        return "hiker://page/list?rule=百度网盘&realurl=" + vipUrl;
    }else if(vipUrl.includes('.123684.com')){
        return "toast://暂不支持123盘";
    }else if(isVipVideo(vipUrl)){
        if(vipUrl.indexOf('html?')>-1){
            vipUrl = vipUrl.split('html?')[0]+'html';
        }
        isVip = 1;
    }else if(!needparse.test(vipUrl) && /^http/.test(vipUrl)){
        log("网页嗅探播放");
        let obj = {
            vipUrl: vipUrl,
            isWeb: 1,
            videoplay: playSet.videoplay,
            ismusic: dataObj.ismusic,
            js: dataObj.js
        }
        return 解析方法(obj);
    }
    //片源标识
    let from;
    if(dataObj.flag){
        from = dataObj.flag;
    }else{
        try{
            if(vipUrl.indexOf('.') != -1){
                let host = vipUrl.replace('m.tv.','m.').match(/\.(.*?)\//)[1];
                from = host.split('.')[0];
                parseRecord['flag'] = parseRecord['flag'] || [];
                if(parseRecord['flag'].indexOf(from)==-1){
                    parseRecord['flag'].push(from);//记录到片源标识组
                }
            }else if(vipUrl.indexOf('-') != -1){
                from = vipUrl.split('-')[0];
            }else{
                from = 'other';
            }
        }catch(e){
            from = 'other';
        }
    }
    if(from == "qiyi"){
        from = "iqiyi";
    }
    log("片源标识："+from+"，需要解析"); 

    let parsemode = playSet.parsemode || 1;//解析模式
    let mulnum = playSet.mulnum || 1;//多线程数
    let jxfile = "hiker://files/rules/Src/Jiexi/jiexi.json";//解析存放文件
    let parselist = [];//待进线程执行的解析列表
    let jxList= [];//读取本地的解析列表
    let isTest;

    if(dataObj.testParse){
        //有指定解析测试
        isTest = 1;
        dataObj.testParse["stype"] = "test";
        parselist.push(dataObj.testParse);
    }else{
        if(dataObj.parse_api){
            try{
                //读取选集自带的解析，将未屏蔽的入备选
                let appParses = dataObj.parse_api;
                appParses = uniq(appParses);//去重
                if(appParses.length>0){
                    for (let i in appParses) {
                        if(excludeparse.indexOf(appParses[i])==-1){
                            parselist.push({stype:'app', type:'3', name:'app'+i, url:appParses[i], sort:0, ext:{}});
                        }
                    }
                    log("选集自带解析数："+appParses.length); 
                }
            }catch(e){
                log("处理选集自带解析失败>"+e.message); 
            }
        }else if(dataObj.parses){
            try{
                //读取选集传入的解析
                let appParses = dataObj.parses;
                if(appParses.length>0){
                    for (let i in appParses) {
                        if(excludeparse.indexOf(appParses[i].url)==-1){
                            let appParse = appParses[i];
                            let appext = appParse.ext||{};
                            parselist.push({stype:'app', type:appParse.type||'3', name:appParse.name||('app'+i), url:appParse.url, sort:0, ext:appext});
                        }
                    }
                    log("选集传入解析数："+appParses.length); 
                }
            }catch(e){
                log("处理选集传入解析失败>"+e.message); 
            }
        }
        
        //读取解析，将可用加入备选
        if(fetch(jxfile)){
            try{
                eval("jxList=" + fetch(jxfile));
            }catch(e){}

            jxList.forEach(it=>{
                if(!it.stop){
                    let ext = it.ext||{};
                    let flag = ext.flag || [];
                    if(flag.indexOf("qiyi")>-1 && flag.indexOf("iqiyi")==-1){
                        flag.push("iqiyi");
                    }
                    if((flag.length==0 && isVip) || flag.indexOf(from)>-1){
                        parselist.push({stype:'myjx', type:it.type, name:it.name, url:it.url, sort:it.sort||0, ext:ext});
                    }
                }
            })
            log("可用解析数：" + parselist.length); 
        }
    }

    //修正排序
    parselist.sort((a, b) => {
        let aa = a.sort||0;
        let bb = b.sort||0;
        return aa - bb;
    })

    let isFirst = false;//是否优先解析首个解析
    let lastparse = parseRecord.lastparse?(parseRecord.lastparse[from] || ""):"";//对应的片源上次解析
    if(lastparse){
        //优先上次成功的
        for(let i=0; i<parselist.length; i++) {
            if(parselist[i].name==lastparse) {
                let Uparseobj = parselist[i];
                parselist.splice(i,1);
                parselist.unshift(Uparseobj);
                isFirst = true;
                break;
            }
        }
    }
    let priorparse = (Juconfig['flagParse']||{})[from]||"";//对应的片源指定优先解析
    if(priorparse){
        //优先片源指定的
        for(let i=0; i<parselist.length; i++) {
            if(parselist[i].name==priorparse) {
                let Uparseobj = parselist[i];
                parselist.splice(i,1);
                parselist.unshift(Uparseobj);
                isFirst = true;
                break;
            }
        }
    }
    //解析播放地址需要的一些变量
    let playurl = "";//视频地址
    let urls = [];//多线路地址
    let names = [];//多线路名称
    let headers = [];//多线路头信息
    let audioUrls = [];//多线路音频分离地址
    let danmu = "";//免嗅解析返回多线路的弹幕
    let faillist = [];//解析失败待处理列表
    let myJXchange = 0;//私有解析是否有变化需要保存

    //模式3手工解析使用代理播放
    if(parsemode==3){
        let u = startProxyServer($.toString((parselist,vipUrl,解析方法,getheader,log) => {
            let parsename = MY_PARAMS.name.join("");
            log("我在代理解析>" + parsename);
            let playUrl = "";
            let ulist = {};
            try{
                ulist = parselist.filter(item => {
                    return item.name==parsename;
                })[0];
                let obj = {
                    ulist: ulist,
                    vipUrl: vipUrl,
                    parsemode: 3
                }
                let getUrl = 解析方法(obj);
                playUrl = getUrl.url;
            }catch(e){
                log(parsename+">解析错误>" + e.message + " 错误行#" + e.lineNumber);
            }
            if(playUrl){
                let urltype;
                let urljson;
                try{
                    eval('urljson = '+ playUrl);
                    urltype = $.type(urljson);
                }catch(e){
                    urltype = "string";
                }
                let headers;
                if(urltype=="object"){
                    headers = urljson.headers && urljson.headers.length>0?urljson.headers[0]:ulist.ext.header;
                    playUrl = urljson.urls[0];
                }
                log(parsename+">代理播放地址>"+playUrl)
                if(playUrl.includes(".m3u8")){
                    let f = cacheM3u8(playUrl, {headers: headers || getheader(playUrl), timeout: 2000});
                    return f?readFile(f.split("##")[0]):playUrl; //'#isVideo=true#';
                }else{
                    return JSON.stringify({
                        statusCode: 302,
                        headers: {
                            "Location": playUrl
                        }
                    });
                }
            }else{
                return '';
            }
        }, parselist, vipUrl, 解析方法, mulheader, log));
        parselist.forEach((item) => {
            urls.push(u + "?name=" + item.name + "#.m3u8#pre#");
            names.push(item.name);
            headers.push(item.ext.header || mulheader(vipUrl));
        })
        let dm;
        if(isVip && playSet.danmu==1){
            dm = 弹幕(vipUrl);
        }
        return JSON.stringify({
            urls: urls,
            names: names,
            headers: headers,
            danmu: dm
        });
    }else if(parsemode==2){//模式2，强制嗅探，手工选择，走video没法指定header
        let dm;
        if(isVip && playSet.danmu==1){
            dm = 弹幕(vipUrl);
        }
        let list = parselist.filter(v => v.type=='0');
        let weburls = list.map(item => "video://" + item.url +vipUrl);
        let webnames = list.map(item => item.name);
        return JSON.stringify({
            urls: weburls,
            names: webnames,
            danmu: dm
        }); 
    }
    //模式1，智能模式
    for (var i=0;i<parselist.length;i++) {
        if(playurl!=""){break;}
        let UrlList = [];
        let Namelist = [];
        var beurls = [];//用于存储多线程返回url
        var beparses = [];//用于存储多线程解析地址
        var beerrors = [];//用于存储多线程是否有错误
        var sccess = 0;//计算成功的结果数
        let p = isFirst? i + 1 : i + mulnum + 2;
        if(p>parselist.length){p=parselist.length}
        for(let s=i;s<p;s++){
            UrlList.push(parselist[s]);
            Namelist.push(parselist[s].name);
            i=s;
        }
        log("本轮排队解析：" + Namelist);
        if(Namelist.length==0){
            return;
        }
        isFirst = false;//取消优先解析首个解析

        let UrlParses = UrlList.map((list)=>{
            if (/^\/\//.test(list.url)) { list.url = 'https:' + list.url }
            return {
                func: 解析方法,
                param: {
                    ulist: list,
                    vipUrl: vipUrl,
                    videoplay: playSet.videoplay,
                    checkVideo: playSet.testvideo?checkVideo:undefined,
                    parsemode: 1
                },
                id: list.url
            }
        });

        be(UrlParses, {
            func: function(obj, id, error, taskResult) {
                let beurl = taskResult.url;
                if(beurl && beurl.startsWith('http') && (needparse.test(beurl)||!contain.test(beurl)||exclude.test(beurl)||excludeurl.indexOf(beurl)>-1)){//&&beurl.indexOf('?')==-1
                    beurl = "";
                }

                obj.results.push(beurl);
                obj.parses.push(taskResult.ulist);
                obj.errors.push(error);
                if (beurl) {
                    sccess = sccess + 1;
                    if(sccess>=mulnum){
                        log("线程中止，已捕获视频");
                        return "break";
                    }
                }
            },
            param: {
                results: beurls,
                parses: beparses,
                errors: beerrors
            }
        });

        for(let k in beparses){
            if(beerrors[k]==null && beurls[k]){
                if(playurl==""){playurl = beurls[k];}
                //记录最快的，做为下次优先
                if(beparses[k].name==priorparse){
                    log(beparses[k].name+'>优先指定解析成功>'+beurls[k]);
                }else if(beparses[k].name==lastparse){
                    log(beparses[k].name+'>优先上次解析成功>'+beurls[k]);
                }else{
                    log(beparses[k].name+'>解析成功>'+beurls[k]+'，记录为片源'+from+'的优先');
                    lastparse = beparses[k].name;
                }

                //私有解析成功的，提升一下排序
                for(let j=0;j<jxList.length;j++){
                    if(beparses[k].name==jxList[j].name){
                        if(jxList[j].type != beparses[k].type){
                            jxList[j].type = beparses[k].type;//自动修正解析类型
                            myJXchange = 1;
                        }
                        let jxsort = jxList[j].sort||0;
                        if(jxsort>0){
                            jxList[j].sort = jxsort - 1;//解析成功的,排序+1
                            myJXchange = 1;
                        }
                        break;
                    }
                }
                
                //组一个多线路播放地址备用，log($.type(beurls[k]));
                let urljson;
                let urltype;
                try{
                    eval('urljson = '+ beurls[k]);
                    urltype = $.type(urljson);
                }catch(e){
                    urltype = "string";
                }
                if(urltype == "object"){
                    try {
                        let murls = urljson.urls;
                        let mnames = urljson.names || [];
                        let mheaders = urljson.headers || [];
                        let maudioUrls = urljson.audioUrls || [];
                        for(let j=0;j<murls.length;j++){
                            if(!/yue|480|360/.test(mnames[j])){//屏蔽全全-优酷的不必要线路
                                let MulUrl = formatMulUrl(murls[j], urls.length);
                                urls.push(MulUrl.url);
                                if(mnames.length>0){
                                    names.push(mnames[j]);
                                }else{
                                    names.push(beparses[k].name || '线路'+urls.length);
                                }
                                if(mheaders.length>0){
                                    headers.push(mheaders[j]);
                                }else{
                                    headers.push(MulUrl.header);
                                }
                                if(maudioUrls.length>0){
                                    audioUrls.push(maudioUrls[j]);
                                }
                            }
                        }
                        if(urljson.danmu){danmu = urljson.danmu;}
                    } catch (e) {
                        log('判断多线路地址对象有错：'+e.message);
                    }
                }else{
                    let MulUrl = formatMulUrl(beurls[k], urls.length);
                    urls.push(MulUrl.url);
                    names.push(beparses[k].name || '线路'+urls.length);
                    headers.push(MulUrl.header);
                }
            }else{
                faillist.push(beparses[k]);
            }
        }//排队解析结果循环
    }//解析全列表循环

    let failparse = [];
    //失败的解析，处理
    for(let p=0;p<faillist.length;p++){
        if(faillist[p].stype=="myjx"){
            for(let j=0;j<jxList.length;j++){
                if(faillist[p].url==jxList[j].url){
                    jxList[j]['type'] = faillist[p]['type'];//修正类型
                    jxList[j]['sort'] = (jxList[j]['sort']||0) + 1;//降权排序
                    failparse.push(jxList[j].name);//加入提示失败列表
                    /*
                    //解析失败的,且排序大于5次从私有中排除片源
                    if(jxList[j].sort>5 && jxList[j].stopfrom.indexOf(from)==-1){
                        jxList[j].stopfrom[jxList[j].stopfrom.length] = from;
                        log(jxList[j].name+'>解析失败大于5次，排除片源'+from);
                    }
                    */
                    myJXchange = 1;
                    break;
                }
            }
        }
        if(faillist[p].stype=="app"){
            //app自带的解析在解析失败时，直接加入黑名单
            parseRecord['excludeparse'] = parseRecord['excludeparse'] || [];
            if(parseRecord['excludeparse'].indexOf(faillist[p].url)==-1){
                parseRecord['excludeparse'].push(faillist[p].url);
            }
        }
    }
    
    if(!isTest){
        //私有解析有排除片源
        if(myJXchange == 1){writeFile(jxfile, JSON.stringify(jxList));}
        //私有解析失败的统一提示
        if(failparse.length>0&&playSet.printlog==1){log(failparse+'<以上私有解析失败，降序+1')}
        //记录上次优先解析和自带解析有加入黑名单的保存                
        parseRecord['lastparse'] = parseRecord['lastparse'] || {};
        parseRecord['lastparse'][from] = lastparse;
        writeFile(recordfile, JSON.stringify(parseRecord));
    } 

    //播放
    if(playurl){
        let dm;
        if(isVip && playSet.danmu==1){
            dm = danmu || 弹幕(vipUrl);
        }
        if(urls.length>1){
            log('进入多线路播放');
            return JSON.stringify({
                urls: urls,
                names: names,
                headers: headers,
                danmu: dm,
                audioUrls: audioUrls
            }); 
        }else{
            log('进入单线路播放');
            if(dm){
                let MulUrl = formatMulUrl(playurl, 0);
                urls = [];
                headers= [];
                urls.push(MulUrl.url);
                headers.push(MulUrl.header);
                return JSON.stringify({
                    urls: urls,
                    headers: headers,
                    danmu: dm 
                }); 
            }else{
                return formatUrl(playurl);
            }
        }
    }else{
        if(isTest && dataObj.testParse["url"].startsWith('http') && !dataObj.testParse["url"].includes('key=')){
            toast('解析失败，转网页验证一下');
            return "web://"+dataObj.testParse["url"]+vipUrl;
        }else{
            return 'toast://解析失败';
        }
    }
}
//检测视频地址有效性
function checkVideo(url,name,times) {
    if(!url){return 0}
    if(!name){name = "解析"}
    if(!times){times = 60}
    try {
        if(/vkey=|banyung\.|mgtv\.com|1905\.com|qq\.com/.test(url)){
            return 1;
        }else if (/\.m3u8/.test(url)) {
            var urlcode = JSON.parse(request(url,{withStatusCode:true,timeout:2000}));
            //log(name+'url访问状态码：'+urlcode.statusCode)
            if(urlcode.statusCode==-1){
                log(name+'>m3u8探测超时未拦载，结果未知');
                return 1;
            }else if(urlcode.statusCode!=200){
                //log(name+'>m3u8播放地址疑似失效或网络无法访问，不信去验证一下>'+url);
                return 0;
            }else{
                try{
                    var tstime = urlcode.body.match(/#EXT-X-TARGETDURATION:(.*?)\n/)[1];
                    var urltss = urlcode.body.replace(/#.*?\n/g,'').replace('#EXT-X-ENDLIST','').split('\n');
                }catch(e){
                    log(name+'>错误：探测异常未拦截>'+e.message);
                    return 1;
                }
                if(parseInt(tstime)*parseInt(urltss.length) < times){
                    log(name+'>m3u8视频长度小于设置的'+times+'s，疑似跳舞小姐姐或防盗小视频，不信去验证一下>'+url);
                    return 0;
                }else{
                    var urlts = urltss[0];
                    if(/^http/.test(urlts)&&!urlts.match(/youku|iqiyi|ixigua|migu|sohu|pptv|le|cctv|1905|mgtv|qq\.com|M3U8\.TV/)){
                        var tscode = JSON.parse(request(urlts,{headers:{'Referer':url},onlyHeaders:true,redirect:false,timeout:2000}));
                        //log(name+'ts访问状态码：'+tscode.statusCode);
                        if(tscode.statusCode==-1){
                            log(name+'>ts段探测超时未拦载，结果未知');
                            return 1;
                        }else if(!/0|200|301|302|403/.test(tscode.statusCode)){
                            log(name+'>ts段地址疑似失效或网络无法访问，不信去验证一下>'+url);
                            return 0;
                        }
                    }    
                }
            }
        }else if (/\.mp4/.test(url)) {
            var urlheader = JSON.parse(request(url,{onlyHeaders:true,timeout:2000}));
            if(urlheader.statusCode==-1){
                log(name+'>mp4探测超时未拦载，结果未知');
                return 1;
            }else if(!/0|200|301|302|403/.test(urlheader.statusCode)){
                log(name+'>mp4播放地址疑似失效或网络无法访问，不信去验证一下>'+url);
                return 0;
            }else{
                var filelength = urlheader.headers['content-length'];
                if(parseInt(filelength[0])/1024/1024 < 30){
                    log(name+'>mp4播放地址疑似跳舞小姐姐或防盗小视频，不信去验证一下>'+url);
                    return 0;
                }
            }
        }
        return 1;
    } catch(e) {
        log(name+'>错误：探测异常未拦截，可能是失败的>'+e.message);
        return 1;
    }
}
//处理单线路播放地址
function formatUrl(url, i) {
    try {
        if (url.trim() == "") {
            return "toast://解析失败，建议切换线路或更换解析方式";
        } else if(/^{/.test(url)){
            return url;
        }else {
            if (url[0] == '/') { url = 'https:' + url }
            if (i == undefined) {
                if (playSet.cachem3u8 && url.indexOf('.m3u8')>-1) {
                    url = cacheM3u8(url, {timeout: 2000});
                }
                if(url.indexOf('User-Agent')==-1){
                    if (/wkfile/.test(url)) {
                        url = url + ';{User-Agent@Mozilla/5.0&&Referer@https://fantuan.tv/}';
                    } else if (/bilibili|bilivideo/.test(url)) {
                        url = url + ";{User-Agent@bili2021&&Referer@https://www.bilibili.com/}";
                    } else if (/mgtv/.test(url)) {
                        url = url + ";{User-Agent@Mozilla/5.0}";
                    }/* else {
                        url = url + ";{User-Agent@Mozilla/5.0}";
                    }*/
                }
            } else {
                if ((playSet.cachem3u8)&&url.indexOf('.m3u8')>-1) {// || url.indexOf('vkey=')>-1
                    url = cacheM3u8(url, {timeout: 2000}, 'video' + parseInt(i) + '.m3u8') + '#pre#';
                }
            }
            if(url.indexOf('#isVideo=true#')==-1){
                url = url + '#isVideo=true#';
            }
            return url;
        }
    } catch (e) {
        return url;
    }
}
//处理多线路播放地址
function formatMulUrl(url,i) {
    try {
        let header = mulheader(url);
        url = url.split(';{')[0];
        if ((playSet.cachem3u8)&&url.indexOf('.m3u8')>-1) {// || url.indexOf('vkey=')>-1
            log("缓存m3u8索引文件");
            let name = 'video'+parseInt(i)+'.m3u8';
            url = cacheM3u8(url, {headers: header, timeout: 3000}, name)+'#pre#';
        }
        if(url.indexOf('#isVideo=true#')==-1 && i==0){
            url = url + '#isVideo=true#';
        }
        return {url:url, header:header};
    } catch (e) {
        log("错误："+e.message);
        return url;
    }   
}
//获取多线路中需要的头信息
function mulheader (url) {
    // 头信息字符串转对象
    function headerStrToObj(str) {
        if (!str.startsWith('{') || !str.endsWith('}')) {
            log('组多线路传入的头信息字符串不正确');
        }
        const pairs = str.slice(1, -1).split('&&');
        const obj = {};
        pairs.forEach(pair => {
            const [key, value] = pair.split('@');
            obj[key] = value.replace(/；；/g,'; ');
        });
        return obj;
    }
    let header = {};
    if(url.includes(';{')){
        header = headerStrToObj('{'+url.split(';{')[1].replace('#isVideo=true#',''))
    }else if (/mgtv/.test(url)) {
        header = { 'User-Agent': 'Mozilla/5.0', 'Referer': 'www.mgtv.com' };
    } else if (/bilibili|bilivideo/.test(url)) {
        header = { 'User-Agent': 'bili2021', 'Referer': 'www.bilibili.com' };
    } else if (/wkfile/.test(url)) {
        header = { 'User-Agent': 'Mozilla/5.0', 'Referer': 'fantuan.tv' };
    }
    return header;
}
function 弹幕(vipUrl) {
    let dm = "";
    log("开始获取弹幕>" + (playSet['danmuSource']||'hls弹幕'));
    
    try{
        if(playSet['danmuSource']=='dm盒子'){
            //dm盒子弹幕
            dm = $.require('hiker://page/dmFun?rule=dm盒子').dmRoute(vipUrl);
        }else{
            let dmfile = `hiker://files/_cache/Juyue/danmu/${md5(vipUrl)}.xml`;
            if(fileExist(dmfile)){
                dm = dmfile;
            }else{
                function convertDanmakuToSimpleXML(danmakuArray, dmfile) {
                    function convertColorToDecimal(color) {
                        const lowerColor = color.toLowerCase();
                        // 处理十六进制颜色 (#fff, #ffffff)
                        if (lowerColor.startsWith('#')) {
                            let hex = lowerColor.substr(1);
                            // 简写格式转完整格式 (#fff -> #ffffff)
                            if (hex.length === 3) {
                                hex = hex.split('').map(char => char + char).join('');
                            }
                            // 转换为十进制
                            return parseInt(hex, 16) || '16777215';
                        }
                        return '16777215'; // 默认白色
                    }
                    // 构建XML头
                    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
                    xml += `<i>\n`;
                    danmakuArray.slice(1).forEach((danmaku) => {
                        let [time, type, color, size, text] = danmaku;
                        let decimalColor = convertColorToDecimal(color);
                        let pAttribute = `${time},1,20,${decimalColor}`;
                        // 添加弹幕到XML
                        xml += `<d p="${pAttribute}">${text}</d>\n`;
                    });
                    xml += `</i>`;
                    writeFile(dmfile, xml);
                    return dmfile;
                }
                let hlshtml = fetch('https://dmku.hls.one/?ac=dm&url='+vipUrl, {time:3000});
                dm = convertDanmakuToSimpleXML(JSON.parse(hlshtml).danmuku || [], dmfile);
            }
        }
    }catch(e){
        log('获取弹幕异常>' + e.message);
    }
    if(dm){
        log("获取弹幕成功");
    }else{
        log("获取弹幕失败");
    }
    return dm;
}
function 解析方法(obj) {
    function geturl(gethtml) {
        let rurl = "";
        try {
            if(gethtml.indexOf('urls = "') != -1){
                rurl = gethtml.match(/urls = "(.*?)"/)[1];
            }else if(gethtml.indexOf('"url":"') != -1){
                rurl = gethtml.match(/"url":"(.*?)"/)[1];
            }else if(gethtml.indexOf('id="video" src="') != -1){
                rurl = gethtml.match(/id="video" src="(.*?)"/)[1];
            }else if(gethtml.indexOf('url: "') != -1){
                rurl = gethtml.match(/url: "(.*?)"/)[1];
            }else{
                //log('将日志提交给作者，帮助完善解析逻辑>>>'+gethtml);
            }
        } catch (e) {
            log('明码获取错误：'+e.message);
        }
        //let rurl = JSON.parse(html).url || JSON.parse(html).data;
        return rurl;
    }
    
    function exeWebRule(webObj, music) {
        let head = webObj.head || {};
        let webUrl = webObj.webUrl;
        let js = webObj.js;

        return executeWebRule(webUrl, $.toString((music,webUrl) => {
            try{
                if (typeof (request) == 'undefined' || !request) {
                    eval(fba.getInternalJs());
                };
                var urls = _getUrls();
                //fba.log(fy_bridge_app.getUrls());
                var exclude = /\/404\.m3u8|\/xiajia\.mp4|\/余额不足\.m3u8|\.avif|\.css|\.ico|\.js|\.gif|\.png|\.jpg|\.jpeg|html,http|m3u88.com\/admin|\.php\?v=h|url=http|vid=http|%253Furl%253Dh|#amp=1|\.t-ui\.cn|ac=dm/;//设置排除地址
                var contain = /\.mp4|\.m3u8|\.avi|\.mov|\.dat|qqBFdownload|mime=video%2F|video_mp4|\.ts\?|TG@UosVod|video\/tos\/|m3u8\?pt=m3u8|\.mpd/;//设置符合条件的正确地址
                for (var i in urls) {
                    if(!fba.getVar("getParse") && !webUrl.includes("=http") && /url=h|v=h|youku|mgtv|ixigua|qq\.com|iqiyi|migu|bilibili|sohu|pptv|\.le\.|\.1905|cctv/.test(urls[i])&&!/\/bid\?|\.gif\?|ads\?|img\.php|index\/\?|cityjson/.test(urls[i])){
                        try{
                            fba.log("获取解析>"+urls[i].match(/http.*?=/)[0]);
                            fba.putVar("getParse","1");
                        }catch(e){}
                    }
                    if(music){
                        if(/\.mp3|\.m4a/.test(urls[i])){
                            return fy_bridge_app.getHeaderUrl(urls[i]) + '#isMusic=true##checkMetadata=false#';
                        }
                    }else if (contain.test(urls[i])&&!exclude.test(urls[i])) {
                        fba.clearVar('getParse');
                        fba.log("exeWebRule捕获视频>"+urls[i]);
                        return fy_bridge_app.getHeaderUrl(urls[i]) + '#isVideo=true#';
                    }
                }
            }catch(e){
                fba.log("exeWebRule失败>"+e.message);
            }
        }, music, webUrl), {
            blockRules: ['.m4a','.mp3','.gif','.jpg','.jpeg','.png','.ico','hm.baidu.com','/ads/*.js','/klad/*.php','layer.css'],
            jsLoadingInject: true,
            js: js,
            ua: head['user-agent'] || MOBILE_UA,
            referer: head['referer'] || undefined,
            checkTime: 100,
            timeout: 12000
        })
    }

    if(obj.isWeb){
        //网页播放页，非官源解析
        if(obj.ismusic){
            return exeWebRule({webUrl:obj.vipUrl, js:obj.js}, 1) || "toast://嗅探解析失败";
        }else if(obj.videoplay){
            return 'video://' + obj.vipUrl;
        }else{
            return exeWebRule({webUrl:obj.vipUrl, js:obj.js}, 0) || "toast://exeWebRule获取失败，可试试video";
        }
    }else if(/^function/.test(obj.ulist.url.trim())){
        //js解析
        obj.ulist['type'] = '2';
        let rurl;
        try{
            eval('var JSparse = '+obj.ulist.url)
            rurl = JSparse(obj.vipUrl);
            //log(rurl);
        }catch(e){
            //log("解析有错误"+e.message);
        }
        if(rurl){
            if(/^toast/.test(rurl)){
                log(obj.ulist.name + '>提示：' + rurl.replace('toast://',''));
                rurl = "";
            }else if(obj.checkVideo && /^http/.test(rurl) && obj.checkVideo(rurl,obj.ulist.name)==0){
                rurl = "";
            }
        }
        return {url: rurl || "", ulist: obj.ulist}; 
    }else{
        //url解析
        let taskheader = {withStatusCode:true, timeout:8000};
        let ext = obj.ulist.ext || {};
        taskheader['header'] = ext.header;
        let getjson;
        try{
            getjson = JSON.parse(request(obj.ulist.url+obj.vipUrl, taskheader));
        }catch(e){
            getjson = {};
            log(obj.ulist.name + '>解析地址访问失败');
        }
        //log(getjson);
        if (getjson.body && getjson.statusCode==200){
            let gethtml = getjson.body;
            let rurl = "";
            let isjson = 0;
            try {
                if(ext.decrypt){
                    // 加密解析
                    function appDecrypt(ciphertext, decrypt) {
                        eval(getCryptoJS());
                        let key = decrypt.key;
                        let iv = decrypt.iv;
                        let mode = decrypt.mode || CryptoJS.mode.ECB;
                        let padding = decrypt.padding || CryptoJS.pad.Pkcs7;
                        key = CryptoJS.enc.Utf8.parse(key);

                        function decrypt(ciphertext) {
                            let decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
                                mode: mode,
                                padding: padding,
                                iv: iv
                            });
                            return decrypted.toString(CryptoJS.enc.Utf8);
                        }
                        return decrypt(ciphertext);
                    }
                    gethtml = appDecrypt(gethtml, ext.decrypt);
                }
                let json = JSON.parse(gethtml);
                //log(json);
                isjson = 1;
                rurl = json.url||json.urll||json.data.url||json.data;
                obj.ulist['type'] = '1';
            } catch (e) {
                //log("非json>"+e.message);
                if(/\.m3u8|\.mp4/.test(getjson.url) && getjson.url.indexOf('=http')==-1){
                    rurl = getjson.url;
                }else if(/\.m3u8|\.mp4/.test(gethtml)){
                    rurl = geturl(gethtml);
                }
                //明码失败，最后一步走嗅探
                if(!rurl){
                    //可用于注入js模似点击
                    function extraJS(playUrl) {
                        function click1(p1,p2) {
                            return $.toString((p1,p2) => {
                                function check() {
                                    try {
                                        let iframe = document.querySelector(p1);
                                        let iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
                                        iframeDocument.querySelector(p2).click();
                                    } catch (e) {
                                        setTimeout(check, 100);
                                    }
                                }
                                check();
                            },p1,p2)
                        }
                        function click2() {
                            return $.toString(() => {
                                function check() {
                                    var is = 0;
                                    // 获取所有具有 id 属性的元素
                                    var elementsWithId = Array.from(document.querySelectorAll('[id]'));
                                    // 遍历每个元素，检查文本内容并触发点击事件
                                    elementsWithId.forEach(element => {
                                        // 检查元素的文本内容是否包含 "点击播放"
                                        if (element.outerHTML.includes("播放")) {
                                            element.click();
                                            is = 1;
                                        }
                                    });
                                    if(is==0){
                                        setTimeout(check, 100);
                                    }
                                }
                                check();
                            })
                        }
                        function click3(p1) {
                            return $.toString((p1) => {
                                function check() {
                                    try {
                                        document.getElementsByClassName(p1)[0].click();
                                    } catch (e) {
                                        setTimeout(check, 100);
                                    }
                                }
                                check();
                            },p1)
                        }
                        if(/jqqzx\.|dadazhu\.|dadagui|freeok/.test(playUrl)){
                            return click1('#playleft iframe','#start');
                        }else if(/media\.staticfile\.link/.test(playUrl)){
                            return click2();
                        }else if(/maolvys\.com/.test(playUrl)){
                            return click3();
                        }else{
                            return undefined;
                        }
                    }
                    //"document.getElementsByClassName('swal-button swal-button--confirm')[0].click()"
                    
                    let purl = obj.ulist.url+obj.vipUrl;
                    if(/jx\.playerjy\.com/.test(purl)){
                        taskheader['referer'] = purl;
                        let burl = pd(fetch(purl), "iframe&&src", purl);
                        purl = pd(fetch(burl), "iframe&&src", purl);
                        log("获取到iframe地址>" + purl);
                    }
                    rurl = exeWebRule({webUrl: purl, head: taskheader, js: ext.js||extraJS(purl)}, 0) || "";
                }
            }

            if(!rurl){
                if(!/404 /.test(gethtml) && obj.ulist.url.indexOf('key=')==-1 && isjson==0){
                    obj.ulist['type'] = '0';
                }
            }else if(obj.checkVideo && /^http/.test(rurl) && obj.checkVideo(rurl, obj.ulist.name)==0){
                rurl = "";
            }
            
            return {url: rurl, ulist: obj.ulist}; 
        }else{
            return {url: "", ulist: obj.ulist, error: 1};//网页无法访问状态码不等于200 
        }
    }
}
    