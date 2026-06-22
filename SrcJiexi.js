let parse = {
    作者: "灵码",
    版本: "260521",
    host: "http://v.qq.com",
    页码: {
        主页: false,
        分类: true
    },
    二级标识: "#gameTheme#",

    // 生成UUID函数
    generateUUID: function () {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16).toUpperCase();
        });
    },

    // 获取版本号，带缓存机制
    getVersion: function () {
        let ver1 = juItem.get("ver1");
        let ver2 = juItem.get("ver2");
        const lastUpdate = juItem.get("version_last_update", "0");
        const currentTime = new Date().getTime();

        if (!ver1 || !ver2 || currentTime - parseInt(lastUpdate) > 86400000) {
            try {
                const versionScript = fetch("https://vfiles.gtimg.cn/tvideo/hippysearch/js/main.ed175fb3.js");
                if (!versionScript) {
                    throw new Error("获取版本脚本失败");
                }
                const versionMatches = versionScript.match(/([a-zA-Z])\s*=\s*"(\d{8})"\s*.*?([a-zA-Z])\s*=\s*"(\d{8})"/);

                if (versionMatches) {
                    ver1 = versionMatches[2];
                    ver2 = versionMatches[4];

                    juItem.set("ver1", ver1);
                    juItem.set("ver2", ver2);
                    juItem.set("version_last_update", currentTime.toString());
                } else {
                    throw new Error("解析版本信息失败");
                }
            } catch (error) {
                log("获取版本信息失败: " + error.message + "，使用默认版本号");
                if (!ver1) ver1 = "25082913";
                if (!ver2) ver2 = "24060601";
            }
        }

        if (!ver1) ver1 = "25082913";
        if (!ver2) ver2 = "24060601";

        return {
            ver1: ver1,
            ver2: ver2
        };
    },

    // 主题颜色处理函数
    themeColor: function (type, content) {
        const color = getItem("主题颜色", "#19B89D");

        switch (type) {
            case "background":
                return `#20${color.replace("#", "")}`;

            case "strong":
                return `‘‘’’<strong><font color="${color}">${content}</font></strong>`;

            case "color":
            default:
                return `<b><font color="${color}">${content}</font></b>`;
        }
    },

    // 秒数转时间格式函数
    secondsToTime: function (seconds) {
        if (isNaN(seconds) || seconds === undefined) {
            return "00:00:00";
        }
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds - hours * 3600) / 60);
        const sec = Math.round((seconds - hours * 3600 - minutes * 60) * 100) / 100;

        const result = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
        return result;
    },

    // 生成标题序号及颜色函数
    getTitle: function (i, name) {
        let colorMap = {
            0: "#ff3300",
            1: "#ff6600",
            2: "#ff9900"
        };
        return `‘‘’’${String(i + 1).fontcolor(colorMap[i] || "black")} ${name}`;
    },

    // 格式化标签函数
    formatTags: function (tags) {
        if (!tags || tags.length === 0) return "";

        const maxTags = Math.min(tags.length, 3 + Math.floor(Math.random() * 2));
        const shuffled = tags.sort(() => 0.5 - Math.random());
        const selectedTags = shuffled.slice(0, maxTags);

        return selectedTags
            .map((tag, index) => {
                let color;
                if (index < 2) {
                    color = "#ae6119";
                } else {
                    color = Math.random() > 0.5 ? "#ae6119" : "#111111";
                }
                return tag.content ? tag.content.small().fontcolor(color) : "";
            })
            .join(" ");
    },

    // 分类页
    分类: function () {
        var d = [];
        var page = MY_PAGE;
        var channelId = getMyVar("channel_id") || "100113";
        var channels = [
            { name: "电视剧", id: "100113" },
            { name: "电影", id: "100173" },
            { name: "综艺", id: "100109" },
            { name: "动漫", id: "100119" },
            { name: "少儿", id: "100150" },
            { name: "纪录片", id: "100105" }
        ];

        // 注册关闭清理
        addListener("onClose", function () {
            var keys = getMyVar("Sfilter_key");
            if (keys) {
                JSON.parse(keys).forEach(function (k) { clearMyVar(k); });
                clearMyVar("Sfilter_key");
            }
        });

        // 频道导航
        if (parseInt(page) === 1) {
            channels.forEach(function (ch) {
                var selected = channelId == ch.id;
                d.push({
                    title: selected ? parse.themeColor("strong", "▶" + ch.name) : ch.name,
                    col_type: "scroll_button",
                    url: $("#noLoading#").lazyRule(function (id) {
                        putMyVar("channel_id", id);
                        var keys = getMyVar("Sfilter_key");
                        if (keys) JSON.parse(keys).forEach(function (k) { clearMyVar(k); });
                        clearMyVar("Sfilter_key");
                        clearMyVar("header.category");
                        refreshPage(true);
                        return "hiker://empty";
                    }, ch.id),
                    extra: { backgroundColor: selected ? parse.themeColor("background", "") : "" }
                });
            });
        }

        // 构建请求
        var body = {
            page_context: { page_index: (page - 1).toString() },
            page_params: {
                page_id: "channel_list",
                page_type: "operation",
                channel_id: channelId,
                filter_params: "sort=75"
            }
        };

        if (parseInt(page) > 1) {
            body.page_context._ds_cli_6970df954e7a9803_poster_offset = (12 * parseInt(page)).toString();
        }

        // 筛选参数
        var filterKeys = getMyVar("Sfilter_key");
        if (filterKeys) {
            var keys = JSON.parse(filterKeys);
            var params = [];
            keys.forEach(function (k) {
                params.push(k + "=" + getMyVar(k, "-1"));
            });
            body.page_params.filter_params = params.join("&");
        }

        // 缓存10分钟
        var cacheKey = "category_cache_" + JSON.stringify(body);
        var cached = getMyVar(cacheKey, "");
        var cacheTime = getMyVar(cacheKey + "_time", "0");
        var now = new Date().getTime();
        var jsonData;

        if (cached && now - parseInt(cacheTime) < 600000) {
            jsonData = JSON.parse(cached);
        } else {
            jsonData = JSON.parse(fetchPC("https://pbaccess.video.qq.com/trpc.multi_vector_layout.mvl_controller.MVLPageHTTPService/getMVLPage?&vplatform=2", {
                headers: { "Content-Type": "application/json", referer: "https://v.qq.com/", origin: "https://v.qq.com" },
                method: "POST",
                body: body
            }));
            putMyVar(cacheKey, JSON.stringify(jsonData));
            putMyVar(cacheKey + "_time", now.toString());
        }

        var data = jsonData && jsonData.data;
        if (!data || !data.modules || !data.modules.normal) return d;

        var cards = data.modules.normal.cards;
        if (!cards || !cards.length) return d;

        var childList = cards[0].children_list;
        var cateTemp = JSON.parse(getMyVar("header.category", JSON.stringify(Array(20).fill("0"))));

        // 筛选按钮
        if (parseInt(page) === 1) {
            d.push({ col_type: "blank_block" });

            var filterCards = childList.filter_card && childList.filter_card.cards || [];
            var filterMap = {};
            filterCards.forEach(function (item) {
                var key = item.params.filter_key;
                if (!filterMap[key]) filterMap[key] = [];
                filterMap[key].push(item);
            });

            var filterKeysList = Object.keys(filterMap);
            putMyVar("Sfilter_key", JSON.stringify(filterKeysList));

            filterKeysList.forEach(function (key, idx) {
                var items = filterMap[key] || [];
                items.forEach(function (item, subIdx) {
                    var title = item.params.option_name;
                    var selected = subIdx.toString() === cateTemp[idx];
                    d.push({
                        title: selected ? parse.themeColor("strong", title) : title,
                        url: $(item.params.option_value + "#noLoading#").lazyRule(function (p) {
                            p.cateTemp[p.index] = p.subIdx.toString();
                            putMyVar("header.category", JSON.stringify(p.cateTemp));
                            putMyVar(p.classKey, p.input);
                            refreshPage(true);
                            return "hiker://empty";
                        }, {
                            cateTemp: cateTemp,
                            index: idx,
                            subIdx: subIdx,
                            classKey: key,
                            input: item.params.option_value
                        }),
                        col_type: "scroll_button",
                        extra: { backgroundColor: selected ? parse.themeColor("background", "") : "" }
                    });
                });
                d.push({ col_type: "blank_block" });
            });

            putMyVar("fiter_has_next_page", data.has_next);
        }

        // 视频列表
        var posterCards = childList.poster_card && childList.poster_card.cards || [];
        posterCards.forEach(function (item) {
            var p = item.params;
            var pic = p.new_pic_vt || p.image_url || p.new_pic_hz || p.image_url_vertical || p.pic_540x304 || p.pic496x280;
            if (pic) {
                if (/\.jpg\//.test(pic)) pic = pic.substring(0, pic.lastIndexOf("/"));
                if (!pic.includes("@Referer=")) pic += "@Referer=";
            }

            var desc = "";
            if (p.imgtag) {
                if (typeof p.imgtag === "object") {
                    var tag = JSON.parse(p.imgtag);
                    desc = tag.tag_3 && tag.tag_3.text || (tag.tag_2 && tag.tag_2.text.split("-")[0]) || "";
                } else {
                    desc = p.imgtag;
                }
            } else {
                desc = p.timelong || p.publish_date || p.episode_updated || (p.duration ? parse.secondsToTime(p.duration) : "") || (p.cms_isvip == 1 ? "VIP" : "");
            }

            var cid = p.cid || p.attached_id || "";
            var url = cid ? "https://v.qq.com/x/cover/" + cid + ".html" : "";

            d.push({
                title: p.title || "",
                desc: desc,
                pic_url: pic || "",
                url: url,
                extra: {
                    detail1: p.timelong + ' ' + p.main_genre + ' ' + p.area_name + ' ' + p.year,
                    detail2: p.sub_title,
                    detail3: p.second_title
                }
            });
        });

        return d;
    },

    // 主页内容处理函数
    主页: function () {
        var d = [];
        // 注册关闭事件清理主页缓存
        addListener("onClose", () => {
            clearMyVar("homeTabCachedData");
            clearMyVar("homeTab");
            clearMyVar("homeTabValue");
            clearMyVar("homeTabCacheTime");
        });

        let versions = this.getVersion();

        let tabButtons = [];
        const classTabs = ["热榜", "电视剧", "电影", "综艺", "动漫", "少儿", "纪录片", "微短剧"];
        const listTabs = ["channelID=0", "channelID=2", "channelID=1", "channelID=10", "channelID=3", "channelID=106", "channelID=9", "channelID=26"];

        // 创建主页导航按钮
        for (var i in classTabs) {
            let name = classTabs[i];
            let tab = listTabs[i];
            tabButtons.push({
                title: getMyVar("homeTab", "0") == i ? this.themeColor("strong", name) : name,
                url: $("#noLoading#").lazyRule(
                    (tab, i) => {
                        putMyVar("homeTab", i);
                        putMyVar("homeTabValue", tab);
                        refreshPage(false);
                        return "hiker://empty";
                    },
                    tab,
                    i
                ),
                col_type: "scroll_button",
                extra: {
                    backgroundColor: getMyVar("homeTab", "0") == i ? this.themeColor("background", "") : ""
                }
            });
        }

        d = d.concat(tabButtons);

        let currentTab = getMyVar("homeTabValue", "channelID=0");

        let cachedData = getMyVar("homeTabCachedData", "");
        let cacheTime = getMyVar("homeTabCacheTime", "0");
        let currentTime = new Date().getTime();
        let needRefresh = !cachedData || currentTime - parseInt(cacheTime) > 1800000;

        let jsonData;
        if (cachedData && !needRefresh) {
            try {
                jsonData = JSON.parse(cachedData);
            } catch (e) {
                log("解析缓存数据失败: " + e.message);
                jsonData = null;
                needRefresh = true;
            }
        }

        // 获取或使用缓存的热榜数据
        if (!jsonData || needRefresh) {
            try {
                let allTabsDataKey = ["datakey=srh_oper_hot_list&channelID=0", "datakey=srh_oper_hot_list&channelID=2", "datakey=srh_oper_hot_list&channelID=1", "datakey=srh_oper_hot_list&channelID=10", "datakey=srh_oper_hot_list&channelID=3", "datakey=srh_oper_hot_list&channelID=106", "datakey=srh_oper_hot_list&channelID=9", "datakey=srh_oper_hot_list&channelID=26"];

                let rankData = request("https://pbaccess.video.qq.com/trpc.videosearch.hot_rank.HotRankServantHttp/HotRankHttp", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Referer: "https://m.v.qq.com/"
                    },
                    body: {
                        clientType: 1,
                        pageNum: 0,
                        pageSize: 10,
                        dataVersion: versions.ver1,
                        tagFilterRequest: {
                            tagFilter: {
                                channel: {
                                    name: "全部",
                                    paramVal: "全部"
                                },
                                staticTags: [],
                                dynamicTags: []
                            },
                            pagenum: 0,
                            pagesize: 18,
                            searchHistory: [],
                            version: versions.ver1,
                            expInfo: [
                                {
                                    key: "isNewMarkLabel",
                                    value: "1"
                                }
                            ],
                            uuid: this.generateUUID()
                        },
                        searchHistoryKeyWords: [],
                        searchDataKey: allTabsDataKey
                    }
                });

                if (!rankData) {
                    throw new Error("获取热榜数据失败");
                }

                jsonData = JSON.parse(rankData);
                putMyVar("homeTabCachedData", JSON.stringify(jsonData));
                putMyVar("homeTabCacheTime", currentTime.toString());
            } catch (e) {
                log("获取热榜数据失败: " + e.message);
                if (cachedData) {
                    try {
                        jsonData = JSON.parse(cachedData);
                    } catch (parseError) {
                        log("解析缓存数据失败: " + parseError.message);
                        jsonData = { data: { navItemList: [] } };
                    }
                } else {
                    jsonData = { data: { navItemList: [] } };
                }
            }
        }

        jsonData = jsonData || { data: { navItemList: [] } };

        let hotRankItems = [];

        if (jsonData.data && jsonData.data.navItemList) {
            let targetIndex = 0;
            if (currentTab) {
                let tabIndex = listTabs.indexOf(currentTab);
                if (tabIndex > -1) {
                    targetIndex = tabIndex;
                }
            }

            if (targetIndex < jsonData.data.navItemList.length) {
                let navItem = jsonData.data.navItemList[targetIndex];
                if (navItem.hotRankResult && navItem.hotRankResult.rankItemList) {
                    let titleDarkImg = navItem.titleDarkImg;
                    let rankItemList = navItem.hotRankResult.rankItemList;

                    hotRankItems.push(
                        {
                            col_type: "rich_text",
                            title: `<img src="${titleDarkImg}#originalSize#">`
                        },
                        {
                            col_type: "blank_block"
                        }
                    );

                    let limit = Math.min(rankItemList.length, 10);
                    for (let i = 0; i < limit; i++) {
                        let item = rankItemList[i];
                        let title = item.title;
                        let imgUrl = item.imgUrl;
                        let id = item.id;
                        let lines = item.lines || "";
                        let tags = item.tags || [];

                        let desc = lines.join("");
                        let tagDisplay = this.formatTags(tags);

                        hotRankItems.push({
                            title: `${this.getTitle(i, title)}\n${tagDisplay}`,
                            url: `https://m.v.qq.com/x/m/play?cid=${id}&vid=&ptag=hippySearch&pageType=long`,
                            desc: desc,
                            pic_url: `${imgUrl}@Referer=`,
                            col_type: "icon_1_left_pic",
                            extra: {
                                pageTitle: title,
                                detail1: desc,
                                detail2: tagDisplay
                            }
                        });
                    }
                    hotRankItems.push({
                        col_type: "line_blank"
                    });
                }
            }
        }

        d = d.concat(hotRankItems);

        return d;
    },

    // 从URL中提取cid函数
    extractCid: function (url) {
        if (url.includes("cid=")) {
            return url.split("cid=")[1].split("&")[0].split("#")[0];
        } else if (url.match(/cover\/([^\/]+)\.html/)) {
            return url.match(/cover\/([^\/]+)\.html/)[1];
        } else {
            try {
                var json = JSON.parse(fetch(url));
                return json.c.column_id || json.c.cid || json.c.id;
            } catch (e) {
                log("提取cid失败: " + e.message);
                return "";
            }
        }
    },

    // 通过CID获取视频信息函数
    getVideoInfoByCid: function (cid) {
        if (!cid) return "";

        try {
            var detailApiUrl = `https://node.video.qq.com/x/api/float_vinfo2?cid=${cid}`;
            var resp = fetch(detailApiUrl, {
                headers: {
                    "User-Agent": PC_UA,
                    Referer: "https://v.qq.com/"
                }
            });

            if (!resp || resp.length < 10) {
                return "";
            }

            try {
                var jsonData = JSON.parse(resp);
                if (jsonData && jsonData.c && jsonData.c.description) {
                    return jsonData.c.description;
                }
                if (jsonData && jsonData.c && jsonData.c.introduction) {
                    return jsonData.c.introduction;
                }
            } catch (parseError) {
                log("解析cid详情API返回数据失败: " + parseError.message);
                return "";
            }
        } catch (e) {
            log("通过cid获取视频详情失败: " + e.message);
        }
        return "";
    },

    // 二级页面处理函数 - 包含选集列表处理
    二级: function (url) {
        const cid = this.extractCid(url);

        // 获取视频详情信息（剧情介绍）
        const description = this.getVideoInfoByCid(cid);

        function getVideoList(input, firt) {
            let cid = input.split("|")[0];
            let page_context = input.split("|")[1];
            let videoApiUrl = 'https://pbaccess.video.qq.com/trpc.universal_backend_service.page_server_rpc.PageServer/GetPageData';
            let pageData = JSON.parse(
                fetchPC(videoApiUrl, {
                    headers: {
                        "Content-Type": "application/json",
                        "referer": "https://v.qq.com/",
                        "Cookie": "video_platform=2;vversion_name=8.2.96"
                    },
                    method: "POST",
                    body: {
                        "page_params": { "req_from": "web_mobile", "page_id": "vsite_episode_list", "page_type": "detail_operation", "id_type": "1", "cid": cid, "vid": "", "lid": "", "page_size": "100", "page_context": page_context },
                        "has_cache": 1
                    }
                })
            );

            let module_data = pageData.data.module_list_datas[0].module_datas[0];
            let tabs = module_data.module_params.tabs;
            let item_datas = module_data.item_data_lists.item_datas || [];

            let 选集 = [];
            item_datas.forEach(it => {
                选集.push({
                    title: (it.item_params.play_title || "").split(" ").slice(-1)[0],
                    img: it.item_params.image_url,
                    desc: it.item_params.video_subtitle || it.item_params.union_title,
                    url: `https://v.qq.com/x/cover/${it.item_params.cid}/${it.item_id}.html`,
                    col_type: "movie_2"
                })
            })

            if (firt) {
                let 分页 = [];
                JSON.parse(tabs||'[]').forEach(it => {
                    分页.push({
                        title: `${it.begin}-${it.end}`,
                        url: cid + '|' + it.page_context
                    })
                })

                return { 分页: 分页, 选集: 选集 };
            }
            return 选集;
        }

        let tab_list = getVideoList(cid + '|', true);

        return {
            detail1: `‘‘’’${MY_PARAMS.detail1}`,
            detail2: `‘‘’’${MY_PARAMS.detail2}`,
            detail3: `‘‘’’${MY_PARAMS.detail3}`,
            desc: description ? `剧情介绍：${description}` : "",
            img: MY_PARAMS.img,
            list: tab_list.选集,
            page: tab_list.分页.length==0?undefined:tab_list.分页,//分页标题和链接数组
            pageparse: tab_list.分页.length==0?undefined:getVideoList,//分页链接请求返回选集方法
            pageParam: {//传参给二级翻页方法
                line: true,
                title: '评论',
                cid: cid
            }
        };
    },
    // 评论代码
    二级翻页: function(param){
        let contentApiUrl = 'https://pbaccess.video.qq.com/trpc.universal_backend_service.page_server_rpc.PageServer/GetPageData';
        let contentData = JSON.parse(
            fetchPC(contentApiUrl, {
                headers: {
                    "Content-Type": "application/json",
                    "referer": "https://v.qq.com/",
                    "Cookie": "video_platform=2;vversion_name=8.2.96"
                },
                method: "POST",
                body: {
                    "page_params": {"data_key":"cid="+param.cid,"page_id":"ip_doki_rec","page_type":"channel_operation"},"has_cache":0,
                    "page_context": MY_PAGE==1?{}:storage0.getMyVar('next_page_context')||{}
                }
            })
        );
        storage0.putMyVar('next_page_context', contentData.data.next_page_context);

        let d = [];
        contentData.data.module_list_datas.forEach(it=>{
            let item_data = it.module_datas[0].item_data_lists.item_datas[0];
            let complex_json = JSON.parse(item_data.complex_json);
            let user = complex_json.user.base;
            let date = new Date(parseInt(complex_json.base.time));
            log(Number(complex_json.base.time));
            log(++complex_json.base.time);
            log(complex_json.base.time+0);
            log(date.toLocaleString());
            d.push({
                title: base64Decode(user.name),
                desc: $.dateFormat(Number(complex_json.base.time), "yyyy-MM-dd") + '·' + complex_json.area.city.replace('市',''),
                pic_url: base64Decode(user.image),
                url: 'hiker://empty',
                col_type: 'avatar'
            })
            //.sub_items
            
        })
        return d;
    },
    // 搜索功能函数
    搜索: function (name) {
        let versions = this.getVersion();

        try {
            var searchResponse = JSON.parse(
                fetchPC("https://pbaccess.video.qq.com/trpc.videosearch.mobile_search.HttpMobileRecall/MbSearchHttp?vplatform=4", {
                    headers: {
                        "Content-Type": "application/json",
                        origin: "https://v.qq.com",
                        referer: "https://v.qq.com/"
                    },
                    method: "POST",
                    body: {
                        version: versions.ver2,
                        clientType: 1,
                        filterValue: "",
                        uuid: this.generateUUID(),
                        retry: 0,
                        query: name,
                        pagenum: 0,
                        pagesize: 14,
                        queryFrom: 0,
                        searchDatakey: "",
                        transInfo: "",
                        isneedQc: true,
                        preQid: "",
                        adClientInfo: "",
                        extraInfo: {
                            isNewMarkLabel: "1"
                        }
                    }
                })
            );

            if (!searchResponse || !searchResponse.data || !searchResponse.data.normalList) {
                var directResults = searchResponse.data && searchResponse.data.searchResult ? searchResponse.data.searchResult : searchResponse.data;

                if (directResults && directResults.length > 0) {
                    return directResults.map(item => {
                        var info = item.videoInfo && item.videoInfo.coverDoc ? item.videoInfo.coverDoc : item.videoInfo;
                        var id = item.videoInfo && item.videoInfo.coverDoc ? item.doc.id : info.id;
                        return {
                            title: info.title || "",
                            desc: (info.year ? info.year + " " : "") + (info.typeName ? info.typeName + " " : "") + (info.area ? info.area : "") + (info.actors ? "\n主演: " + (Array.isArray(info.actors) ? info.actors.slice(0, 3).join(",") : info.actors) : ""),
                            img: (info.imgUrl || "") + "@Referer=",
                            url: `https://node.video.qq.com/x/api/float_vinfo2?cid=${item.doc.id}`,
                            content: info.subTitle || "",
                            extra: {
                                detail1: (info.actors ? "主演: " + (Array.isArray(info.actors) ? info.actors.slice(0, 3).join(",") : info.actors) : ""),
                                detail2: (info.year ? info.year + " " : "") + (info.typeName ? info.typeName + " " : "") + (info.area ? info.area : ""),
                                detail3: info.subTitle || "",
                            }
                        };
                    });
                }
                return [];
            }

            // 使用局部变量避免全局污染
            var searchResults = [];
            var normalList = searchResponse.data.normalList.itemList;

            normalList.forEach(item => {
                if (item.doc && item.doc.dataType == 2 && !item.doc.id.includes("sdp")) {
                    var videoInfo = item.videoInfo;
                    let descInfo = videoInfo.year || videoInfo.area || videoInfo.language || videoInfo.directors || videoInfo.actors ? `${videoInfo.year || ""} ${videoInfo.area || ""} ${videoInfo.language ? videoInfo.language.join(",") : ""} 导演:${videoInfo.directors ? videoInfo.directors.join(",") : ""} 主演:${videoInfo.actors ? videoInfo.actors.join(",") : ""}`.replace(/\s+/g, " ").trim() : "";

                    searchResults.push({
                        title: videoInfo.title || "",
                        img: (videoInfo.imgUrl || "") + "@Referer=",
                        url: `https://node.video.qq.com/x/api/float_vinfo2?cid=${item.doc.id}`,
                        content: videoInfo.subTitle || "",
                        desc: descInfo,
                        extra: {
                            detail1: videoInfo.actors ? `主演:${videoInfo.actors ? videoInfo.actors.join(",") : ""}`.replace(/\s+/g, " ").trim() : "",
                            detail2: videoInfo.year + ' ' + videoInfo.area + ' ' + videoInfo.language,
                            detail3: videoInfo.subTitle || ""
                        }
                    });
                }
            });

            if (searchResults.length === 0 && searchResponse.data.areaBoxList) {
                searchResponse.data.areaBoxList[0].itemList.forEach(item => {
                    if (item.doc && item.doc.dataType == 2 && !item.doc.id.includes("sdp")) {
                        var videoInfo = item.videoInfo;
                        let descInfo = videoInfo.year || videoInfo.area || videoInfo.language || videoInfo.directors || videoInfo.actors ? `${videoInfo.year || ""} ${videoInfo.area || ""} ${videoInfo.language ? videoInfo.language.join(",") : ""} 导演:${videoInfo.directors ? videoInfo.directors.join(",") : ""} 主演:${videoInfo.actors ? videoInfo.actors.join(",") : ""}`.replace(/\s+/g, " ").trim() : "";

                        searchResults.push({
                            title: videoInfo.title || "",
                            img: (videoInfo.imgUrl || "") + "@Referer=",
                            url: `https://node.video.qq.com/x/api/float_vinfo2?cid=${item.doc.id}`,
                            content: videoInfo.subTitle || "",
                            desc: descInfo,
                            extra: {
                                detail1: videoInfo.actors ? `主演:${videoInfo.actors ? videoInfo.actors.join(",") : ""}`.replace(/\s+/g, " ").trim() : "",
                                detail2: videoInfo.year + ' ' + videoInfo.area + ' ' + videoInfo.language,
                                detail3: videoInfo.subTitle || ""
                            }
                        });
                    }
                });
            }

            if (searchResults.length === 0 && searchResponse.data.streamList && Array.isArray(searchResponse.data.streamList)) {
                searchResponse.data.streamList.forEach(stream => {
                    if (stream && stream.itemList && Array.isArray(stream.itemList)) {
                        stream.itemList.forEach(item => {
                            if (item && item.videoInfo && item.doc) {
                                var videoInfo = item.videoInfo;
                                var coverDoc = videoInfo.coverDoc;
                                searchResults.push({
                                    title: videoInfo.title || (coverDoc && coverDoc.title) || "",
                                    desc: (videoInfo.year ? videoInfo.year + " " : "") + (videoInfo.typeName ? videoInfo.typeName + " " : "") + (videoInfo.area ? videoInfo.area : "") + (info.actors ? "\n主演: " + (Array.isArray(info.actors) ? info.actors.slice(0, 3).join(",") : info.actors) : ""),
                                    img: (videoInfo.imgUrl || (coverDoc && coverDoc.imgUrl) || "") + "@Referer=",
                                    url: `https://v.qq.com/x/cover/${item.doc.id}.html`,
                                    content: videoInfo.subTitle || (coverDoc && coverDoc.subTitle) || "",
                                    extra: {
                                        detail1: (info.actors ? "主演: " + (Array.isArray(info.actors) ? info.actors.slice(0, 3).join(",") : info.actors) : ""),
                                        detail2: (videoInfo.year ? videoInfo.year + " " : "") + (videoInfo.typeName ? videoInfo.typeName + " " : "") + (videoInfo.area ? videoInfo.area : ""),
                                        detail3: videoInfo.subTitle || (coverDoc && coverDoc.subTitle) || ""
                                    }
                                });
                            }
                        });
                    }
                });
            }

            return searchResults;
        } catch (e) {
            log("搜索请求失败: " + e.message);
            return [];
        }
    },
    // 获取最新更新信息函数
    最新: function (surl) {
        try {
            const detailData = this.二级(surl);

            if (detailData.desc) {
                const match = detailData.desc.match(/集数:(.*?)(?:<br>|$)/);
                if (match && match[1]) {
                    return match[1].trim();
                }
            }

            if (Array.isArray(detailData.list) && detailData.list.length > 0) {
                const lastEpisode = detailData.list[detailData.list.length - 1].title;
                if (lastEpisode) {
                    return `更新至: ${lastEpisode}`;
                }
            }

            return "暂无更新信息";
        } catch (e) {
            log("获取最新剧集信息失败: " + e.message);
            return "暂无更新信息";
        }
    }
};  