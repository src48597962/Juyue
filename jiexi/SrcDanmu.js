require(config.jxCodePath + 'SrcPublic.js');

function dmhome(){
    setPageTitle('弹幕库管理');
    let jxIcons = currentTheme['接口图标'];
        let d = [];
    d.push({
        title: '增加',
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            require(config.jxCodePath + 'SrcDanmu.js');
            dmapi();
        }),
        img: getJxIcon(jxIcons[0].img, false, jxIcons[0].color),
        col_type: "icon_small_4"
    });
    d.push({
        title: '操作',
        url: $(["清空所有"], 2).select(() => {
            require(config.jxCodePath + 'SrcPublic.js');
            if(input=="清空所有"){
                return $("确定要删除本地所有的弹幕接口吗？").confirm((jxdmfile)=>{
                    writeFile(jxdmfile, JSON.stringify([]));
                    refreshPage(false);
                    return 'toast://已全部清空';
                }, jxdmfile)
            }
        }),
        img: getJxIcon(jxIcons[1].img, false, jxIcons[1].color),//'http://123.56.105.145/tubiao/more/290.png',
        col_type: "icon_small_4"
    });
    d.push({
        title: '导入',
        url: $("").input(() => {
            input = input.trim();
            if (input == "") {
                return 'toast://不能为空';
            }

            let code = aesDecode('danmu', input.split('￥')[1]);
            let text = parsePaste(code);
            let sharetxt = base64Decode(text);
            let imports = JSON.parse(sharetxt); 

            require(config.jxCodePath + 'SrcPublic.js');
            let dmlist = [];
            let dmfilestr = fetch(jxdmfile);
            if (dmfilestr != "") {
                eval("dmlist=" + dmfilestr + ";");
            }
            imports.forEach(it=>{
                if(!dmlist.some(v=>v.name==it.name || v.url==it.url)){
                    dmlist.push(it);
                }
            })
            writeFile(jxdmfile, JSON.stringify(dmlist));
            refreshPage();
            return 'toast://已导入';
        }),
        img: getJxIcon(jxIcons[2].img, false, jxIcons[2].color),
        col_type: "icon_small_4"
    });

    let pastes = getPastes();
    d.push({
        title: '分享',
        url: $(pastes, 2).select(() => {
            require(config.jxCodePath + 'SrcPublic.js');
            let dmlist = [];
            let dmfilestr = fetch(jxdmfile);
            if (dmfilestr != "") {
                eval("dmlist=" + dmfilestr + ";");
            }
            if(dmlist.length==0){
                return 'toast://列表为空';
            }
            showLoading('分享生成中，请稍后...');
            let sharetxt = base64Encode(JSON.stringify(dmlist));
            let pasteurl = sharePaste(sharetxt, input);
            hideLoading();
            if (/^http|^云/.test(pasteurl) && pasteurl.includes('/')) {
                log('剪贴板地址>' + pasteurl);
                copy('解析弹幕￥' + aesEncode('danmu', pasteurl) + '￥聚阅');
                return "toast://分享口令已生成";
            } else {
                log('分享失败>' + pasteurl);
                return "toast://分享失败，剪粘板或网络异常>" + pasteurl;
            }
        }),
        img: getJxIcon(jxIcons[3].img, false, jxIcons[3].color),
        col_type: "icon_small_4"
    });
    d.push({
        col_type: "line_blank"
    });
    let dmlist = [];
    let dmfilestr = fetch(jxdmfile);
    if (dmfilestr != "") {
        eval("dmlist=" + dmfilestr + ";");
    }
    dmlist.reverse();
    dmlist.forEach(it=>{
        d.push({
            title: it.name + '  [' + it.type + ']  ' + (it.search?'{搜索}':''),
            desc: it.url,
            col_type: 'text_1',
            url: $(['编辑', '删除'], 2).select((data) => {
                if(input=='编辑'){
                    return $('hiker://empty#noRecordHistory##noHistory#').rule((data) => {
                        require(config.jxCodePath + 'SrcDanmu.js');
                        dmapi(data);
                    }, data)
                }else if(input=='删除'){
                    require(config.jxCodePath + 'SrcPublic.js');
                    let dmlist = [];
                    let dmfilestr = fetch(jxdmfile);
                    if (dmfilestr != "") {
                        eval("dmlist=" + dmfilestr + ";");
                    }
                    dmlist = dmlist.filter(v => v.url != data.url);
                    writeFile(jxdmfile, JSON.stringify(dmlist));
                    refreshPage();
                    return 'toast://已删除';
                }
            }, it)
        })
    })
    setResult(d);
}



//弹幕新增或编辑
function dmapi(data) {
    addListener("onClose", $.toString(() => {
        clearMyVar('dmname');
        clearMyVar('dmurl');
        clearMyVar('dmtype');
        clearMyVar('dmsearch');
        clearMyVar('isload');
        refreshPage();
    }));
    let d = [];
    if (!data) {
        setPageTitle("弹幕库-新增");
    } else {
        if (getMyVar('isload', '0') == "0") {
            setPageTitle("弹幕库-变更");
            putMyVar('dmname', data.name);
            putMyVar('dmurl', data.url || "");
            putMyVar('dmtype', data.type || "");
            putMyVar('dmsearch', data.search || "");
            putMyVar('isload', '1');
        }
    }
    d.push({
        title: 'dmname',
        col_type: 'input',
        desc: "弹幕名称",
        extra: {
            titleVisible: false,
            defaultValue: getMyVar('dmname', ""),
            onChange: 'putMyVar("dmname",input)'
        }
    });
    d.push({
        title: 'dmurl',
        col_type: 'input',
        desc: "弹幕接口",
        extra: {
            titleVisible: false,
            defaultValue: getMyVar('dmurl', ""),
            onChange: 'putMyVar("dmurl",input)'
        }
    });
    d.push({
        title: '弹幕类型：' + getMyVar('dmtype', '自动识别'),
        col_type: 'text_1',
        url: 'hiker://empty'
    });
    d.push({
        title: '是否支持关键字搜索：' + (getMyVar('dmsearch')?'是':'否'),
        col_type: 'text_1',
        url: data?'toast://只能新增时修改':$('#noLoading#').lazyRule(() => {
            if(getMyVar('dmsearch')){
                clearMyVar('dmsearch');
            }else{
                putMyVar('dmsearch', '1');
            }
            refreshPage();
            return 'hiker://empty';
        })
    });
    d.push({
        col_type: 'blank_block'
    });
    d.push({
        title: '保存',
        col_type: 'text_center_1',
        url: $('#noLoading#').lazyRule((data) => {
            let dmname = getMyVar('dmname');
            let dmurl = getMyVar('dmurl');
            if (!dmname || !dmurl) {
                return "toast://信息不完整"
            }
            if (dmname=='dm盒子') {
                return "toast://名称不能是dm盒子"
            }
            let dmtype = getMyVar('dmtype');
            let dmsearch = getMyVar('dmsearch');

            require(config.jxCodePath + 'SrcPublic.js');
            let dmlist = [];
            let dmfilestr = fetch(jxdmfile);
            if (dmfilestr != "") {
                eval("dmlist=" + dmfilestr + ";");
            }
            if(!data){
                if (dmlist.some(v => v.name == dmname)) {
                    return 'toast://名称已存在：' + dmname;
                }
                if (dmlist.some(v => v.url == dmurl)) {
                    return 'toast://链接已存在：' + dmurl;
                }
            }

            try {
                if(!data){
                    showLoading('正在校验有效性');
                    let html = fetch(dmurl + 'https://v.qq.com/x/cover/mzc00200u2ay1kj/o4102s6qfdq.html', { timeout: 8000 });
                    if (html.startsWith('{') && html.includes('comments')) {
                        dmtype = 'json';
                    } else if (html.startsWith('<?xml') && html.includes('<d p="')) {
                        dmtype = 'xml';
                    } else {
                        dmtype = '';
                    }
                    dmsearch = isDmSearch(dmurl);
                    hideLoading();
                }
                
                if (dmtype) {
                    if(data){
                        dmlist = dmlist.filter(v => v.url != data.url);
                    }
                    let item = { name: dmname, url: dmurl, type: dmtype };
                    if(dmsearch){
                        item['search'] = '1';
                    }
                    dmlist.push(item);
                    writeFile(jxdmfile, JSON.stringify(dmlist));
                    toast('添加成功');
                } else {
                    toast('未检测到有效弹幕格式');
                }
            } catch (e) {
                toast('发生错误: ' + e.message);
            }
            hideLoading();
            back();
            return 'hiker://empty';
        }, data)
    });
    setResult(d);
}

