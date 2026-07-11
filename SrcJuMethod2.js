//子页面读接口规则数据
function parse(jkdata) {
    jkdata = jkdata || storage0.getMyVar('二级源接口信息') || storage0.getMyVar('一级源接口信息') || {};
    if($.type(jkdata)=="string"){
        jkdata = {id: jkdata}
    }
    require((config.聚阅||getPublicItem('聚阅','')).replace(/[^/]*$/,'') + "SrcJuMethod.js");
    return getObjCode(jkdata, 'page');
}

function 图片解密(input, key, iv, kiType, mode, isBase64Dec) {
    try {
        if (input == null) throw new Error("");
        const CryptoUtil = $.require("hiker://assets/crypto-java.js");
        let getData = (str, type) => {
            switch (type) {
                case "Hex":
                    return CryptoUtil.Data.parseHex(str);
                case "Base64":
                    return CryptoUtil.Data.parseBase64(str);
                default:
                    return CryptoUtil.Data.parseUTF8(str);
            }
        }
        let keyData = getData(key, kiType);
        let ivData = getData(iv, kiType);
        let textData = CryptoUtil.Data.parseInputStream(input);
        if(isBase64Dec){
            textData = textData.base64Decode();
        }
        let encrypted = CryptoUtil.AES.decrypt(textData, keyData, {
            mode: mode || "AES/CBC/PKCS7Padding",
            iv: ivData
        });
        return encrypted.toInputStream();
    } catch (e) {
        return;
    }
}
//压缩和灰度代码
let Bitmap = android.graphics.Bitmap;
let BitmapFactory = android.graphics.BitmapFactory;
// 获取Bitmap解码选项（支持动态缩小比例）
function getOptions(inSampleSize) {
    let options = new BitmapFactory.Options();
    options.inSampleSize = inSampleSize || 1; // 默认不缩小
    options.inPreferredConfig = Bitmap.Config.ARGB_8888; // 使用高质量颜色模式
    return options;
}
// 将Bitmap转为InputStream（自动关闭流）
function bitmapToInputStream(bitmap, quality) {
    quality = quality || 85; // 默认质量85%
    let ByteArrayOutputStream = java.io.ByteArrayOutputStream;
    let ByteArrayInputStream = java.io.ByteArrayInputStream;
    let baos = new ByteArrayOutputStream();
    try {
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, baos);
        return new ByteArrayInputStream(baos.toByteArray());
    } finally {
        baos.close(); // 确保流关闭
    }
}
// 解码输入流为Bitmap（支持动态缩小）
function decodeBitmap(input, inSampleSize) {
    return BitmapFactory.decodeStream(input, null, getOptions(inSampleSize));
}
// 转为灰度图
function toGrayscale(bmpOriginal, inSampleSize) {
    let Canvas = android.graphics.Canvas;
    let ColorMatrix = android.graphics.ColorMatrix;
    let ColorMatrixColorFilter = android.graphics.ColorMatrixColorFilter;
    let Paint = android.graphics.Paint;
    try {
        let bitmap = decodeBitmap(bmpOriginal, inSampleSize);
        try {
            let width = bitmap.getWidth();
            let height = bitmap.getHeight();
            let bmpGrayscale = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            let canvas = new Canvas(bmpGrayscale);
            let paint = new Paint();
            let cm = new ColorMatrix();
            cm.setSaturation(0);
            paint.setColorFilter(new ColorMatrixColorFilter(cm));
            canvas.drawBitmap(bitmap, 0, 0, paint);
            return bitmapToInputStream(bmpGrayscale);
        } finally {
            bitmap.recycle();
        }
    } catch (e) {
        return bmpOriginal; // 返回原始数据
    }
}
// 压缩图片
function compress(bmpOriginal, inSampleSize, quality) {
    try {
        let bitmap = decodeBitmap(bmpOriginal, inSampleSize);
        try {
            return bitmapToInputStream(bitmap, quality);
        } finally {
            bitmap.recycle();
        }
    } catch (e) {
        return bmpOriginal; // 返回原始数据
    }
}
// 主页发现按钮事件
function findBtn() {
    const hikerPop = $.require(libspath + 'plugins/hikerPop.js');
    let original = ['搜索栏设置','搜索历史数',getItem('搜索建议词', "")=='1'?'‘‘搜索建议词’’':'搜索建议词',getItem('记忆搜索词', "")=='1'?'‘‘记忆搜索词’’':'记忆搜索词','聚合搜索页','三针短剧','聚影直播'];
    let findlist = original.map(v=>{return {'name': v}});
    let Juconfig = getJuconfig();
    let findItems = Juconfig['findItems'] || [];
    findlist = findlist.concat(findItems.filter(v=>!v.stop))

    let names = findlist.map(v=>v.name);
    let pop = hikerPop.setNextThrottle(200).selectBottomRes({
        options: names,
        columns: 3,
        height: 0.6,
        title: "更多发现",
        noAutoDismiss: true,
        beforeShow() {
            //log("显示")
        },
        click(s, i, manage) {
            if(s=='搜索栏设置'){
                let searchMode = MY_NAME=="海阔视界"?["主页界面","当前接口","分组接口","页面聚合"]:["主页界面","页面聚合"];
                hikerPop.selectBottomMark({
                    options: searchMode,
                    position: searchMode.indexOf(juItem2.get('接口搜索方式','主页界面')),
                    click(a) {
                        pop.dismiss();
                        juItem2.set("接口搜索方式", a);
                        return "toast://搜索方式设置为：" + a;
                    }
                });
            }else if(s=='搜索历史数'){
                    return $(getItem("显示搜索历史数量", "18"),"显示搜索历史数量").input(()=>{
                    if(!parseInt(input)||parseInt(input)<1||parseInt(input)>100){
                        return 'toast://输入有误，请输入1-100数字';
                    }
                    setItem("显示搜索历史数量", input);
                    return "hiker://empty";
                })
            }else if(/搜索建议词|记忆搜索词/.test(s)){
                s = s.replace(/‘‘|’’/g, '');
                let isEnable = getItem(s, "")=='1';

                manage.list.forEach((v,ii)=> (manage.list[ii] = i === ii ? (isEnable?s:"‘‘"+s+"’’") : v));
                manage.change();
                
                if(isEnable){
                    clearItem(s);
                    return "toast://已取消" + s;
                }else{
                    setItem(s, "1");
                    return "toast://已设置" + s;
                }
            }else{
                pop.dismiss();
                if(s=='聚合搜索页'){
                    return `hiker://page/sousuopage#noRecordHistory##noHistory##immersiveTheme##noRefresh#?type=视频&page=fypage&keyword=`;
                }else if(s=='三针短剧'){
                    toast('三针科兴短剧，越看越有趣\n      顺佬出品，必属精品');
                    return 'hiker://page/duanju#gameTheme##noRecordHistory##noHistory#?rule=聚阅';
                }else if(s=='聚影直播'){
                    return $("hiker://empty#noRecordHistory##noHistory##noRefresh#").rule(() => {
                        setPageTitle('聚影直播');
                        require(config.聚阅.replace(/[^/]*$/,'') + 'SrcLive.js');
                        Live();
                    })
                }else{
                    return findlist[i].url;
                }
            }
            return "hiker://emtpy";
        },
        menuClick(manage) {
            hikerPop.selectCenter({
                options: ["添加", "删除", "停用", "显示", "置顶", "置底", "最后", "顶部"],
                columns: 2,
                title: "请选择",
                click(s, i) {
                    if (i === 0) {
                        hikerPop.inputTwoRow({
                            titleHint: "名称",
                            titleDefault: "",
                            urlHint: "链接",
                            urlDefault: "",
                            noAutoSoft: true,
                            title: "添加发现",
                            //hideCancel: true,
                            confirm(s1, s2) {
                                if(findItems.some(v=>v.name==s1 || v.url==s2)){
                                    return 'toast://已存在';
                                }
                                findItems.push({name: s1, url: s2});
                                Juconfig['findItems'] = findItems;
                                writeFile(cfgfile, JSON.stringify(Juconfig));
                                manage.list.push(s1);
                                names.push(s1);
                                findlist.push({name: s1, url: s2});
                                manage.change();
                                return "toast://添加了:" + s1;
                            }
                        });
                        return "hiker://empty";
                    } else if (i === 1) {
                        manage.list.splice(manage.list.length - 1, 1);
                        manage.change();
                    } else if (i === 2) {
                        manage.scrollToPosition(manage.list.length - 1, true);
                    } else if (i === 3) {
                        manage.scrollToPosition(0, true);
                    }
                },
            });

        }
    });
    return "hiker://empty";
}

let exports = {
    "parse": parse,
    "imgDec": (key, iv, kiType, mode, isBase64Dec) => 图片解密(input, key, iv, kiType, mode, isBase64Dec),
    "compress": (inSampleSize, quality) => compress(input, inSampleSize, quality),
    "toGrayscale": (inSampleSize) => toGrayscale(input, inSampleSize),
    "findBtnF": findBtn
}
/*
try{
    let exportskeys = Object.keys(exports);
    let getexp = parse() || {};
    let arr = getexp.exports || [];
    arr.forEach(it => {
        if($.type(it)=="object"){
            if(!exportskeys.includes(it.key)){
                exports[it.key] = getexp[it.key];
            }
        }else if($.type(it)=="string"){
            if(!exportskeys.includes(it)){
                exports[it] = getexp[it];
            }
        }
    })
}catch(e){}
*/
$.exports = exports