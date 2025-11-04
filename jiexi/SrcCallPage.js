// 调用管理页
function jxCallPage(dd) {
    addListener("onClose", $.toString(() => {

    }));

    setPageTitle('本地解析管理-调用');

    function callapi(data) {
        return $('hiker://empty#noRecordHistory##noHistory##noRefresh#').rule((data) => {
            addListener("onClose", $.toString(() => {
                clearMyVar('apiname');
                clearMyVar('apiword');
                clearMyVar('apicode');
                clearMyVar('isload');
            }));
            
            if(!data){
                setPageTitle("解析调用管理-新增");
            }else{
                if(getMyVar('isload', '0')=="0"){
                    setPageTitle("解析调用管理-变更");
                    putMyVar('apiname', data.name);
                    putMyVar('apiword', data.word||"");
                    putMyVar('apicode', data.code||"");
                    putMyVar('isload', '1');
                }
            }
            let d = [];
            d.push({
                title:'apiname',
                col_type: 'input',
                desc: "名称",
                extra: {
                    titleVisible: false,
                    defaultValue: getMyVar('apiname', ""),
                    onChange: 'putMyVar("apiname",input)'
                }
            });
            d.push({
                title:'apiword',
                col_type: 'input',
                desc: "匹配关键词",
                extra: {
                    titleVisible: false,
                    defaultValue: getMyVar('apiword', ""),
                    onChange: 'putMyVar("apiword",input)'
                }
            });
            d.push({
                title:'apicode',
                col_type: 'input',
                    desc: "调用代码，不写return，地址输入变量：vipUrl",
                extra: {
                    highlight: true,
                    type: "textarea",
                    titleVisible: false,
                    defaultValue: getMyVar('apicode', ""),
                    onChange: 'putMyVar("apicode", input)'
                }
            });
            d.push({
                title:'保存',
                col_type:'text_center_1',
                url:$().lazyRule((data)=>{
                    let name = getMyVar('apiname');
                    let word = getMyVar('apiword');
                    let code = getMyVar('apicode');
                    if(!name || !word || !code){
                        return "toast://信息不完整";
                    }

                    require(config.jxCodePath + 'SrcPublic.js');
                    let lists = getCalls();

                    if(data){
                        lists = lists.filter(v=>v.name!=data.name);
                    }else if(lists.some(v=>v.name==name)){
                        return "toast://已存在";
                    }
                    lists.push({name: name, word: word, code: code})
                    writeFile(jxcallfile, JSON.stringify(lists));
                    back(true);
                    return "toast://已保存";
                }, data)
            });
            setResult(d);
        }, data);
    }
    let d = dd || [];
    d.push({
        title: '增加',
        url: callapi(),
        img: 'http://123.56.105.145/tubiao/more/25.png',
        col_type: "icon_small_3"
    });
    d.push({
        title: '导入',
        url: $("","聚解口令").input(()=>{
            if(input==""){
                return 'toast://不能为空';
            }
            writeFile("hiker://files/_cache/Jujiexi/cloudimport.txt", input);
            return "hiker://page/importConfirm#immersiveTheme##noRecordHistory##noHistory#?rule=聚阅"
        }),
        img: 'http://123.56.105.145/tubiao/more/43.png',
        col_type: "icon_small_3"
    });
    
    let dydatalist = getCalls();
    let yxdatalist = dydatalist.filter(it=>{
        return !it.stop;
    });
    
    let pastes = getPastes();
    d.push({
        title: '分享',
        url: jxdatalist.length == 0 ? "hiker://empty" : $(pastes,2).select(()=>{
            require(config.jxCodePath + 'SrcPublic.js');
            return JYshare(input);
        }),
        img: 'http://123.56.105.145/tubiao/more/3.png',
        col_type: "icon_small_3"
    });
    d.push({
        col_type: "line"
    });
    dydatalist.forEach(it=>{
        d.push({
            title: it.name,
            url: $(['编辑', it.stop?'启用':'禁用', '删除'], 2).select((data, callapi)=>{
                
            }, data, callapi),
            desc: it.word,
            col_type: "text_1"
        });
    })
    d.push({
        title: "‘‘’’<small><font color=#f20c00>当前调用数：" + dydatalist.length + "，总有效数：" + yxdatalist.length + "</font></small>",
        url: 'hiker://empty',
        col_type: 'text_center_1',
        extra: {
            lineVisible: false
        }
    });
    setResult(d);
}