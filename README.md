# fis-postpackager-amdclean

Packed AMD File And Converts AMD Code To Standard JavaScript.
## use
```node
npm install --save fis-postpackager-amdclean
```

## settings
```javascript
//file : path/to/project/fis-conf.js
fis.match('::package', {
    postpackager: fis.plugin('amdclean', {
        source: 'src/main.js',
        output: '../output/main-min.js'
    })
});

or

fis.match('::package', {
    postpackager: fis.plugin('amdclean', {
        source: ['src/main.js', 'lib/main.js'],
        output: ['../output/src-min.js', '../output/lib-main.js']
    })
});

```