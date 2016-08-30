/*
 * @Author: wangchao
 * @Date:   2016-08-24 20:17:17
 * Packed AMD File And Converts AMD Code To Standard JavaScript
 * @Last Modified by:   wangchao
 * @Last Modified time: 2016-08-30 20:06:33
 */
'use strict';
const amdclean = require('amdclean');
const childProcess = require('child_process');
const iconv = require('iconv-lite');
const fs = require('fs');
const uglifyJs = require('uglify-js');
module.exports = function(res, packs, config) {
	/*入口主函数*/
	var main = (function() {
		if (typeof(config.source) == 'object') {
			for (var i = 0, len = config.source.length; i < len; i++) {
				doAction(config.source[i], config.output[i]);
			}
		} else {
			doAction(config.source, config.output);
		}
	})();

	function doAction(source, output) {
		source = source.replace(/.js$/i, '');
		var baseUrl = source.substr(0, source.lastIndexOf('/')), //源文件目录
			baseMod = source.substr(source.lastIndexOf('/') + 1); //入口模块

		//requirejs合并文件输出
		var exec = childProcess.exec,
			command = exec('node ./node_modules/requirejs/bin/r.js -o baseUrl=' + baseUrl + ' name=' + baseMod + ' out=' + output + ' optimize=none');

		//命令退出执行文件处理
		command.on('exit', function(code) {
			fs.readFile(output, function(err, data) {
				if (err)
					console.log("打包文件失败 " + err);
				else {
					//把数组转换为utf8中文  
					var content = iconv.decode(data, 'utf8');

					//清理amd
					content = amdclean.clean(content);

					if (config.minify) {
						//压缩脚本
						var ret = uglifyJs.minify(content, {
							fromString: true
						});
						content = ret.code;
					}

					//写入文件
					fs.writeFile(output, content, function(err) {
						if (err)
							console.log("清理AMD失败 " + err);
						else
							console.log("打包文件成功");
					});
				}
			});
		});

        command.stdout.on('data', function (data) {
            if (!config.debug) {
                return;
            }
            console.log(data);
        });
	}
}