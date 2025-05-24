function getYiData(datatype, jkdata, dd) {
    addListener('onRefresh', $.toString(() => {
        clearMyVar(datatype+'动态加载loading')
    }));
    addListener('onClose', $.toString(() => {
        clearMyVar(datatype+'动态加载loading')
    }));

    eval(fetch(jkdata.url));

    let d = dd || [];
    let page = MY_PAGE || 1;
    let 公共 = rule;

    try {
        if (page == 1 && typeof (setPreResult) != "undefined" && getMyVar(datatype+'动态加载loading') != '1') {
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
                pic_url: config.聚阅.replace(/[^/]*$/,'') + "img/Loading.gif",
                col_type: "pic_1_center",
                url: "hiker://empty",
                extra: {
                    cls: "loading_gif"
                }
            })
            setPreResult(d);
            d = [];
            putMyVar(datatype+'动态加载loading', '1');
        }

        let 页码 = rule["页码"] || {};
        if(!页码[datatype] && page>1){
            return [];
        }
        let 转换 = rule["转换"] || {};
        let zz = 转换["排行"] || "排行";
        if(rule[zz]){
            d.push({
                title: zz,
                url: rulePage(zz,页码[zz]),
                pic_url: "http://123.56.105.145/tubiao/more/229.png",
                col_type: 'icon_small_3'
            })
        }
        zz = 转换["分类"] || "分类";
        if(rule[zz]){
            d.push({
                title: zz,
                url: rulePage(zz,页码[zz]),
                pic_url: "http://123.56.105.145/tubiao/more/287.png",
                col_type: 'icon_small_3'
            })
        }
        zz = 转换["更新"] || "更新";
        if(rule[zz]){
            d.push({
                title: zz,
                url: rulePage(zz,页码[zz]),
                pic_url: "http://123.56.105.145/tubiao/more/288.png",
                col_type: 'icon_small_3'
            })
        }
        let 执行str = rule[datatype].toString();
        let obj = rule.四大金刚 || {};
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
            if (公共['预处理']) {
                try {
                    公共['预处理']();
                } catch (e) {
                    log('执行预处理报错，信息>' + e.message + " 错误行#" + e.lineNumber);
                }
            }
            let setResult = function (d){
                return d;
            }
            eval("let 数据 = " + 执行str);
            getData = 数据() || [];
        } catch (e) {
            getData = [];
            error = e.message;
            log('执行获取数据报错，信息>' + e.message + " 错误行#" + e.lineNumber);
        }
        deleteItemByCls("loading_gif");

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
        toast(datatype + "代码报错，更换主页源或联系接口作者修复");
        log("报错信息>" + e.message + " 错误行#" + e.lineNumber);
    }

    return d;
}