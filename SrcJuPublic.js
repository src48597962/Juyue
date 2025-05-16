let cfgfile = "hiker://files/rules/Src/Ju/config.json";
let Jucfg = fetch(cfgfile);
if (Jucfg != "") {
    eval("var Juconfig=" + Jucfg + ";");
} else {
    var Juconfig = {};
    Juconfig["依赖"] = config.聚阅 || "https://gitcode.net/src48597962/hk/-/raw/Ju/SrcJuPublic.js";
    writeFile(cfgfile, JSON.stringify(Juconfig));
}

let runTypes = ["漫画", "小说", "听书", "图集", "影视", "音频", "聚合", "其它"];
let runMode = Juconfig["runMode"] || "漫画";
let sourcename = Juconfig[runMode + 'sourcename'] || "";//主页源名称
let stopTypes = storage0.getItem('stopTypes', []);

let sourcefile = "hiker://files/rules/Src/Ju/jiekou.json";
let sourcedata = fetch(sourcefile);
if (sourcedata != "") {
    try {
        eval("var datalist=" + sourcedata + ";");
    } catch (e) {
        var datalist = [];
    }
} else {
    var datalist = [];
}

datalist.reverse();

let yxdatalist = datalist.filter(it => {
    return !it.stop;
});
let yidatalist = yxdatalist.filter(it => {
    return it.parse;
});
let erdatalist = yxdatalist.filter(it => {
    return it.erparse;
});
//获取类型名称数组
function getTypeNames(is) {
    let snames = [];
    if (is == "主页") {
        runTypes.forEach(it => {
            if (stopTypes.indexOf(it) == -1) {
                snames.push(it);
            }
        })
    } else if (is == "搜索页") {
        snames = ["漫画", "小说", "听书", "影视", "聚合"];
    } else {
        snames = runTypes;
    }
    return snames;
}
//获取类型名称数组
function getGroupNames() {
    let gnames = [];
    erdatalist.forEach(it => {
        if (it.group && gnames.indexOf(it.group) == -1) {
            gnames.push(it.group);
        }
    })
    return gnames;
}

//获取接口列表数据
function getListData(lx, selectType) {
    let jkdatalist = [];
    if (lx == "all") {
        jkdatalist = datalist;
    } else if (lx == "yx") {
        jkdatalist = yxdatalist;
    } else if (lx == "yi") {
        jkdatalist = yidatalist;
    } else if (lx == "er") {
        jkdatalist = erdatalist;
    }
    jkdatalist = jkdatalist.filter(it => {
        return selectType == "全部" || selectType == it.type;
    })
    if (getItem('sourceListSort', 'update') == 'name') {
        jkdatalist = sortByPinyin(jkdatalist);
    }

    // 禁用的放到最后
    let withStop = jkdatalist.filter(item => item.stop);
    let withoutStop = jkdatalist.filter(item => !item.stop);
    // 合并数组
    let result = withoutStop.concat(withStop);

    return result;
}
//选择主页源新方法hikerPop
function selectSource2(selectType) {
        const hikerPop = $.require(config.聚阅.match(/http(s)?:\/\/.*\//)[0] + "plugins/hikerPop.js");
        let sourceList = getListData("yi", selectType);

        hikerPop.setUseStartActivity(false);

        let items = sourceList.map(v => {
            return {title:v.name,icon:v.img};
        });
        let spen = 3;
        let index = items.indexOf(items.filter(d => d.title == sourcename)[0]);

        let pop = hikerPop.selectBottomResIcon({
            iconList: items,
            columns: spen,
            title: "当前源>" + selectType + "_" + sourcename,
            noAutoDismiss: false,
            position: index,
            toPosition: index,
            extraInputBox: new hikerPop.ResExtraInputBox({
                hint: "源关键字",
                title: "ok",
                onChange(s, manage) {
                    //log("onChange:"+s);
                    let flist = items.filter(x => x.title.toLowerCase().includes(s.toLowerCase()));
                    manage.change(flist);
                },
                defaultValue: "",
                click(s, manage) {
                    //toast(s);
                    //log(manage.iconList);
                },
                titleVisible: false
            }),
            longClick(s, i) {
                /*
                showSelectOptions({
                    title: "分享视频源",
                    options: ["JS文件分享"].concat(getPastes()),
                    col: 2,
                    js: $.toString(name => {
                        
                    }, s.replace(/[’‘]/g, ""))
                });
                */
            },
            click(item, i, manage) {
                pop.dismiss();

                let input = item.title.replace(/[’‘]/g, "");
                return changeSource(selectType, input);
            },
            menuClick(manage) {
                hikerPop.selectCenter({
                    options: ["改变样式", "排序方法:" + (getItem('sourceListSort', 'update') == 'name' ? "名称" : "时间"), "列表倒序"],
                    columns: 2,
                    title: "请选择",
                    click(s, i) {
                        if (i === 0) {
                            spen = spen == 3 ? 2 : 3;
                            manage.changeColumns(spen);
                            manage.scrollToPosition(index, false);
                        } else if (i === 1) {
                            setItem("sourceListSort", getItem('sourceListSort') == 'name' ? "update" : "name");
                            let items = getListData("yi", selectType).map(v => {
                                return {title:v.name,icon:v.img};
                            });
                            manage.change(items);
                            let index = items.indexOf(items.filter(d => d.title == sourcename)[0]);
                            manage.scrollToPosition(index, true);
                            manage.setSelectedIndex(index);
                        } else if (i === 2) {
                            items.reverse();
                            manage.change(items);
                            let index = items.indexOf(items.filter(d => d.title == sourcename)[0]);
                            manage.setSelectedIndex(index);
                            manage.scrollToPosition(index, true);
                        }
                    }
                });
            }
        });
    return 'hiker://empty';
}
function changeSource(stype, sname) {
    if (stype == runMode && sname == Juconfig[stype + 'sourcename']) {
        return 'toast://' + stype + ' 主页源：' + sname;
    }
    if (typeof (unRegisterTask) != "undefined") {
        unRegisterTask("juyue");
    } else {
        toast("软件版本过低，可能存在异常");
    }
    try {
        let listMyVar = listMyVarKeys();
        listMyVar.forEach(it => {
            if (!/^SrcJu_|initConfig/.test(it)) {
                clearMyVar(it);
            }
        })
    } catch (e) {
        xlog('清MyVar失败>' + e.message);
        clearMyVar(MY_RULE.title + "分类");
        clearMyVar(MY_RULE.title + "更新");
        clearMyVar(MY_RULE.title + "类别");
        clearMyVar(MY_RULE.title + "地区");
        clearMyVar(MY_RULE.title + "进度");
        clearMyVar(MY_RULE.title + "排序");
        clearMyVar("排名");
        clearMyVar("分类");
        clearMyVar("更新");
        clearMyVar(stype + "_" + sourcename);
        clearMyVar("一级源接口信息");
    }
    try {
        refreshX5WebView('about:blank');
    } catch (e) { }

    Juconfig["runMode"] = stype;
    Juconfig[stype + 'sourcename'] = sname;
    writeFile(cfgfile, JSON.stringify(Juconfig));
    refreshPage(false);
    return 'toast://' + stype + ' 主页源已设置为：' + sname;
}
//封装选择主页源方法
function selectSource(selectType) {
    if (getItem('selectSource_col_type') == 'hikerPop') {
        return selectSource2(selectType);
    }
    let sourcenames = [];
    let selectIndex = -1;

    if ((MY_NAME == "海阔视界" && getAppVersion() >= 4706)) {
        getListData("yi", selectType).forEach((it, i) => {
            if (sourcenames.indexOf(it.name) == -1) {
                if (Juconfig[runMode + 'sourcename'] == it.name) {
                    it.name = it.name + '√';
                    selectIndex = i;
                }
                sourcenames.push({ title: it.name, icon: it.img });
            }
        })
    } else {
        getListData("yi", selectType).forEach(it => {
            if (sourcenames.indexOf(it.name) == -1) {
                if (Juconfig[runMode + 'sourcename'] == it.name) {
                    it.name = '‘‘’’<span style="color:red" title="' + it.name + '">' + it.name + '</span>';
                }
                sourcenames.push(it.name);
            }
        })
    }

    if (sourcenames.length == 0) {
        return "toast://当前分类无接口"
    }

    return $(sourcenames, 3, selectType + ">主页源>" + sourcename, selectIndex).select((runMode, sourcename, cfgfile, Juconfig) => {

        input = input.replace(/‘|’|“|”|<[^>]+>/g, "").replace(/(.*)√/, '$1');
        if (Juconfig["runMode"] == runMode && input == Juconfig[runMode + 'sourcename']) {
            return 'toast://' + runMode + ' 主页源：' + input;
        }
        if (typeof (unRegisterTask) != "undefined") {
            unRegisterTask("juyue");
        } else {
            toast("软件版本过低，可能存在异常");
        }
        try {
            let listMyVar = listMyVarKeys();
            listMyVar.forEach(it => {
                if (!/^SrcJu_|initConfig/.test(it)) {
                    clearMyVar(it);
                }
            })
        } catch (e) {
            xlog('清MyVar失败>' + e.message);
            clearMyVar(MY_RULE.title + "分类");
            clearMyVar(MY_RULE.title + "更新");
            clearMyVar(MY_RULE.title + "类别");
            clearMyVar(MY_RULE.title + "地区");
            clearMyVar(MY_RULE.title + "进度");
            clearMyVar(MY_RULE.title + "排序");
            clearMyVar("排名");
            clearMyVar("分类");
            clearMyVar("更新");
            clearMyVar(runMode + "_" + sourcename);
            clearMyVar("一级源接口信息");
        }
        try {
            refreshX5WebView('about:blank');
        } catch (e) { }

        Juconfig["runMode"] = runMode;
        Juconfig[runMode + 'sourcename'] = input;
        writeFile(cfgfile, JSON.stringify(Juconfig));
        refreshPage(false);
        return 'toast://' + runMode + ' 主页源已设置为：' + input;
    }, selectType, sourcename, cfgfile, Juconfig)
    //}});
    //return "hiker://empty";
}
//打开指定类型的新页面
function rulePage(datatype, ispage) {
    return $("hiker://empty#noRecordHistory##noHistory#" + (ispage ? "?page=fypage" : "")).rule((datatype) => {
        require(config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'SrcJuPublic.js');
        getYiData(datatype);
    }, datatype)
}

//获取一级数据
function getYiData(datatype, od) {
    addListener('onRefresh', $.toString(() => {
        clearMyVar('动态加载loading')
    }));
    addListener('onClose', $.toString(() => {
        clearMyVar('动态加载loading')
    }));

    let d = od || [];
    let sourcedata = yidatalist.filter(it => {
        return it.name == sourcename && it.type == runMode;
    });
    let parse;
    let 公共;
    try {
        if (sourcedata.length > 0) {
            eval("let source = " + sourcedata[0].parse);
            if (source.ext && /^http/.test(source.ext)) {
                requireCache(source.ext, 48);
                parse = yidata;
            } else {
                parse = source;
            }
        }
    } catch (e) {
        xlog("√一级源代码加载异常>" + e.message);
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
                    xlog('√执行预处理报错，信息>' + e.message + " 错误行#" + e.lineNumber);
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
            let getData = [];
            try {
                eval("let 数据 = " + 执行str);
                getData = 数据() || [];
            } catch (e) {
                getData = [];
                xlog('√执行获取数据报错，信息>' + e.message + " 错误行#" + e.lineNumber);
            }
            if (loading) {
                deleteItemByCls("loading_gif");
            }

            if (getData.length == 0 && page == 1) {
                d.push({
                    title: "未获取到数据",
                    desc: "下拉刷新重试或点此更换主页源",
                    url: $('#noLoading#').lazyRule((input) => {
                        require(config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'SrcJuPublic.js');
                        return selectSource(input);
                    }, runMode),
                    col_type: "text_center_1",
                })
            } else if (getData.length > 0) {
                require(config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'SrcJuMethod.js');
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
            xlog("√报错信息>" + e.message + " 错误行#" + e.lineNumber);
        }
        setResult(d);
    } else {
        if (datatype == "主页") {
            d.push({
                title: runMode + " 主页源不存在\n需先选择配置主页源",//\n设置-选择漫画/小说/听书/
                desc: "点此或上面分类按钮皆可选择",//设置长按菜单可以开启界面切换开关
                url: $('#noLoading#').lazyRule((input) => {
                    require(config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'SrcJuPublic.js');
                    return selectSource(input);
                }, runMode),
                col_type: "text_center_1",
                extra: {
                    lineVisible: false
                }
            })
            confirm({
                title: runMode + " 主页源不存在",
                content: "需先选择配置主页源",
                confirm: $.toString((input) => {
                    require(config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'SrcJuPublic.js');
                    return selectSource(input);
                }, runMode),
                cancel: $.toString(() => {
                    return "toast://点击当前分类名称可以切换主页源";
                })
            });
        }
        setResult(d);
    }
}

//简繁互转,x可不传，默认转成简体，传2则是转成繁体
function jianfan(str, x) {
    require(config.聚阅.match(/http(s)?:\/\/.*\//)[0] + 'SrcSimple.js');
    return PYStr(str, x);
}
//重定义打印日志，只允许调试模式下打印
var xlog = log;
log = function (msg) {
    if (getMyVar("SrcJu_调试模式") || getItem("SrcJu_接口日志")) {
        xlog(msg);
    }
}
//聚影搜索调用
function JySearch(sskeyword, sstype) {
    if (sstype == "聚搜接口") {
        return $('hiker://empty#noRecordHistory##noHistory#').rule((name) => {
            require(config.聚阅.match(/http(s)?:\/\/.*\//)[0].replace('/Ju/', '/master/') + 'SrcJyXunmi.js');
            xunmi(name);
        }, sskeyword);
    } else if (sstype == "云盘接口") {
        return $('hiker://empty#noRecordHistory##noHistory#').rule((name) => {
            let d = [];
            d.push({
                title: name + "-云盘聚合搜索",
                url: "hiker://empty",
                col_type: "text_center_1",
                extra: {
                    id: "listloading",
                    lineVisible: false
                }
            })
            setResult(d);
            require(config.聚阅.match(/http(s)?:\/\/.*\//)[0].replace('/Ju/', '/master/') + 'SrcJyAliDisk.js');
            aliDiskSearch(name);
        }, sskeyword);
    } else if (sstype == "Alist接口") {
        return $('hiker://empty#noRecordHistory##noHistory#').rule((name) => {
            let d = [];
            d.push({
                title: name + "-Alist聚合搜索",
                url: "hiker://empty",
                col_type: "text_center_1",
                extra: {
                    id: "listloading",
                    lineVisible: false
                }
            })
            setResult(d);
            require(config.聚阅.match(/http(s)?:\/\/.*\//)[0].replace('/Ju/', '/master/') + 'SrcJyAlist.js');
            alistSearch2(name, 1);
        }, sskeyword);
    } else {
        return "hiker://search?rule=聚影√&s=" + sskeyword;
    }
}
// 按拼音排序
function sortByPinyin(arr) {
    var arrNew = arr.sort((a, b) => a.name.localeCompare(b.name));
    for (var m in arrNew) {
        var mm = /^[\u4e00-\u9fa5]/.test(arrNew[m].name) ? m : '-1';
        if (mm > -1) {
            break;
        }
    }
    for (var n = arrNew.length - 1; n >= 0; n--) {
        var nn = /^[\u4e00-\u9fa5]/.test(arrNew[n].name) ? n : '-1';
        if (nn > -1) {
            break;
        }
    }
    if (mm > -1) {
        var arrTmp = arrNew.splice(m, parseInt(n - m) + 1);
        arrNew = arrNew.concat(arrTmp);
    }
    return arrNew
}
// 替换最后一个指定字符串
function replaceLast(str, search, replacement) {
    const lastIndex = str.lastIndexOf(search);

    if (lastIndex !== -1) {
        return str.slice(0, lastIndex) + replacement + str.slice(lastIndex + search.length);
    }

    return str; // 如果没找到，返回原字符串
}

/*

function selectSource2(selectType) {
        const hikerPop = $.require("http://hiker.nokia.press/hikerule/rulelist.json?id=6966");
        let sourceList = getListData("yi", selectType);

        hikerPop.setUseStartActivity(false);

        let names = sourceList.map(v => v.name == sourcename ? "‘‘" + v.name + "’’" : v.name);
        let spen = 3;

        let pop = hikerPop.selectBottomRes({
            options: names,
            columns: spen,
            title: "当前源>" + selectType + "_" + sourcename,
            noAutoDismiss: true,
            position: 1,
            extraInputBox: new hikerPop.ResExtraInputBox({
                hint: "源关键字",
                title: "ok",
                onChange(s, manage) {
                    //log("onChange:"+s);
                    let flist = names.filter(x => x.includes(s));
                    manage.list.length = 0;
                    flist.forEach(x => {
                        manage.list.push(x);
                    });
                    manage.change();
                },
                defaultValue: "",
                click(s, manage) {
                    //toast(s);
                    //log(manage.list);
                },
                titleVisible: false
            }),
            longClick(s, i) {
                showSelectOptions({
                    title: "分享视频源",
                    options: ["JS文件分享"].concat(getPastes()),
                    col: 2,
                    js: $.toString(name => {
                        
                    }, s.replace(/[’‘]/g, ""))
                });
            },
            click(s, i, manage) {
                pop.dismiss();

                let input = s.replace(/[’‘]/g, "");
                if (selectType == runMode && input == Juconfig[selectType + 'sourcename']) {
                    return 'toast://' + selectType + ' 主页源：' + input;
                }
                if (typeof (unRegisterTask) != "undefined") {
                    unRegisterTask("juyue");
                } else {
                    toast("软件版本过低，可能存在异常");
                }
                try {
                    let listMyVar = listMyVarKeys();
                    listMyVar.forEach(it => {
                        if (!/^SrcJu_|initConfig/.test(it)) {
                            clearMyVar(it);
                        }
                    })
                } catch (e) {
                    xlog('清MyVar失败>' + e.message);
                    clearMyVar(MY_RULE.title + "分类");
                    clearMyVar(MY_RULE.title + "更新");
                    clearMyVar(MY_RULE.title + "类别");
                    clearMyVar(MY_RULE.title + "地区");
                    clearMyVar(MY_RULE.title + "进度");
                    clearMyVar(MY_RULE.title + "排序");
                    clearMyVar("排名");
                    clearMyVar("分类");
                    clearMyVar("更新");
                    clearMyVar(runMode + "_" + sourcename);
                    clearMyVar("一级源接口信息");
                }
                try {
                    refreshX5WebView('about:blank');
                } catch (e) { }

                Juconfig["runMode"] = runMode;
                Juconfig[runMode + 'sourcename'] = input;
                writeFile(cfgfile, JSON.stringify(Juconfig));
                refreshPage(false);
                return 'toast://' + runMode + ' 主页源已设置为：' + input;
            },
            menuClick(manage) {
                hikerPop.selectCenter({
                    options: ["改变样式", "排序方法:" + (getItem('sourceListSort', 'update') == 'name' ? "名称" : "时间"), "列表倒序"],
                    columns: 2,
                    title: "请选择",
                    click(s, i) {
                        if (i === 0) {
                            spen = spen == 3 ? 2 : 3;
                            manage.changeColumns(spen);
                        } else if (i === 1) {
                            setItem("sourceListSort", getItem('sourceListSort') == 'name' ? "" : "name");
                            manage.list.length = 0;
                            let names = getListData("yi", selectType).map(v => v.name == sourcename ? "‘‘" + v.name + "’’" : v.name);
                            names.forEach(x => {
                                manage.list.push(x);
                            });
                            manage.change();
                        } else if (i === 2) {
                            manage.list.reverse();
                            names.reverse();
                            manage.change();
                        }
                    }
                });
            }
        });
    return 'hiker://empty';
}
*/