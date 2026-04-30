let d = [];
d.push({
    title: '分析',
    desc: '输入网站url',
    url: $.toString(() => {
        input = input.trim();
        if(!input){
            return 'toast://输入不能为空';
        }
        
        return 'hiker://empty';
    }),
    col_type: 'input',
    extra: {
        defaultValue: ''
    }
})



setResult(d);