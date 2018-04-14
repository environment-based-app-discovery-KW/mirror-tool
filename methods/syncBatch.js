const urljoin = require('url-join');
const request = require('request');
const fs = require('fs');
const path = require('path');
const http = require('http');
const mysql = require('mysql');
const readConfig = require("./readConfig");
const readMeta = require("./readMeta");
const config = readConfig();
const mysqlConnection = mysql.createConnection({
  host: config.mysql_host,
  database: config.mysql_database,
  user: config.mysql_username,
  password: config.mysql_password,
  multipleStatements: true,
});

module.exports = function syncBatch(batch_number = 0) {
  console.log("> performing batch update " + batch_number);
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
      let promises = [];
      tables.forEach(tableName => {
        body[tableName].forEach(record => {

          // 下载之前没有下载过的文件包
          if (record.code_bundle_hash) {
            let filePath = path.join(config.file_bucket_path, record.code_bundle_hash);
            if (!fs.existsSync(filePath)) {
              console.log("  > fetching file " + record.code_bundle_hash);
              let file = fs.createWriteStream(filePath);
              promises.push(new Promise(resolve => {
                http.get(urljoin(config.canonical_server, 'file/download?hash=' + record.code_bundle_hash), function (response) {
                  response.pipe(file);
                  file.on('finish', function () {
                    file.close(() => {
                      console.log("  < done fetching file " + record.code_bundle_hash);
                      resolve();
                    });
                  });
                });
              }));
            }
          }

          sql.push(`INSERT INTO ${tableName}` +
            ` (${Object.keys(record).join(',')}) values` +
            ` (${Object.keys(record).map(_ => `"${typeof record[_] === 'string' ? record[_].replace(/([\\"])/g, "\\$1") : record[_]}"`).join(',')})` +
            ` ON DUPLICATE KEY UPDATE ${Object.keys(record).filter(_ => _ !== 'id').map(_ => `\`${_}\`=VALUES(\`${_}\`)`).join(',')};`)
          //TODO: 一个INSERT，多个values tuple，效率更高
        });
      });

      if (sql.length) {
        promises.push(new Promise(resolve => {
          console.log(`  > executing sql (${sql.length} queries)`);
          mysqlConnection.query(sql.join(''), (err, results) => {
            console.log("  < done executing sql");
            resolve(results);
          });
        }));
      }

      resolve(Promise.all(promises).then(() => ({ syncFinished })));
    });
  }));
};

