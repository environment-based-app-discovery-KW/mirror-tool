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

      console.log(body);
      //TODO: sync response to db, save file to path
    });
  }));
};

