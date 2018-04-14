const readMeta = require("./methods/readMeta");
const readConfig = require("./methods/readConfig");
const syncBatch = require("./methods/syncBatch");

const meta = readMeta();
const config = readConfig();
syncBatch(config.canonical_server, meta.last_sync_ts);