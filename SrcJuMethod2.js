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

function 图片解密(key, iv, kiType, mode) {
    const CryptoUtil = $.require("http://hiker.nokia.press/hikerule/rulelist.json?id=6805&auth=5e44e1a1-51f6-5825-97ae-4d381341bc00");
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
    let keyData = getData(key, kiType),
        ivData = getData(iv, kiType),
        textData = CryptoUtil.Data.parseInputStream(input);
    let encrypted = CryptoUtil.AES.decrypt(textData, keyData, {
        mode: mode,
        iv: ivData
    });
    return encrypted.toInputStream();
}

function 图片解密2(key, iv, kiType, mode, base64Dec) {
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
        if(base64Dec){
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
const Color = android.graphics.Color;
const ColorMatrix = android.graphics.ColorMatrix;
const ColorMatrixColorFilter = android.graphics.ColorMatrixColorFilter;
const Paint = android.graphics.Paint;

function toGrayscale(bmpOriginal) {
    bmpOriginal = BitmapFactory.decodeStream(bmpOriginal, null, getOptions());
    let width, height;
    height = bmpOriginal.getHeight();
    width = bmpOriginal.getWidth();

    let bmpGrayscale = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565);
    let c = new Canvas(bmpGrayscale);
    let paint = new Paint();
    let cm = new ColorMatrix();
    cm.setSaturation(0);
    let f = new ColorMatrixColorFilter(cm);
    paint.setColorFilter(f);
    c.drawBitmap(bmpOriginal, 0, 0, paint);
    return outInput(bmpGrayscale);
}

// 获取原始图片的字节大小（用于计算压缩率）
function getOriginalSize(inputStream) {
    const buffer = java.io.ByteArrayOutputStream();
    const buf = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024);
    let bytesRead;
    while ((bytesRead = inputStream.read(buf)) != -1) {
        buffer.write(buf, 0, bytesRead);
    }
    const originalBytes = buffer.toByteArray();
    inputStream.reset(); // 重置流，以便后续处理
    return originalBytes.length;
}

// 按压缩率压缩（0.5 = 50%，0.3 = 30%...）
function compress(input, ratio) {
    if (!ratio || ratio <= 0 || ratio >= 1) {
        ratio = 0.5;
    }
    log(ratio);
    // 1. 先解码原始图片
    const options = new BitmapFactory.Options();
    options.inSampleSize = 1; // 初始不缩放
    const bitmap = BitmapFactory.decodeStream(input, null, options);
    // 2. 计算目标质量（假设JPEG压缩率与质量线性相关，实际可能非线性）
    let quality = Math.round(ratio * 100);
    quality = Math.max(10, Math.min(100, quality)); // 限制在 10-100 之间
    // 3. 压缩并返回
    const baos = new ByteArrayOutputStream();
    bitmap.compress(Bitmap.CompressFormat.JPEG, quality, baos);
    return new ByteArrayInputStream(baos.toByteArray());
}

let exports = {
    "parse": parse,
    "imageDecrypt": 图片解密,
    "imgDec": 图片解密2,
    "compress": (ratio) => compress(input, ratio),
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