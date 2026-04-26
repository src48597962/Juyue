/*
 * m3u8 全自动去广告【终极融合版 v4】
 * 修复：正片误删问题 + 增加正片保护机制
 * 优化：提高检测门槛，降低误判率
*/
function cleanM3u8(url, ref) {
    log('执行去广告');
    let json = JSON.parse(fetch(url, {headers:{referer: ref||url}, withStatusCode:true}));
    
    if(json.statusCode!=200){
        return url;
    }
    let m3u8Content = fixM3u8(url, json.body);
    log(m3u8Content);
    let fixcontent = cleanM3u8RemoveAds(m3u8Content);
    log(fixcontent);
    let playurl = "hiker://files/_cache/"+md5(url)+".m3u8";
    writeFile(playurl, fixcontent);
    return getPath(playurl)+"#isVideo=true###"+input;
}

function cleanM3u8RemoveAds(m3u8Content) {
    if (!m3u8Content || typeof m3u8Content !== 'string') return m3u8Content;

    let lines = m3u8Content.split('\n').map(line => line.trim());
    let result = [];

    let totalSegments = lines.filter(l => l.includes('.ts')).length;
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

    // 步骤1：基础广告识别
    markAdsUltra(segments);

    // 步骤2：分组检测（带正片保护）
    groupCleanByDiscontinuityAdvanced(segments, discontinuityPositions, lines);

    // 步骤3：连续集群安全锁
    applyContinuitySafetyLock(segments);

    // 生成纯净 m3u8
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
 * 广告识别：文件名异常 + 时长波动 + 目录统计 + 跨域 + 极短时长
 * 优化：降低误判，提高正片保护
 */
function markAdsUltra(segments) {
    let segCount = segments.length;
    if (segCount < 10) return;

    // 获取正片主时长（出现次数最多的时长）
    let durCount = {};
    for (let seg of segments) {
        let key = seg.duration.toFixed(3);
        durCount[key] = (durCount[key] || 0) + 1;
    }
    
    // 按出现次数排序，取前2个主时长（可能有多种正片时长）
    let sortedDurs = Object.entries(durCount).sort((a, b) => b[1] - a[1]);
    let mainDuration = parseFloat(sortedDurs[0][0]);
    let mainDurationCount = sortedDurs[0][1];
    let mainDurationRatio = mainDurationCount / segCount;
    
    let secondDuration = sortedDurs.length > 1 ? parseFloat(sortedDurs[1][0]) : null;
    let secondDurationRatio = sortedDurs.length > 1 ? sortedDurs[1][1] / segCount : 0;
    
    log(`主时长: ${mainDuration} 秒 (占比 ${(mainDurationRatio * 100).toFixed(1)}%)`);
    if (secondDuration) {
        log(`次时长: ${secondDuration} 秒 (占比 ${(secondDurationRatio * 100).toFixed(1)}%)`);
    }

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

        // 文件名异常
        let lenDelta = Math.abs(name.length - avgNameLength);
        if (lenDelta > 8) score += 35;
        if (!isHexNormal(name)) score += 40;

        // 时长波动
        let prev = segments[idx > 0 ? idx - 1 : 0];
        let durDelta = Math.abs(seg.duration - prev.duration);
        if (durDelta > 2.0) score += 25;

        // 广告典型时长（4s,5s, 或 0.5-3s）
        const isAdDuration = (d.toFixed(0) === '5' || d.toFixed(0) === '4' || (d >= 0.5 && d <= 3.0));
        if (isAdDuration) score += 30;

        // 极短时长强惩罚
        if (d < 0.5) {
            score += 100;
        } else if (d < 1.0) {
            score += 60;
        }

        // 目录不是主目录
        if (seg.dirPath !== mainDir && pathCount[seg.dirPath] < threshold) score += 50;

        // 跨域
        if (seg.domain !== mainDomain) score += 60;

        // === 优化：提高白名单门槛，只有主时长占比超过55%才启用 ===
        // 同时允许次时长（如片头片尾的不同时长）作为正片保护
        let isMainDuration = Math.abs(d - mainDuration) <= 0.01;
        let isSecondDuration = secondDuration && Math.abs(d - secondDuration) <= 0.01;
        
        if (mainDurationRatio > 0.55) {
            // 主时长占绝对主导时，非主时长且非次时长的切片罚分
            if (!isMainDuration && !isSecondDuration) {
                score += 70;
            }
        } else if (mainDurationRatio > 0.4) {
            // 主时长较占优时，仅非主时长罚分（允许次时长通过）
            if (!isMainDuration) {
                score += 50;
            }
        }

        seg.isAd = score >= 70;
    });
}

/**
 * 分组检测（带正片保护机制）
 * 规则1：极短切片 + 总时长 < 10s → 广告
 * 规则2：总时长 15~45秒，切片数 4~12，无超长切片(>15s) → 需进一步验证
 */
function groupCleanByDiscontinuityAdvanced(segments, discontinuityPositions, lines) {
    if (segments.length === 0) return;

    // 先获取正片主时长（用于组保护）
    let durCount = {};
    for (let seg of segments) {
        let key = seg.duration.toFixed(3);
        durCount[key] = (durCount[key] || 0) + 1;
    }
    let sortedDurs = Object.entries(durCount).sort((a, b) => b[1] - a[1]);
    let mainDuration = parseFloat(sortedDurs[0][0]);

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
    let groupMainDurCount = new Array(totalGroups).fill(0);  // 主时长切片数量

    for (let i = 0; i < segments.length; i++) {
        let g = groupIds[i];
        let d = segments[i].duration;
        groupTotalDur[g] += d;
        groupSegCount[g]++;
        if (d < 0.5) groupHasVeryShort[g] = true;
        if (d > 15.0) groupHasLong[g] = true;
        if (Math.abs(d - mainDuration) <= 0.01) groupMainDurCount[g]++;
    }

    // 输出分组信息
    for (let g = 0; g < totalGroups; g++) {
        let mainRatio = groupMainDurCount[g] / groupSegCount[g];
        log(`组 ${g}: 时长=${groupTotalDur[g].toFixed(2)}s, 切片=${groupSegCount[g]}, 主时长比=${(mainRatio*100).toFixed(0)}%, 极短=${groupHasVeryShort[g]}, 长片=${groupHasLong[g]}`);
    }

    // 标记广告组
    for (let i = 0; i < segments.length; i++) {
        let g = groupIds[i];
        let isAdGroup = false;
        
        // === 正片保护：如果组内超过60%的切片是主时长，则不是广告 ===
        let mainRatio = groupMainDurCount[g] / groupSegCount[g];
        if (mainRatio > 0.6) {
            continue;  // 保护这个组，不标记为广告
        }

        // 规则1：极短切片 + 总时长 < 10s
        if (groupHasVeryShort[g] && groupTotalDur[g] < 10.0) {
            isAdGroup = true;
            log(`组 ${g}: 触发规则1`);
        }
        // 规则2：总时长 15~45秒（缩小范围，避免误伤），切片数 4~12
        else if (groupTotalDur[g] >= 15 && groupTotalDur[g] <= 45 && groupSegCount[g] >= 4 && groupSegCount[g] <= 12 && !groupHasLong[g]) {
            // 额外检查：主时长占比不能太高（已经保护过了）
            let allIntegerDuration = true;
            let veryShortCount = 0;
            
            for (let j = 0; j < segments.length; j++) {
                if (groupIds[j] === g) {
                    let dur = segments[j].duration;
                    if (dur < 1.0) veryShortCount++;
                    if (Math.abs(dur - Math.round(dur)) > 0.01) {
                        allIntegerDuration = false;
                    }
                }
            }
            
            let veryShortRatio = veryShortCount / groupSegCount[g];
            if (allIntegerDuration || veryShortRatio > 0.4) {  // 极短比提高到40%
                isAdGroup = true;
                log(`组 ${g}: 触发规则2 (整数秒=${allIntegerDuration}, 极短比=${veryShortRatio.toFixed(2)})`);
            } else {
                let adCountInGroup = 0;
                for (let j = 0; j < segments.length; j++) {
                    if (groupIds[j] === g && segments[j].isAd) adCountInGroup++;
                }
                if (adCountInGroup >= groupSegCount[g] * 0.6) {  // 提高到60%
                    isAdGroup = true;
                    log(`组 ${g}: 触发规则2 (基础标记过半)`);
                }
            }
        }

        if (isAdGroup) {
            segments[i].isAd = true;
        }
    }
}

/**
 * 连续集群安全锁：需要连续 ≥4 个才删除（更严格）
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
            if (chain < 4) {  // 从3改为4，更严格
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