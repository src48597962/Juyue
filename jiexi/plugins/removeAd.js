/*
 * m3u8 全自动去广告【终极融合版 v6】
 * 兜底逻辑：如果正片时长高度一致，则不删除任何切片
                    //require(config.聚阅.replace(/[^/]*$/,'') + 'jiexi/plugins/removeAd.js');
                    //return cleanM3u8($.require("parseUrl").解析(url), input);
*/
function cleanM3u8(url, ref) {
    log('执行去广告');
    let json = JSON.parse(fetch(url, {headers:{referer: ref||url}, withStatusCode:true}));
    
    if(json.statusCode!=200){
        return url;
    }
    let strs = json.body.split('\n');
    if(strs.length<10 && json.body.includes('.m3u8')){
        strs.forEach(it=>{
            if(it.includes('.m3u8')){
                if(!it.startsWith('http')){
                    it = getHome(url) + it;
                    log(it);
                    json = JSON.parse(fetch(it, {headers:{referer: ref||it}, withStatusCode:true}));
                }
            }
        })
    }
    let m3u8Content = fixM3u8(url, json.body);
    log(m3u8Content);
    let fixcontent = cleanM3u8RemoveAds(m3u8Content);
    log(fixcontent);
    let playurl = "hiker://files/_cache/"+md5(url)+".m3u8";
    writeFile(playurl, fixcontent);
    return getPath(playurl);
}

function cleanM3u8RemoveAds(m3u8Content) {
    if (!m3u8Content || typeof m3u8Content !== 'string') return m3u8Content;

    let lines = m3u8Content.split('\n').map(line => line.trim());
    let result = [];

    let totalSegments = lines.filter(l => l.includes('.ts')||l.includes('.png')).length;
    if (totalSegments < 10) {
        log('✅ 切片过少，不执行广告清理');
        return m3u8Content;
    }

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
                dirPath: getDirPath(tsLine),
                domain: getDomain(tsLine),
                isAd: false
            });
        }
    }

    // ========== 兜底逻辑：检查时长一致性 ==========
    let durCount = {};
    for (let seg of segments) {
        let key = seg.duration.toFixed(3);
        durCount[key] = (durCount[key] || 0) + 1;
    }
    let sortedDurs = Object.entries(durCount).sort((a, b) => b[1] - a[1]);
    let mainDuration = sortedDurs.length > 0 ? parseFloat(sortedDurs[0][0]) : 0;
    let mainDurationPercent = sortedDurs.length > 0 ? (sortedDurs[0][1] / segments.length) * 100 : 0;
    
    log(`主时长: ${mainDuration}s, 占比: ${mainDurationPercent.toFixed(1)}%`);
    
    // 如果超过 70% 的切片是同一个时长，说明正片时长高度一致，不执行任何广告删除
    if (mainDurationPercent > 70) {
        log('✅ 正片时长高度一致（超过70%切片相同时长），跳过广告检测，保留全部内容');
        return m3u8Content;
    }
    
    // 如果超过 80% 的切片时长都在 [主时长-0.1, 主时长+0.1] 范围内，也跳过
    let similarCount = 0;
    for (let seg of segments) {
        if (Math.abs(seg.duration - mainDuration) <= 0.1) similarCount++;
    }
    if (similarCount / segments.length > 0.8) {
        log('✅ 正片时长高度相似（80%切片时长接近主时长），跳过广告检测，保留全部内容');
        return m3u8Content;
    }

    // 只有时长多样化时才执行广告检测
    log('⚠️ 检测到多种时长，执行广告检测');

    // 步骤1：基础广告识别
    markAdsUltraSafe(segments);

    // 步骤2：分组检测
    groupCleanByDiscontinuityAdvanced(segments, discontinuityPositions, lines);

    // 步骤3：连续集群安全锁
    applyContinuitySafetyLock(segments);

    let adLines = new Set();
    segments.forEach(s => {
        if (s.isAd) {
            adLines.add(s.infLine);
            adLines.add(s.tsLine);
        }
    });

    for (let i = 0; i < lines.length; i++) {
        if (adLines.has(i)) continue;
        if (lines[i] === '#EXT-X-DISCONTINUITY' && adLines.has(i + 1)) continue;
        result.push(lines[i]);
    }

    return result.join('\n');
}

/**
 * 广告识别
 */
function markAdsUltraSafe(segments) {
    let segCount = segments.length;
    if (segCount < 10) return;

    // 统计正片样本
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
    let threshold = Math.max(2, Math.floor(segCount * 0.05));

    segments.forEach((seg, idx) => {
        let score = 0;
        let name = seg.filename;
        let d = seg.duration;

        // 文件名异常（严格十六进制判断）
        let isValidHex = /^[0-9a-f]{32}$/.test(name);
        if (!isValidHex) score += 50;

        // 时长波动（需要大于一定阈值）
        let prev = segments[idx > 0 ? idx - 1 : 0];
        let next = segments[idx < segCount - 1 ? idx + 1 : idx];
        let durDeltaPrev = Math.abs(d - prev.duration);
        let durDeltaNext = Math.abs(d - next.duration);
        // 如果与前后时长差异都大于 1 秒
        if (durDeltaPrev > 1.0 && durDeltaNext > 1.0) score += 30;

        // 极短时长（<1秒）强惩罚
        if (d < 1.0) {
            score += 80;
        }

        // 目录不是主目录
        if (seg.dirPath !== mainDir && pathCount[seg.dirPath] < threshold) score += 50;

        // 跨域
        if (seg.domain !== mainDomain) score += 60;

        // 阈值提高到 80，更难触发
        seg.isAd = score >= 80;
    });
}

/**
 * 分组检测
 */
function groupCleanByDiscontinuityAdvanced(segments, discontinuityPositions, lines) {
    if (segments.length === 0) return;

    // 构建组索引
    let groupIds = new Array(segments.length).fill(0);
    let groupIdx = 0;
    let discLineSet = new Set(discontinuityPositions);
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
    let totalGroups = groupIdx + 1;

    // 统计每个组的指标
    let groupTotalDur = new Array(totalGroups).fill(0);
    let groupSegCount = new Array(totalGroups).fill(0);
    let groupHasVeryShort = new Array(totalGroups).fill(false);

    for (let i = 0; i < segments.length; i++) {
        let g = groupIds[i];
        let d = segments[i].duration;
        groupTotalDur[g] += d;
        groupSegCount[g]++;
        if (d < 0.5) groupHasVeryShort[g] = true;
    }

    // 标记广告组
    for (let i = 0; i < segments.length; i++) {
        let g = groupIds[i];
        let isAdGroup = false;
        
        // 规则：极短切片 + 总时长 < 10s，且组切片数 >= 3
        if (groupHasVeryShort[g] && groupTotalDur[g] < 10.0 && groupSegCount[g] >= 3) {
            isAdGroup = true;
            log(`组 ${g}: 触发分组删除 (时长=${groupTotalDur[g].toFixed(2)}s, 切片=${groupSegCount[g]})`);
        }

        if (isAdGroup) {
            segments[i].isAd = true;
        }
    }
}

/**
 * 连续集群安全锁：需要连续 ≥3 个才删除
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
            // 连续广告必须达到 3 个才删除
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