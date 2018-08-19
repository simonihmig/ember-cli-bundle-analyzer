'use strict';

const path = require('path');
const { createOutput, summarizeAll } = require('broccoli-concat-analyser');
const fs = require('fs');
const sane = require('sane');
const touch = require('touch');
const hashFiles = require('hash-files').sync;
const tmp = require('tmp');
const VersionChecker = require('ember-cli-version-checker');
const interceptStdout = require('intercept-stdout');

const REQUEST_PATH = '/_analyze';
const BROCCOLI_CONCAT_PATH_SUPPORT = '3.6.0';
const BROCCOLI_CONCAT_LAZY_SUPPORT = '3.7.0';

module.exports = {
  name: 'ember-cli-concat-analyzer',
  _hashedFiles: {},
  _statsOutput: null,
  _hasWatcher: false,
  _buildCallback: null,

  init() {
    this._super.init && this._super.init.apply(this, arguments);

    let checker = new VersionChecker(this);
    this.concatVersion = checker.for('broccoli-concat');

    if (this.concatVersion.lt(BROCCOLI_CONCAT_LAZY_SUPPORT)) {
      this.enableStats();
    }
    this.initConcatStatsPath();
  },

  initConcatStatsPath() {
    // if broccoli-concat supports a custom path for stats data, put the data in a temp folder outside of the project!
    if (this.concatVersion.gte(BROCCOLI_CONCAT_PATH_SUPPORT)) {
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
        res.sendFile(path.join(__dirname, 'lib', 'output', 'computing', 'index.html'));
        return;
      }

      if (!this._statsOutput) {
        res.sendFile(path.join(__dirname, 'lib', 'output', 'computing', 'index.html'));
      } else {
        res.send(this._statsOutput);
      }
    });

    app.get(`${REQUEST_PATH}/compute`, (req, res) => {
      this.initWatcher();
      Promise.resolve()
        .then(() => {
          if (!this.hasStats()) {
            this.enableStats();
            return this.triggerBuild();
          }
        })
        .then(() => {
          try {
            // @todo make this throw an exception when there are no stats
            this._statsOutput = this.buildOutput();
            res.redirect(REQUEST_PATH);
          } catch (e) {
            res.sendFile(path.join(__dirname, 'lib', 'output', 'no-stats', 'index.html'));
          }
        });
    });
  },

  buildOutput() {
    console.log('Computing stats...');
    summarizeAll(this.concatStatsPath);
    return createOutput(this.concatStatsPath);
  },

  initWatcher() {
    if (this._hasWatcher) {
      return;
    }
    let watcher = sane(this.concatStatsPath, { glob: ['*.json'], ignored: ['*.out.json'] });
    watcher.on('change', this._handleWatcher.bind(this));
    watcher.on('add', this._handleWatcher.bind(this));
    watcher.on('delete', this._handleWatcher.bind(this));
    this._hasWatcher = true;
  },

  _handleWatcher(filename, root/*, stat*/) {
    // if (this._buildCallback) {
    //   this._buildCallback();
    //   this._buildCallback = null;
    //   console.log(`build cb`);
    //
    // }
    // console.log(`Cache invalidated by ${filename}`);


    let file = path.join(root, filename);
    let hash = hashFiles({ files: [file] });

    if (this._hashedFiles[filename] !== hash) {
      console.log(`Cache invalidated by ${filename}`);
      this._statsOutput = null;
      this._hashedFiles[filename] = hash;
    }
  },

  isEnabled() {
    return true;
  },

  hasStats() {
    return !!process.env.CONCAT_STATS && this.concatStatsPath && fs.existsSync(this.concatStatsPath);
  },

  enableStats() {
    process.env.CONCAT_STATS = 'true';
  },

  triggerBuild() {
    return new Promise((resolve) => {
      let stopIntercept = interceptStdout((text) => {
        if (text.match(/Build successful/)) {
          stopIntercept();
          setTimeout(resolve, 10);
        }
      });

      let { root } = this.project;
      // @todo be smarter about path (app, addon, MU)
      touch(path.join(root, 'tests/dummy/app/app.js'));

    });
  }
};
