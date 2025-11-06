function aytmParse(vipUrl) {
    let srcHome = getPublicItem('聚阅', '');
    if (!srcHome) {
        return "toast://需要先有聚阅并正常打开一次";
    }
    
    let {lazy} = $.require(srcHome.replace(/[^/]*$/, '') + 'jiexi/SrcInvoke.js');
    return lazy(vipUrl);
}