/*
 * m3u8 全自动去广告【终极融合版 v5】
 * 修复：禁用时长白名单，依赖分组检测和连续集群
*/
function cleanM3u8(url, ref) {
    log('执行去广告');
    let json = JSON.parse(fetch(url, {headers:{referer: ref||url}, withStatusCode:true}));
    
    if(json.statusCode!=200){
        return url;
    }
    let m3u8Content = fixM3u8(url, json.body);
    //log(m3u8Content);
    let fixcontent = cleanM3u8RemoveAds(m3u8Content);
    //log(fixcontent);
    let playurl = "hiker://files/_cache/"+md5(url)+".m3u8";
    writeFile(playurl, fixcontent);
    return getPath(playurl)+"##"+input;
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

    // 步骤1：基础广告识别（不使用时长白名单）
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
 * 安全版广告识别：不使用时长白名单，仅依赖文件名、目录、跨域、极短时长
 */
function markAdsUltraSafe(segments) {
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
    let threshold = Math.max(2, Math.floor(segCount * 0.05));

    segments.forEach((seg, idx) => {
        let score = 0;
        let name = seg.filename;
        let d = seg.duration;

        // 文件名异常
        let lenDelta = Math.abs(name.length - avgNameLength);
        if (lenDelta > 8) score += 35;
        if (!isHexNormal(name)) score += 40;

        // 时长波动（与前后对比）
        let prev = segments[idx > 0 ? idx - 1 : 0];
        let next = segments[idx < segCount - 1 ? idx + 1 : idx];
        let durDeltaPrev = Math.abs(d - prev.duration);
        let durDeltaNext = Math.abs(d - next.duration);
        // 如果与前后时长差异都很大，则有广告嫌疑
        if (durDeltaPrev > 2.0 && durDeltaNext > 2.0) score += 30;

        // 广告典型时长（5s 或 极短）
        if (d.toFixed(0) === '5') score += 40;
        
        // 极短时长强惩罚（<1秒）
        if (d < 1.0) {
            score += 80;
        } else if (d >= 1.0 && d <= 3.0) {
            score += 30;
        }

        // 目录不是主目录
        if (seg.dirPath !== mainDir && pathCount[seg.dirPath] < threshold) score += 50;

        // 跨域
        if (seg.domain !== mainDomain) score += 60;

        // 降低阈值到60，更容易标记
        seg.isAd = score >= 60;
    });
}

/**
 * 分组检测
 */
function groupCleanByDiscontinuityAdvanced(segments, discontinuityPositions, lines) {
    if (segments.length === 0) return;

    // 获取正片主时长（仅用于日志和组保护）
    let durCount = {};
    for (let seg of segments) {
        let key = seg.duration.toFixed(3);
        durCount[key] = (durCount[key] || 0) + 1;
    }
    let sortedDurs = Object.entries(durCount).sort((a, b) => b[1] - a[1]);
    let mainDuration = sortedDurs.length > 0 ? parseFloat(sortedDurs[0][0]) : 0;
    let mainRatio = sortedDurs.length > 0 ? sortedDurs[0][1] / segments.length : 0;
    log(`主时长: ${mainDuration}s, 占比: ${(mainRatio*100).toFixed(1)}%`);

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
    let groupHasLong = new Array(totalGroups).fill(false);
    let groupMainDurCount = new Array(totalGroups).fill(0);

    for (let i = 0; i < segments.length; i++) {
        let g = groupIds[i];
        let d = segments[i].duration;
        groupTotalDur[g] += d;
        groupSegCount[g]++;
        if (d < 0.5) groupHasVeryShort[g] = true;
        if (d > 15.0) groupHasLong[g] = true;
        if (Math.abs(d - mainDuration) <= 0.05) groupMainDurCount[g]++;
    }

    // 输出分组信息
    for (let g = 0; g < totalGroups; g++) {
        let mainRatioGroup = groupMainDurCount[g] / groupSegCount[g];
        log(`组 ${g}: 时长=${groupTotalDur[g].toFixed(2)}s, 切片=${groupSegCount[g]}, 主时长比=${(mainRatioGroup*100).toFixed(0)}%, 极短=${groupHasVeryShort[g]}`);
    }

    // 标记广告组
    for (let i = 0; i < segments.length; i++) {
        let g = groupIds[i];
        let isAdGroup = false;
        
        // 正片保护：大组（切片>50）且主时长占比>30% → 保护
        if (groupSegCount[g] > 50 && groupMainDurCount[g] / groupSegCount[g] > 0.3) {
            continue;
        }

        // 规则1：极短切片 + 总时长 < 10s
        if (groupHasVeryShort[g] && groupTotalDur[g] < 10.0) {
            isAdGroup = true;
            log(`组 ${g}: 触发规则1`);
        }
        // 规则2：总时长 12~45秒，切片数 3~15
        else if (groupTotalDur[g] >= 12 && groupTotalDur[g] <= 45 && groupSegCount[g] >= 3 && groupSegCount[g] <= 15) {
            let veryShortCount = 0;
            for (let j = 0; j < segments.length; j++) {
                if (groupIds[j] === g && segments[j].duration < 1.0) veryShortCount++;
            }
            let veryShortRatio = veryShortCount / groupSegCount[g];
            if (veryShortRatio > 0.3) {
                isAdGroup = true;
                log(`组 ${g}: 触发规则2 (极短比=${veryShortRatio.toFixed(2)})`);
            }
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