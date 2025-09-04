//此为getapp壳子专用结构
let parse = {
    作者: "",
    频道: {
        包含项: ['排行', '分类', '周表'],
        页面标识: "#gameTheme#",
        沉浸: {
            图片: "",
            高度: 110
        }
    },
    二级标识: "#gameTheme#",
    配置: {
        de_key: "",
        host: "",
        //init: 120, //可选项，qijiappapi为120，才需要
        //rank: 1 //可选项，没有主页推荐，才需要
    },
    模板: {
        id: '1756086251723',
        name: 'GetAppApi'
    },
    /*//此为自定义解析逻辑，需要则去除注释
    解析: function(url, appconfig){
        appconfig = parse.配置;
        let {url,parse_api_url,token,from} = JSON.parse(url);
        ...
    }
    */
};