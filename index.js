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
  bundleFiles: [
    'dist/assets/*.js',
    // ignore CSS files for now, due to https://github.com/ember-cli/ember-cli/issues/9384
    // 'dist/assets/*.css'
  ],

  init() {
    this._super.init && this._super.init.apply(this, arguments);
    debug(`${this.name} started.`);
  },

  included(app) {
    this._super.included.apply(this, arguments);

    this.checkSourcemapConfigs();

    let options = app.options['bundleAnalyzer'] || {};
    this.analyzerOptions = options;

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

  checkSourcemapConfigs() {
    if (!this.isEnabled()) {
      return;
    }

    const emberCliSupport = this.app.options.sourcemaps?.enabled;
    const emberAutoImportSupport =
      this.app.options.autoImport?.webpack?.devtool;
    // @todo Embroider detection

    if (!emberCliSupport) {
      this.ui.writeWarnLine(
        'ember-cli-bundle-analyzer requires source maps to be enabled, but they are turned off for Ember CLI. Please see https://github.com/simonihmig/ember-cli-bundle-analyzer#source-maps for how to enable them!'
      );
    }

    if (emberAutoImportSupport !== 'source-map') {
      if (!emberAutoImportSupport) {
        this.ui.writeWarnLine(
          `ember-cli-bundle-analyzer requires fully enabled source maps for ember-auto-import, but they are turned off. Please see https://github.com/simonihmig/ember-cli-bundle-analyzer#source-maps for how to enable them!`
        );
      } else {
        this.ui.writeWarnLine(
          `ember-cli-bundle-analyzer requires fully enabled source maps for ember-auto-import, but the config is set to "${emberAutoImportSupport}". Please see https://github.com/simonihmig/ember-cli-bundle-analyzer#source-maps for how to enable them!`
        );
      }
    }
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
        replaceMap: { 'dist/': '', 'webpack://__ember_auto_import__/': '' },
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
    return this.app.options['bundleAnalyzer']?.enabled === true;
  },
};
