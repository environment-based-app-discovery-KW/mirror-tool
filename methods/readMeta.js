const fs = require('fs');

module.exports = function readMeta() {
  if (!fs.existsSync('meta.json')) {
    let defaultMeta = {
      last_sync_ts: 0,
    };
    fs.writeFileSync('meta.json', JSON.stringify(defaultMeta, null, 4), { encoding: "utf8" });
    return defaultMeta;
  }
  return JSON.parse(fs.readFileSync('meta.json', { encoding: "utf8" }));
}

