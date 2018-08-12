/* eslint-env node */
'use strict';

const path = require('path');
const { createOutput, summarizeAll } = require('broccoli-concat-analyser');

const REQUEST_PATH = '/_analyze';
const concatStatsPath = path.join(process.cwd(), './concat-stats-for');

module.exports = {
  name: 'ember-cli-concat-analyzer',

  serverMiddleware(config) {
    if (this.isEnabled()) {
      this.addAnalyzeMiddleware(config);
    }
  },

  addAnalyzeMiddleware(config) {
    let app = config.app;

    app.use(REQUEST_PATH, (req, res /*, next*/) => {

      if (!this.hasStats()) {
        res.sendFile(path.join(__dirname, 'lib', 'output', 'no-stats', 'index.html'));
      } else {
        summarizeAll(concatStatsPath);
        let content = createOutput(concatStatsPath);
        res.send(content);
      }
    });
  },

  isEnabled() {
    return true;
  },

  hasStats() {
    return !!process.env.CONCAT_STATS;
  }
};
