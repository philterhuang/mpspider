const spider = require('@ksky521/spider');
const Queue = require('./lib/Queue');
const getMidFromUrl = require('./lib/getMidFromUrl');
const getMdArticle = require('./lib/getMdArticle');
const fs = require('fs-extra');

function self(url, jsonFilePath, options) {
    return new Promise((resolve, reject) => {
        if (!url) {
            reject('url is empty');
        }

        spider.Spider(
            url,
            (err, data) => {
                if (!err) {
                    let items = data.items;
                    if (!Array.isArray(items)) {
                        if (items.mid) {
                            items = [items];
                        } else {
                            reject('getList Error: ' + JSON.stringify(data));
                        }
                    }
                    const queue = new Queue(getMdArticle, 2);
                    items.forEach(({url, mid, title}, i) => {
                        queue.add([mid, url, options]);
                    });
                    queue.run().then(data => {
                        data = data.filter(item => {
                            return item && item.content;
                        });
                        fs.writeJSONSync(jsonFilePath, data);
                        resolve(data);
                    });
                } else {
                    reject(err);
                }
                // content = toMd(content, { gfm: true });
                // console.log(title, content);
            },
            {
                items: {
                    selector: '#js_content a',
                    handler: (dom, $) => {
                        let url = dom.attr('href');
                        return {
                            mid: getMidFromUrl(url),
                            url,
                            title: dom.text().trim()
                        };
                    }
                }
            }
        );
    });
}

// const url = 'https://mp.weixin.qq.com/s/CIPosICgva9haqstMDIHag';

module.exports = self;
