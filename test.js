let parse = {
    作者: "King",
    名称: "51吃瓜",
    版本: '20250622',
    页码: {
        "主页": 1
    },
    host: 'https://hx7sz3.yajzacf.top',
    预处理1: function() {
        if (!getItem('吃瓜link') && !getItem('执行预处理')) {
            setItem('吃瓜link', 'https://barely.vssgrmd.top')
            setItem('发布link', "https://51cga24.com")
        }
        var host = getItem('吃瓜link')
        var html = fetch(host)
        if (!/吃瓜/.test(html) && !getItem('执行预处理')) {
            let baseUrl = "https://51cga";
            let start = 24;
            let end = 35;
            let foundUrl = "";

            // 获取当天日期（几号）作为标识，和原代码保持一致的时间判断逻辑
            let time = new Date().getDate().toString();

            // 先判断是否当天未执行过检测，和原逻辑保持时间校验
            if (getItem("time") !== time) {
                // 遍历网址逻辑
                for (let i = start; i <= end; i++) {
                    let currentUrl = `${baseUrl}${i}.com`;
                    // 这里假设存在一个自定义的网络可达检测方法，不同环境实现不同，以下用 try - catch + fetch 模拟
                    try {
                        // 尝试请求网址，通过是否抛错判断可达性，实际可根据返回状态码等细化
                        let response = fetch(currentUrl);
                        if (response) {
                            foundUrl = pdfh(response, "a&&href");
                            toast(`找到可访问网址：${foundUrl}`);
                            setItem("发布link", foundUrl); // 保存找到的网址到本地存储
                            setItem("time", time); // 更新时间标识，当天不再重复检测
                            break; // 找到就停止遍历
                        }
                    } catch (error) {
                        toast(`${currentUrl} 不可访问`);
                    }
                }
                if (!foundUrl) {
                    toast("未找到可访问的网址");
                }
            }

            var 发布 = getItem('发布link')
            var html = fetchCodeByWebView(发布)
            //log(html)
            var urls = pdfa(html, ".box&&.btnLink")
            let links = urls.map(item => pdfh(item, "Text"));
            log(links)
            let link = findReachableIP(links, 5000)
            log("更新：" + link)
            setItem('吃瓜link', "https://" + link);
            setItem('执行预处理', '1');
            refreshPage();
        }
    },

    /*
    51吃瓜回家的路 (本公告更新日期：2025/06/23)
    官方最新地址
    51吃瓜网页版最新网址 https://51cga23.com
    51吃瓜网页版海外永久地址 https://51cg1.com
    51吃瓜网页版海外永久中转 https://cg51.com
    51吃瓜备用网址1: https://51cga22.com
    51吃瓜备用地址2： https://apy91.xyz
    51吃瓜备用地址3： https://apy92.xyz
    */

    "静态分类": {
        "type": "主页",
        "url": "hiker://empty##/fyclassfypage",
        "class_name": "首页&往期&标签&今日吃瓜&吃瓜榜单&学生校园&热门大瓜&看片娱乐&必看大瓜&伦理道德&网红黑料&海外吃瓜&明星黑料&骚男骚女&每日大赛&擦边撩骚&51涨知识&人人吃瓜&吃瓜看戏&领导干部&51剧场&吃瓜新闻&免费短剧&51包养&51原创",
        "class_url": "page/&archives/page/&tags/&category/wpcz/&category/mrdg/&category/xsxy/&category/rdsj/&category/ysyl/&category/bkdg/&category/lldd/&category/whhl/&category/hwcg/&category/whmx/&category/snsn/&category/mrds/&category/dcbq/&category/zzs/&category/rrcg/&category/qubk/&category/ldcg/&category/51djc/&category/cgxw/&category/cbdj/&category/51by/&category/yczq/",
        "area_name": "",
        "area_url": "",
        "year_name": "",
        "year_url": "",
        "sort_name": "",
        "sort_url": ""
    },
    "主页": function() {
            var d = []
            if (parse.作者 == "King") {
                var tlazy = $('').image(() => {
                    const CryptoUtil = $.require("hiker://assets/crypto-java.js");
                    let key = CryptoUtil.Data.parseUTF8("f5d965df75336270");
                    let iv = CryptoUtil.Data.parseUTF8("97b60394abc2fbe1");
                    let textData = CryptoUtil.Data.parseInputStream(input);
                    let encrypted = CryptoUtil.AES.decrypt(textData, key, {
                        mode: "AES/CBC/PKCS7Padding",
                        iv: iv
                    });
                    return encrypted.toInputStream();
                })
                var host = getItem('吃瓜link')
                log(host)
                //var host=parse.host
                var url = host + MY_URL.split("##")[1];
                log(url)
                var html = fetchPC(url);
                if (/archives/.test(MY_URL)) {
                    var list = pdfa(html, '#archives-content&&.brick')
                    list.forEach(item => {
                        d.push({
                            title: pdfh(item, 'a&&Text'),
                            url: pdfh(item, 'a&&href'),
                            extra: {
                                title: pdfh(item, 'a&&Text'),
                                //img: img + tlazy,
                                desc: "",
                                url: pdfh(item, 'a&&href'),
                            },
                            col_type: 'text_1',
                        })
                    })
                } else if (/tags/.test(MY_URL)) {
                    var lazy = $('').rule(() => {
                        var d = []
                        var tlazy = $('').image(() => {
                            const CryptoUtil = $.require("hiker://assets/crypto-java.js");
                            let key = CryptoUtil.Data.parseUTF8("f5d965df75336270");
                            let iv = CryptoUtil.Data.parseUTF8("97b60394abc2fbe1");
                            let textData = CryptoUtil.Data.parseInputStream(input);
                            let encrypted = CryptoUtil.AES.decrypt(textData, key, {
                                mode: "AES/CBC/PKCS7Padding",
                                iv: iv
                            });
                            return encrypted.toInputStream();
                        })
                        html = getResCode()
                        var list2 = pdfa(html, 'body&&article:not(.no-mask)')
                        list2.forEach(item => {
                            var title = pdfh(item, 'h2&&Text')
                            var img = item.match(/http.*?jpeg|http.*?jpg/)
                            if (img) {
                                d.push(toerji({
                                    title: '‘‘’’\n\n\n\n' + title + '<small>\n' + pdfh(item, '.post-card-info&&Text') + '</small>',
                                    //  desc: pdfh(item, '.post-card-info&&Text'),
                                    desc: '0',
                                    img: img + tlazy,
                                    url: pdfh(item, 'a&&href'),
                                    extra: {
                                        title: title,
                                        img: img + tlazy,
                                        desc: "",
                                        url: pdfh(item, 'a&&href'),
                                    },
                                    col_type: "card_pic_1"
                                }))
                            }
                        })
                        setResult(d)
                    });
                    var 第一项 = 100 * (MY_PAGE - 1) + 1; //log(第一项)
                    var 最后项 = 100 * MY_PAGE; //log(最后项)                                   
                    var html = fetch(host + "/tags.html")
                    if (MY_PAGE == 1) {
                        var list1 = pdfa(html, '#archives-tags&&a,1:50')
                    } else if (MY_PAGE == 2) {
                        var list1 = pdfa(html, '#archives-tags&&a,51:100')
                    } else if (MY_PAGE == 3) {
                        var list1 = pdfa(html, '#archives-tags&&a,101:150')
                    }
                    var listk = ["富二代", "韩国", "主播", "母狗"]
                    listk.forEach(item => {
                        d.push({
                            title: pdfh(item, 'Text'),
                            url: host + "/tag/" + pdfh(item, 'Text') + "/fypage/" + lazy,
                            col_type: "text_4"
                        })
                    });
                    list1.forEach(item => {
                        d.push({
                            title: pdfh(item, 'a&&Text'),
                            url: host + pdfh(item, 'a&&href') + "fypage/" + lazy,
                            col_type: "text_4"
                        })
                    });

                } else {

                    var list = pdfa(html, 'body&&article:not(:has(meta[content=广告])):not(:matches(在线选妃|杏吧直播|无忧直播|开云体育|同城约​炮|随时可约|无色无味无记忆|复制网址用浏览器|私密发货|开云体育|扫描图中|点击扫码|免费体验|开元棋牌|迷奸同事|注册即送|恋人直播|名姿直播))');
                    for (var j in list) {
                        var title = pdfh(list[j], 'h2&&Text');
                        var img = pdfh(list[j], 'script&&Html').split("'")[1];
                        var desc = pdfh(list[j], '.post-card-info&&Text'); //.match(/\d+\s年\s\d+\s月\s\d+\s日/);
                        if (title != '热搜 HOT' && title != '') {
                            d.push({
                                title: title,
                                img: img + tlazy,
                                desc: desc,
                                url: pdfh(list[j], 'a&&href'),
                                extra: {
                                    title: title,
                                    img: img + tlazy,
                                    desc: desc,
                                    url: pdfh(list[j], 'a&&href'),
                                },
                                col_type: 'movie_2'
                            });
                        }
                    }
                }

            } else {
                d.push({
                    title: '请勿修改作者名',
                    url: 'hiker://empty',
                    col_type: 'text_center_1'
                })
            }
            return d
        }

        ,
    "搜索": function(name) {
        var d = [];
        var tlazy = $('').image(() => {
            const CryptoUtil = $.require("hiker://assets/crypto-java.js");
            let key = CryptoUtil.Data.parseUTF8("f5d965df75336270");
            let iv = CryptoUtil.Data.parseUTF8("97b60394abc2fbe1");
            let textData = CryptoUtil.Data.parseInputStream(input);
            let encrypted = CryptoUtil.AES.decrypt(textData, key, {
                mode: "AES/CBC/PKCS7Padding",
                iv: iv
            });
            return encrypted.toInputStream();
        })
        var host = getItem('吃瓜link')
        log(host)
        //var host=parse.host        
        if (page == 1) {
            var url = host + '/search/' + name + '/'
        } else {
            var url = host + '/search/' + name + '/' + page + '/';
        }
        log(url)
        var html = fetchPC(url);
        var list = pdfa(html, 'body&&article')
        list.forEach(item => {
            var img = pdfh(item, 'script&&Html').split("'")[1]
            var url = pdfh(item, 'a&&href')
            var title = pdfh(item, 'h2&&Text')
            var desc = pdfh(item, '.post-card-info&&Text')
            d.push({
                title: title,
                desc: desc,
                img: img + tlazy,
                url: url,
                col_type: "movie_2",
                extra: {
                    title: title,
                    img: img + tlazy,
                    desc: desc,
                    url: url,
                },
            })
        })
        return d
    },
    二级: function(surl) { //surl为详情页链接
        //自行实现代码
        log(surl)
        var host = getItem('吃瓜link')
        var url = host + "/archives/" + surl.split("archives")[1].match(/\d+/)[0];
        log(url)
        let html = fetchPC(url);
        var tlazy = $('').image(() => {
            const CryptoUtil = $.require("hiker://assets/crypto-java.js");
            let key = CryptoUtil.Data.parseUTF8("f5d965df75336270");
            let iv = CryptoUtil.Data.parseUTF8("97b60394abc2fbe1");
            let textData = CryptoUtil.Data.parseInputStream(input);
            let encrypted = CryptoUtil.AES.decrypt(textData, key, {
                mode: "AES/CBC/PKCS7Padding",
                iv: iv
            });
            return encrypted.toInputStream();
        })
        let detail1 = MY_PARAMS.title; //pdfh(html, '.post-title&&Text');
        let detail2 = MY_PARAMS.desc; //parseDomForHtml(html, '.post-meta&&Text') ;
        let 简介 = detail1 + detail2;
        let 图片 = MY_PARAMS.img ? MY_PARAMS.img : pdfh(html, ".post-content&&img&&data-xkrkllgl") + tlazy
        let 选集 = parseDomForArray(html, '#post&&.dplayer').map((data, j) => {
            let 选集列表 = {};
            选集列表.title = '““视频””' + (Number(j) + 1)
            选集列表.url = pdfh(data, '.dplayer&&data-config').match(/http.*?m3u8.*/)[0].split('"')[0].replace(/\\/g, "")
            //选集列表.extra = {};
            return 选集列表;
        })

        var d = []
        d.push({
            col_type: 'line',
        });

        //标题
        d.push({
            title: pdfh(html, '.post-title&&Text'),
            desc: parseDomForHtml(html, '.post-meta&&Text'),
            url: url + $('').lazyRule(() => {
                return "web://" + input
            }),
            col_type: 'text_center_1',

        });
        d.push({
            col_type: 'line',
        });

        //正文
        var texts = pdfa(html, 'body&&.post-content>p:not(:has(.content-file)):not(p:matches(复制以下链接分享给朋友)~p):not(:matches(复制以下链接分享给朋友)):not(:matches(在线选妃|杏吧直播|无忧直播|开云体育|同城约​炮|随时可约|无色无味无记忆|复制网址用浏览器|私密发货|开云体育|扫描图中|点击扫码|免费体验|开元棋牌|迷奸同事|评论和转发|九游娱乐))');
        texts.forEach((item, index) => {
            if (pdfh(item, 'p&&Text')) {
                var url = pdfh(item, 'a&&href')
                var title = pdfh(item, 'p&&Text').replace("简要描述：", "")
                d.push({
                    title: /archive/.test(url) ? '‘‘’’<font color="' + '#FF0000' + '">' + title + '</font>' : title,
                    url: url, //+ $('').rule($.require("jiekou").parse().二级),
                    extra: {
                        title: title,
                        desc: "",
                        img: MY_PARAMS.img,
                    },
                    col_type: /archive/.test(url) ? 'text_1' : "rich_text",

                });
            }
            var imgs = pdfa(item, 'p&&img').map(h => pdfh(h, 'img&&data-xkrkllgl'));
            imgs.filter(it => it.length > 0).forEach(item2 => {
                d.push({
                    title: '',
                    img: item2 + tlazy,
                    url: item2 + tlazy,
                    col_type: 'pic_1_full'
                });
            });
        });

        //视频
        var list = parseDomForArray(html, '#post&&.dplayer');
        for (let j in list) {
            d.push({
                title: '““视频””' + (Number(j) + 1),
                //url: pdfh(list[j], '.dplayer&&data-config') + `@lazyRule=.js:JSON.parse(input).video.url`,
                url: pdfh(list[j], '.dplayer&&data-config').match(/http.*?m3u8.*/)[0].split('"')[0].replace(/\\/g, "") + $('').lazyRule(() => {
                    return input
                }),
                col_type: 'text_2',
            });
        }

        return {
            detail1: detail1,
            detail2: detail2,
            noShow: {
                简介: true,
                排序: true
            },

            desc: 简介,
            img: 图片,
            list: 选集,
            extenditems: d,
        } //按格式返回
    }
};