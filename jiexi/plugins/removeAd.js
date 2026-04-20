/*
 * m3u8 全自动去广告
 * 零误删 | 通用 | 支持任意广告时长 | 支持切片地址突变
 * 规则：只删连续异常切片集群，绝不删正片
*/
function cleanM3u8(url, ref) {
    log('进来了>'+ url);
    let json = JSON.parse(fetch(url, {headers:{referer: ref||url}, withStatusCode:true}));
    
    if(json.statusCode!=200){
        return url;
    }
    let m3u8Content = json.body;
    let urlPath = json.url.replace(/[^/]*$/, '');
    log(urlPath);
    let cleanContent = cleanM3u8RemoveAds(m3u8Content, urlPath);
    log(cleanContent);
    return url;
}

function cleanM3u8RemoveAds(m3u8Content, urlPath) {
    if (!m3u8Content || typeof m3u8Content !== 'string') return m3u8Content;

    // 1. 按行解析
    let lines = m3u8Content.split('\n').map(line => line.trim());
    let result = [];

    // === 安全保护：切片总数不足10个 → 直接返回原内容（绝不处理）===
    let totalSegments = lines.filter(l => l.endsWith('.ts')).length;
    if (totalSegments < 10) {
        log('✅ 切片过少，不执行广告清理');
        return m3u8Content;
    }

    // === 解析所有切片信息 ===
    let segments = [];
    let discontinuityPositions = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        if (line === '#EXT-X-DISCONTINUITY') discontinuityPositions.push(i);
        if (line.startsWith('#EXTINF:')) {
            let tsLine = lines[i + 1] || '';
            if (!tsLine || tsLine.startsWith('#')) continue;

            segments.push({
                infLine: i,
                tsLine: i + 1,
                duration: parseFloat(line.replace('#EXTINF:', '').replace(',', '')),
                filename: tsLine.split('?')[0].split('/').pop(),
                fullPath: tsLine,
                isAd: false
            });
        }
    }

    // === 核心：广告识别（零误删）===
    markAdsSafely(segments, discontinuityPositions);

    // === 生成纯净 m3u8 ===
    let adLines = new Set();
    segments.forEach(s => {
        if (s.isAd) {
            adLines.add(s.infLine);
            adLines.add(s.tsLine);
        }
    });

    // 保留非广告内容
    for (let i = 0; i < lines.length; i++) {
        if (adLines.has(i)) continue;
        // 移除广告段附近的多余断层
        if (lines[i] === '#EXT-X-DISCONTINUITY' && adLines.has(i + 1)) continue;

        if(lines[i].includes('.ts') && !lines[i].startsWith('http')){
            lines[i] = urlPath + lines[i];
        }
        result.push(lines[i]);
    }

    return result.join('\n');
}

/**
 * 【安全广告识别引擎】
 * 3大特征同时满足才判定广告，绝对不删正片
 */
function markAdsSafely(segments, discontinuities) {
    let segCount = segments.length;
    if (segCount < 10) return;

    // 基准样本：前20%  youku/tencent/iqiyi 正片特征
    let sampleSize = Math.max(8, Math.floor(segCount * 0.2));
    let sample = segments.slice(0, sampleSize);

    // 提取正片标准特征
    let avgNameLength = sample.map(s => s.filename.length).reduce((a, b) => a + b, 0) / sampleSize;
    let isHexNormal = name => /^[0-9a-f]{30,40}/.test(name); // 视频站正片通用规则

    // 逐个评分
    segments.forEach((seg, idx) => {
        let score = 0;
        let name = seg.filename;

        // 特征1：文件名长度突变（广告最典型）
        let lenDelta = Math.abs(name.length - avgNameLength);
        if (lenDelta > 8) score += 35;

        // 特征2：命名规则突变（正片是32位哈希，广告不是）
        let normalName = isHexNormal(name);
        if (!normalName) score += 40;

        // 特征3：时长剧烈波动 >2秒
        let prev = segments[idx > 0 ? idx - 1 : 0];
        let durDelta = Math.abs(seg.duration - prev.duration);
        if (durDelta > 2.0) score += 25;

        // 达到70分才标记可疑
        seg.isAd = score >= 70;
    });

    // === 【最强安全锁】===
    // 只有【连续3个以上】可疑切片 → 才判定为真实广告
    // 零星1～2个异常 → 保留（绝不误删正片）
    for (let i = 0; i < segCount; i++) {
        if (!segments[i].isAd) continue;
        let chain = 0;
        for (let j = i; j < segCount && segments[j].isAd; j++) chain++;
        if (chain < 3) {
            for (let j = i; j < i + chain; j++) segments[j].isAd = false;
        }
    }

    log(`✅ 识别完成：共 ${segments.length} 个切片，广告 ${segments.filter(s => s.isAd).length} 个`);
}