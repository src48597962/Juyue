function header(arr, rule) {
	var X5二级 = getPath('hiker://files/rules/dzHouse/html/二级新样式.html');
	if (fileExist(X5二级) == false) {
		var 远程二级 = request('http://123.56.105.145/weisyr/二级新样式.html');
		if (远程二级.indexOf("bg_maker") > 0) {
			writeFile(X5二级, 远程二级);
		} else {
			confirm({
				title: '❌错误提示',
				content: '二级样式文件导入出错'
			})
		}
	}
	addListener('onClose', $.toString(() => {
		clearVar('X5二级加载');
		clearVar('二级样式数据');
	}));
	clearVar('二级样式数据');

	putVar('主题颜色', getItem('主题颜色','#F4A7B9'))
	var data = {
		片名: rule.片名 || '',
		图片: rule.图片 || '',
		年份: rule.年份 || '',
		类型: rule.类型 || '',
		状态: rule.状态 || '',
		附加: rule.附加 || '',  //里面用<br>换行
	}
	//putVar('二级样式数据', data);
	
	putVar('执行递增', (parseInt(getVar('执行递增', '0'))+1).toString())
	//log(getVar('执行递增'))
	/*
	var ver = getAppVersion();
	if (ver >= 3409) {
		cacheCode($.toString((data) => {
			putVar("二级样式数据", data);
		}, data));
	}
*/
	let Arr = [{
		desc: '300&&list',
		url: X5二级,
		col_type: 'x5_webview_single',
		extra: {
			ua: MOBILE_UA,
			autoPlay: true,
			imgLongClick: false,
			showProgress: false,
            js: $.toString((data)=>{
                fba.putVar('二级样式数据', JSON.stringify(data));
            }, data),
            jsLoadingInject: true
		}
	}];
	if (arr) arr.push(Arr[0]);
	return arr || Arr
}