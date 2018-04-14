const urljoin = require('url-join');
const request = require('request');

module.exports = function syncBatch(server_url, last_sync_ts, batch_number = 0) {
  return new Promise(((resolve, reject) => {
    let endpoint = urljoin(server_url, 'sync');
    request({
      url: endpoint,
      method: "POST",
      body: {
        last_sync_ts,
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

