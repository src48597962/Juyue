js:
let picUrl = "http://cdn.dgjinmei.com/ig/user/082114/796ef762e4df171f.ceb";
let picErrorUrl = "https://live.fanmingming.cn/tv/CCTV--.png";

let decode = $().image(() => {
    if (input == null) {
        return fetch("http://img.soogif.com/ED6s2k6jg8P6R7iWfHboLlXtHg3f4hxQ.gif_s300x0", {
            inputStream: true
        });
    }

});

let d = [];
for (let i = 0; i < 20; i++) {
    d.push({
        title: i,
        img: picErrorUrl.replace('--', i+1) + decode,
        col_type: 'icon_2_round',
        url: 'toast://'+i
    })
}
setResult(d);