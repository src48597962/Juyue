var d = [];
d.push({
    title: "终极超频·全伪装免限速测试",
    url: 'ff256c6c181d58556b729223ada77eb7' + $('').lazyRule(() => {
        let html = request("https://player.tmzyz.com/?url=" + input);
        let urlMatch = html.match(/url: '(.*?)',/);
        if (!urlMatch) return "toast://未匹配到M3U8地址";
        let m3u8Url = "https://player.tmzyz.com/" + urlMatch[0];
        let txt = request(m3u8Url);
        if (!txt) return "toast://未获取到M3U8内容";

        let lines = txt.split("\n");
        let mediaUrl = ""; 

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (line && line.charAt(0) !== "#") {
                mediaUrl = line;
                break; 
            }
        }
        if (!mediaUrl) return "toast://未获取到播放地址";

        if (mediaUrl.indexOf("http") !== 0) {
            let lastSlash = m3u8Url.lastIndexOf("/");
            mediaUrl = m3u8Url.substring(0, lastSlash + 1) + mediaUrl;
        }

        let newLines = [];
        let currentStart = 0;
        let prevStart = 0;
        let prevSize = 0;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) continue;

            if (line.indexOf("#EXT-X-MAP") === 0) {
                let m = line.match(/BYTERANGE="(\d+)@(\d+)"/);
                if (m) {
                    let size = parseInt(m[1], 10);
                    let start = parseInt(m[2], 10);
                    let proxyMapUrl = start + "|" + size;
                    newLines.push('#EXT-X-MAP:URI="' + proxyMapUrl + '"');
                    currentStart = start + size;
                } else {
                    newLines.push(line);
                }
            } else if (line.indexOf("#EXT-X-BYTERANGE:") === 0) {
                let br = line.split(":")[1].trim();
                let arr = br.split("@");
                if (arr.length === 2) {
                    prevSize = parseInt(arr[0], 10);
                    prevStart = parseInt(arr[1], 10);
                } else if (arr.length === 1) {
                    prevSize = parseInt(arr[0], 10);
                    prevStart = currentStart;
                }
                currentStart = prevStart + prevSize;
            } else if (line.charAt(0) === "#") {
                newLines.push(line);
            } else {
                let proxySegUrl = prevStart + "|" + prevSize;
                newLines.push(proxySegUrl);
            }
        }
        writeFile('hiker://files/_cache/tmzyz.m3u8', newLines.join("\n"));

        let u = startProxyServer($.toString((mediaUrl) => {
            let url = MY_PARAMS.url;
            if (url.includes("|")) {
                log("代理ts：" + url);
                //此时可以根据实际逻辑得到真实有效的ts地址
                let start = parseInt(url.split("|")[0], 10);
                let size = parseInt(url.split("|")[1], 10);
                let end = start + size;
                return JSON.stringify({
                    statusCode: 302,
                    headers: {
                        "Location": mediaUrl,
                        "Range": "bytes=" + start + "-" + (end - 1),
                        "User-Agent": "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
                        "Referer": "https://player.tmzyz.com/",
                        "Origin": "https://player.tmzyz.com",
                        "Accept": "*/*",
                        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
                    }
                });
            }
            log("我在代理" + url);
            let f = fetch(url).split("\n");
            return f.map(it => {
                if (it.includes("|")) {
                    return "/proxy?url=" + it;
                }
                return it;
            }).join("\n");
        }, mediaUrl));


        return u + "?url=hiker://files/_cache/tmzyz.m3u8#.mp4";



    }),
    col_type: "text_1"
});

setResult(d);