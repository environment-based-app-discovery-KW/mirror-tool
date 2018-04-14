const fs = require('fs');
const configFilePath = 'config.json';

module.exports = function readConfig() {
  return JSON.parse(fs.readFileSync(configFilePath, { encoding: "utf8" }));
};

