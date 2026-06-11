//本代码仅用于个人学习，请勿用于其他作用，下载后请24小时内删除，代码虽然是公开学习的，但请尊重作者，应留下说明
require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuPublic.js');

// 管理中心
function manageSet(){
    addListener("onClose", $.toString(() => {
        //refreshPage(false);
    }));
    setPageTitle("♥管理中心"+getMyVar('SrcJu_Version', ''));

    let d = [];
    d.push({
        col_type: "line_blank"
    });
    d.push({
        title: '依赖管理',
        img: getIcon("管理-依赖.svg"),
        col_type: 'avatar',
        url: 'hiker://empty'
    });
    d.push({
        title: 'github加速管理',
        img: getIcon("管理-箭头.svg"),
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            $.require('ghproxy').proxyPage();
        }),
        col_type: 'text_icon'
    });
    d.push({
        title: '指定聚阅代码库',
        img: getIcon("管理-箭头.svg"),
        url: $(getItem('依赖', ''),"手工指定聚阅代码库地址").input(()=>{
            return $("确定要指定聚阅代码库地址"+input).confirm((input)=>{
                if(input && (!input.startsWith("http") || !input.endsWith("SrcJu.js"))){
                    return "toast://输入有误"
                }
                input = input.trim();
                setItem('依赖', input);
                initConfig({
                    聚阅: input
                })
                setPublicItem('聚阅', input);
                deleteCache();
                return "toast://已设置，返回主页刷新";
            },input)
        }),
        col_type: 'text_icon'
    });
    d.push({
        col_type: "line_blank"
    });
    d.push({
        title: '规则配置',
        img: getIcon("管理-配置.svg"),
        col_type: 'avatar',
        url: 'toast://不清楚，可不动'
    });
    /*
    d.push({
        title: '资源码分享管理',
        img: getIcon("管理-箭头.svg"),
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            require(config.聚影.replace(/[^/]*$/,'') + 'SrcJyPublic.js');
            shareResource();
        }),
        col_type: 'text_icon'
    });
    d.push({
        title: '资源码订阅管理',
        img: getIcon("管理-箭头.svg"),
        url: $('hiker://empty#noRecordHistory##noHistory#').rule(() => {
            require(config.聚影.replace(/[^/]*$/,'') + 'SrcJyPublic.js');
            subResource();
        }),
        col_type: 'text_icon'
    });
    */
    d.push({
        title: '规则日志打印',
        img: getItem('规则日志打印','1')=="1"?getIcon("管理-开.svg"):getIcon("关.svg"),
        url: $("#noLoading#").lazyRule(() => {
            if(getItem('规则日志打印')=="0"){
                clearItem('规则日志打印');
            }else{
                setItem('规则日志打印','0');
            }
            refreshPage();
            return 'hiker://empty';
        }),
        col_type: 'text_icon'
    });
    d.push({
        title: '接口日志打印',
        img: getItem('接口日志打印')=="1"?getIcon("管理-开.svg"):getIcon("关.svg"),
        url: $("#noLoading#").lazyRule(() => {
            if(getItem('接口日志打印')=="1"){
                clearItem('接口日志打印');
            }else{
                setItem('接口日志打印','1');
            }
            refreshPage();
            return 'hiker://empty';
        }),
        col_type: 'text_icon'
    });
    d.push({
        title: '不显示沉浸图',
        img: getItem('不显示沉浸图')=="1"?getIcon("管理-开.svg"):getIcon("关.svg"),
        url: $("#noLoading#").lazyRule(() => {
            if(getItem('不显示沉浸图')=="1"){
                clearItem('不显示沉浸图');
            }else{
                setItem('不显示沉浸图','1');
            }
            refreshPage();
            return 'hiker://empty';
        }),
        col_type: 'text_icon'
    });
    d.push({
        title: '自动禁用失败',
        img: getItem('自动禁用失败的源')=="1"?getIcon("管理-开.svg"):getIcon("关.svg"),
        url: $("#noLoading#").lazyRule(() => {
            let sm;
            if(getItem('自动禁用失败的源')=="1"){
                clearItem('自动禁用失败的源');
                sm = '关闭自动禁用失败的源';
            }else{
                setItem('自动禁用失败的源','1');
                sm = '开启自动禁用失败次数大于15的源';
            }
            refreshPage();
            return 'toast://' + sm;
        }),
        col_type: 'text_icon'
    });
    d.push({
        col_type: "line_blank"
    });
    d.push({
        title: '关于聚阅',
        img: getIcon("聚阅.svg"),
        col_type: 'avatar',
        url: 'toast://哥就是帅'
    });
    d.push({
        title: '主题图标设置',
        img: getIcon("管理-箭头.svg"),
        col_type: 'text_icon',
        url: $("hiker://empty#noRecordHistory##noHistory##immersiveTheme#").rule(() => {
            require(config.聚阅.replace(/[^/]*$/,'') + 'SrcJuManage.js');
            themeIconSet();
        }),
        extra: {
            newWindow: true,
            windowId: '聚阅主题图标设置'
        }
    });
    let colors = [{
        title: '绿意盎然',
        icon: "#4EAF7C"
    },{
        title: '蓝田生玉',
        icon: "#3498DB"
    },{
        title: '暗宝石绿',
        icon: "#00CED1"
    },{
        title: '橙黄橘绿',
        icon: "#F5AB34"
    },{
        title: '热情似火',
        icon: "#D64440"
    },{
        title: '粉装玉琢',
        icon: "#F0838D"
    },{
        title: '重斤球紫',
        icon: "#9B59B5"
    },{
        title: '深卡其色',
        icon: "#BDB76B"
    },{
        title: '亮天蓝色',
        icon: "#87CEFA"
    },{
        title: '泥牛入海',
        icon: "#BD7F45"
    },{
        title: '青出于黑',
        icon: "#336F7A"
    },{
        title: "自定义色",
        icon: getItem('自定义色', '1')
    },{
        title: "恢复初始",
        icon: ""
    }]
    
    colors.forEach(it=>{
        if(getItem('主题颜色','') == it.icon){
            it.title = it.title + '√';
        }
    })
    d.push({
        title: '主题颜色选择',
        img: getIcon("管理-箭头.svg"),
        url: $(colors, 3).select((colors) => {
            input = input.replace('√', '');
            if(input=="自定义色"){
                return $(getItem('自定义色', ''), "输入自定义主题颜色代码").input(()=>{
                    if(!input.startsWith('#')){
                        return "toast://颜色代码错误，请以#开头";
                    }
                    setItem('主题颜色', input);
                    setItem('自定义色', input);
                    refreshPage(false);
                    return "hiker://empty";
                })
            }else{
                let color = colors.filter(d => d.title == input)[0].icon;
                if(color){
                    setItem('主题颜色', color);
                }else{
                    clearItem('主题颜色');
                }
                refreshPage();
                return "hiker://empty";
            } 
        }, colors),
        col_type: 'text_icon',
        extra: {
            longClick: [{
                title: "主页大图标不变化",
                js: $.toString(() => {
                    return $("#noLoading#").lazyRule(() => {
                        if(getItem('主页大图标不变化')=="1"){
                            clearItem('主页大图标不变化');
                        }else{
                            setItem('主页大图标不变化','1');
                        }
                        return 'toast://切换成功，返回主页刷新';
                    })
                })
            }]
        }
    });
    d.push({
        title: '查看更新日志',
        img: getIcon("管理-箭头.svg"),
        col_type: 'text_icon',
        url: $("#noLoading#").lazyRule(() => {
            eval(fetch(getItem("依赖","").replace(/[^/]*$/,'') + 'SrcTmplVersion.js'));
            let updateRecords = newVersion.JYUpdateRecords || [];

            const hikerPop = $.require(libspath + 'plugins/hikerPop.js');
            hikerPop.updateRecordsBottom(updateRecords);
            
            return "hiker://empty";
        })
    });
    d.push({
        title: '开发手册文档',
        img: getIcon("管理-箭头.svg"),
        col_type: 'text_icon',
        url: $("#noLoading#").lazyRule(() => {
            return "web://https://docs.qq.com/doc/DWERBTHJzcWV0UHVE";
        })
    });
    d.push({
        title: '检测版本更新',
        img: getIcon("管理-箭头.svg"),
        col_type: 'text_icon',
        url: $("#noLoading#").lazyRule(() => {
            if(!getItem("依赖","")){
                return "toast://代码库获取异常，无法更新！";
            }
            if(!getItem("依赖","").startsWith("http")){
                return "toast://非在线代码库，无法在线更新！";
            }
            try{
                eval(request(getItem("依赖","").replace(/[^/]*$/,'') + 'SrcTmplVersion.js'))
                let nowVersion = getItem('Version', getMyVar('SrcJu_Version', '0.1').replace('-V',''));
                let nowtime = Date.now();
                if (parseFloat(newVersion.SrcJu) > parseFloat(nowVersion)) {
                    confirm({
                        title: '发现新版本，是否更新？', 
                        content: '本地V'+nowVersion+' => 云端V'+newVersion.SrcJu, 
                        confirm: $.toString((nowtime,newVersion) => {
                            setItem('Version', newVersion);
                            setItem('VersionChecktime', nowtime+'time');
                            deleteCache();
                            putMyVar('SrcJu_Version', '-V'+newVersion);
                            refreshPage();
                        },nowtime, newVersion.SrcJu),
                        cancel:''
                    })
                }else if (parseFloat(newVersion.JYUpdateRecords[0].title.split('V')[1]) > parseFloat(nowVersion)) {
                    confirm({
                        title: '测试beta版本，是否更新？', 
                        content: '本地V'+nowVersion+' => 云端'+newVersion.JYUpdateRecords[0].title, 
                        confirm: $.toString((nowtime) => {
                            setItem('VersionChecktime', nowtime+'time');
                            deleteCache();
                            toast('已更新，版本号还是会显示正式版的');
                            refreshPage();
                        },nowtime),
                        cancel:''
                    })
                }else{
                    toast('已经为最新版本');
                }
            }catch(e){
                toast('获取版本信息异常>'+e.message);
            }
            return "hiker://empty";
        })
    });
    d.push({
        title: '支持一下作者',
        img: getIcon("管理-箭头.svg"),
        col_type: 'text_icon',
        url: config.聚阅.replace(/[^/]*$/,'') + 'img/pay.jpg'
    });
    d.push({
        col_type: "line_blank"
    });
    d.push({
        title: '免责申明',
        img: getIcon("管理-免责.svg"),
        col_type: 'avatar',
        url: 'hiker://empty'
    })
    d.push({
        title: `<small>
                1. 本小程序是一个空壳小程序，无任何内置资源。<br>
                2. 本小程序开源<b>完全免费</b>，如果是付费购买的那你被骗了。<br>
                3. 本小程序免费无偿使用，不接受任何指责和无理要求。<br>
                4. 本小程序开发初衷源于兴趣爱好，乐于分享，禁止贩卖。<br>
                5. 本小程序仅用于个人学习研究，请于导入24小时内删除！<br>
                <b>开始使用本规则即代表遵守规则条例</b><br>
            </small>`,
        col_type: 'rich_text'
    });
    setResult(d);
}
// 程序图标设置
function themeIconSet() {
    addListener("onClose", $.toString(() => {
        clearMyVar('themeList');
        clearMyVar('currentTheme');
    }));
    setPageTitle('主题图标设置');
    clearMyVar('按钮名称');
    clearMyVar('按钮索引');
    clearMyVar('编辑类别');
    clearMyVar('编辑组件状态');
    clearMyVar('图标临时记录');
    if(fileExist(libspath + 'themes.json')){
        writeFile(rulepath + 'themes.json', fetch(libspath + 'themes.json'));
        deleteFile(libspath + 'themes.json');
    }

    let d = [];
    if(isDarkMode() || getItem('不显示沉浸图')=='1'){
        for(let i=0;i<2;i++){
            d.push({
                title: "",
                url: "hiker://empty",
                col_type: "text_1",
                extra: {
                    lineVisible: false
                }
            })
        }
    }else{
        d.push({
            col_type: 'pic_1_full',
            img: "http://123.56.105.145/weisyr/img/TopImg0.png",
            url: 'hiker://empty',
        });
    }

    let themeList = storage0.getMyVar('themeList');
    if (!themeList) {
        themeList = getThemeList();
        storage0.putMyVar('themeList', themeList);
    }

    let currentTheme = storage0.getMyVar('currentTheme', storage0.getItem('currentTheme', getThemeList(true)));
    let themename = currentTheme['名称'] || '';
    let themenames = themeList.map(it => it.名称);
    if (!storage0.getMyVar('currentTheme') && themename) {
        storage0.putMyVar('currentTheme', currentTheme);
    }

    d.push({
        title: '主题：' + (themename || '没有主题'),
        url: $(themenames, 2, '选择主题').select(() => {
            let theme = storage0.getMyVar('themeList').filter(v => v.名称 == input)[0];
            storage0.putMyVar('currentTheme', theme);
            refreshPage();
            return 'hiker://empty';
        }),
        col_type: 'text_2'
    })
    d.push({
        title: '新增|删除',
        url: $('', '请输入一个主题名称').input(() => {
            let themeList = storage0.getMyVar('themeList');
            if (themeList.some(v => v.名称 == input) || input=='原生主题') {
                return 'toast://主题名称已存在';
            } else if (input) {
                storage0.putMyVar('currentTheme', {
                    名称: input
                });
                refreshPage();
            }
            return 'hiker://empty';
        }),
        col_type: 'text_2',
        extra: {
            longClick: [{
                title: "删除主题",
                js: $.toString((rulepath,themename) => {
                    return $("删除主题["+themename+"]，确认？").confirm((rulepath, themename)=>{
                        let currentTheme = storage0.getMyVar('currentTheme', {});
                        let themeList = storage0.getMyVar('themeList', []);
                        themeList = themeList.filter(v => v.名称 != currentTheme.名称);
                        writeFile(rulepath + 'themes.json', JSON.stringify(themeList));

                        if(storage0.getItem('currentTheme', {}).名称==currentTheme.名称){
                            clearItem('currentTheme');
                        }
                        clearMyVar('currentTheme');
                        clearMyVar('themeList');
                        //删除对应文件夹
                        let L = $.require("http://123.56.105.145/weisyr/js/file.js")
                        L.deleteFiles(getPath(rulepath + 'themes/' + themename).replace('file://',''));

                        refreshPage(true);
                        return 'toast://已保存并生效';
                    }, rulepath, themename)
                }, rulepath, themename)
            }]
        }
    })
    if(themename){
        let 编辑组件 = () => {
            let d = []
            d.push({
                title: '着色',
                col_type: 'text_3',
                url: $("#noLoading#").lazyRule(() => {
                    let imgtype = getMyVar('编辑类别', '主页') + '图标';
                    let currentTheme = storage0.getMyVar('currentTheme', {});
                    let imgs = currentTheme[imgtype] || [];
                    let i = parseInt(getMyVar('按钮索引', '0'));
                    let img = (imgs[i]||{}).img;

                    function extractColorsFromSVG(svgString) {
                        const colorRegex = /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})\b/g;
                        const colors = new Set(); // 使用 Set 避免重复

                        let match;
                        while ((match = colorRegex.exec(svgString)) !== null) {
                            colors.add(match[0]); // 添加完整匹配的颜色代码
                        }

                        return Array.from(colors); // 转成数组返回
                    }

                    if(img){
                        if(!img.endsWith('.svg')){
                            return 'toast://非svg格式图标无法着色';
                        }
                        let colors = extractColorsFromSVG(fetch(img)).map(v=>{
                            return {
                                title: v,
                                icon: v
                            }
                        })
                        if(colors.length==0){
                            return 'toast://获取svg图标中颜色代码失败';
                        }
                        return $(colors, 2, '选择随主题色变化的颜色代码').select(()=>{
                            let imgtype = getMyVar('编辑类别', '主页') + '图标';
                            let currentTheme = storage0.getMyVar('currentTheme', {});
                            let imgs = currentTheme[imgtype] || [];
                            let i = parseInt(getMyVar('按钮索引', '0'));
                            let img = (imgs[i]||{}).img;
                            imgs[i] = {img: img, color: input};
                            currentTheme[imgtype] = imgs;
                            storage0.putMyVar('currentTheme', currentTheme);
                            return 'toast://已选择：' + input;
                        })
                    }
                    return 'hiker://empty';
                }),
                extra: {
                    id: '图标编辑着色',
                    cls: '图标编辑组件'
                }
            })
            d.push({
                title: `““””📂本地`,
                col_type: 'text_3',
                url: `fileSelect://`+$.toString(()=>{
                    updateItem(getMyVar('编辑类别') + '图标id' + getMyVar('按钮索引'), {
                        img: 'file://' + input
                    })
                    updateItem("图标编辑input", {
                        desc: '已选择本地图',
                    });
                    let imgtype = getMyVar('编辑类别', '主页') + '图标';
                    let currentTheme = storage0.getMyVar('currentTheme', {});
                    let imgs = currentTheme[imgtype] || [];
                    let i = parseInt(getMyVar('按钮索引', '0'));
                    //记录图标上一个状态
                    let 图标临时记录 = storage0.getMyVar('图标临时记录', {});
                    图标临时记录[getMyVar('编辑类别') + '图标id' + getMyVar('按钮索引')] = imgs[i]?(imgs[i].img || ''):'';
                    storage0.putMyVar('图标临时记录', 图标临时记录);
                    //更新新图标
                    imgs[i] = {img: 'file://' + input, color: (imgs[i]||{}).color||undefined};
                    currentTheme[imgtype] = imgs;
                    storage0.putMyVar('currentTheme', currentTheme);
                }),
                extra: {
                    id: '本地选择',
                    cls: '图标编辑组件',
                    backgroundColor: '#FB9966'
                }
            })
            d.push({
                title: `““””撤销`,
                col_type: 'text_3',
                url: $('#noLoading#').lazyRule(() => {
                    //查询图标上一个状态
                    let 图标临时记录 = storage0.getMyVar('图标临时记录', {});
                    let oldimg = 图标临时记录[getMyVar('编辑类别') + '图标id' + getMyVar('按钮索引')] || '';
                    if(oldimg){
                        //恢复原图标
                        updateItem(getMyVar('编辑类别') + '图标id' + getMyVar('按钮索引'), {
                            img: oldimg
                        })
                        updateItem("图标编辑input", {
                            desc: '已恢复上一个图标',
                        });
                        //记录图标
                        let imgtype = getMyVar('编辑类别', '主页') + '图标';
                        let currentTheme = storage0.getMyVar('currentTheme', {});
                        let imgs = currentTheme[imgtype] || [];
                        let i = parseInt(getMyVar('按钮索引', '0'));
                        //更新原图标
                        imgs[i] = {img: oldimg, color: (imgs[i]||{}).color||undefined};
                        currentTheme[imgtype] = imgs;
                        storage0.putMyVar('currentTheme', currentTheme);
                        return 'toast://已恢复';
                    }
                    return 'toast://无记录';
                }),
                extra: {
                    id: '撤销',
                    cls: '图标编辑组件',
                }
            })

            d.push({
                title: '',
                desc: '输入图标地址',
                url: $.toString(() => {
                    input = input.trim();
                    if(!input){
                        return 'toast://输入不能为空';
                    }
                    let imgtype = getMyVar('编辑类别', '主页') + '图标';
                    let currentTheme = storage0.getMyVar('currentTheme', {});
                    let imgs = currentTheme[imgtype] || [];
                    let i = parseInt(getMyVar('按钮索引', '0'));
                    //记录图标上一个状态
                    let 图标临时记录 = storage0.getMyVar('图标临时记录', {});
                    图标临时记录[getMyVar('编辑类别') + '图标id' + getMyVar('按钮索引')] = imgs[i]?(imgs[i].img || ''):'';
                    storage0.putMyVar('图标临时记录', 图标临时记录);
                    //更新新图标
                    imgs[i] = {img: input, color: (imgs[i]||{}).color||undefined};
                    currentTheme[imgtype] = imgs;
                    storage0.putMyVar('currentTheme', currentTheme);
                    updateItem(getMyVar('编辑类别') + '图标id' + getMyVar('按钮索引'), {
                        img: input
                    });
                    return 'hiker://empty';
                }),
                col_type: 'input',
                extra: {
                    defaultValue: '',
                    id: '图标编辑input',
                    cls: '图标编辑组件'
                }
            })
            return d
        }
        let 编辑d = 编辑组件();
        let datas = [{
            'type': '主页',
            'name': ['切源', '频道', '搜索', '收藏', '管理']
        }, {
            'type': '二级',
            'name': ['简介', '扩展', '换源', '详情']
        }, {
            'type': '书架',
            'name': ['本地下载', '切换样式', '收藏列表']
        }, {
            'type': '接口',
            'name': ['增加', '操作', '导入', '分享']
        }, {
            'type': '解析',
            'name': ['解析列表', '调用列表', '解析设置',]
        }]

        let icon5_col = (MY_NAME=="海阔视界"&&getAppVersion()>=5579)||(MY_NAME=="嗅觉浏览器"&&getAppVersion()>=2322) ? 'icon_5_no_crop' : 'icon_5';
        datas.forEach((data) => {
            let type_name = data.type;
            d.push({
                title: `““””<font color=#B5B5B5>${type_name}图标</font>`,
                col_type: 'text_1',
                url: 'hiker://empty'
            })
            let imgs = currentTheme[type_name + '图标'] || [];
            imgs = imgs.map((v)=>{
                return {
                    img: $.type(v)=='object'?v.img:v,
                    color: $.type(v)=='object'?v.color||'':''
                }
            })
            data.name.forEach((it, i) => {
                let icon_name = it;
                let icon_img = getIcon((imgs[i]||{}).img, false, (imgs[i]||{}).color);
                d.push({
                    title: icon_name,
                    img: icon_img,
                    col_type: type_name == '接口' ? 'icon_small_4' : (type_name=='二级'||type_name=='书架'||type_name=='解析') ? 'icon_small_3' : icon5_col,
                    url: themename=='原生主题'?'hiker://empty':$('#noLoading#').lazyRule((type_name, icon_name, i, 编辑d) => {
                        //还原上一个图标名称
                        updateItem(getMyVar('编辑类别') + '图标id' + getMyVar('按钮索引'), {
                            title: getMyVar('按钮名称'),
                        });
                        
                        //执行按钮编辑组件变换
                        if (getMyVar('编辑类别') == type_name && getMyVar('按钮索引') == i && getMyVar('编辑组件状态', '1') == '1') {
                            deleteItemByCls('图标编辑组件');
                            putMyVar('编辑组件状态', '0');
                            updateItem(type_name + '图标id' + i, {
                                title: icon_name,
                            });
                        } else if (getMyVar('编辑类别') != type_name || getMyVar('编辑组件状态', '0') == '0') {
                            deleteItemByCls('图标编辑组件');
                            addItemAfter(type_name + 'add', 编辑d);
                            putMyVar('编辑组件状态', '1');
                        }
                        updateItem("图标编辑input", {
                            desc: `输入地址修改［${icon_name}］`
                        });
                        
                        //修正当前选中按钮图标
                        let font;
                        if (type_name=='二级' || type_name=='书架' || type_name=='解析') {
                            font = '';
                        } else {
                            font = '““””';
                        }
                        if (getMyVar('编辑组件状态', '1') == '1') {
                            updateItem(type_name + '图标id' + i, {
                                title: `${font}<b><font color=#F4A7B9>${icon_name}</font></b>`,
                            });
                        }
                        
                        //记录当前选中的按钮信息
                        putMyVar('按钮索引', i);
                        putMyVar('按钮名称', icon_name);
                        putMyVar('编辑类别', type_name);

                        //处理增加底部空白
                        deleteItemByCls('底部增加空白区');
                        let addnum = 0;
                        if(type_name=='接口'){
                            addnum = 4;
                        }else if(type_name=='书架'){
                            addnum = 2;
                        }
                        let d = [];
                        for(let i=0;i<addnum;i++){
                            d.push({
                                title: "",
                                url: "hiker://empty",
                                col_type: "text_1",
                                extra: {
                                    cls: '底部增加空白区',
                                    lineVisible: false
                                }
                            })
                        }
                        addItemAfter('icondownid', d);
                        return 'hiker://empty';
                    }, type_name, icon_name, i, 编辑d),
                    extra: {
                        id: type_name + '图标id' + i,
                    }
                })
            })
            d.push({
                col_type: 'blank_block',
                extra: {
                    id: type_name + 'add',
                }
            })
            d.push({
                col_type: 'line_blank'
            })
        })

        
    }

    d.push({
        col_type: 'big_blank_block',
    })
    d.push({
        title: '恢复|清空',
        url: $().lazyRule(() => {
            clearItem('currentTheme');
            clearMyVar('currentTheme');
            clearMyVar('themeList');
            refreshPage(true);
            return 'toast://已恢复使用原生自带';
        }),
        col_type: 'text_3',
        extra: {
            longClick: [{
                title: "清空主题",
                js: $.toString((rulepath) => {
                    return $("清空本地所有主题，确认？").confirm((rulepath)=>{
                        deleteFile(rulepath + 'themes.json');
                        clearMyVar('currentTheme');
                        clearMyVar('themeList');
                        refreshPage(true);
                        return 'toast://已清空';
                    },rulepath)
                },rulepath)
            }]
        }
    })
    d.push({
        title: '““””<font color=#94B5B0>保存|应用</font>',
        url: !themename ? 'toast://没有主题' : themename=='原生主题' ? $().lazyRule(() => {
            clearItem('currentTheme');
            return 'hiker://empty';
        }): $().lazyRule((rulepath, themename) => {
            let currentTheme = storage0.getMyVar('currentTheme', {});
            if (!themename) {
                return 'toast://没有主题'
            } else if (!currentTheme.主页图标) {
                return 'toast://新建主题没有内容';
            }

            Object.keys(currentTheme).forEach(it=>{
                if($.type(currentTheme[it])=='array'){
                    currentTheme[it].forEach(v=>{
                        if($.type(v)=='object' && !v.img.startsWith(rulepath) && !v.img.startsWith('http')){
                            let newimg = rulepath+'themes/'+themename+v.img.substr(v.img.lastIndexOf('/')).replace('_fileSelect_','').replace('_storage_emulated_0_','');
                            saveImage(getPath(v.img).replace('file://',''), newimg);
                            v.img = newimg;
                        }
                    })
                }
            })

            let themeList = storage0.getMyVar('themeList', []);
            themeList = themeList.filter(v => v.名称 != themename);
            themeList.push(currentTheme);
            writeFile(rulepath + 'themes.json', JSON.stringify(themeList));
            storage0.setItem('currentTheme', currentTheme);//保存为当前主题
            storage0.putMyVar('currentTheme', currentTheme);
            storage0.putMyVar('themeList', themeList);
            refreshPage(true);
            return 'toast://已保存并生效';
        }, rulepath, themename),
        col_type: 'text_3'
    })
    d.push({
        title: '导入|分享',
        url: $().lazyRule(() => {
            return $("", "输入聚阅主题分享口令").input(() => {
                let pasteurl = aesDecode('Juyue', input.split('￥')[1]);
                let inputname = input.split('￥')[0];
                if (inputname == '聚阅主题') {
                    function saveBase64Image(base64Str, savePath) {
                        const File = java.io.File;
                        const FileOutputStream = java.io.FileOutputStream;

                        try {
                            // 移除可能的base64前缀
                            let pureBase64 = base64Str.replace(/^data:image\/\w+;base64,/, "");
                            // 解码
                            let bytes = _base64.decode(pureBase64, _base64.NO_WRAP);
                            // 处理保存路径
                            let fullPath = getPath(savePath).replace("file://", "");
                            // 确保目录存在
                            let file = new File(fullPath);
                            let parent = file.getParentFile();
                            if (!parent.exists()) {
                                parent.mkdirs();
                            }
                            // 写入文件
                            let fos = new FileOutputStream(file);
                            fos.write(bytes);
                            fos.close();
                            return;
                        } catch (e) {
                            //xlog("保存图片失败：" + e);
                            return;
                        }
                    }
                    

                    try {
                        let text;
                        if(/^http|^云/.test(pasteurl)){
                            showLoading('获取数据中，请稍后...');
                            text = parsePaste(pasteurl);
                            hideLoading();
                        }
                        if(text && !/^error/.test(text)){
                            let importTheme = [];
                            try{
                                let gzip = $.require(libspath + "plugins/gzip.js");
                                importTheme = JSON.parse(gzip.unzip(parsePaste(pasteurl)));
                            }catch(e){
                                importTheme = JSON.parse(parsePaste(pasteurl));//兼容一下旧的分享口令
                            }
                            Object.keys(importTheme).forEach(it=>{
                                if($.type(importTheme[it])=='array'){
                                    importTheme[it].forEach(v=>{
                                        if($.type(v)=='object' && !v.img.startsWith('http') && v.imgb64){
                                            v.img = 'hiker://files/_cache/Juyue/themes/' + importTheme.名称 + v.img.substr(v.img.lastIndexOf('/'));
                                            saveBase64Image(v.imgb64, v.img);
                                            delete v.imgb64;
                                        }
                                    })
                                }
                            })

                            storage0.putMyVar('currentTheme', importTheme);
                            refreshPage();
                            return 'toast://确定需要，则要保存';
                        }else{
                            return 'toast://获取失败>' + text;
                        }
                    } catch (e) {
                        return 'toast://口令异常';
                    }
                }
                return 'toast://不是聚阅主题口令';
            })
        }),
        col_type: 'text_3',
        extra: {
            longClick: [{
                title: "主题分享",
                js: $.toString((themename) => {
                    let currentTheme = storage0.getMyVar('currentTheme', {});
                    if (!themename) {
                        return 'toast://没有主题'
                    } else if (!currentTheme.主页图标) {
                        return 'toast://新建主题没有内容';
                    } else if (themename=='原生主题') {
                        return 'toast://原生主题无法分享';
                    }

                    let themeList = storage0.getMyVar('themeList', []).filter(v => v.名称 == themename);
                    if (themeList.length == 1) {
                        Object.keys(currentTheme).forEach(it=>{
                            if($.type(currentTheme[it])=='array'){
                                currentTheme[it].forEach(v=>{
                                    if($.type(v)=='object' && !v.img.startsWith('http')){
                                        v.imgb64 = convertBase64Image(v.img);
                                    }
                                })
                            }
                        })

                        let gzip = $.require(libspath + "plugins/gzip.js");
                        let sharetxt = gzip.zip(JSON.stringify(currentTheme));

                        let pastes = getPastes();
                        return $(pastes,2).select((sharetxt,themename)=>{
                            let pasteurl = sharePaste(sharetxt, input);
                            if (/^http|^云/.test(pasteurl) && pasteurl.includes('/')) {
                                let code = '聚阅主题￥' + aesEncode('Juyue', pasteurl) + '￥' + themename;
                                copy(code);
                                return "toast://分享口令已生成";
                            } else {
                                xlog('分享失败>' + pasteurl);
                                return "toast://分享失败，剪粘板或网络异常>" + pasteurl;
                            }
                        }, sharetxt, themename)
                    }
                    return 'toast://异常';
                }, themename)
            }]
        }

    })
    d.push({
        title: "““””<small><font color=#bfbfbf>" + '着色功能仅对.svg格式图标有效' + "</font></small>",
        col_type: "text_center_1",
        url: 'hiker://empty',
        extra: {
            lineVisible: false,
        }
    })
    d.push({
        title: "",
        url: "hiker://empty",
        col_type: "text_1",
        extra: {
            id: 'icondownid',
            lineVisible: false
        }
    })

    setResult(d);
}
