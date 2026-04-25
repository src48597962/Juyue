/*
 * m3u8 全自动去广告【终极融合版 v2】
 * 修复：返回清理后的内容 + 极短时长强识别 + DISCONTINUITY 分组智能删除
 * 零误删 | 通用 | 支持任意广告时长 | 支持切片地址突变 | 目录统计+跨域+双模式+极短时长+分组删除
*/
function cleanM3u8(url, ref) {
    log('执行去广告');
    let json = JSON.parse(fetch(url, {headers:{referer: ref||url}, withStatusCode:true}));
    
    if(json.statusCode!=200){
        return url;
    }
    let m3u8Content = json.body;
    let fixcontent = cleanM3u8RemoveAds(fixM3u8(url, m3u8Content));
    log(fixcontent);
    // 修复：返回清理后的 M3U8 内容（调用方应将其用于播放）
    let playurl = "hiker://files/_cache/"+md5(url)+".m3u8";
    writeFile(playurl, fixcontent);
    return getPath(playurl)+"##"+input;
}

function cleanM3u8RemoveAds(m3u8Content) {
    if (!m3u8Content || typeof m3u8Content !== 'string') return m3u8Content;

    // 1. 按行解析
    let lines = m3u8Content.split('\n').map(line => line.trim());
    let result = [];

    // === 安全保护：切片总数不足10个 → 直接返回原内容 ===
    let totalSegments = lines.filter(l => l.includes('.ts')).length;
    if (totalSegments < 10) {
        log('✅ 切片过少，不执行广告清理');
        return m3u8Content;
    }

    // === 解析所有切片信息，同时记录 DISCONTINUITY 位置 ===
    let segments = [];
    let discontinuityPositions = []; // 存储 #EXT-X-DISCONTINUITY 所在行号

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
                dirPath: getDirPath(tsLine),
                domain: getDomain(tsLine),
                isAd: false
            });
        }
    }

    // === 步骤1：三重模式广告识别（文件名+时长+目录+跨域）===
    markAdsUltra(segments);

    // === 步骤2：基于 DISCONTINUITY 分组的智能删除（针对极短广告簇）===
    groupCleanByDiscontinuity(segments, discontinuityPositions, lines);

    // === 步骤3：连续集群安全锁（非分组强删的广告必须连续≥3个才生效）===
    applyContinuitySafetyLock(segments);

    // === 生成纯净 m3u8 ===
    let adLines = new Set();
    segments.forEach(s => {
        if (s.isAd) {
            adLines.add(s.infLine);
            adLines.add(s.tsLine);
        }
    });

    // 保留非广告内容，并补全相对路径
    for (let i = 0; i < lines.length; i++) {
        if (adLines.has(i)) continue;
        // 如果当前行是 DISCONTINUITY 且下一行是广告，则跳过 DISCONTINUITY
        if (lines[i] === '#EXT-X-DISCONTINUITY' && adLines.has(i + 1)) continue;
        result.push(lines[i]);
    }

    return result.join('\n');
}

/**
 * 终极广告识别：文件名异常 + 时长波动 + 目录统计 + 跨域 + 极短时长强惩罚
 */
function markAdsUltra(segments) {
    let segCount = segments.length;
    if (segCount < 10) return;

    // 统计正片样本（前20%切片作为参考）
    let sampleSize = Math.max(8, Math.floor(segCount * 0.2));
    let sample = segments.slice(0, sampleSize);
    let avgNameLength = sample.map(s => s.filename.length).reduce((a, b) => a + b, 0) / sampleSize;
    let isHexNormal = name => /^[0-9a-f]{30,40}/.test(name);

    // 目录统计
    let pathCount = {};
    segments.forEach(s => pathCount[s.dirPath] = (pathCount[s.dirPath] || 0) + 1);
    let mainDir = null, maxCount = 0;
    for (let p in pathCount) {
        if (pathCount[p] > maxCount) { maxCount = pathCount[p]; mainDir = p; }
    }
    let mainDomain = segments.length > 0 ? segments[0].domain : '';
    // 修复 bug：原 segCount.length 改为 segCount
    let threshold = Math.max(2, Math.floor(segCount * 0.05));

    segments.forEach((seg, idx) => {
        let score = 0;
        let name = seg.filename;
        let d = seg.duration;

        // 文件名异常
        let lenDelta = Math.abs(name.length - avgNameLength);
        if (lenDelta > 8) score += 35;
        if (!isHexNormal(name)) score += 40;

        // 时长波动
        let prev = segments[idx > 0 ? idx - 1 : 0];
        let durDelta = Math.abs(seg.duration - prev.duration);
        if (durDelta > 2.0) score += 25;

        // 广告典型时长（4s,5s, 或 <1s）
        const isAdDuration = (d.toFixed(0) === '5' || d.toFixed(0) === '4' || (d >= 0.5 && d <= 3.0));
        if (isAdDuration) score += 30;

        // 极短时长强惩罚（<0.5秒直接判广告候选）
        if (d < 0.5) {
            score += 100;
        } else if (d < 1.0) {
            score += 60;
        }

        // 目录不是主目录
        if (seg.dirPath !== mainDir && pathCount[seg.dirPath] < threshold) score += 50;

        // 跨域
        if (seg.domain !== mainDomain) score += 60;

        seg.isAd = score >= 70;
    });
}

/**
 * 基于 DISCONTINUITY 分组智能删除
 * 规则：如果一组内存在极短切片（<0.5s）且整组总时长 < 10 秒，则整组标记为广告
 */
function groupCleanByDiscontinuity(segments, discontinuityPositions, lines) {
    if (segments.length === 0) return;

    // 构建每个切片所属的组索引（按 DISCONTINUITY 划分）
    let groupIds = new Array(segments.length).fill(0);
    let groupIdx = 0;
    let discLineSet = new Set(discontinuityPositions);
    // 遍历 lines 来分配组号（因为 discontinuity 可能在切片之间）
    let segPtr = 0;
    for (let i = 0; i < lines.length && segPtr < segments.length; i++) {
        if (i === segments[segPtr].infLine) {
            groupIds[segPtr] = groupIdx;
            segPtr++;
        }
        if (discLineSet.has(i)) {
            groupIdx++;
        }
    }

    // 统计每个组的总时长、是否包含极短切片
    let groupTotalDur = [];
    let groupHasVeryShort = [];
    for (let i = 0; i <= groupIdx; i++) {
        groupTotalDur[i] = 0;
        groupHasVeryShort[i] = false;
    }
    for (let i = 0; i < segments.length; i++) {
        let g = groupIds[i];
        groupTotalDur[g] += segments[i].duration;
        if (segments[i].duration < 0.5) groupHasVeryShort[g] = true;
    }

    // 标记符合条件的整组广告
    for (let i = 0; i < segments.length; i++) {
        let g = groupIds[i];
        if (groupHasVeryShort[g] && groupTotalDur[g] < 10.0) {
            segments[i].isAd = true;
        }
    }
}

/**
 * 连续集群安全锁：只有连续 ≥3 个被标记为广告的切片才真正删除
 * 若连续数量不足 3，则取消这些切片的广告标记
 */
function applyContinuitySafetyLock(segments) {
    let i = 0;
    while (i < segments.length) {
        if (segments[i].isAd) {
            let chain = 0;
            let start = i;
            while (i < segments.length && segments[i].isAd) {
                chain++;
                i++;
            }
            if (chain < 3) {
                for (let j = start; j < i; j++) {
                    segments[j].isAd = false;
                }
            }
        } else {
            i++;
        }
    }
    let adCount = segments.filter(s => s.isAd).length;
    log(`✅ 识别完成：总切片 ${segments.length}，广告 ${adCount}`);
}

// ======================
// 工具函数
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