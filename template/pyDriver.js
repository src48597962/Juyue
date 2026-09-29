// ========= 脚本最顶部，全局区域，只执行一次 =========
let PythonHiker = $.require(codePath + "plugins/PythonHiker.js");
// 全局Map：key=sourcename，value=pyModule（Python Spider实例代理）
globalThis.__pySpiderMap = globalThis.__pySpiderMap || {};

let parse = {
    作者: '',
    版本: '1.0',
    host: '',
    sourcename: '', // 【必填】每个py源设置唯一名称，例如"py_youku"
    pyurl: '',      // 【必填】py脚本本地/远程地址
    页码: {
        主页: true,
        分类: true,
        排行: true,
        更新: true
    },
    频道: {
        包含项: ["分类", "排行", "周表"]
    },

    /**
     * 统一入口：调用Python侧接口
     * apitype: homeContent / categoryContent / detailContent / searchContent / playContent
     * ...arr：对应接口所需不定长参数
     */
    callApi: function(apitype, ...arr) {
        const sourcename = this.sourcename;
        const pyurl = this.pyurl;
        if (!sourcename || !pyurl) {
            xlog("py源配置缺失：sourcename/pyurl");
            return null;
        }

        // 查找是否已有缓存的py实例
        if (!globalThis.__pySpiderMap[sourcename]) {
            // 加载py脚本，实例化Spider，执行init初始化
            const pyObj = PythonHiker.runPy(pyurl, sourcename).callAttr("Spider");
            PythonHiker.callFunc(pyObj, "init", []);
            globalThis.__pySpiderMap[sourcename] = pyObj;
            xlog(`[PY源 ${sourcename}] 新建Python Spider实例`);
        }
        const pyModule = globalThis.__pySpiderMap[sourcename];

        // ========= 接口参数预处理，按需做类型转换 =========
        if (apitype === 'categoryContent') {
            // categoryContent(tid, pg, filter, extend)
            arr[1] = PythonHiker.toInt(arr[1]);
            arr[3] = PythonHiker.toPyJson(arr[3]);
        }
        if (apitype === 'searchContent') {
            // searchContent(keyword, pg)
            arr[1] = PythonHiker.toInt(arr[1]);
        }

        // 组装参数，调用Python函数
        const args = [pyModule, apitype].concat(arr);
        const ret = PythonHiker.callFunc.apply(PythonHiker, args);
        return ret;
    },

    // 销毁当前源的py实例，切换源、cookie失效时调用
    resetPy: function() {
        const sourcename = this.sourcename;
        if (globalThis.__pySpiderMap[sourcename]) {
            delete globalThis.__pySpiderMap[sourcename];
            xlog(`[PY源 ${sourcename}] 销毁Python实例`);
        }
    },

    // ========= 海阔视界标准入口函数 =========
    主页: function() {
        let 分类 = [];
        let 推荐 = [];
        let 筛选;
        const cacheKey = this.sourcename + '$classCache';
        let classCache = storage0.getMyVar(cacheKey);
        if (classCache) {
            推荐 = classCache.推荐;
            分类 = classCache.分类;
            筛选 = classCache.筛选;
        } else {
            // 调用Python homeContent
            let home = this.callApi("homeContent", true);
            if (!home) return [];
            let typelist = home['class'] || [];
            typelist.forEach(v => {
                分类.push(v.type_name + '$' + v.type_id);
            })
            筛选 = home['filters'];
            let homeVod = home['list'] || [];
            homeVod.forEach(it => {
                推荐.push({
                    "vod_url": it.vod_id.toString(),
                    "vod_name": it.vod_name,
                    "vod_desc": it.vod_remarks,
                    "vod_pic": it.vod_pic
                });
            })
            if (分类.length > 0) {
                storage0.putMyVar(cacheKey, { 分类: 分类, 筛选: 筛选, 推荐: 推荐 });
            }
        }

        // --- 下面保留你原来主页渲染UI的代码不动 ---
        let fold = getMyVar('dianbo$fold', "0");
        let cate_id = getMyVar('dianbo$分类', '');
        let fl = storage0.getMyVar('dianbo$flCache') || {};
        let d = [];
        let vodlists = [];
        if (分类.length > 0) {
            let Color = getItem('主题颜色', '#3399cc');
            try {
                cate_id = cate_id || (推荐.length > 0 ? 'tj' : 分类[0].split('$')[1]);
                if ($.type(筛选) == 'object' && cate_id != 'tj') {
                    d.push({
                        title: fold === '1' ? '““””<b><span style="color: #F54343">∨</span></b>' : '““””<b><span style="color:' + Color + '">∧</span></b>',
                        url: $('#noLoading#').lazyRule((fold) => {
                            putMyVar('dianbo$fold', fold === '1' ? '0' : '1');
                            clearMyVar('dianbo$flCache');
                            refreshPage(false);
                            return "hiker://empty";
                        }, fold),
                        col_type: 'scroll_button'
                    })
                }
                putMyVar('dianbo$分类', cate_id);
                if (推荐.length > 0) {
                    if (cate_id == 'tj') {
                        vodlists = 推荐;
                    }
                    d.push({
                        title: cate_id == 'tj' ? '““””<b><span style="color:' + Color + '">' + '推荐' + '</span></b>' : '推荐',
                        url: $('#noLoading#').lazyRule(() => {
                            putMyVar('dianbo$分类', 'tj');
                            refreshPage(true);
                            return "hiker://empty";
                        }),
                        col_type: 'scroll_button',
                        extra: {
                            backgroundColor: cate_id == 'tj' ? "#20" + Color.replace('#', '') : undefined
                        }
                    });
                }
                分类.forEach((it, i) => {
                    let itname = it.split('$')[0].replace(/|||/g, '').trim();
                    let itid = it.split('$')[1];
                    d.push({
                        title: cate_id == itid ? '““””<b><span style="color:' + Color + '">' + itname + '</span></b>' : itname,
                        url: $('#noLoading#').lazyRule((itid) => {
                            putMyVar('dianbo$分类', itid);
                            clearMyVar('dianbo$flCache');
                            refreshPage(true);
                            return "hiker://empty";
                        }, itid),
                        col_type: 'scroll_button',
                        extra: {
                            backgroundColor: cate_id == itid ? "#20" + Color.replace('#', '') : undefined
                        }
                    });
                })
                d.push({ col_type: "blank_block" });
                if (筛选 && fold == '1') {
                    Object.entries(筛选).forEach(([key, value]) => {
                        if (key == cate_id) {
                            if ($.type(value) == "object") {
                                value = [value];
                            }
                            value.forEach(it => {
                                if (it.value.length > 0) {
                                    fl[it.key] = fl[it.key] || (it.value[0].v == "全部" ? it.value[0].v : undefined);
                                    it.value.forEach((itit) => {
                                        d.push({
                                            title: fl[it.key] == itit.v ? '““””<b><span style="color:' + Color + '">' + itit.n + '</span></b>' : itit.n,
                                            url: $('#noLoading#').lazyRule((flkey, itid) => {
                                                let fl = storage0.getMyVar('dianbo$flCache') || {};
                                                fl[flkey] = itid;
                                                storage0.putMyVar('dianbo$flCache', fl);
                                                refreshPage(true);
                                                return "hiker://empty";
                                            }, it.key, itit.v),
                                            col_type: 'scroll_button',
                                            extra: {
                                                backgroundColor: fl[it.key] == itit.v ? "#20" + Color.replace('#', '') : ""
                                            }
                                        });
                                    })
                                    d.push({ col_type: "blank_block" });
                                }
                            })
                        }
                    });
                }
                storage0.putMyVar('dianbo$flCache', fl);
            } catch (e) {
                log('生成分类数据异常>' + e.message + " 错误行#" + e.lineNumber);
            }
        }
        if (cate_id != "tj") {
            try {
                fl.cateId = fl.cateId || cate_id;
                cate_id = fl.cateId;
                delete fl.cateId;
                fl.typeid = cate_id;
                // 调用分类列表接口 categoryContent(tid,pg,filter,extend)
                let formatJo = this.callApi("categoryContent", cate_id, page, true, fl);
                let vodlist = formatJo.list || [];
                vodlist.forEach(it => {
                    vodlists.push({
                        "vod_url": it.vod_id.toString(),
                        "vod_name": it.vod_name,
                        "vod_desc": it.vod_remarks,
                        "vod_pic": it.vod_pic
                    });
                })
            } catch (e) {
                log('获取列表异常>' + e.message + ' 错误行#' + e.lineNumber);
            }
        }
        vodlists.forEach(it => {
            d.push({
                title: it.vod_name,
                desc: it.vod_desc,
                img: it.vod_pic,
                url: it.vod_url,
                col_type: 'movie_3'
            })
        })
        return d;
    },

    // 二级详情页
    二级: function(url) {
        let ret = this.callApi("detailContent", url);
        return ret;
    },

    // 搜索
    搜索: function(name) {
        let d = [];
        if (page > 1) return d;
        let res = this.callApi("searchContent", name, page);
        if (!res) return d;
        let list = res.list || [];
        list.forEach(it => {
            d.push({
                vod_url: it.vod_id.toString(),
                vod_name: it.vod_name,
                vod_desc: it.vod_remarks,
                vod_pic: it.vod_pic
            })
        })
        return d;
    },

    // 播放解析
    解析: function(url) {
        let playUrl = this.callApi("playContent", url);
        return playUrl;
    },

    最新: function(url) {
        return '';
    },

    新建模板: `let parse = {
    sourcename: "",
    pyurl: ""
}`
}
