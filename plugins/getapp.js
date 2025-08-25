let getapp = {
    // 内容过滤
    filterContent: function(content) {
        return !/(QQ|群|广告勿信)/.test(content);
    },
    // 提取JSON数据
    rely: function(data) {
        return data.match(/\{([\s\S]*)\}/)[0].replace(/\{([\s\S]*)\}/, "$1");
    },
    // AES加密解密模块
    aes: $.toString(() => {
        eval(getCryptoJS());

        // 初始化配置
        if (!getMyVar("host", "")) {
            let selectedSource = this.源数据 || {};
            let appurl = selectedSource.host;
            putMyVar("host", /txt|json/.test(appurl) ? fetch(appurl) + "/" : appurl);
            putMyVar("host_1", appurl);
            putMyVar("de_key", selectedSource.de_key);
            putMyVar("init", selectedSource.init || "");
            putMyVar("rank", selectedSource.rank || "");
        }

        // 统一主题颜色函数
        function themeColor(type, content) {
            const color = getItem("主题颜色", "#FF6699");
            switch (type) {
                case "background":
                    return "#20" + color.replace("#", "");
                case "strong":
                    return "‘‘’’<strong><font color=" + color + ">" + content + "</font></strong>";
                case "color":
                default:
                    return "<b><font color=" + color + ">" + content + "</font></b>";
            }
        }

        // 分类数据生成
        function Cate(list, n, d, col, longclick) {
            if (!col) {
                col = "scroll_button";
            }
            if (!longclick) {
                longclick = [];
            }
            var index_n = list[0].id.split("&")[0] + "";
            list.forEach(data => {
                var title = data.title.split("&");
                var id = data.id.split("&");
                if (data.img != null) {
                    var img = data.img.split("&");
                } else {
                    var img = [];
                }
                title.forEach((title, index) => {
                    d.push({
                        title: getMyVar(n, index_n) == id[index] ? themeColor("strong", title) : title,
                        img: img[index],
                        url: $("#noLoading#").lazyRule(
                            (n, title, id) => {
                                putMyVar(n, id);
                                refreshPage(false);
                                return "hiker://empty";
                            },
                            n,
                            title,
                            id[index] + ""
                        ),
                        col_type: col,
                        extra: {
                            longClick: longclick,
                            backgroundColor: getMyVar(n, index_n) == id[index] ? themeColor("background") : ""
                        }
                    });
                });
                d.push({
                    col_type: "blank_block"
                });
            });
            return d;
        }

        // 解密函数
        function Decrypt(word) {
            eval(getCryptoJS());
            const key = CryptoJS.enc.Utf8.parse(getMyVar("de_key"));
            const iv = CryptoJS.enc.Utf8.parse(getMyVar("de_key"));
            let encryptedHexStr = CryptoJS.enc.Base64.parse(word);
            let decrypt = CryptoJS.AES.decrypt({
                    ciphertext: encryptedHexStr
                },
                key, {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }
            );
            let decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
            return decryptedStr;
        }

        // 加密函数
        function Encrypt(plaintext) {
            eval(getCryptoJS());
            const id = CryptoJS.enc.Utf8.parse(getMyVar("de_key"));
            const iv = CryptoJS.enc.Utf8.parse(getMyVar("de_key"));
            var encrypted = CryptoJS.AES.encrypt(plaintext, id, {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            var ciphertext = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
            return ciphertext;
        }

        // POST请求
        function post(url, body) {
            if (!body) {
                var body = "";
            }
            let html = fetch(getMyVar("host") + url, {
                headers: {},
                body: body,
                method: "POST"
            });
            let html1 = Decrypt(JSON.parse(html).data);
            return JSON.parse(html1);
        }
    }),
    主页: function() {
        var d = [];
        eval(this.rely(this.aes));

        try {
            if (MY_PAGE == 1) {
                // 初始化数据
                let init_data;
                let initCacheKey = "init_data_" + getMyVar("host_1", "");
                if (!storage0.getMyVar(initCacheKey, "")) {
                    if (!getMyVar("init", "")) {
                        init_data = post("api.php/getappapi.index/initV119");
                    } else {
                        init_data = post("api.php/qijiappapi.index/initV120");
                    }
                    storage0.putMyVar(initCacheKey, init_data);
                } else {
                    init_data = storage0.getMyVar(initCacheKey);
                }

                // 轮播图
                if (init_data.banner_list && init_data.banner_list.length > 0) {
                    let filteredBannerList = init_data.banner_list.filter(item => item.vod_name && !/广告|防走丢|旗星/.test(item.vod_name));
                    if (filteredBannerList.length > 0) {
                        let blist = filteredBannerList.map(item => ({
                            title: item.vod_name,
                            img: item.vod_pic,
                            url: item.vod_link || item.vod_id,
                            extra: {
                                name: item.vod_name,
                                vod_id: item.vod_link || item.vod_id,
                                de_key: getMyVar("de_key"),
                                host: getMyVar("host_1"),
                                init: getMyVar("init")
                            }
                        }));
                        banner(true, d, blist, {
                            col_type: "card_pic_1",
                            desc: "0",
                            time: 5000
                        });
                    }
                }

                // 初始化分类
                if (init_data && init_data.type_list) {
                    let type_id_ = [];
                    init_data.type_list.slice(1).forEach(data => {
                        type_id_.push({
                            list: data.type_name,
                            id: data.type_id,
                            name: "type",
                            filter_type_list: data.filter_type_list || []
                        });
                    });
                    let typeCacheKey = "type_id_" + getMyVar("host_1", "");
                    storage0.putMyVar(typeCacheKey, type_id_);
                }
            }

            // 构建推荐列表
            let initCacheKey = "init_data_" + getMyVar("host_1", "");
            if (storage0.getMyVar(initCacheKey).type_list) {
                storage0
                    .getMyVar(initCacheKey)
                    .type_list.slice(1)
                    .forEach(data => {
                        if (data.recommend_list && data.recommend_list.toString() != [] && this.filterContent(data.type_name)) {
                            d.push({
                                title: themeColor("color", data.type_name),
                                url: $().lazyRule(type_id => {
                                    putMyVar("type_list_type", type_id);
                                    refreshPage(false);
                                    return "hiker://page/rulePage#noRecordHistory##noHistory##gameTheme#?type=分类&page=fypage&type_id=" + type_id;
                                }, data.type_id),
                                img: "hiker://images/icon_right5",
                                col_type: "text_icon",
                                extra: {
                                    type_id: data.type_id
                                }
                            });

                            if (data.recommend_list && data.recommend_list.length > 0) {
                                data.recommend_list.forEach(data => {
                                    if (this.filterContent(data.vod_name)) {
                                        d.push({
                                            title: data.vod_name,
                                            desc: data.vod_remarks,
                                            img: data.vod_pic,
                                            url: data.vod_id,
                                            col_type: "movie_3",
                                            extra: {
                                                vod_id: data.vod_id,
                                                vod_name: data.vod_name,
                                                de_key: getMyVar("de_key"),
                                                host: getMyVar("host_1"),
                                                init: getMyVar("init")
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
            }
        } catch (e) {
            log(e.message);
        }
        return d;
    },
    二级: function(surl) {
        var d = [];
        eval(this.rely(this.aes));
        try {
            let id = MY_PARAMS.vod_id;
            let de_key = MY_PARAMS.de_key;
            let host = MY_PARAMS.host;
            let init = MY_PARAMS.init || "";

            if (host !== getMyVar("host_1")) {
                putMyVar("host", /txt|json/.test(host) ? fetch(host) + "/" : host);
                putMyVar("host_1", host);
                putMyVar("de_key", de_key);
                putMyVar("init", init);
            }

            let data;
            if (!init) {
                data = post("api.php/getappapi.index/vodDetail", "vod_id=" + id);
            } else {
                data = post("api.php/qijiappapi.index/vodDetail2", "vod_id=" + id);
            }
            let vod = data.vod;

            // 播放线路
            let play_list = data.vod_play_list;
            play_list.forEach((data, index_1) => {
                let info = data.player_info;
                let cleanShowName = info.show.replace(/\(请勿相信任何广告\)/g, "").replace(/\丨广告勿信/g, "");
                d.push({
                    title: getMyVar("info", "0") == index_1 ? themeColor("strong", cleanShowName) : cleanShowName,
                    url: $("#noLoading#").lazyRule(
                        (n, title, id) => {
                            putMyVar(n, id);
                            refreshPage(false);
                            return "hiker://empty";
                        },
                        "info",
                        cleanShowName,
                        index_1 + ""
                    ),
                    col_type: "scroll_button",
                    extra: {
                        longClick: [],
                        backgroundColor: getMyVar("info", "0") == index_1 ? themeColor("background") : ""
                    }
                });
            });
            requireCache("http://123.56.105.145/weisyr/二级新样式.js", 24);
            return {
                detailurl: vod.vod_pic,
                detailObj: header(false, {
                    片名: vod.vod_name,
                    图片: vod.vod_pic,
                    年份: vod.vod_remarks,
                    类型: vod.vod_class + "｜" + vod.vod_year,
                    状态: vod.vod_director + "｜" + vod.vod_actor
                })[0],
                detail1: `‘‘’’<font color="#55555">导演: ${vod.vod_director}\n主演: ${vod.vod_actor}</font>`,
                detail2: `‘‘’’<font color="#55555">连载: ${vod.vod_remarks}\n${vod.vod_year} | ${vod.vod_area} | ${vod.vod_class}</font>`,
                desc: vod.vod_blurb,
                line: play_list.map(item => item.player_info.show.replace(/\(请勿相信任何广告\)/g, "").replace(/\丨广告勿信/g, "")),
                list: play_list.map(item =>
                    item.urls.map(ep => ({
                        title: ep.name,
                        url: $().lazyRule((url, parse_api_url, token, from) => {
                                let parse = $.require("jiekou").parse();
                                eval("let 解析2 = " + parse['解析']);
                                return 解析2.call(parse, url, parse_api_url, token, from);
                            }, ep.url, ep.parse_api_url, ep.token, ep.from
                        )
                    })))
            };
        } catch (e) {
            log(e.message);
        }
    },
    解析: function(url, parse_api_url, token, from) {
        eval(this.rely(this.aes));
        function postvideo(url, body) {
            if (!body) {
                var body = '';
            }
            let html = fetch(getMyVar('host') + url, {
                headers: {},
                body: body,
                method: 'POST'
            });
            let html1 = JSON.parse(html);
            return html1
        }
        if (/\.mkv/.test(url)) {

            return url + "#isVideo=true#";
        }
        if (/\.m4a|\.mp3/.test(url)) {
            return url + "#isMusic=true#";
        }
        try {
            if (/url=/.test(parse_api_url)) {
                if (/maoyan/.test(parse_api_url)) {
                    return parse_api_url.split("url=")[1]
                }
                let qq = fetch(parse_api_url);
                if (JSON.parse(qq).code === 200) {
                    let play = JSON.parse(qq).url
                    if (play.includes("nby") && play.includes("mp4")) {
                        let nby = JSON.parse(
                            fetch(play, {
                                headers: {},
                                method: "GET",
                                onlyHeaders: true
                            })
                        );
                        return nby.url + "#isVideo=true#";
                    }
                    return play + "#isVideo=true#";

                } else if ((JSON.parse(qq) && JSON.parse(qq).code === 0)) {
                    // .

                    return parse_api_url.split("url=")[1]

                } else {
                    return "toast://解析失败"
                }
            }
            let parse_api = parse_api_url.slice(0, 32);
            let body = {
                parse_api: parse_api,
                url: Encrypt(url),
                token: token
            };
            let data;
            if (!getMyVar("init")) {
                data = postvideo("api.php/getappapi.index/vodParse", body);
            } else {
                data = postvideo("api.php/qijiappapi.index/vodParse", body);
            }
            log(data)
            if (data.code == 0) {
                if (/\.m3u8|\/.mp4/.test(url)) {
                    return url + '#isVideo=true#'
                } else {
                    return "toast://解析失败"
                }

            }
            let json = JSON.parse(Decrypt(data.data)).json
            log(json)
            let m3u8 = JSON.parse(json).url
            // log(m3u8)
            if (m3u8.includes("nby") && m3u8.includes("mp4")) {
                let nby = JSON.parse(
                    fetch(m3u8, {
                        headers: {},
                        method: "GET",
                        onlyHeaders: true
                    })
                );
                return nby.url + "#isVideo=true#";
            } else if (m3u8 == null) {
                return 'toast://未获取到链接'
            }
            return m3u8 + "#isVideo=true#"
        } catch (e) {
            log(e.message)
            return 'toast://未获取到链接'
        }
    },
    搜索: function(name) {
        var d = [];
        eval(this.rely(this.aes));
        var pg = MY_PAGE;

        try {
            let keyword = name || "";
            let body = {
                keywords: keyword,
                type_id: 0,
                page: +pg
            };

            let data;
            if (!getMyVar("init")) {
                data = post("api.php/getappapi.index/searchList", body);
            } else {
                data = post("api.php/qijiappapi.index/searchList", body);
            }

            data.search_list.forEach(data => {
                d.push({
                    title: data.vod_name,
                    desc: "‘‘’’类型：" + data.vod_class + "\n" + ("‘‘’’更新状态：" + data.vod_remarks),
                    img: data.vod_pic,
                    url: data.vod_id,
                    col_type: "movie_1_vertical_pic",
                    extra: {
                        vod_id: data.vod_id,
                        vod_name: data.vod_name,
                        de_key: getMyVar("de_key"),
                        host: getMyVar("host_1"),
                        init: getMyVar("init")
                    }
                });
            });
        } catch (e) {
            log(e.message);
        }
        return d;
    },
    分类: function() {
        var d = [];
        eval(this.rely(this.aes));
        var pg = MY_PAGE;
        try {
            if (MY_PAGE == 1) {
                let typeCacheKey = "type_id_" + getMyVar("host_1", "");
                if (!storage0.getMyVar(typeCacheKey)) {
                    let init_data;
                    if (!getMyVar("init")) {
                        init_data = post("api.php/getappapi.index/initV119");
                    } else {
                        init_data = post("api.php/qijiappapi.index/initV120");
                    }
                    let type_id_ = [];
                    init_data.type_list.slice(1).forEach(data => {
                        type_id_.push({
                            list: data.type_name,
                            id: data.type_id,
                            name: "type",
                            filter_type_list: data.filter_type_list
                        });
                    });
                    storage0.putMyVar(typeCacheKey, type_id_);
                }

                let default_type = storage0.getMyVar(typeCacheKey)[0].id;
                if (!getMyVar("type_list_type")) {
                    putMyVar("type_list_type", default_type);
                }

                let cete_index_type = storage0.getMyVar(typeCacheKey)[+getMyVar("type_list_index", "0")].id;
                storage0.putMyVar("cate_index_type", cete_index_type);
                storage0.getMyVar(typeCacheKey).forEach((data, index_1) => {
                    if (this.filterContent(data.list)) {
                        d.push({
                            title: getMyVar("type_list_type", getMyVar("cate_index_type")) == data.id ? themeColor("strong", data.list) : data.list,
                            url: $("#noLoading#").lazyRule(
                                (id, index_1) => {
                                    putMyVar("type_list_type", id);
                                    putMyVar("type_list_index", index_1);
                                    refreshPage(false);
                                    return "hiker://empty";
                                },
                                data.id,
                                index_1 + ""
                            ),
                            col_type: "scroll_button",
                            extra: {
                                backgroundColor: getMyVar("type_list_type", getMyVar("cate_index_type")) == data.id ? themeColor("background") : ""
                            }
                        });
                    }
                });

                d.push({
                    col_type: "blank_block"
                });
                storage0.getMyVar(typeCacheKey)[+getMyVar("type_list_index", "0")].filter_type_list.forEach((data, index) => {
                    let name = data.name;
                    putMyVar("cate_index_" + name + getMyVar("type_list_index", "0"), data.list[0]);
                    data.list.forEach(data => {
                        if (this.filterContent(data)) {
                            d.push({
                                title: getMyVar("type_list_" + name + getMyVar("type_list_index", "0"), getMyVar("cate_index_" + name + getMyVar("type_list_index", "0"))) == data ? themeColor("strong", data) : data,
                                url: $("#noLoading#").lazyRule(
                                    (n, name, id) => {
                                        putMyVar(n, id);
                                        refreshPage(false);
                                        return "hiker://empty";
                                    },
                                    "type_list_" + name + getMyVar("type_list_index", "0"),
                                    name,
                                    data
                                ),
                                col_type: "scroll_button",
                                extra: {
                                    backgroundColor: getMyVar("type_list_" + name + getMyVar("type_list_index", "0"), getMyVar("cate_index_" + name + getMyVar("type_list_index", "0"))) == data ? themeColor("background") : ""
                                }
                            });
                        }
                    });
                    d.push({
                        col_type: "blank_block"
                    });
                });
            }

            const getCategoryCacheKey = () => {
                return (
                    "category_" +
                    storage0.getMyVar("type_list_type", storage0.getMyVar("cate_index_type")) +
                    "_" +
                    pg +
                    "_" +
                    getMyVar("host_1", "") +
                    "_" +
                    getMyVar("type_list_index", "0") +
                    "_" +
                    getMyVar("type_list_area" + getMyVar("type_list_index", "0"), storage0.getMyVar("cate_index_area" + getMyVar("type_list_index", "0"))) +
                    "_" +
                    getMyVar("type_list_year" + getMyVar("type_list_index", "0"), storage0.getMyVar("cate_index_year" + getMyVar("type_list_index", "0"))) +
                    "_" +
                    getMyVar("type_list_sort" + getMyVar("type_list_index", "0"), storage0.getMyVar("cate_index_sort" + getMyVar("type_list_index", "0"))) +
                    "_" +
                    getMyVar("type_list_lang" + getMyVar("type_list_index", "0"), storage0.getMyVar("cate_index_lang" + getMyVar("type_list_index", "0"))) +
                    "_" +
                    getMyVar("type_list_class" + getMyVar("type_list_index", "0"), storage0.getMyVar("cate_index_class" + getMyVar("type_list_index", "0")))
                );
            };

            let cacheKey = getCategoryCacheKey();

            if (!storage0.getMyVar(cacheKey)) {
                let body = {
                    area: storage0.getMyVar("type_list_area" + storage0.getMyVar("type_list_index", "0"), storage0.getMyVar("cate_index_area" + getMyVar("type_list_index", "0"))),
                    year: storage0.getMyVar("type_list_year" + storage0.getMyVar("type_list_index", "0"), storage0.getMyVar("cate_index_year" + getMyVar("type_list_index", "0"))),
                    type_id: +storage0.getMyVar("type_list_type", storage0.getMyVar("cate_index_type")),
                    page: +pg,
                    sort: storage0.getMyVar("type_list_sort" + storage0.getMyVar("type_list_index", "0"), storage0.getMyVar("cate_index_sort" + getMyVar("type_list_index", "0"))),
                    lang: storage0.getMyVar("type_list_lang" + storage0.getMyVar("type_list_index", "0"), storage0.getMyVar("cate_index_lang" + getMyVar("type_list_index", "0"))),
                    class: storage0.getMyVar("type_list_class" + storage0.getMyVar("type_list_index", "0"), storage0.getMyVar("cate_index_class" + getMyVar("type_list_index", "0")))
                };
                let data;
                if (!getMyVar("init")) {
                    data = post("api.php/getappapi.index/typeFilterVodList", body);
                } else {
                    data = post("api.php/qijiappapi.index/typeFilterVodList", body);
                }

                if (data.recommend_list && data.recommend_list.length > 0) {
                    saveImage(data.recommend_list[0].vod_pic, "hiker://files/cache/Top_H5.jpg");
                }
                storage0.putMyVar(cacheKey, data);
            }

            storage0.getMyVar(cacheKey).recommend_list.forEach(data => {
                d.push({
                    title: data.vod_name,
                    desc: data.vod_remarks,
                    img: data.vod_pic,
                    url: data.vod_id,
                    col_type: "movie_3",
                    extra: {
                        vod_id: data.vod_id,
                        vod_name: data.vod_name,
                        de_key: getMyVar("de_key"),
                        host: getMyVar("host_1"),
                        init: getMyVar("init")
                    }
                });
            });
        } catch (e) {
            log(e.message);
        }
        return d;
    },
    排行: function() {
        var d = [];
        eval(this.rely(this.aes));
        var pg = MY_PAGE;
        try {
            const hasRankFeature = getMyVar("rank") == '1';

            if (MY_PAGE == 1) {
                if (hasRankFeature) {
                    d.push({
                        title: getMyVar("rankindex", "0") == "0" ? themeColor("strong", "全部") : "全部",
                        url: $("#noLoading#").lazyRule(() => {
                            putMyVar("rankindex", "0");
                            refreshPage(false);
                            return "hiker://empty";
                        }),
                        col_type: "scroll_button",
                        extra: {
                            backgroundColor: getMyVar("rankindex", "0") == "0" ? themeColor("background") : ""
                        }
                    });

                    let typeCacheKey = "type_id_" + getMyVar("host_1", "");
                    if (storage0.getMyVar(typeCacheKey)) {
                        storage0.getMyVar(typeCacheKey).forEach((data, index) => {
                            if (this.filterContent(data.list)) {
                                d.push({
                                    title: getMyVar("rankindex", "0") == data.id ? themeColor("strong", data.list) : data.list,
                                    url: $("#noLoading#").lazyRule(id => {
                                        putMyVar("rankindex", id);
                                        refreshPage(false);
                                        return "hiker://empty";
                                    }, data.id),
                                    col_type: "scroll_button",
                                    extra: {
                                        backgroundColor: getMyVar("rankindex", "0") == data.id ? themeColor("background") : ""
                                    }
                                });
                            }
                        });
                    }
                } else {
                    let rank = [{
                        title: "日榜&周榜&月榜",
                        id: "1&2&3"
                    }];
                    Cate(rank, "rank", d, "text_3");
                }
            }

            const getRankParams = () => {
                if (hasRankFeature) {
                    return {
                        cacheKey: "rank_" + getMyVar("rankindex", "0") + "_" + pg + "_" + getMyVar("host_1", ""),
                        body: {
                            type_id: +getMyVar("rankindex", "0") || 0,
                            page: +pg
                        }
                    };
                } else {
                    return {
                        cacheKey: "rank_" + getMyVar("rankindex", "1") + "_" + pg + "_" + getMyVar("host_1", ""),
                        body: {
                            type_id: +getMyVar("rankindex", "1") || 1,
                            page: +pg
                        }
                    };
                }
            };

            const {
                cacheKey,
                body
            } = getRankParams();

            if (!storage0.getMyVar(cacheKey)) {
                let data;
                if (!getMyVar("init")) {
                    data = post("api.php/getappapi.index/rankListV134", body);
                } else {
                    data = post("api.php/qijiappapi.index/rankListV134", body);
                }
                if (data.rank_list && data.rank_list.length > 0) {
                    saveImage(data.rank_list[0].vod_pic, "hiker://files/cache/Top_H5.jpg");
                }
                storage0.putMyVar(cacheKey, data);
            }

            if (storage0.getMyVar(cacheKey).rank_list) {
                storage0.getMyVar(cacheKey).rank_list.forEach(data => {
                    d.push({
                        title: data.vod_name + "\n" + ("‘‘’’演员：" + data.vod_actor + "\n国家：" + data.vod_area).small(),
                        desc: "类型：" + data.vod_class + "\n" + ("‘‘’’更新状态：" + data.vod_remarks),
                        img: data.vod_pic,
                        url: data.vod_id,
                        col_type: "movie_1_vertical_pic",
                        extra: {
                            vod_id: data.vod_id,
                            vod_name: data.vod_name,
                            de_key: getMyVar("de_key"),
                            host: getMyVar("host_1"),
                            init: getMyVar("init")
                        }
                    });
                });
            }
        } catch (e) {
            log(e.message);
        }
        return d;
    },
    周表: function() {
        var d = [];
        eval(this.rely(this.aes));

        var pg = MY_PAGE;
        try {
            let today = new Date().getDay();
            let currentDay = today === 0 ? 7 : today;

            let weekdays = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
            let weekdayIds = ["1", "2", "3", "4", "5", "6", "7"];
            let reorderedTitles = [];
            let reorderedIds = [];

            for (let i = 0; i < 7; i++) {
                let index = (currentDay - 1 + i) % 7;
                reorderedTitles.push(weekdays[index]);
                reorderedIds.push(weekdayIds[index]);
            }

            let week = [{
                title: reorderedTitles.join("&"),
                id: reorderedIds.join("&")
            }];

            putMyVar("currentWeekDay", currentDay.toString());
            if (!getMyVar("week")) {
                putMyVar("week", getMyVar("currentWeekDay"));
            }
            Cate(week, "week", d, "scroll_button", [{
                title: "重置",
                js: $.toString(() => {
                    let today = new Date().getDay();
                    let currentDay = today === 0 ? 7 : today;
                    putMyVar("week", currentDay.toString());
                    putMyVar("currentWeekDay", currentDay.toString());
                    refreshPage();
                    return "hiker://empty";
                })
            }]);

            let currentWeekDay = getMyVar("currentWeekDay");
            const getWeekCacheKey = () => {
                return "week_" + getMyVar("week", currentWeekDay) + "_" + pg + "_" + getMyVar("host_1", "");
            };

            let cacheKey = getWeekCacheKey();

            if (!storage0.getMyVar(cacheKey)) {
                let body = {
                    week: +getMyVar("week", currentWeekDay),
                    page: +pg
                };
                let data;
                if (!getMyVar("init")) {
                    data = post("api.php/getappapi.index/vodWeekList", body);
                } else {
                    data = post("api.php/qijiappapi.index/vodWeekList", body);
                }
                if (data.week_list.length > 0) {
                    saveImage(data.week_list[0].vod_pic, "hiker://files/cache/Top_H5.jpg");
                }
                storage0.putMyVar(cacheKey, data);
            }

            storage0.getMyVar(cacheKey).week_list.forEach(data => {
                d.push({
                    title: data.vod_name + "\n" + ("‘‘’’演员：" + data.vod_actor + "\n国家：" + data.vod_area).small(),
                    desc: "类型：" + data.vod_class + "\n" + ("‘‘’’更新状态：" + data.vod_remarks),
                    img: data.vod_pic,
                    url: data.vod_id,
                    col_type: "movie_1_vertical_pic",
                    extra: {
                        vod_id: data.vod_id,
                        vod_name: data.vod_name,
                        de_key: getMyVar("de_key"),
                        host: getMyVar("host_1"),
                        init: getMyVar("init")
                    }
                });
            });
        } catch (e) {
            log(e.message);
        }
        return d;
    },
    最新: function(surl) {
        const detailData = this.二级(surl);

        // 提取集数中的数字
        const extractEpisodeNumber = episode => {
            const match = episode.match(/(?:第)?(\d+)(?:集|话)?/);
            return match ? parseInt(match[1], 10) : null;
        };

        // 比较集数大小
        const isEpisodeNewer = (newEpisode, oldEpisode) => {
            const newNum = extractEpisodeNumber(newEpisode);
            const oldNum = extractEpisodeNumber(oldEpisode);
            return newNum !== null && oldNum !== null ? newNum > oldNum : newEpisode > oldEpisode;
        };

        let latestEpisode = "";
        let latestLine = "";

        if (Array.isArray(detailData.list) && detailData.list.length > 0) {
            for (let i = 0; i < detailData.list.length; i++) {
                const playList = detailData.list[i];
                const lineName = (detailData.line[i] || `线路${i + 1}`).replace(/\(请勿相信任何广告\)/g, "");

                if (Array.isArray(playList) && playList.length > 0) {
                    const episode = playList[playList.length - 1].title || "";
                    if (episode && (!latestEpisode || isEpisodeNewer(episode, latestEpisode))) {
                        latestEpisode = episode;
                        latestLine = lineName;
                    }
                }
            }
        }

        return latestEpisode ? `更新至: ${latestEpisode}-(${latestLine})` : "暂无更新信息";
    }
};