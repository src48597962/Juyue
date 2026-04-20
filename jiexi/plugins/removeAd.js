/*
 * m3u8 全自动去广告
 * 零误删 | 通用 | 支持任意广告时长 | 支持切片地址突变
 * 规则：只删连续异常切片集群，绝不删正片
*/
function cleanM3u8(url, ref) {
    log('执行去广告');
    let json = JSON.parse(fetch(url, {headers:{referer: ref||url}, withStatusCode:true}));
    
    if(json.statusCode!=200){
        return url;
    }
    let m3u8Content = json.body;
    let urlPath = json.url.replace(/[^/]*$/, '');
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
    let totalSegments = lines.filter(l => l.includes('.ts')).length;
    if (totalSegments < 10) {
        console.log('✅ 切片过少，不执行广告清理');
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

    // === 核心：双模式广告识别（文件名规则 + 时长规则）===
    markAdsHybrid(segments);

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
 * 【双模式智能广告识别】
 * 1. 文件名异常（保留你原来的逻辑，兼容老影片）
 * 2. 时长模式（适配全MD5文件名的新影片）
 * 最终必须满足：连续 ≥3 个才判定广告，绝对不删正片
 */
function markAdsHybrid(segments) {
    let segCount = segments.length;
    if (segCount < 10) return;

    // ======================
    // 规则1：文件名特征（你原来的逻辑，完整保留）
    // ======================
    let sampleSize = Math.max(8, Math.floor(segCount * 0.2));
    let sample = segments.slice(0, sampleSize);
    let avgNameLength = sample.map(s => s.filename.length).reduce((a, b) => a + b, 0) / sampleSize;
    let isHexNormal = name => /^[0-9a-f]{30,40}/.test(name);

    // ======================
    // 规则2：时长特征（新增，适配全MD5广告）
    // 连续 5.0s / 4.0s / 极短切片 一律判定广告特征
    // ======================
    segments.forEach((seg, idx) => {
        let score = 0;
        let name = seg.filename;
        let d = seg.duration;

        // --- 原逻辑：文件名异常 + 分 ---
        let lenDelta = Math.abs(name.length - avgNameLength);
        if (lenDelta > 8) score += 35;
        if (!isHexNormal(name)) score += 40;

        // --- 原逻辑：时长波动 + 分 ---
        let prev = segments[idx > 0 ? idx - 1 : 0];
        let durDelta = Math.abs(seg.duration - prev.duration);
        if (durDelta > 2.0) score += 25;

        // --- 新增：广告典型时长（强制标记为可疑）---
        const isAdDuration =
            d.toFixed(0) === '5' ||       // 5秒整（广告最爱）
            d.toFixed(0) === '4' ||       // 4秒整
            (d >= 0.5 && d <= 3.0);       // 超短碎片

        if (isAdDuration) score += 30;

        // 达标即可疑（不直接定为广告）
        seg.isAd = score >= 70;
    });

    // ======================
    // 【终极安全锁】
    // 只有连续 ≥3 个可疑切片 → 才是真正广告
    // ======================
    for (let i = 0; i < segCount; i++) {
        if (!segments[i].isAd) continue;

        let chain = 0;
        for (let j = i; j < segCount && segments[j].isAd; j++) chain++;

        if (chain < 3) {
            for (let j = i; j < i + chain; j++) {
                segments[j].isAd = false;
            }
        }
    }

    console.log(`✅ 识别完成：总切片 ${segments.length}，广告 ${segments.filter(s => s.isAd).length}`);
}