# fis3-postpackager-amdclean

Packed AMD File And Converts AMD Code To Standard JavaScript.
## use
```node
npm install --save fis-postpackager-amdclean
```

## settings
```javascript
fis.match('::package', {
    packager: fis.plugin('map', {
	    '/lib/min.js': '/sdk/**.js'
	}),
    postpackager: [
        fis.plugin('amdclean', {
            config: [
	            {
	                main: '/sdk/main.js', //入口文件
	                release: '/lib/min.js' //输出文件
	            }
            ],
            minify: true, //是否压缩
            debug: true //是否打印日志
        })
    ]
});

```