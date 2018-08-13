/* eslint-env node */
'use strict';

const path = require('path');
const { createOutput, summarizeAll } = require('broccoli-concat-analyser');
const sane = require('sane');
const hashFiles = require('hash-files').sync;
const tmp = require('tmp');

const REQUEST_PATH = '/_analyze';

module.exports = {
  name: 'ember-cli-concat-analyzer',
  _hashedFiles: {},

  init() {
    this._super.init && this._super.init.apply(this, arguments);
    this.concatStatsPath = tmp.dirSync().name;

    // Enable concat stats by default, as setting this later will not work
    process.env.CONCAT_STATS = true;

    // @todo check for older broccoli-concat that does not support this:
    process.env.CONCAT_STATS_PATH = this.concatStatsPath;
  },

  serverMiddleware(config) {
    if (this.isEnabled()) {
      this.addAnalyzeMiddleware(config);
    }
  },

  addAnalyzeMiddleware(config) {
    let app = config.app;

    app.get(REQUEST_PATH, (req, res) => {

      if (!this.hasStats()) {
        res.sendFile(path.join(__dirname, 'lib', 'output', 'no-stats', 'index.html'));
      } else if (!this._cache) {
        res.sendFile(path.join(__dirname, 'lib', 'output', 'computing', 'index.html'));
      } else {
        res.send(this._cache);
      }
    });

    app.get(`${REQUEST_PATH}/compute`, (req, res) => {
      this._cache = this.buildOutput();
      res.redirect(REQUEST_PATH);
    });
  },

  buildOutput() {
    summarizeAll(this.concatStatsPath);
    this.initWatcher();
    return createOutput(this.concatStatsPath);
  },

  initWatcher() {
    let watcher = sane(this.concatStatsPath, { glob: ['*.json'], ignored: ['*.out.json'] });
    watcher.on('change', this._handleWatcher.bind(this));
    watcher.on('add', this._handleWatcher.bind(this));
    watcher.on('delete', this._handleWatcher.bind(this));
  },

  _handleWatcher(filename, root, stat) {
    let file = path.join(root, filename);
    let hash = hashFiles({ files: [file] });

    if (this._hashedFiles[filename] !== hash) {
      // console.log(`Cache invalidated by ${filename}`);
      this._cache = null;
      this._hashedFiles[filename] = hash;
    }
  },

  isEnabled() {
    return true;
  },

  hasStats() {
    return !!process.env.CONCAT_STATS;
  }
};
