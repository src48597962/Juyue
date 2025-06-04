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
let 一级 = function(fileid) {
    let info = storage0.getMyVar('一级源接口信息') || {};
    let 标识 = info.type + "_" + info.name;
    fileid = fileid || 标识;
    return readData(fileid, 1)
}
let 二级 = function(fileid) {
    let info = storage0.getMyVar('二级源接口信息') || {};
    let 标识 = info.type + "_" + info.name;
    fileid = fileid || 标识;
    return readData(fileid, 2)
}
let 公共 = function(fileid) {
    let info = storage0.getMyVar('二级源接口信息') || storage0.getMyVar('一级源接口信息') || {};
    let 标识 = info.type + "_" + info.name;
    fileid = fileid || 标识;
    return readData(fileid, 3)
}
let 属性 = function(fileid, parse, attribut) {
    let 接口;
    eval("接口 = " + parse);
    return 接口(fileid)[attribut];
};

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

let exports = {
    "一级": 一级,
    "二级": 二级,
    "公共": 公共,
    "属性": 属性,
    "imageDecrypt": 图片解密,
    "imgDec": 图片解密2
}
try{
    let exportskeys = Object.keys(exports);
    let getexp = 公共() || {};
    let arr = getexp.exports || [];
    arr.forEach(it => {
        if(!exportskeys.includes(it.key)){
            let parse = eval('('+it.type+'())');
            exports[it.key] = parse[it.key];
        }
    })
}catch(e){}

$.exports = exports