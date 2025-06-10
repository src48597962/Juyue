//子页面读接口规则数据
function readData(fileid){
    let file = `hiker://files/rules/Src/Juyue/jiekou/${fileid}.txt`;
    let filedata = fetch(file);
    if(filedata){
        eval(filedata);
        return parse;
    }else{
        return {};
    }
}

let parse = function(fileid) {
    let jkdata = storage0.getMyVar('二级源接口信息') || storage0.getMyVar('一级源接口信息') || {};
    fileid = fileid || jkdata.id;
    return readData(fileid)
}

function 图片解密(key, iv, kiType, mode, isBase64Dec) {
    try {
        if (input == null) throw new Error("");
        const CryptoUtil = $.require("hiker://assets/crypto-java.js");
        let getData = (str, type) => {
            switch (type) {
                case "Hex":
                    return CryptoUtil.Data.parseHex(str);
                case "Base64":
                    return CryptoUtil.Data.parseBase64(str);
                case "UTF8":
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
            mode: mode, //"AES/CBC/PKCS7Padding",
            iv: ivData
        });
        return encrypted.toInputStream();
    } catch (e) {
        return;
    }
}
//压缩和灰度代码
const ByteArrayOutputStream = java.io.ByteArrayOutputStream;
const ByteArrayInputStream = java.io.ByteArrayInputStream;
const Bitmap = android.graphics.Bitmap;
const BitmapFactory = android.graphics.BitmapFactory;
const Canvas = android.graphics.Canvas;
const ColorMatrix = android.graphics.ColorMatrix;
const ColorMatrixColorFilter = android.graphics.ColorMatrixColorFilter;
const Paint = android.graphics.Paint;
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
    const baos = new ByteArrayOutputStream();
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
// 转为灰度图（支持动态缩小）
function toGrayscale(bmpOriginal, inSampleSize) {
    const bitmap = decodeBitmap(bmpOriginal, inSampleSize);
    try {
        const width = bitmap.getWidth();
        const height = bitmap.getHeight();
        const bmpGrayscale = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        const canvas = new Canvas(bmpGrayscale);
        const paint = new Paint();
        const cm = new ColorMatrix();
        cm.setSaturation(0); // 设置饱和度为0（灰度）
        paint.setColorFilter(new ColorMatrixColorFilter(cm));
        canvas.drawBitmap(bitmap, 0, 0, paint);
        return bitmapToInputStream(bmpGrayscale);
    } finally {
        bitmap.recycle(); // 回收原Bitmap
    }
}
// 压缩图片（参数顺序调整：第2个是缩小比例，第3个是质量）
function compress(bmpOriginal, inSampleSize, quality) {
    const bitmap = decodeBitmap(bmpOriginal, inSampleSize);
    try {
        return bitmapToInputStream(bitmap, quality);
    } finally {
        bitmap.recycle();
    }
}

let exports = {
    "parse": parse,
    "imgDec": (key, iv, kiType, mode, isBase64Dec) => 图片解密(input, key, iv, kiType, mode, isBase64Dec),
    "compress": (inSampleSize, quality) => compress(input, inSampleSize, quality),
    "toGrayscale": () => toGrayscale(input)
}
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

$.exports = exports