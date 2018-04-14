const urljoin = require('url-join');
const request = require('request');
const fs = require('fs');
const path = require('path');
const http = require('http');
const readConfig = require("./readConfig");
const readMeta = require("./readMeta");

module.exports = function syncBatch(batch_number = 0) {
  let config = readConfig();
  let meta = readMeta();
  return new Promise(((resolve, reject) => {
    let endpoint = urljoin(config.canonical_server, 'sync');
    request({
      url: endpoint,
      method: "POST",
      body: {
        last_sync_ts: meta.last_sync_ts,
        batch_number,
      },
      json: true,
    }, (err, response, body) => {
      if (err) {
        reject(err);
        return;
      }

      let itemsPerBatch = body.$items_per_batch;
      let tables = Object.keys(body).filter(_ => !_.startsWith('$'));
      let syncFinished = tables.every(_ => body[_].length < itemsPerBatch);
      let sql = [];
      tables.forEach(tableName => {
        body[tableName].forEach(record => {

          // 下载之前没有下载过的文件包
          if (record.code_bundle_hash) {
            let filePath = path.join(config.file_bucket_path, record.code_bundle_hash);
            if (!fs.existsSync(filePath)) {
              let file = fs.createWriteStream(filePath);
              http.get(urljoin(config.canonical_server, 'file/download?hash=' + record.code_bundle_hash), function (response) {
                response.pipe(file);
                //TODO: promise cannot resolve unless all downloads are done.
              });
            }
          }

          sql.push(`INSERT INTO ${tableName}` +
            ` (${Object.keys(record).join(',')}) values` +
            ` (${Object.keys(record).map(_ => `"${typeof record[_] === 'string' ? record[_].replace(/([\\"])/g, "\\$1") : record[_]}"`).join(',')})` +
            ` ON DUPLICATE KEY UPDATE`)
          //TODO: 一个INSERT，多个values tuple，效率更高
        });
      });
      console.log(sql.join('\n'));
      //TODO: sync response to db, save file to path
    });
  }));
};

