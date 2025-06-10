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
const Color = android.graphics.Color;
const ColorMatrix = android.graphics.ColorMatrix;
const ColorMatrixColorFilter = android.graphics.ColorMatrixColorFilter;
const Paint = android.graphics.Paint;

function getOptions() {
    let options = new BitmapFactory.Options();
    options.inSampleSize = 2;
    return options;
}
function bitmapToInputStream(bitmap, quality) {
    quality = quality || 85;
    const baos = new ByteArrayOutputStream();
    bitmap.compress(Bitmap.CompressFormat.JPEG, quality, baos);
    return new ByteArrayInputStream(baos.toByteArray());
}
function decodeBitmap(input) {
    return BitmapFactory.decodeStream(input, null, getOptions());
}
function toGrayscale(bmpOriginal) {
    const bitmap = decodeBitmap(bmpOriginal);
    const width = bitmap.getWidth();
    const height = bitmap.getHeight();
    const bmpGrayscale = Bitmap.createBitmap(width, height, Bitmap.Config.RGB_565);
    const canvas = new Canvas(bmpGrayscale);
    const paint = new Paint();
    const cm = new ColorMatrix();
    cm.setSaturation(0);
    paint.setColorFilter(new ColorMatrixColorFilter(cm));
    canvas.drawBitmap(bitmap, 0, 0, paint);
    bitmap.recycle(); 
    return bitmapToInputStream(bmpGrayscale);
}
function compress(bmpOriginal, ratio) {
    const bitmap = decodeBitmap(bmpOriginal);
    const result = bitmapToInputStream(bitmap, ratio);
    bitmap.recycle();
    return result;
}

let exports = {
    "parse": parse,
    "imgDec": (key, iv, kiType, mode, isBase64Dec) => 图片解密(key, iv, kiType, mode, isBase64Dec),
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