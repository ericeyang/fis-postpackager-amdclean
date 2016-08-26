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
        source: 'src/MasterTV.js',
        output: '../output/MasterTV-min.js'
    })
});
```
