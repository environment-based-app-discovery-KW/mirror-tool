const fs = require("fs");
const readMeta = require("./methods/readMeta");
const syncBatch = require("./methods/syncBatch");

(async () => {
  let batchNumber = 0;
  while (true) {
    let syncResult = await syncBatch(batchNumber);
    if (syncResult.syncFinished) {
      break;
    }
    batchNumber++;
  }
  let meta = { ...readMeta(), last_sync_ts: +new Date() };
  fs.writeFileSync('meta.json', JSON.stringify(meta, null, 4), { encoding: "utf8" });
  console.log("\nall done.");
  process.exit();
})();
