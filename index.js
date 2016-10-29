/*
 * @Author: wangchao
 * @Date:   2016-08-24 20:17:17
 * Packed AMD File And Converts AMD Code To Standard JavaScript
 * @Last Modified by:   wangchao
 * @Last Modified time: 2016-10-29 16:37:13
 */
'use strict';
const amdclean = require('amdclean');
const childProcess = require('child_process');
const iconv = require('iconv-lite');
const fs = require('fs');
const uglifyJs = require('uglify-js');
const deasync = require('deasync');

module.exports = function (ret, pack, settings, opt) {
    // 入口主函数
    var main = (function () {
        if (settings.config) {
            for (var i = 0, len = settings.config.length; i < len; i++) {
                doAction(settings.config[i]);
            }
        }
    })();

    function doAction(config) {
        var file = ret['pkg'][config.release];
        if(!file)return;

        var content = '';
        var isReturn = false;

        var source = config.main.replace(/.js$/i, '').replace(/^\//, '');
        var baseUrl = source.substr(0, source.lastIndexOf('/')); // 源文件目录
        var baseMod = source.substr(source.lastIndexOf('/') + 1); // 入口模块

        // requirejs合并文件输出
        var exec = childProcess.exec;
        var tempFile = '../'+(+new Date())+'.js';
        var command = exec('node ./node_modules/requirejs/bin/r.js -o baseUrl=' + baseUrl + ' name=' + baseMod + ' out=' + tempFile + ' optimize=none');

        // 命令退出执行文件处理
        command.on('exit', function (code) {
            fs.readFile(tempFile, function (err, data) {
                if (err) {
                    console.log('打包文件失败 ' + err);
                } else {
                    // 把数组转换为utf8中文
                    content = iconv.decode(data, 'utf8');

                    // 清理amd
                    content = amdclean.clean(content);

                    if (settings.minify) {
                        // 压缩脚本
                        var ret = uglifyJs.minify(content, {
                            fromString: true
                        });
                        content = ret.code;
                    }

                    console.log('打包文件成功');
                    fs.unlinkSync(tempFile);
                }
                isReturn = true;
            });
        });

        command.stdout.on('data', function (data) {
            if (!settings.debug) {
                return;
            }

            console.log(data);
        });

        // 判断是否返回content，如果没有继续等待
        while (!isReturn) {
            try {
                deasync.runLoopOnce();
            }
            catch (e) {
                console.log(e);
                isReturn = true;
            }
        }

        if(settings.domain){
            file.domain = settings.domain;
        }
        if(settings.url){
            file.url = settings.url + file.url.substr(file.url.lastIndexOf('/')+1);
        }
        
        file.setContent(content);

        fis.set(config.release, file.getUrl());
    }
};
