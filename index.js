/*
 * @Author: wangchao
 * @Date:   2016-08-24 20:17:17
 * Packed AMD File And Converts AMD Code To Standard JavaScript
 * @Last Modified by:   ericeyang
 * @Last Modified time: 2018-04-25 22:00:00
 */
'use strict';
const amdclean = require('amdclean');
const childProcess = require('child_process');
const iconv = require('iconv-lite');
const fs = require('fs');
const uglifyJs = require('uglify-js');
const deasync = require('deasync');

module.exports = function(ret, pack, settings, opt) {
  // 入口主函数
  var main = (function() {
    if (settings.config) {
      for (var i = 0, len = settings.config.length; i < len; i++) {
        doAction(settings.config[i]);
      }
    }
  })();

  // 同步创建文件夹
  function mkdirSync(url, mode, cb) {
    var arr = url.split('/');
    mode = mode || '0755';
    cb = cb || function() {};
    if (arr[0] === '.') {
      //处理 ./aaa
      arr.shift();
    }
    if (arr[0] === '..') {
      //处理 ../ddd/d
      arr.splice(0, 2, arr[0] + '/' + arr[1]);
    }
    function inner(cur) {
      if (!fs.existsSync(cur)) {
        //不存在就创建一个
        fs.mkdirSync(cur, mode);
      }
      if (arr.length) {
        inner(cur + '/' + arr.shift());
      } else {
        cb();
      }
    }
    arr.length && inner(arr.shift());
  }

  // 删除目录及下面的文件
  function deleteFolderRecursive(dirname) {
    var files = [];
    if (fs.existsSync(dirname)) {
      files = fs.readdirSync(dirname);
      files.forEach(function(file, index) {
        var curPath = dirname + '/' + file;
        if (fs.statSync(curPath).isDirectory()) {
          // recurse
          deleteFolderRecursive(curPath, true);
        } else {
          // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(dirname);
    }
  }

  function doAction(config) {
    var rootDir = '../../.amdclean';
    var content = '';
    var isReturn = false;
    var file = ret['pkg'][config.release];

    if (!file) {
      return;
    }

    var source = config.main.replace(/.js$/i, '').replace(/^\//, '');
    var baseUrl = source.substr(0, source.lastIndexOf('/')); // 源文件目录
    var baseMod = source.substr(source.lastIndexOf('/') + 1); // 入口模块

    // 遍历相关模块
    var files = Object.values(ret.src).filter(function(v) {
      return (new RegExp('^/' + baseUrl + '/.*.js$')).test(v.subpath);
    });

    // 逐个写入临时文件夹 `../../.amdclean` 下
    files.map(function writeFile(f, index) {
      var tempFile = rootDir + f.subpath;
      var tempFilePath = tempFile.substr(0, tempFile.lastIndexOf('/'));
      var tempFileName = tempFile.substr(tempFile.lastIndexOf('/') + 1);
      var fContent =
        f.subpath === config.main
          ? f._content.replace(new RegExp(baseUrl, 'g'), '.')
          : f._content;
      var fileCnt = new Buffer(fContent);
      mkdirSync(tempFilePath, 0, function(e) {
        if (e) {
          console.log('出错了');
        } else {
          var fd = fs.openSync(tempFile, 'w', '0644');
          fs.writeSync(fd, fileCnt);
        }
      });
    });

    baseUrl = rootDir + '/' + baseUrl;

    // requirejs合并文件输出
    var exec = childProcess.exec;
    var tempFile = rootDir + '/' + +new Date() + '.js';
    var command = exec(
      'node ./node_modules/requirejs/bin/r.js -o baseUrl=' +
        baseUrl +
        ' name=' +
        baseMod +
        ' out=' +
        tempFile +
        ' optimize=none'
    );

    // 命令退出执行文件处理
    command.on('exit', function(code) {
      fs.readFile(tempFile, function(err, data) {
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
        }
        isReturn = true;
      });
    });

    command.stdout.on('data', function(data) {
      if (!settings.debug) {
        return;
      }

      console.log(data);
    });

    // 判断是否返回content，如果没有继续等待
    while (!isReturn) {
      try {
        deasync.runLoopOnce();
      } catch (e) {
        console.log(e);
        isReturn = true;
      }
    }

    if (settings.domain) {
      file.domain = settings.domain;
    }
    if (settings.url) {
      file.url = settings.url + file.url.substr(file.url.lastIndexOf('/') + 1);
    }

    file.setContent(content);

    fis.set(config.release, file.getUrl());

    deleteFolderRecursive(rootDir + '/');
  }
};
