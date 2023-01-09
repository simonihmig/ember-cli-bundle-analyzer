'use strict';

const path = require('path');
const debug = require('debug')('ember-cli-bundle-analyzer');
const interceptStdout = require('intercept-stdout');
const injectLivereload = require('./lib/inject-livereload');
const explore = require('source-map-explorer').explore;
const glob = require('fast-glob');

const REQUEST_PATH = '/_analyze';

module.exports = {
  name: require('./package').name,

  _hashedFiles: {},
  _statsOutput: null,
  _hasWatcher: false,
  _buildCallback: null,
  _computePromise: null,
  _buildPromise: null,
  bundleFiles: ['dist/assets/*.js', 'dist/assets/*.css'],

  init() {
    this._super.init && this._super.init.apply(this, arguments);
    debug(`${this.name} started.`);
  },

  included(app) {
    this._super.included.apply(this, arguments);
    // this.app = app;
    let options = app.options['bundle-analyzer'] || {};

    let ignoredFiles = (options && options.ignore) || [];
    if (!Array.isArray(ignoredFiles)) {
      ignoredFiles = [ignoredFiles];
    }

    if (options.ignoreTestFiles !== false) {
      ignoredFiles = ignoredFiles.concat(
        'tests.js',
        'test-support.js',
        'test-support.css'
      );
    }

    this.ignoredFiles = ignoredFiles;
  },

  serverMiddleware(config) {
    if (this.isEnabled()) {
      this.addAnalyzeMiddleware(config);
    }
  },

  addAnalyzeMiddleware(config) {
    let app = config.app;

    app.get(REQUEST_PATH, async (req, res) => {
      this.debugRequest(req);
      this.initBuildWatcher();
      await this._buildPromise;
      if (!this._statsOutput) {
        res.sendFile(
          path.join(__dirname, 'lib', 'output', 'computing', 'index.html')
        );
      } else {
        res.send(this._statsOutput);
      }
    });

    app.get(`${REQUEST_PATH}/compute`, async (req, res) => {
      this.debugRequest(req);
      this.initBuildWatcher();
      await this._buildPromise;
      try {
        let output = await this.computeOutput();
        this._statsOutput = injectLivereload(output);
        res.redirect(REQUEST_PATH);
      } catch (e) {
        if (e.errors) {
          e.errors.map((e) => this.ui.writeError(e.error));
        } else {
          this.ui.writeError(e);
        }
        res.sendFile(
          path.join(__dirname, 'lib', 'output', 'no-stats', 'index.html')
        );
      }
    });
  },

  debugRequest(req) {
    debug(`${req.method} ${req.url}`);
  },

  async computeOutput() {
    if (!this._computePromise) {
      debug('Computing stats...');

      let files = await glob(this.bundleFiles, {
        ignore: this.ignoredFiles.map((file) => `dist/assets/${file}`),
      });
      debug('Found these bundles: ' + files.join(', '));
      this._computePromise = explore(files, {
        output: { format: 'html' },
        replaceMap: { 'dist/': '' },
        noBorderChecks: true,
      }).then((result) => {
        debug(
          'Computing finished, bundle results: ' +
            JSON.stringify(result.bundles)
        );

        result.errors.map((e) =>
          this.ui[e.isWarning ? 'writeWarnLine' : 'writeErrorLine'](
            `${e.bundleName}: ${e.message}`
          )
        );

        this._computePromise = null;
        return result.output;
      });
    }
    return this._computePromise;
  },

  initBuildWatcher() {
    let resolve;
    if (this._buildWatcher) {
      return;
    }
    this._buildWatcher = interceptStdout((text) => {
      if (text instanceof Buffer) {
        text = text.toString();
      }
      if (typeof text !== 'string') {
        return text;
      }

      if (text.match(/file (added|changed|deleted)/)) {
        debug('Rebuild detected');
        this._buildPromise = new Promise((_resolve) => (resolve = _resolve));
        this._statsOutput = null;
      }

      if (text.match(/Build successful/)) {
        if (!resolve) {
          return;
        }
        debug('Finished build detected');
        setTimeout(() => {
          resolve();
        }, 1000);
      }
    });
  },

  isEnabled() {
    return true;
  },
};
