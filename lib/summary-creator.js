'use strict';

const CachingWriter = require('broccoli-caching-writer');
const fs = require('fs');
const path = require('path');
const summarizeAll = require('broccoli-concat-analyser').summarizeAll;
const buildOutputSummary = require('broccoli-concat-analyser').buildOutputSummary;

const FILE_NAME = 'summary.js';

class SummaryCreator extends CachingWriter {

  constructor(statsPath) {
    let options = {
      cacheInclude: [/[^/]+\.json/],
      cacheExclude: [/[^/]+\.out\.json/]
    };
    super([statsPath], options);
    this.statsPath = statsPath;
  }

  build() {
    let outputFilename = path.join(this.outputPath, FILE_NAME);

    summarizeAll(this.statsPath);

    let summary = JSON.stringify(buildOutputSummary(this.statsPath));
    let content = `var SUMMARY = ${summary}`;

    fs.writeFileSync(outputFilename, content);
  }
}

module.exports = SummaryCreator;
