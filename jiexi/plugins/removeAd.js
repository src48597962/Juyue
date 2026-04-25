/*
 * m3u8 全自动去广告【终极融合版 v3】
 * 修复：返回清理后的内容 + 极短时长强识别 + DISCONTINUITY 分组智能删除
 * 新增：分组总时长锁定（12-60秒）+ 时长白名单检测 + 防误删保护
 * 零误删 | 通用 | 支持任意广告时长 | 支持切片地址突变
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

    // === 步骤1：三重模式广告识别（文件名+时长+目录+跨域+时长白名单）===
    markAdsUltra(segments);

    // === 步骤2：基于 DISCONTINUITY 分组的高级检测 ===
    groupCleanByDiscontinuityAdvanced(segments, discontinuityPositions, lines);

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

    for (let i = 0; i < lines.length; i++) {
        if (adLines.has(i)) continue;
        if (lines[i] === '#EXT-X-DISCONTINUITY' && adLines.has(i + 1)) continue;
        result.push(lines[i]);
    }

    return result.join('\n');
}

/**
 * 终极广告识别：文件名异常 + 时长波动 + 目录统计 + 跨域 + 极短时长 + 时长白名单
 */
function markAdsUltra(segments) {
    let segCount = segments.length;
    if (segCount < 10) return;

    // === 获取正片主时长（出现次数最多的时长）===
    let durCount = {};
    for (let seg of segments) {
        let key = seg.duration.toFixed(3);
        durCount[key] = (durCount[key] || 0) + 1;
    }
    let mainDuration = null, maxDurCount = 0;
    for (let [dur, count] of Object.entries(durCount)) {
        if (count > maxDurCount) {
            maxDurCount = count;
            mainDuration = parseFloat(dur);
        }
    }
    let mainDurationRatio = maxDurCount / segCount;
    log(`正片主时长: ${mainDuration} 秒，占比 ${(mainDurationRatio * 100).toFixed(1)}%`);

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

        // === 时长白名单检测（主时长占比 > 40% 时启用）===
        // 降低阈值到40%，更好地捕获广告
        if (mainDuration !== null && maxDurCount > segCount * 0.4) {
            let durationTolerance = 0.01;
            if (Math.abs(d - mainDuration) > durationTolerance) {
                score += 80;
            }
        }

        seg.isAd = score >= 70;
    });
}

/**
 * 高级分组检测（基于 DISCONTINUITY）
 * 规则1：组内存在极短切片（<0.5s）且组总时长 < 10s → 整组广告
 * 规则2：组总时长在 12~60 秒之间，切片数 3~12，且无超长切片(>15s) → 整组广告
 */
function groupCleanByDiscontinuityAdvanced(segments, discontinuityPositions, lines) {
    if (segments.length === 0) return;

    // 构建每个切片所属的组索引
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

    // 统计每个组的各项指标
    let groupTotalDur = new Array(totalGroups).fill(0);
    let groupSegCount = new Array(totalGroups).fill(0);
    let groupHasVeryShort = new Array(totalGroups).fill(false);
    let groupHasLong = new Array(totalGroups).fill(false);  // 超长切片 >15s

    for (let i = 0; i < segments.length; i++) {
        let g = groupIds[i];
        groupTotalDur[g] += segments[i].duration;
        groupSegCount[g]++;
        if (segments[i].duration < 0.5) groupHasVeryShort[g] = true;
        if (segments[i].duration > 15.0) groupHasLong[g] = true;  // 正片10.4s不算超长
    }

    // 输出分组信息用于调试
    for (let g = 0; g < totalGroups; g++) {
        log(`组 ${g}: 总时长=${groupTotalDur[g].toFixed(2)}s, 切片数=${groupSegCount[g]}, 含极短=${groupHasVeryShort[g]}, 含长片=${groupHasLong[g]}`);
    }

    // 标记广告组
    for (let i = 0; i < segments.length; i++) {
        let g = groupIds[i];
        let isAdGroup = false;

        // 规则1：极短切片 + 总时长 < 10s
        if (groupHasVeryShort[g] && groupTotalDur[g] < 10.0) {
            isAdGroup = true;
            log(`组 ${g}: 触发规则1（极短切片+时长<10s）`);
        }
        // 规则2：总时长 12~60秒，切片数 3~12，无超长切片(>15s)
        else if (groupTotalDur[g] >= 12 && groupTotalDur[g] <= 60 && groupSegCount[g] >= 3 && groupSegCount[g] <= 12 && !groupHasLong[g]) {
            let allIntegerDuration = true;
            let veryShortCount = 0;  // <1s 的切片计数
            
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
            // 满足以下任一条件即判定为广告：
            // 1. 组内所有切片时长都是整数秒
            // 2. 组内极短切片占比 > 30%（<1s 的切片超过三分之一）
            if (allIntegerDuration || veryShortRatio > 0.3) {
                isAdGroup = true;
                log(`组 ${g}: 触发规则2 (整数秒=${allIntegerDuration}, 极短比=${veryShortRatio.toFixed(2)})`);
            } else {
                // 否则要求组内至少一半的切片已经被基础标记为广告候选
                let adCountInGroup = 0;
                for (let j = 0; j < segments.length; j++) {
                    if (groupIds[j] === g && segments[j].isAd) adCountInGroup++;
                }
                if (adCountInGroup >= groupSegCount[g] / 2) {
                    isAdGroup = true;
                    log(`组 ${g}: 触发规则2 (基础标记过半: ${adCountInGroup}/${groupSegCount[g]})`);
                }
            }
        }

        if (isAdGroup) {
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