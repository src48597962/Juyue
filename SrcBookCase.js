function bookCase() {
    require(config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'SrcJuPublic.js');

    let Julist = [];
    let collection = JSON.parse(fetch("hiker://collection?rule="+MY_RULE.title));
    collection.forEach(it => {
        try{
            if(it.params&& (JSON.parse(it.params).title==MY_RULE.title)){
                Julist.push(it);
            }
        }catch(e){
            xlog("√书架加载异常>"+e.message);
        }
    })
    setPageTitle('我的书架');
    let d = [];
    d.push({
        title: ' 本地下载',
        url: getMyVar("SrcJu_bookCaseType","全部")=="全部"?"hiker://page/Main.view?rule=本地资源管理":"hiker://page/Bookrack.view?rule=本地资源管理&ruleName="+MY_RULE.title+"&type="+(getMyVar("SrcJu_bookCaseType")=="漫画"?"comic":"novel"),
        img: "http://123.56.105.145/tubiao/messy/70.svg",
        col_type: "icon_2"
    });
    d.push({
        title: ' 切换样式',
        url: $('#noLoading#').lazyRule(() => {
            if(getItem("bookCase_col_type")=="movie_3_marquee"){
                clearItem("bookCase_col_type");
            }else{
                setItem("bookCase_col_type", "movie_3_marquee");
            }
            refreshPage(false);
            return 'hiker://empty';
        }),
        img: "http://123.56.105.145/tubiao/messy/85.svg",
        col_type: "icon_2"
    });
    for (let i = 0; i < 8; i++) {
        d.push({
            col_type: "blank_block"
        })
    }
    let typebtn = getTypeNames();
    typebtn.unshift("全部");
    typebtn.forEach(it =>{
        d.push({
            title: getMyVar("SrcJu_bookCaseType","全部")==it?`““””<b><span style="color: #3399cc">`+it+`</span></b>`:it,
            url: $('#noLoading#').lazyRule((it) => {
                putMyVar("SrcJu_bookCaseType",it);
                refreshPage(false);
                return "hiker://empty";
            },it),
            col_type: 'scroll_button'
        })
    })
    let col_type = getItem("bookCase_col_type", "movie_1_vertical_pic");
    Julist.forEach(it => {
        try{
            let params = JSON.parse(it.params);
            let stype = JSON.parse(params.params).stype;
            if(getMyVar("SrcJu_bookCaseType")==stype || getMyVar("SrcJu_bookCaseType","全部")=="全部"){
                let name = it.mTitle.indexOf(JSON.parse(params.params).name)>-1?JSON.parse(params.params).name:it.mTitle;
                let sname = JSON.parse(params.params).sname;
                let surl = JSON.parse(params.params).surl;
                let extraData = it.extraData?JSON.parse(it.extraData):{};
                let last = extraData.lastChapterStatus?extraData.lastChapterStatus:"";
                let mask = it.lastClick?it.lastClick.split('@@')[0]:"";
                d.push({
                    title: col_type=='movie_1_vertical_pic'?name + "\n\n‘‘’’<small>💠 "+stype+" | "+(sname||"")+"</small>":name,
                    pic_url: it.picUrl,
                    desc: col_type=='movie_1_vertical_pic'?"🕓 "+mask+"\n\n🔘 "+last:last,
                    url: $("hiker://empty?type="+stype+"#immersiveTheme##autoCache#").rule(() => {
                        require(config.聚阅);
                        erji();
                        putMyVar('从书架进二级','1');
                    }),
                    col_type: col_type,
                    extra: {
                        pageTitle: name,
                        name: name,
                        img: it.picUrl,
                        sname: sname,
                        surl: surl,
                        stype: stype,
                        sourcedata: JSON.parse(params.params).sourcedata,
                        lineVisible: false,
                        cls: "caselist"
                    }
                })
            }
        }catch(e){
            xlog("√书架加载异常>"+e.message);
        }
    })
    d.push({
        title: Julist.length==0?"书架空空如也~~♥收藏即加入书架":"",
        url: "hiker://empty",
        col_type: "text_center_1",
        extra: {
            lineVisible: false,
            id: "caseloading"
        }
    })
    setResult(d);
}