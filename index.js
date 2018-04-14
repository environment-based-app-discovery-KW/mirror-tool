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
  console.log("\nall done.");
})();
