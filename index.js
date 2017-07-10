/* eslint-env node */
'use strict';

const path = require('path');
const Watcher = require('broccoli').Watcher;
const Builder = require('broccoli').Builder;
const getMiddleware = require('broccoli').getMiddleware;
const mergeTrees = require('broccoli-merge-trees');
const SummaryCreator = require('./lib/summary-creator');

const REQUEST_PATH = '/_analyze';

module.exports = {
  name: 'ember-cli-concat-analyzer',

  serverMiddleware(config) {
    if (this.isEnabled()) {
      this.addAnalyzeMiddleware(config);
    }
  },

  addAnalyzeMiddleware(config) {
    let app = config.app;
    let appWatcher = config.options.watcher;

    app.use(REQUEST_PATH, (req, res, next) => {

      if (!this.middleware) {
        // wait for the app build to have finished before running our separate watcher
        return appWatcher
          .then(() => {
            let watcher = new Watcher(this.getBuilder());
            watcher.start();

            this.middleware = getMiddleware(watcher);
            this.middleware(req, res, next);
          })
          .catch((err) => {
            console.error(err);
            res.send(err.message);
          });
      }

      this.middleware(req, res, next);
    });
  },

  isEnabled() {
    return true;
  },

  hasStats() {
    return !!process.env.CONCAT_STATS;
  },

  getBuilder() {
    let tree;
    if (this.hasStats()) {
      tree = this.getAnalyzerTree();
    } else {
      tree = this.treeGenerator(path.join(__dirname, 'lib', 'output', 'no-stats'));
    }
    return new Builder(tree);
  },

  getAnalyzerTree() {
    let outDir = path.join(require.resolve('broccoli-concat-analyser'), '..', '..', 'output');
    let statsPath = path.join(process.cwd(), 'concat-stats-for');

    let staticAssetsTree = this.treeGenerator(outDir);
    let summaryTree = new SummaryCreator(statsPath);

    return mergeTrees([staticAssetsTree, summaryTree]);
  }
};
