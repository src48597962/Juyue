var lazy = $('').lazyRule((MY_HOME) => {
    var html = JSON.parse(request(input).match(/r player_.*?=(.*?)</)[1])
    var url = html.url
    if (html.encrypt == '1') {
        url = unescape(url);
    } else if (html.encrypt == '2') {
        url = unescape(base64Decode(url));
    }
    
        eval(request(MY_HOME + '/static/js/playerconfig.js'));
            var jx = MacPlayerConfig.player_list[html.from].parse;
            if (jx == '') {
                jx = MacPlayerConfig.parse
            }
            
   log(jx)
                eval(request(jx + url, {
            headers: {
                'Referer': MY_URL
            }
        }).match(/var config = {[\s\S]*?}/)[0])
        eval(getCryptoJS())

       
        var play = JSON.parse(post(jx.replace('?url=', 'api_config.php'), {
            body: {
                time: config.time,
                url: config.url,
                key: config.key,
                vkey: config.vkey
            }
        }))
        
        if (play.code==200){
            
            return play.url+"#isVideo=true#"
        }else{
            
            return url
        }

     
},MY_HOME)