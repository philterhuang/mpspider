const AnyProxy = require('anyproxy');
const anyproxyRule = require('./lib/anyproxyRule.js');

module.exports = (event, cacheFilePath, port = 8001, spiderOptions = {}) => {
    return new Promise((resolve, reject) => {
        if (!AnyProxy.utils.certMgr.ifRootCAFileExists()) {
            AnyProxy.utils.certMgr.generateRootCA((error, keyPath) => {
                // let users to trust this CA before using proxy
                if (!error) {
                    const certDir = require('path').dirname(keyPath);
                    console.log('The cert is generated at', certDir);
                    console.log('HTTPS配置查看文档：http://anyproxy.io/cn/#%E8%AF%81%E4%B9%A6%E9%85%8D%E7%BD%AE');
                    const isWin = /^win/.test(process.platform);
                    if (isWin) {
                        exec('start .', {cwd: certDir});
                    } else {
                        exec('open .', {cwd: certDir});
                    }
                } else {
                    console.error('error when generating rootCA', error);
                }
            });
            // 拒绝掉，先安装
            return reject('rootCA');
        }

        
        // 监听到事件，表明完成列表抓取
        event.on('end', data => {
            resolve(data);
        });
        event.on('stop', () => {
            proxyServer.close();
        });
        const rule = anyproxyRule(event, cacheFilePath);

        const options = Object.assign(
            {
                port: port || 8001,
                rule: rule,
                webInterface: {
                    enable: true,
                    webPort: 8002
                },
                throttle: 10000,
                forceProxyHttps: false,
                wsIntercept: false, // 不开启websocket代理
                silent: true
            },
            spiderOptions.anyproxy || {}
        );
        const proxyServer = new AnyProxy.ProxyServer(options);
        proxyServer.on('ready', e => {
            event.emit('anyproxy_ready', port || 8001);
        });
        proxyServer.on('error', e => {
            reject(e);
        });
        proxyServer.start();
    });
};
