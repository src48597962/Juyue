function getYiData(jkdata, batchTest) {
    addListener('onRefresh', $.toString(() => {
        clearMyVar('动态加载loading')
    }));
    addListener('onClose', $.toString(() => {
        clearMyVar('动态加载loading')
    }));

    let d = od || [];
    let sourcedata = getDatas('yi', true).filter(it => {
        return it.id==homeSourceId;
    });
    let parse;
    let 公共;
    try {
        if (sourcedata.length==1) {
            eval("let source = " + sourcedata[0].parse);
            parse = source;
        }
    } catch (e) {
        log("一级源代码加载异常>" + e.message + " 错误行#" + e.lineNumber);
    }
    if (parse) {
        try {
            eval("let gonggong = " + sourcedata[0].public);
            if (gonggong && gonggong.ext && /^http/.test(gonggong.ext)) {
                requireCache(gonggong.ext, 48);
                gonggong = ggdata;
            }
            公共 = gonggong || parse['公共'] || {};
            if (公共['预处理']) {
                try {
                    公共['预处理']();
                } catch (e) {
                    log('执行预处理报错，信息>' + e.message + " 错误行#" + e.lineNumber);
                }
            }
            let info = { type: sourcedata[0].type, name: sourcedata[0].name };
            let 标识 = info.type + "_" + info.name;
            let itemid = 标识 + "_" + datatype;
            let page = MY_PAGE || 1;
            let loading;
            if (page == 1 && typeof (setPreResult) != "undefined" && getMyVar('动态加载loading') != itemid) {
                loading = 1;
                d.push({
                    title: "",
                    url: "hiker://empty",
                    col_type: "text_1",
                    extra: {
                        lineVisible: false,
                        cls: "loading_gif"
                    }
                })
                d.push({
                    title: "",
                    url: "hiker://empty",
                    col_type: "text_1",
                    extra: {
                        lineVisible: false,
                        cls: "loading_gif"
                    }
                })
                d.push({
                    pic_url: "http://123.56.105.145/weisyr/img/Loading1.gif",
                    col_type: "pic_1_center",
                    url: "hiker://empty",
                    extra: {
                        cls: "loading_gif"
                    }
                })
                setPreResult(d);
                d = [];
                putMyVar('动态加载loading', itemid);
            }
            let 执行str = parse[datatype].toString();

            if (!执行str.includes('rule')) {
                执行str = replaceLast(执行str, 'setResult', 'return ')
            }

            let 页码 = parse["页码"] || {};
            let 转换 = parse["转换"] || {};
            let zz = 转换["排行"] || "排行";
            if(parse&&parse[zz]){
                d.push({
                    title: zz,
                    url: rulePage(zz,页码[zz]),
                    pic_url: "http://123.56.105.145/tubiao/more/229.png",
                    col_type: 'icon_small_3'
                })
            }
            zz = 转换["分类"] || "分类";
            if(parse&&parse[zz]){
                d.push({
                    title: zz,
                    url: rulePage(zz,页码[zz]),
                    pic_url: "http://123.56.105.145/tubiao/more/287.png",
                    col_type: 'icon_small_3'
                })
            }
            zz = 转换["更新"] || "更新";
            if(parse&&parse[zz]){
                d.push({
                    title: zz,
                    url: rulePage(zz,页码[zz]),
                    pic_url: "http://123.56.105.145/tubiao/more/288.png",
                    col_type: 'icon_small_3'
                })
            }

            let obj = parse.四大金刚 || {};
            if (obj.url && obj.type == datatype) {//四大金刚获取分类数据
                let class_name = (obj.class_name || "").split('&').filter(item => item != '');
                let class_url = (obj.class_url || "").split('&').filter(item => item != '');
                let area_name = (obj.area_name || "").split('&').filter(item => item != '');
                let area_url = (obj.area_url || "").split('&').filter(item => item != '');
                let year_name = (obj.year_name || "").split('&').filter(item => item != '');
                let year_url = (obj.year_url || "").split('&').filter(item => item != '');
                let sort_name = (obj.sort_name || "").split('&').filter(item => item != '');
                let sort_url = (obj.sort_url || "").split('&').filter(item => item != '');
                let isAll = (obj.url || "").includes('fyAll') ? 1 : 0;
                fyAll = getMyVar("fyAll_id", class_url.length > 0 ? class_url[0] : "");
                fyclass = isAll ? fyAll : getMyVar("fyclass_id", class_url.length > 0 ? class_url[0] : "");
                fyarea = isAll ? fyAll : getMyVar("fyarea_id", area_url.length > 0 ? area_url[0] : "");
                fyyear = isAll ? fyAll : getMyVar("fyyear_id", year_url.length > 0 ? year_url[0] : "");
                fysort = isAll ? fyAll : getMyVar("fysort_id", sort_url.length > 0 ? sort_url[0] : "");
                if (page == 1) {
                    class_url.forEach((it, i) => {
                        try {
                            d.push({
                                title: fyclass == it ? `““””<b><span style="color: #09c11b">` + class_name[i] + `</span></b>` : class_name[i],
                                url: $("#noLoading#").lazyRule((id_name, nowid, newid) => {
                                    if (nowid != newid) {
                                        putMyVar(id_name, newid);
                                        refreshPage(false);
                                    }
                                    return 'hiker://empty'
                                }, isAll ? "fyAll_id" : "fyclass_id", fyclass, it),
                                col_type: 'scroll_button'
                            })
                        } catch (e) { }
                    })
                    area_url.forEach((it, i) => {
                        if (i == 0) {
                            d.push({
                                col_type: "blank_block"
                            })
                        }
                        try {
                            d.push({
                                title: fyarea == it ? `““””<b><span style="color: #09c11b">` + area_name[i] + `</span></b>` : area_name[i],
                                url: $("#noLoading#").lazyRule((id_name, nowid, newid) => {
                                    if (nowid != newid) {
                                        putMyVar(id_name, newid);
                                        refreshPage(false);
                                    }
                                    return 'hiker://empty'
                                }, isAll ? "fyAll_id" : "fyarea_id", fyarea, it),
                                col_type: 'scroll_button'
                            })
                        } catch (e) { }
                    })
                    year_url.forEach((it, i) => {
                        if (i == 0) {
                            d.push({
                                col_type: "blank_block"
                            })
                        }
                        try {
                            d.push({
                                title: fyyear == it ? `““””<b><span style="color: #09c11b">` + year_name[i] + `</span></b>` : year_name[i],
                                url: $("#noLoading#").lazyRule((id_name, nowid, newid) => {
                                    if (nowid != newid) {
                                        putMyVar(id_name, newid);
                                        refreshPage(false);
                                    }
                                    return 'hiker://empty'
                                }, isAll ? "fyAll_id" : "fyyear_id", fyyear, it),
                                col_type: 'scroll_button'
                            })
                        } catch (e) { }
                    })
                    sort_url.forEach((it, i) => {
                        if (i == 0) {
                            d.push({
                                col_type: "blank_block"
                            })
                        }
                        try {
                            d.push({
                                title: fysort == it ? `““””<b><span style="color: #09c11b">` + sort_name[i] + `</span></b>` : sort_name[i],
                                url: $("#noLoading#").lazyRule((id_name, nowid, newid) => {
                                    if (nowid != newid) {
                                        putMyVar(id_name, newid);
                                        refreshPage(false);
                                    }
                                    return 'hiker://empty'
                                }, isAll ? "fyAll_id" : "fysort_id", fysort, it),
                                col_type: 'scroll_button'
                            })
                        } catch (e) { }
                    })
                    d.push({
                        col_type: "blank_block"
                    })
                }

                let fypage = page;
                MY_URL = obj.url.replace('fyAll', fyAll).replace('fyclass', fyclass).replace('fyarea', fyarea).replace('fyyear', fyyear).replace('fysort', fysort).replace('fypage', fypage);
                执行str = 执行str.replace('getResCode()', 'request(MY_URL)');
            }
            
            let error = "";
            let getData = [];
            try {
                eval("let 数据 = " + 执行str);
                getData = 数据() || [];
            } catch (e) {
                getData = [];
                error = e.message;
                log('执行获取数据报错，信息>' + e.message + " 错误行#" + e.lineNumber);
            }
            if (loading) {
                deleteItemByCls("loading_gif");
            }

            if (getData.length == 0 && page == 1) {
                d.push({
                    title: "未获取到数据",
                    desc: error,
                    url: "hiker://empty",
                    col_type: "text_center_1",
                })
            } else if (getData.length > 0) {
                require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuMethod.js');
                getData.forEach(item => {
                    try {
                        item = toerji(item, info);
                    } catch (e) {
                        //log(item);
                    }
                })
            }
            d = d.concat(getData);
        } catch (e) {
            toast(datatype + "代码报错，更换主页源或联系接口作者");
            log("报错信息>" + e.message + " 错误行#" + e.lineNumber);
        }
        setResult(d);
    } else {
        if (datatype == "主页") {
            d.push({
                title: homeGroup + " 主页源不存在\n需先选择配置主页源",
                desc: "点此或上面按钮皆可选择",
                url: $('#noLoading#').lazyRule((input) => {
                    require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');
                    return selectSource(input);
                }, homeGroup),
                col_type: "text_center_1",
                extra: {
                    lineVisible: false
                }
            })
        }
        setResult(d);
    }
}