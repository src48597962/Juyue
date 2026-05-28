/*
 * m3u8 全自动去广告【终极融合版 v7】
 * 优化：域名/路径差异检测前置，提升准确率
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
    //log(m3u8Content);
    let fixcontent = cleanM3u8RemoveAds(m3u8Content);
    //log(fixcontent);
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

    // ========== 第一步：域名和路径快速检测（前置） ==========
    markAdsByPathAndDomain(segments);
    
    // 检查是否已经标记了足够的广告
    let markedCount = segments.filter(s => s.isAd).length;
    if (markedCount > 0) {
        log(`🔍 路径/域名检测标记了 ${markedCount} 个潜在广告切片`);
    }

    // ========== 第二步：兜底逻辑检查时长一致性 ==========
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

    // ========== 第三步：基础广告识别 ==========
    markAdsUltraSafe(segments);

    // ========== 第四步：分组检测 ==========
    groupCleanByDiscontinuityAdvanced(segments, discontinuityPositions, lines);

    // ========== 第五步：连续集群安全锁 ==========
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
 * 路径和域名快速检测（前置）
 */
function markAdsByPathAndDomain(segments) {
    if (segments.length < 3) return;

    // 统计所有域名
    let domainCount = {};
    segments.forEach(s => {
        let domain = s.domain || 'unknown';
        domainCount[domain] = (domainCount[domain] || 0) + 1;
    });

    // 统计所有目录
    let pathCount = {};
    segments.forEach(s => {
        let path = s.dirPath || 'unknown';
        pathCount[path] = (pathCount[path] || 0) + 1;
    });

    // 找到主要域名（占比最高的）
    let totalSegs = segments.length;
    let mainDomain = '';
    let maxDomainCount = 0;
    for (let d in domainCount) {
        if (domainCount[d] > maxDomainCount) {
            maxDomainCount = domainCount[d];
            mainDomain = d;
        }
    }

    // 找到主要路径
    let mainPath = '';
    let maxPathCount = 0;
    for (let p in pathCount) {
        if (pathCount[p] > maxPathCount) {
            maxPathCount = pathCount[p];
            mainPath = p;
        }
    }

    log(`主域名: ${mainDomain} (${maxDomainCount}/${totalSegs})`);
    log(`主路径: ${mainPath} (${maxPathCount}/${totalSegs})`);

    // 阈值：少于5%的域名或路径视为异常
    let domainThreshold = Math.max(2, Math.floor(totalSegs * 0.05));
    let pathThreshold = Math.max(2, Math.floor(totalSegs * 0.05));

    // 标记异常域名和路径的切片
    segments.forEach(seg => {
        let reasons = [];
        
        // 检查域名
        if (seg.domain !== mainDomain && domainCount[seg.domain] < domainThreshold) {
            reasons.push(`异常域名: ${seg.domain} (出现${domainCount[seg.domain]}次)`);
        }
        
        // 检查路径
        if (seg.dirPath !== mainPath && pathCount[seg.dirPath] < pathThreshold) {
            reasons.push(`异常路径: ${seg.dirPath} (出现${pathCount[seg.dirPath]}次)`);
        }

        // 检查文件命名模式
        let name = seg.filename;
        let isNumericTs = /^\d+\.ts$/.test(name); // 纯数字.ts
        let isHexTs = /^[0-9a-f]{32}\.ts$/.test(name); // 32位十六进制.ts
        
        // 如果主流是十六进制命名，但这个是其他格式
        let hexCount = segments.filter(s => /^[0-9a-f]{32}\.ts$/.test(s.filename)).length;
        if (hexCount > totalSegs * 0.7 && !isHexTs) {
            reasons.push(`命名模式异常: ${name}`);
        }

        // 标记为广告
        if (reasons.length > 0) {
            seg.isAd = true;
            log(`🔴 路径/域名检测标记: ${reasons.join(', ')}`);
        }
    });

    // 额外检查：如果某个路径下的切片全是连续的且数量很少，标记为广告
    let pathSegments = {};
    segments.forEach((seg, idx) => {
        if (!pathSegments[seg.dirPath]) {
            pathSegments[seg.dirPath] = [];
        }
        pathSegments[seg.dirPath].push(idx);
    });

    for (let path in pathSegments) {
        let indices = pathSegments[path];
        // 如果这个路径的切片数很少（< 总切片的5%）
        if (indices.length < totalSegs * 0.05 && path !== mainPath) {
            // 检查是否连续
            let isConsecutive = true;
            for (let i = 1; i < indices.length; i++) {
                if (indices[i] - indices[i-1] !== 1) {
                    isConsecutive = false;
                    break;
                }
            }
            if (isConsecutive) {
                indices.forEach(idx => {
                    if (!segments[idx].isAd) {
                        segments[idx].isAd = true;
                        log(`🔴 连续异路径广告块: ${path} (${indices.length}个切片)`);
                    }
                });
            }
        }
    }
}

/**
 * 广告识别（改进版）
 */
function markAdsUltraSafe(segments) {
    let segCount = segments.length;
    if (segCount < 10) return;

    // 统计正片样本
    let sampleSize = Math.max(8, Math.floor(segCount * 0.2));
    let sample = segments.slice(0, sampleSize);
    let avgDuration = sample.map(s => s.duration).reduce((a, b) => a + b, 0) / sampleSize;

    segments.forEach((seg, idx) => {
        if (seg.isAd) return; // 已经被路径/域名检测标记的跳过
        let score = 0;
        let d = seg.duration;

        // 极短时长（<0.8秒）强惩罚
        if (d < 0.8) {
            score += 80;
        }

        // 时长波动检测
        let prev = segments[idx > 0 ? idx - 1 : 0];
        let next = segments[idx < segCount - 1 ? idx + 1 : idx];
        let durDeltaPrev = Math.abs(d - prev.duration);
        let durDeltaNext = Math.abs(d - next.duration);
        
        // 如果与前后时长差异都大于 2 秒
        if (durDeltaPrev > 2.0 && durDeltaNext > 2.0) {
            score += 40;
        }
        
        // 如果与平均时长差异过大
        if (Math.abs(d - avgDuration) > avgDuration * 0.5) {
            score += 30;
        }

        // 阈值
        seg.isAd = score >= 80;
    });
}

/**
 * 分组检测
 */
function groupCleanByDiscontinuityAdvanced(segments, discontinuityPositions, lines) {
    if (segments.length === 0) return;

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
    let groupTotalDur = new Array(totalGroups).fill(0);
    let groupSegCount = new Array(totalGroups).fill(0);
    let groupHasVeryShort = new Array(totalGroups).fill(false);
    let groupAdCount = new Array(totalGroups).fill(0);

    for (let i = 0; i < segments.length; i++) {
        let g = groupIds[i];
        let d = segments[i].duration;
        groupTotalDur[g] += d;
        groupSegCount[g]++;
        if (d < 0.5) groupHasVeryShort[g] = true;
        if (segments[i].isAd) groupAdCount[g]++;
    }

    // 标记广告组
    for (let i = 0; i < segments.length; i++) {
        let g = groupIds[i];
        let isAdGroup = false;
        
        // 规则1：组内已有多个广告标记
        if (groupAdCount[g] >= 2 && groupSegCount[g] >= 3) {
            isAdGroup = true;
            log(`组 ${g}: 组内广告标记触发 (已标记${groupAdCount[g]}个, 总切片${groupSegCount[g]})`);
        }
        
        // 规则2：极短切片 + 总时长 < 8s，且组切片数 >= 2
        if (groupHasVeryShort[g] && groupTotalDur[g] < 8.0 && groupSegCount[g] >= 2) {
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
                log(`🔒 安全锁: 解除 ${chain} 个连续标记 (需要>=3)`);
            } else {
                log(`✅ 确认广告块: ${chain} 个连续切片`);
            }
        } else {
            i++;
        }
    }
    
    let adCount = segments.filter(s => s.isAd).length;
    log(`📊 识别完成：总切片 ${segments.length}，广告 ${adCount} (${(adCount/segments.length*100).toFixed(1)}%)`);
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