const mpath = "hiker://files/plugins/Chaquopy";

function getMP(name) {
    return mpath + "/" + name;
}

function initPython() {
    initChaquopy(getMP("chaquopy.apk"));
    findJavaClass(getMP("classes.dex"), 'com.chaquo.python.android.AndroidPlatform', getMP('arm64-v8a'));
}
initPython();


const FileUtil = com.example.hikerview.utils.FileUtil;
const File = java.io.File;
const Integer = java.lang.Integer;

let AndroidPlatform = new org.mozilla.javascript.NativeJavaClass(this, findJavaClass("com.chaquo.python.android.AndroidPlatform"));
let Python = new org.mozilla.javascript.NativeJavaClass(this, findJavaClass("com.chaquo.python.Python"));
let PyObject = new org.mozilla.javascript.NativeJavaClass(this, findJavaClass("com.chaquo.python.PyObject"));
let Kwarg = new org.mozilla.javascript.NativeJavaClass(this, findJavaClass("com.chaquo.python.Kwarg"));

if (!Python.isStarted()) {
    let androidPlatform = new AndroidPlatform(getCurrentActivity());
    Python.start(androidPlatform);

    let sys = Python.getInstance().getModule("sys");
    let spath = sys.get("path").asList();
    spath.add(spath.size(), PyObject.fromJava(getPath(getMP("libs_py")).slice(7)));
}


let py = Python.getInstance();

let machinery = py.getModule("importlib.machinery");




let Builtins = py.getBuiltins();

//构建海阔环境模块
let hkrule = (typeof MY_RULE !== "undefined") && MY_RULE ? MY_RULE : {};
let hiker = py.getModule("base.hiker");
hiker.put("MY_TITLE", MY_RULE.title || "");
hiker.put("MY_TICKET", MY_TICKET);
hiker.put("CALLBACK_KEY", CALLBACK_KEY);
hiker.put("my_rule", JSON.stringify(MY_RULE));


let NativePyApp = py.getModule("app");
//let NativePyApp = machinery.callAttr("SourceFileLoader", "app", getPath(getMP("libs_py/application/json.py")).slice(7)).callAttr("load_module");


function evalCode(...args) {
    return NativePyApp.callAttr("call_global_function", ["eval"].concat(args));
}

function execCode(...args) {
    return NativePyApp.callAttr("call_global_function", ["exec"].concat(args));
}

function wrapperJsFunc(func) {
    return NativePyApp.callAttr("wrapper_jsfunc", [func]);
}

function wrapperPyFunc(pyObject) {
    return function(...arr) {
        arr = arr.map(v => fromJs(v));
        return pyToJs(pyObject.call(arr));
    }
}

function callFunc(pyObject, name, ...arr) {
    arr = arr.map(v => fromJs(v));
    return pyToJs(pyObject.callAttr(name, arr));
}

function callSyncFunc(pyObject, name, ...arr){
    arr = fromJs(arr);
    return pyToJs(NativePyApp.callAttr("sync_wrapper",[pyObject.get(name), arr]));
}

function pyToJs(pyObject) {
    if (pyObject == null) {
        return null;
    }
    let type = String(pyObject.type().toString()).replace("<class '", "").replace("'>", "");
    //log(type)
    if (type === "list" || type === "tuple" || type === "set") {
        if (type === "set") {
            pyObject = Builtins.callAttr("list", [pyObject]);
        }
        let arr = [];
        let list = pyObject.asList();
        let size = list.size();

        for (let i = 0; i < size; i++) {
            arr.push(pyToJs(list.get(i)));
        }
        return arr;
    } else if (type === "int" || type === "float") {
        return Number(pyObject.toDouble());
    } else if (type === "bool") {
        return Boolean(pyObject.toBoolean());
    } else if (type === "dict") {
        let obj = {};
        for (let item of pyObject.asMap().entrySet()) {
            obj[String(item.getKey().toString())] = pyToJs(item.getValue());
        }
        return obj;
    } else if (type === "str") {
        return String(pyObject.toString());
    } else if (type === "function") {
        return wrapperPyFunc(pyObject);
    } else if(type === "bytes"){
        return pyObject.toJava(java.lang.Class.forName("[B"));
    } else {
        try {
            let clazz = java.lang.Class.forName(type, javaLoader);
            if (clazz !== null) {
                return pyObject.toJava(clazz);
            }
        } catch (e) {

        }
    }
    return pyObject;
}

function toJson(pyObj) {
    return JSON.parse(NativePyApp.callAttr("json_stringify", [pyObj]).toString());
}

function toPyJson(json) {
    return NativePyApp.callAttr("json_parse", [JSON.stringify(json)]);
}
const cPath = getPath("hiker://files/_cache/py/").slice(7);

function runPy(path, mname, nocache) {
    let name = "";
    let mpath = "";
    if (path.startsWith("http")) {
        if (path.endsWith(".py")) {
            name = path.split("/").pop().split(".")[0];
        } else {
            name = md5(path);
        }
        if(nocache){
           downloadFile(path, (mpath = cPath + (mname || name) + ".py"));
        }else {
           requireDownload(path, (mpath = cPath + (mname || name) + ".py"));
        }
    } else {
        if(path.startsWith('hiker://')){
            mpath = getPath(path);
        }
        mpath = path.replace("file://", "");
    }
    return machinery.callAttr("SourceFileLoader", mname || name, mpath).callAttr("load_module");
}

function fromJs(obj) {
    let type = Object.prototype.toString.call(obj);
    if ("[object Array]" === type) {

        let list = Builtins.callAttr("list");
        for (let value of obj) {
            list.callAttr("append", fromJs(value));
        }
        return PyObject.fromJava(list);
    } else if ("[object Object]" === type) {
        let dict = Builtins.callAttr("dict");
        for (let [key, value] of Object.entries(obj)) {
            dict.callAttr("update", Kwarg(String(key), fromJs(value)));
        }
        return dict;
    } else if ("[object Undefined]" === type || "[object Null]" === type) {
        return null;
    } else if ("[object Function]" === type) {
        return wrapperJsFunc(obj);
    } else if ("[object Date]" === type) {
        return obj.getTime();
    } else if ("[object Set]" === type) {
        let set = Builtins.callAttr("set");
        for (let value of obj) {
            set.callAttr("add", fromJs(value));
        }
        return set;
    } else if ("[object Map]" === type) {
        let dict = Builtins.callAttr("dict");
        for (let [key, value] of obj.entries()) {
            dict.callAttr("update", Kwarg(String(key), fromJs(value)));
        }
        return dict;
    }
    /* else if("[object Number]"===type&&isInteger(obj)){
            return new Integer(obj);
        }*/
    return obj;
    //return PyObject.fromJava(obj);
}

function isInteger(obj) {
    return ~~obj == obj;
}

function toInt(num) {
    return new Integer(num);
}
Builtins.put("print", hiker.get("log"));

// 新增方法

function callFuncApply(pyObject, name, argArr) {
    const args = argArr.map(v => fromJs(v));
    const fullArgs = [name].concat(args);
    const ret = pyObject.callAttr.apply(pyObject, fullArgs);
    return pyToJs(ret);
}
// 新增：异步调用py，带超时
function callFuncWithTimeout(pyObject, name, argArr, timeoutMs = 8000) {
    return new Promise(function(resolve, reject) {
        let isDone = false;
        // 超时计时器
        const timer = setTimeout(function() {
            if (!isDone) {
                isDone = true;
                reject(new Error("PY调用超时:" + timeoutMs + "ms"));
            }
        }, timeoutMs);

        // 异步执行python调用（Chaquopy需要放到子线程执行，防止卡住JS主线程）
        new java.lang.Thread(function() {
            try {
                const ret = callFuncApply(pyObject, name, argArr);
                if (!isDone) {
                    isDone = true;
                    clearTimeout(timer);
                    resolve(ret);
                }
            } catch (e) {
                if (!isDone) {
                    isDone = true;
                    clearTimeout(timer);
                    reject(e);
                }
            }
        }).start();
    });
}
/*
function runPyGetReuslt(pyurl, apitype, ...arr){
    try{
        let pyModule = GM.get('py_'+pyurl);
        if(!pyModule){
            pyModule = runPy(pyurl).callAttr("Spider");
            callFunc(pyModule, "init", []);
            GM.put('py_'+pyurl, pyModule);
            let keys = GM.listKeys();
            if(keys.length>10){
                GM.clear(keys[0]);
            }
        }
        return callFuncApply(pyModule, apitype, arr);
    }catch(e){
        log('runpy发生异常' + e.message);
    }
    return {};
}
*/

// 改造后的 runPyGetReuslt
async function runPyGetReuslt(pyurl, apitype, ...arr){
    const timeout = 8000; // 8秒超时，按需修改
    try{
        let pyModule = GM.get('py_'+pyurl);
        if(!pyModule){
            pyModule = runPy(pyurl).callAttr("Spider");
            callFunc(pyModule, "init", []);
            GM.put('py_'+pyurl, pyModule);
            let keys = GM.listKeys();
            if(keys.length>10){
                GM.remove(keys[0]); // 原代码GM.clear会清空全部，这里改成删除最早一条，修复bug
            }
        }
        // 带超时调用
        const res = await callFuncWithTimeout(pyModule, apitype, arr, timeout);
        return res;
    }catch(e){
        log('runpy发生异常: ' + e.message);
        // 超时的时候，可以额外记录日志
        if(e.message.indexOf("PY调用超时") >=0 ){
            log(`【PY超时】${pyurl} -> ${apitype}`);
        }
    }
    return {};
}


$.exports = {
    PyObject,
    callSyncFunc,
    Kwarg,
    callFunc,
    evalCode,
    execCode,
    runPy,
    toJson,
    toPyJson,
    Builtins,
    wrapperJsFunc,
    pyToJs,
    fromJs,
    toInt,
    runPyGetReuslt
}