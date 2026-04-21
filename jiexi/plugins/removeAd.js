/*
 * m3u8 全自动去广告【终极融合版】
 * 零误删 | 通用 | 支持任意广告时长 | 支持切片地址突变 | 目录统计+跨域+双模式三重识别
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

            // 解析完整地址、目录、域名（来自顶级AdFilter）
            let fullPath = tsLine.startsWith('http') ? tsLine : urlPath + tsLine;
            segments.push({
                infLine: i,
                tsLine: i + 1,
                duration: parseFloat(line.replace('#EXTINF:', '').replace(',', '')),
                filename: tsLine.split('?')[0].split('/').pop(),
                fullPath: fullPath,
                dirPath: getDirPath(fullPath),    // 目录路径
                domain: getDomain(fullPath),      // 域名
                isAd: false
            });
        }
    }

    // === 核心：三重模式广告识别（文件名+时长+目录路径+跨域）===
    markAdsUltra(segments);

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
        if (lines[i] === '#EXT-X-DISCONTINUITY' && adLines.has(i + 1)) continue;

        if(lines[i].includes('.ts') && !lines[i].startsWith('http')){
            lines[i] = urlPath + lines[i];
        }
        result.push(lines[i]);
    }

    return result.join('\n');
}

/**
 * 【终极广告识别：三重检测】
 * 1. 原：文件名异常 + 时长波动
 * 2. 新增：路径统计（出现最多=正片）
 * 3. 新增：跨域直接判定广告
 * 最终：连续≥3个才删除，零误删
 */
function markAdsUltra(segments) {
    let segCount = segments.length;
    if (segCount < 10) return;

    // ======================
    // 规则1：原有双模式（文件名 + 时长）
    // ======================
    let sampleSize = Math.max(8, Math.floor(segCount * 0.2));
    let sample = segments.slice(0, sampleSize);
    let avgNameLength = sample.map(s => s.filename.length).reduce((a, b) => a + b, 0) / sampleSize;
    let isHexNormal = name => /^[0-9a-f]{30,40}/.test(name);

    // ======================
    // 规则2：目录路径统计（来自顶级AdFilter核心）
    // ======================
    let pathCount = {};
    segments.forEach(s => pathCount[s.dirPath] = (pathCount[s.dirPath] || 0) + 1);

    // 出现次数最多的目录 = 正片主目录
    let mainDir = null, maxCount = 0;
    for (let p in pathCount) {
        if (pathCount[p] > maxCount) { maxCount = pathCount[p]; mainDir = p; }
    }

    // 主域名
    let mainDomain = segments.length > 0 ? segments[0].domain : '';
    let threshold = Math.max(2, Math.floor(segCount.length * 0.05));

    // ======================
    // 综合评分
    // ======================
    segments.forEach((seg, idx) => {
        let score = 0;
        let name = seg.filename;
        let d = seg.duration;

        // 原：文件名异常
        let lenDelta = Math.abs(name.length - avgNameLength);
        if (lenDelta > 8) score += 35;
        if (!isHexNormal(name)) score += 40;

        // 原：时长波动
        let prev = segments[idx > 0 ? idx - 1 : 0];
        let durDelta = Math.abs(seg.duration - prev.duration);
        if (durDelta > 2.0) score += 25;

        // 原：广告典型时长
        const isAdDuration = d.toFixed(0) === '5' || d.toFixed(0) === '4' || (d >= 0.5 && d <= 3.0);
        if (isAdDuration) score += 30;

        // 新增：目录不是主目录 + 数量少
        if (seg.dirPath !== mainDir && pathCount[seg.dirPath] < threshold) score += 50;

        // 新增：跨域直接判定强广告
        if (seg.domain !== mainDomain) score += 60;

        // 达标即可疑
        seg.isAd = score >= 70;
    });

    // ======================
    // 终极安全锁：连续≥3个才判定广告
    // ======================
    for (let i = 0; i < segCount; i++) {
        if (!segments[i].isAd) continue;
        let chain = 0;
        for (let j = i; j < segCount && segments[j].isAd; j++) chain++;
        if (chain < 3) {
            for (let j = i; j < i + chain; j++) segments[j].isAd = false;
        }
    }

    log(`✅ 识别完成：总切片 ${segments.length}，广告 ${segments.filter(s => s.isAd).length}`);
}

// ======================
// 工具函数（从顶级AdFilter提取）
// ======================
function getDirPath(url) {
    try {
        let clean = url.split('?')[0];
        let last = clean.lastIndexOf('/');
        if (last <= 0) return clean;
        return clean.substring(0, last);
    } catch(e) { return ''; }
}
function getDomain(url) {
    try {
        let m = url.match(/^(https?:\/\/[^\/]+)/);
        return m ? m[1] : '';
    } catch(e) { return ''; }
}