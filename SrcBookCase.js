require(config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'SrcJuPublic.js');

function addCase(obj) {
    let casefile = rulepath + 'case.json';
    eval('let caselist = ' + (fetch(casefile)||'[]'));

    caselist.unshift(obj);
    writeFile(casefile, JSON.stringify(caselist));
    toast('已加入');
}

function bookCase() {
    addListener("onClose", $.toString(() => {
        clearMyVar('书架收藏列表');
    }));

    setPageTitle('我的收藏书架');
    let d = [];
    let sjIcons = getThemeList(true)['书架图标'];
    d.push({
        title: '本地下载',
        url: getMyVar("SrcJu_bookCaseType","全部")=="全部"?"hiker://page/Main.view?rule=本地资源管理":"hiker://page/Bookrack.view?rule=本地资源管理&ruleName="+MY_RULE.title+"&type="+(getMyVar("SrcJu_bookCaseType")=="漫画"?"comic":"novel"),
        img: getIcon(sjIcons[0].img, false, sjIcons[0].color),
        col_type: "icon_small_3"
    });
    d.push({
        title: '切换样式',
        url: $('#noLoading#').lazyRule(() => {
            if(getItem("bookCase_col_type")=="movie_3_marquee"){
                clearItem("bookCase_col_type");
            }else{
                setItem("bookCase_col_type", "movie_3_marquee");
            }
            refreshPage(false);
            return 'hiker://empty';
        }),
        img: getIcon(sjIcons[1].img, false, sjIcons[1].color),
        col_type: "icon_small_3"
    });
    d.push({
        title: getItem("切换收藏列表", "聚阅收藏"),
        url: $('#noLoading#').lazyRule(() => {
            if(getItem("切换收藏列表")=="软件收藏"){
                clearItem("切换收藏列表");
            }else{
                setItem("切换收藏列表", "软件收藏");
            }
            clearMyVar('书架收藏列表');
            refreshPage(false);
            return 'hiker://empty';
        }),
        img: getIcon(sjIcons[2].img, false, sjIcons[2].color),
        col_type: "icon_small_3"
    });
    for (let i = 0; i < 8; i++) {
        d.push({
            col_type: "blank_block"
        })
    }
    let Color = getItem('主题颜色','#3399cc');
    let typebtn = getTypeNames();
    typebtn.unshift("全部");
    typebtn.forEach(it =>{
        d.push({
            title: getMyVar("SrcJu_bookCaseType","全部")==it?`““””<b><span style="color: `+Color+`">`+it+`</span></b>`:it,
            url: $('#noLoading#').lazyRule((it) => {
                putMyVar("SrcJu_bookCaseType",it);
                refreshPage(false);
                return "hiker://empty";
            },it),
            col_type: 'scroll_button',
            extra: {
                backgroundColor: getMyVar("SrcJu_bookCaseType","全部")==it?"#20" + Color.replace('#',''):""
            }
        })
    })
    let col_type = getItem("bookCase_col_type", "movie_1_vertical_pic");

    let Julist = [];
    if(storage0.getMyVar('书架收藏列表')){
        Julist = storage0.getMyVar('书架收藏列表');
    }else{
        if(getItem("切换收藏列表")=="软件收藏"){
            let collection = JSON.parse(fetch("hiker://collection?rule="+MY_RULE.title));
            collection.forEach(it => {
                try{
                    if(it.params&& (JSON.parse(it.params).title==MY_RULE.title)){
                        Julist.push(it);
                    }
                }catch(e){
                    xlog("书架加载异常>"+e.message);
                }
            })
        }else{
            let casefile = rulepath + 'case.json';
            eval('let caselist = ' + (fetch(casefile)||'[]'));
            let history = JSON.parse(fetch("hiker://history?rule="+MY_RULE.title));
            history = history.filter(v=>v.type=='二级列表');
            caselist.forEach(it => {
                history = history.filter(v=>v.title==it.name&&v.picUrl==it.img);
                if(history.length==1){
                    it.mask = history[0].lastClick?history[0].lastClick.split('@@')[0]:"";
                }
                Julist.push(it);
            })
        }
        storage0.putMyVar('书架收藏列表', Julist);
    }

    if(getItem("切换收藏列表")=="软件收藏"){
        Julist.forEach(it => {
            try{
                let params = JSON.parse(it.params);
                let stype = JSON.parse(params.params).data.type;
                if(getMyVar("SrcJu_bookCaseType")==stype || getMyVar("SrcJu_bookCaseType","全部")=="全部"){
                    let extra = JSON.parse(params.params);
                    extra['cls'] = "caselist";
                    extra['lineVisible'] = false;
                    delete extra['id'];
                    let name = it.mTitle.indexOf(extra.name)>-1?extra.name:it.mTitle;
                    let sname = extra.data.name;
                    let extraData = it.extraData?JSON.parse(it.extraData):{};
                    let last = extraData.lastChapterStatus?extraData.lastChapterStatus:"";
                    let mask = it.lastClick?it.lastClick.split('@@')[0]:"";
                    d.push({
                        title: col_type=='movie_1_vertical_pic'?name.substring(0,15) + "\n\n‘‘’’<small>💠  <font color=#bfbfbf>"+stype+" | "+(sname||"")+"</font></small>":name,
                        pic_url: it.picUrl,
                        desc: col_type=='movie_1_vertical_pic'?"🕓 "+mask.substring(0,15)+"\n\n🔘 "+last:last,
                        url: $("hiker://empty?type="+stype+"#immersiveTheme##autoCache#").rule(() => {
                            require(config.聚阅);
                            erji();
                            putMyVar('从书架进二级','1');
                        }),
                        col_type: col_type,
                        extra: extra
                    })
                }
            }catch(e){
                xlog("书架加载异常>"+e.message);
            }
        })
    }else{//聚阅收藏列表
        Julist.forEach(it => {
            try{
                let stype = it.data.type;
                if(getMyVar("SrcJu_bookCaseType")==stype || getMyVar("SrcJu_bookCaseType","全部")=="全部"){
                    let extra = it;
                    extra['cls'] = "caselist";
                    extra['lineVisible'] = false;
                    delete extra['id'];
                    let name = it.name;
                    let sname = extra.data.name;
                    let last = it.last||"";
                    let mask = it.mask||"";
                    d.push({
                        title: col_type=='movie_1_vertical_pic'?name.substring(0,15) + "\n\n‘‘’’<small>💠  <font color=#bfbfbf>"+stype+" | "+(sname||"")+"</font></small>":name,
                        pic_url: it.img,
                        desc: col_type=='movie_1_vertical_pic'?"🕓 "+mask.substring(0,15)+"\n\n🔘 "+last:last,
                        url: $("hiker://empty?type="+stype+"#immersiveTheme##autoCache#").rule((caseurl) => {
                            require(config.聚阅);
                            erji();
                            putMyVar('从书架进二级','1');
                            let caselist = storage0.getMyVar('书架收藏列表');
                            let index = caselist.findIndex(item => item.url === caseurl);
                            const [target] = caselist.splice(index, 1);
                            caselist.unshift(target);
                            storage0.putMyVar('书架收藏列表', caselist);
                        }, it.url),
                        col_type: col_type,
                        extra: extra
                    })
                }
            }catch(e){
                xlog("书架加载异常>"+e.message);
            }
        })
    }
    
    d.push({
        title: Julist.length==0?"空空如也~~"+(getItem("切换收藏列表")=="软件收藏"?"右上角♥加入软件收藏":"长按二级封面加入聚阅收藏"):"",
        url: "hiker://empty",
        col_type: "text_center_1",
        extra: {
            lineVisible: false,
            id: "caseloading"
        }
    })
    setResult(d);
}