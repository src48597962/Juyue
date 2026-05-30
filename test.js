var d = [];
d.push({
    title: "终极超频·全伪装免限速测试",
    url: 'ff256c6c181d58556b729223ada77eb7' + $().lazyRule(() => {
        let html = request("https://player.tmzyz.com/?url=" + input);
        let urlMatch = html.match(/url: '(.*?)',/);
        if (!urlMatch) return "toast://未匹配到M3U8地址";
        let m3u8Url = "https://player.tmzyz.com/" + id;
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





        var OUTPUT_M3U8 = getPath("hiker://files/_cache/hikerview_proxy.m3u8").slice(7);

        // ---------- 核心：高伪装、免限速流式下载引擎 ----------
        function pipeAndDecryptJava(urlStr, start, end, clientOutputStream) {
            var URL = java.net.URL;
            var url = new URL(urlStr);
            var conn = url.openConnection();
            
            // 1. 【最关键】全套浏览器伪装，彻底骗过 CDN 防盗链和限速策略
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Range", "bytes=" + start + "-" + (end - 1));
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36");
            conn.setRequestProperty("Referer", "https://player.tmzyz.com/");
            conn.setRequestProperty("Origin", "https://player.tmzyz.com");
            conn.setRequestProperty("Connection", "keep-alive"); // 保持长连接，规避频繁握手
            conn.setRequestProperty("Accept", "*/*");
            conn.setRequestProperty("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8");
            
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);
            
            var responseCode = conn.getResponseCode();
            if (responseCode != 206 && responseCode != 200) {
                throw new Error("HTTP 限速或拒绝访问: " + responseCode);
            }
            
            var contentLength = conn.getContentLengthLong();
            
            // 抢先向手机播放器响应
            var header = "HTTP/1.1 200 OK\r\n" +
                         "Content-Type: video/mp4\r\n" +
                         "Content-Length: " + contentLength + "\r\n" +
                         "Connection: close\r\n\r\n";
            clientOutputStream.write(new java.lang.String(header).getBytes("UTF-8"));

            var inputStream = conn.getInputStream();
            // 2. 缓冲区直接拉满到 32KB，大幅度降低高网速下的 I/O 损耗
            var buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 32768); 
            var bytesRead;
            
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                for (var i = 0; i < bytesRead; i++) {
                    var b = (buffer[i] - 1) & 0xFF;
                    buffer[i] = (b > 127) ? (b - 256) : b;
                }
                clientOutputStream.write(buffer, 0, bytesRead);
            }
            
            clientOutputStream.flush();
            inputStream.close();
            conn.disconnect();
        }

        // ---------- 解析并重写 M3U8 到本地 ----------
        function rewriteM3u8ToLocal(m3u8Url, port, localPath) {
            var txt = request(m3u8Url);
            if (!txt) return null;

            var lines = txt.split("\n");
            var mediaUrl = ""; 

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (line && line.charAt(0) !== "#") {
                    mediaUrl = line;
                    break; 
                }
            }
            if (!mediaUrl) return null;

            if (mediaUrl.indexOf("http") !== 0) {
                var lastSlash = m3u8Url.lastIndexOf("/");
                mediaUrl = m3u8Url.substring(0, lastSlash + 1) + mediaUrl;
            }

            var newLines = [];
            var currentStart = 0;
            var prevStart = 0;
            var prevSize = 0;

            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line) continue;

                if (line.indexOf("#EXT-X-MAP") === 0) {
                    var m = line.match(/BYTERANGE="(\d+)@(\d+)"/);
                    if (m) {
                        var size = parseInt(m[1], 10);
                        var start = parseInt(m[2], 10);
                        var proxyMapUrl = "http://127.0.0.1:" + port + "/?start=" + start + "&size=" + size + "#.mp4";
                        newLines.push('#EXT-X-MAP:URI="' + proxyMapUrl + '"');
                        currentStart = start + size;
                    } else {
                        newLines.push(line);
                    }
                } else if (line.indexOf("#EXT-X-BYTERANGE:") === 0) {
                    var br = line.split(":")[1].trim();
                    var arr = br.split("@");
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
                    var proxySegUrl = "http://127.0.0.1:" + port + "/?start=" + prevStart + "&size=" + prevSize + "#.mp4";
                    newLines.push(proxySegUrl);
                }
            }

            var File = java.io.File;
            var FileOutputStream = java.io.FileOutputStream;
            var file = new File(localPath);
            var parent = file.getParentFile();
            if (parent && !parent.exists()) parent.mkdirs();
            
            var fos = new FileOutputStream(file, false);
            fos.write(new java.lang.String(newLines.join("\n")).getBytes("UTF-8"));
            fos.flush();
            fos.close();

            return mediaUrl;
        }

        // ---------- 主流程入口 ----------
        var html = request("https://player.tmzyz.com/?url=ff256c6c181d58556b729223ada77eb7");
        var urlMatch = html.match(/url: '(.*?)',/);
        if (!urlMatch) return "toast://未匹配到M3U8地址";
        
        var rawM3u8Url = "https://player.tmzyz.com/" + urlMatch[1];

        var serverSocket = new java.net.ServerSocket(0);
        var port = serverSocket.getLocalPort();

        var realMediaUrl = rewriteM3u8ToLocal(rawM3u8Url, port, OUTPUT_M3U8);
        if (!realMediaUrl) return "toast://解析M3U8失败";

        // 3. 引入 Java 顶级并发工具：固定大小线程池，消灭频繁创建线程导致的 CPU 剧烈抖动
        var threadPool = java.util.concurrent.Executors.newFixedThreadPool(8);

        // 启动主监听线程
        new java.lang.Thread(new java.lang.Runnable({
            run: function() {
                try {
                    while (!serverSocket.isClosed()) {
                        var socket = serverSocket.accept(); 
                        
                        // 使用线程池无缝托管请求
                        threadPool.execute(new java.lang.Runnable({
                            run: function() {
                                try {
                                    var is = socket.getInputStream();
                                    var reader = new java.io.BufferedReader(new java.io.InputStreamReader(is));
                                    var requestLine = reader.readLine();
                                    if (!requestLine) return;
                                    
                                    var parts = requestLine.split(" ");
                                    if (parts.length < 2) return;
                                    
                                    var path = parts[1];
                                    var startMatch = path.match(/start=(\d+)/);
                                    var sizeMatch = path.match(/size=(\d+)/);
                                    var os = socket.getOutputStream();
                                    
                                    if (startMatch && sizeMatch) {
                                        var start = parseInt(startMatch[1], 10);
                                        var size = parseInt(sizeMatch[1], 10);
                                        var end = start + size;
                                        
                                        // 启动高伪装数据传输管道
                                        pipeAndDecryptJava(realMediaUrl, start, end, os);
                                    } else {
                                        var header = "HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n";
                                        os.write(new java.lang.String(header).getBytes("UTF-8"));
                                        os.flush();
                                    }
                                } catch (e) {
                                    // 过滤播放器主动断开引起的常规异常
                                } finally {
                                    try { socket.close(); } catch(sc){}
                                }
                            }
                        }));
                    }
                } catch (te) {
                    // 安全退出
                }
            }
        })).start();

        // 交付本地重写过的 M3U8 文件
        return "file://" + OUTPUT_M3U8;

    }),
    col_type: "text_1"
});

setResult(d);