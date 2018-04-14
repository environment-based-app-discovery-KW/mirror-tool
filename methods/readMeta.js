const fs = require('fs');
const metaFilePath = 'meta.json';

module.exports = function readMeta() {
  if (!fs.existsSync(metaFilePath)) {
    let defaultMeta = {
      last_sync_ts: 0,
    };
    fs.writeFileSync(metaFilePath, JSON.stringify(defaultMeta, null, 4), { encoding: "utf8" });
    return defaultMeta;
  }
  return JSON.parse(fs.readFileSync(metaFilePath, { encoding: "utf8" }));
}

