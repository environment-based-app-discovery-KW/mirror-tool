const fs = require('fs');
const _ = require('lodash');
const configFilePath = 'config.json';

module.exports = _.memoize(function readConfig() {
  return JSON.parse(fs.readFileSync(configFilePath, { encoding: "utf8" }));
});

