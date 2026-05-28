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
                isAd: false,
                adReason: '' // 记录广告原因
            });
        }
    }

    // ========== 第一步：域名和路径快速检测（最高优先级） ==========
    markAdsByPathAndDomain(segments);
    
    let pathMarkedCount = segments.filter(s => s.isAd).length;
    let pathMarkedIndices = [];
    segments.forEach((s, idx) => {
        if (s.isAd) pathMarkedIndices.push(idx);
    });
    
    if (pathMarkedCount > 0) {
        log(`🔍 路径/域名检测发现 ${pathMarkedCount} 个异常切片: [${pathMarkedIndices.join(', ')}]`);
        
        // 如果域名/路径检测已经标记了广告，先检查是否需要应用安全锁
        // 但不要被时长一致性检查覆盖
    }

    // ========== 第二步：兜底逻辑检查时长一致性 ==========
    // 注意：这个检查只对未被路径/域名标记的切片生效
    let unmarkedSegments = segments.filter(s => !s.isAd);
    
    if (unmarkedSegments.length > 0) {
        let durCount = {};
        for (let seg of unmarkedSegments) {
            let key = seg.duration.toFixed(3);
            durCount[key] = (durCount[key] || 0) + 1;
        }
        let sortedDurs = Object.entries(durCount).sort((a, b) => b[1] - a[1]);
        let mainDuration = sortedDurs.length > 0 ? parseFloat(sortedDurs[0][0]) : 0;
        let mainDurationPercent = sortedDurs.length > 0 ? (sortedDurs[0][1] / unmarkedSegments.length) * 100 : 0;
        
        log(`未标记切片主时长: ${mainDuration}s, 占比: ${mainDurationPercent.toFixed(1)}% (基于${unmarkedSegments.length}个未标记切片)`);
        
        // 如果超过 90% 的未标记切片是同一个时长，跳过对这些切片的进一步检测
        if (mainDurationPercent > 90) {
            log('✅ 未标记切片时长高度一致，跳过进一步检测');
            // 但保留路径/域名检测的结果
        } else {
            // 时长多样化，继续执行其他检测
            log('⚠️ 未标记切片时长多样，继续检测');
            
            // ========== 第三步：基础广告识别（仅对未标记切片） ==========
            markAdsUltraSafe(segments);
            
            // ========== 第四步：分组检测 ==========
            groupCleanByDiscontinuityAdvanced(segments, discontinuityPositions, lines);
        }
    }

    // ========== 第五步：连续集群安全锁（但对路径标记的广告放宽要求） ==========
    applyContinuitySafetyLock(segments, pathMarkedIndices);

    let adLines = new Set();
    segments.forEach(s => {
        if (s.isAd) {
            adLines.add(s.infLine);
            adLines.add(s.tsLine);
            if (s.adReason) {
                log(`🗑️ 删除: ${s.adReason} - ${s.filename}`);
            }
        }
    });

    for (let i = 0; i < lines.length; i++) {
        if (adLines.has(i)) continue;
        if (lines[i] === '#EXT-X-DISCONTINUITY' && adLines.has(i + 1)) continue;
        result.push(lines[i]);
    }

    log(`📊 最终结果：总切片 ${segments.length}，删除 ${segments.filter(s => s.isAd).length} 个`);
    return result.join('\n');
}

/**
 * 路径和域名快速检测（最高优先级）
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

    // 统计文件命名模式
    let namePatterns = {};
    segments.forEach(s => {
        let name = s.filename;
        let pattern = 'other';
        if (/^\d+\.ts$/.test(name)) pattern = 'numeric';
        else if (/^[0-9a-f]{32}\.ts$/.test(name)) pattern = 'hex32';
        else if (/^[0-9a-f]{8}-[0-9a-f]{4}/.test(name)) pattern = 'uuid';
        else if (/^segment-\d+/.test(name)) pattern = 'segment';
        namePatterns[pattern] = (namePatterns[pattern] || 0) + 1;
    });

    let totalSegs = segments.length;
    
    // 找到主要域名（占比最高的）
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

    // 找到主要命名模式
    let mainPattern = '';
    let maxPatternCount = 0;
    for (let p in namePatterns) {
        if (namePatterns[p] > maxPatternCount) {
            maxPatternCount = namePatterns[p];
            mainPattern = p;
        }
    }

    log(`主域名: ${mainDomain} (${maxDomainCount}/${totalSegs})`);
    log(`主路径: ${mainPath} (${maxPathCount}/${totalSegs})`);
    log(`主命名模式: ${mainPattern} (${maxPatternCount}/${totalSegs})`);

    // 阈值：域名或路径出现次数少于总切片的5%且少于3个，视为异常
    let threshold = Math.max(2, Math.floor(totalSegs * 0.05));

    // 标记异常切片
    segments.forEach(seg => {
        let reasons = [];
        
        // 检查域名（最关键）
        if (seg.domain !== mainDomain && domainCount[seg.domain] <= threshold) {
            reasons.push(`异域名:${seg.domain}(${domainCount[seg.domain]}次)`);
        }
        
        // 检查路径
        if (seg.dirPath !== mainPath && pathCount[seg.dirPath] <= threshold) {
            reasons.push(`异路径:${seg.dirPath.substring(seg.dirPath.lastIndexOf('/'))}(${pathCount[seg.dirPath]}次)`);
        }

        // 检查文件命名模式
        let name = seg.filename;
        let segPattern = 'other';
        if (/^\d+\.ts$/.test(name)) segPattern = 'numeric';
        else if (/^[0-9a-f]{32}\.ts$/.test(name)) segPattern = 'hex32';
        
        if (segPattern !== mainPattern && namePatterns[segPattern] <= threshold) {
            reasons.push(`命名异常:${name}`);
        }

        // 标记为广告（不需要高分，域名/路径异常本身就是强信号）
        if (reasons.length > 0) {
            seg.isAd = true;
            seg.adReason = reasons.join(', ');
        }
    });

    // 额外检查：连续的异路径块
    let i = 0;
    while (i < segments.length) {
        if (segments[i].isAd && segments[i].adReason.includes('异路径')) {
            let start = i;
            let pathBlock = [];
            while (i < segments.length && segments[i].isAd && segments[i].adReason.includes('异路径')) {
                pathBlock.push(i);
                i++;
            }
            // 如果连续异路径块 >= 2 个，确认全部删除
            if (pathBlock.length >= 2) {
                pathBlock.forEach(idx => {
                    if (!segments[idx].adReason.includes('连续块')) {
                        segments[idx].adReason += ' [连续异路径块]';
                    }
                });
                log(`🔴 确认连续异路径块: 索引[${pathBlock[0]}-${pathBlock[pathBlock.length-1]}] (${pathBlock.length}个)`);
            } else {
                // 单个异路径切片，需要更谨慎
                // 检查是否在开头或结尾（更可能是广告）
                if (pathBlock[0] === 0 || pathBlock[0] === segments.length - 1) {
                    log(`🔴 边缘异路径切片: 索引${pathBlock[0]}`);
                } else {
                    // 中间的单个异路径切片，降低标记强度
                    pathBlock.forEach(idx => {
                        segments[idx].isAd = true;
                        segments[idx].adReason += ' [独立异路径]';
                    });
                    log(`⚠️ 独立异路径切片: 索引${pathBlock[0]}，标记但可能被安全锁解除`);
                }
            }
        } else {
            i++;
        }
    }
}

/**
 * 广告识别（改进版，仅对未标记切片）
 */
function markAdsUltraSafe(segments) {
    let segCount = segments.length;
    if (segCount < 10) return;

    let unmarkedSegments = segments.filter(s => !s.isAd);
    if (unmarkedSegments.length < 5) return;

    let avgDuration = unmarkedSegments.map(s => s.duration).reduce((a, b) => a + b, 0) / unmarkedSegments.length;

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
        if (score >= 80) {
            seg.isAd = true;
            seg.adReason = `时长异常(d=${d.toFixed(1)}s, 平均=${avgDuration.toFixed(1)}s)`;
        }
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
    let groupPathDiff = new Array(totalGroups).fill(false);

    for (let i = 0; i < segments.length; i++) {
        let g = groupIds[i];
        let d = segments[i].duration;
        groupTotalDur[g] += d;
        groupSegCount[g]++;
        if (d < 0.5) groupHasVeryShort[g] = true;
        if (segments[i].isAd) groupAdCount[g]++;
        if (segments[i].adReason && segments[i].adReason.includes('异路径')) groupPathDiff[g] = true;
    }

    // 标记广告组
    for (let i = 0; i < segments.length; i++) {
        if (segments[i].isAd) continue; // 已经标记的跳过
        
        let g = groupIds[i];
        let isAdGroup = false;
        
        // 规则1：组内已有路径差异标记
        if (groupPathDiff[g] && groupSegCount[g] >= 2) {
            isAdGroup = true;
            segments[i].adReason = `异路径组(${groupSegCount[g]}片)`;
        }
        
        // 规则2：组内已有多个广告标记
        if (groupAdCount[g] >= 2 && groupSegCount[g] >= 2) {
            isAdGroup = true;
            if (!segments[i].adReason) segments[i].adReason = `广告组(${groupAdCount[g]}/${groupSegCount[g]}片)`;
        }
        
        // 规则3：极短切片 + 总时长 < 8s
        if (groupHasVeryShort[g] && groupTotalDur[g] < 8.0 && groupSegCount[g] >= 2) {
            isAdGroup = true;
            if (!segments[i].adReason) segments[i].adReason = `极短组(总${groupTotalDur[g].toFixed(1)}s/${groupSegCount[g]}片)`;
        }

        if (isAdGroup) {
            segments[i].isAd = true;
        }
    }
}

/**
 * 连续集群安全锁（对路径标记的广告放宽要求）
 */
function applyContinuitySafetyLock(segments, pathMarkedIndices) {
    let pathMarkedSet = new Set(pathMarkedIndices);
    
    let i = 0;
    while (i < segments.length) {
        if (segments[i].isAd) {
            let chain = 0;
            let start = i;
            let hasPathMarked = false;
            
            while (i < segments.length && segments[i].isAd) {
                if (pathMarkedSet.has(i)) hasPathMarked = true;
                chain++;
                i++;
            }
            
            // 路径/域名标记的广告：2个连续就删除
            // 其他标记的广告：需要3个连续才删除
            let minChain = hasPathMarked ? 2 : 3;
            
            if (chain < minChain) {
                for (let j = start; j < i; j++) {
                    if (!pathMarkedSet.has(j)) { // 保留路径标记的
                        segments[j].isAd = false;
                    }
                }
                log(`🔒 安全锁: 解除 ${chain} 个标记 (需要>=${minChain})`);
            } else {
                log(`✅ 确认广告块: ${chain} 个连续切片${hasPathMarked ? ' (含路径标记)' : ''}`);
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