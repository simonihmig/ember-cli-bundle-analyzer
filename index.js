'use strict';

const path = require('path');
const { createOutput, summarizeAll } = require('broccoli-concat-analyser');
const fs = require('fs');
const sane = require('sane');
const touch = require('touch');
const hashFiles = require('hash-files').sync;
const tmp = require('tmp');
const VersionChecker = require('ember-cli-version-checker');

const REQUEST_PATH = '/_analyze';
const BROCCOLI_CONCAT_PATH_SUPPORT = '3.6.0';

module.exports = {
  name: 'ember-cli-concat-analyzer',
  _hashedFiles: {},
  _statsOutput: null,

  init() {
    this._super.init && this._super.init.apply(this, arguments);

    // Enable concat stats by default, as setting this later will not work
    process.env.CONCAT_STATS = true;

    this.initConcatStatsPath();
  },

  initConcatStatsPath() {
    let checker = new VersionChecker(this);
    let concatVersion = checker.for('broccoli-concat');

    // if broccoli-concat supports a custom path for stats data, put the data in a temp folder outside of the project!
    if (concatVersion.gte(BROCCOLI_CONCAT_PATH_SUPPORT)) {
      this.concatStatsPath = tmp.dirSync().name;
      process.env.CONCAT_STATS_PATH = this.concatStatsPath;
    } else {
      this.concatStatsPath = path.join(process.cwd(), 'concat-stats-for');
    }
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
        this.enableStats();
        this.triggerBuild();
      }

      if (!this._statsOutput) {
        res.sendFile(path.join(__dirname, 'lib', 'output', 'computing', 'index.html'));
      } else {
        res.send(this._statsOutput);
      }
    });

    app.get(`${REQUEST_PATH}/compute`, (req, res) => {
      if (!this.hasStats()) {
        res.sendFile(path.join(__dirname, 'lib', 'output', 'no-stats', 'index.html'));
        return;
      }
      this._statsOutput = this.buildOutput();
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

  _handleWatcher(filename, root/*, stat*/) {
    let file = path.join(root, filename);
    let hash = hashFiles({ files: [file] });

    if (this._hashedFiles[filename] !== hash) {
      // console.log(`Cache invalidated by ${filename}`);
      this._statsOutput = null;
      this._hashedFiles[filename] = hash;
    }
  },

  isEnabled() {
    return true;
  },

  hasStats() {
    return !!process.env.CONCAT_STATS && fs.existsSync(concatStatsPath);
  },

  enableStats() {
    process.env.CONCAT_STATS = 'true';
  },

  triggerBuild() {
    let { root } = this.project;
    touch(path.join(root, 'tests/dummy/app/app.js'));
  }
};
